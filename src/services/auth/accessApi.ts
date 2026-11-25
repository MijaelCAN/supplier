// src/services/auth/accessApi.ts
// Habilitar acceso al portal (TCK-001333): registra o actualiza el UDO Acceso Desarrollo en SAP y genera la contraseña.
// Si el acceso ya existía, el backend solo restablece la contraseña (la anterior deja de servir).
// El backend no guarda quién lo habilitó: mientras tanto se registra en Firestore (colección accesosHabilitados).
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { httpClient } from '@/services/http/httpClient';
import { getApiBaseUrl } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import type { RoleType } from '@/services/auth/apiAuth';

const COLLECTION = 'accesosHabilitados';

/** Roles internos que se pueden asignar. ADMIN solo lo asigna un administrador. */
export const ROLES_INTERNOS: UserRole[] = [
    UserRole.COMPRAS,
    UserRole.FINANZAS,
    UserRole.CONTABILIDAD,
    UserRole.ALMACEN,
    UserRole.CALIDAD,
    UserRole.SEGURIDAD,
    UserRole.PLANEAMIENTO,
    UserRole.SOLICITANTE,
    UserRole.ADMIN,
];

export interface HabilitarAccesoRequest {
    /** RUC (proveedor) o DNI (interno) */
    usuario: string;
    roleType: RoleType;
    rol: UserRole;
}

export interface HabilitarAccesoResult {
    /** true si el acceso ya existía y solo se restableció la contraseña */
    yaExistia: boolean;
    message: string;
    usuario: string;
    password: string;
    nombre: string;
    correo: string;
    roleType: RoleType;
}

interface ApiHabilitarAccesoResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: {
        usuario: string;
        password: string;
        nombre: string;
        correo: string;
        role_type: RoleType;
    } | null;
}

export class HabilitarAccesoError extends Error {
    constructor(public readonly statusCode: number, message: string) {
        super(message);
        this.name = 'HabilitarAccesoError';
    }
}

/** Valida el documento según el tipo: RUC de 11 dígitos para proveedor, DNI de 8 para interno. */
export const validarDocumento = (usuario: string, roleType: RoleType): string | null => {
    const value = usuario.trim();
    if (!value) return roleType === 'provider' ? 'Ingresa el RUC.' : 'Ingresa el DNI.';
    if (roleType === 'provider' && !/^\d{11}$/.test(value)) return 'El RUC debe tener 11 dígitos.';
    if (roleType === 'internal' && !/^\d{8}$/.test(value)) return 'El DNI debe tener 8 dígitos.';
    return null;
};

/**
 * Llama a POST /api/Login/HabilitarAcceso. El API responde HTTP 200 y el código real va en status_code
 * (404: no existe en SAP, 400: datos inválidos, 500: error al actualizar el acceso en SAP).
 */
export const habilitarAcceso = async (request: HabilitarAccesoRequest): Promise<HabilitarAccesoResult> => {
    const usuario = request.usuario.trim();
    const errorDocumento = validarDocumento(usuario, request.roleType);
    if (errorDocumento) throw new HabilitarAccesoError(400, errorDocumento);
    if (request.roleType === 'provider' && request.rol !== UserRole.PROVEEDOR) {
        throw new HabilitarAccesoError(400, 'Un proveedor solo puede tener el rol Proveedor.');
    }
    if (request.roleType === 'internal' && !ROLES_INTERNOS.includes(request.rol)) {
        throw new HabilitarAccesoError(400, 'Selecciona un rol interno válido.');
    }

    let response: Response;
    try {
        response = await httpClient(`${getApiBaseUrl()}/api/Login/HabilitarAcceso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, role_type: request.roleType, rol: request.rol }),
        });
    } catch (error) {
        throw new HabilitarAccesoError(0, error instanceof Error ? error.message : 'No se pudo conectar con el servidor.');
    }

    const body = (await response.json().catch(() => null)) as ApiHabilitarAccesoResponse | null;
    if (!response.ok || !body) {
        throw new HabilitarAccesoError(response.status, body?.message || `Error al habilitar el acceso (${response.status}).`);
    }
    if (!body.success || body.status_code !== 200 || !body.data) {
        throw new HabilitarAccesoError(body.status_code, body.message || 'No se pudo habilitar el acceso.');
    }

    const yaExistia = /ya exist/i.test(body.message ?? '');
    const result: HabilitarAccesoResult = {
        yaExistia,
        message: body.message,
        usuario: body.data.usuario,
        password: body.data.password,
        nombre: body.data.nombre ?? '',
        correo: (body.data.correo ?? '').trim(),
        roleType: body.data.role_type ?? request.roleType,
    };

    await registrarHabilitacion(request, result);
    return result;
};

/** Registro de quién habilitó o restableció el acceso. Nunca lanza: si Firestore falla, el acceso ya quedó en SAP. */
const registrarHabilitacion = async (request: HabilitarAccesoRequest, result: HabilitarAccesoResult): Promise<void> => {
    const user = useAuthStore.getState().currentUser;
    try {
        await addDoc(collection(db, COLLECTION), {
            usuario: result.usuario,
            nombre: result.nombre,
            roleType: request.roleType,
            rol: request.rol,
            accion: result.yaExistia ? 'RESTABLECIDO' : 'HABILITADO',
            habilitadoPor: user?.userCode || user?.username || '',
            habilitadoPorNombre: user?.fullName || user?.username || '',
            habilitadoPorRol: user?.role ?? '',
            fecha: serverTimestamp(),
        });
    } catch (error) {
        console.error('No se pudo registrar la habilitación del acceso:', error);
    }
};
