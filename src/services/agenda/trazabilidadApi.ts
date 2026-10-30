// src/services/agenda/trazabilidadApi.ts
// Trazabilidad de la cita (fase 1). El API de citas solo guarda el estado actual, así que cada cambio que hace
// el portal se registra aquí, en Firestore, con fecha, usuario y área. Solo existe desde que se publicó esta función.
import { addDoc, collection, onSnapshot, query, serverTimestamp, Timestamp, where, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import type { AppointmentStatus, Invoice } from '@/store/types';
import { fetchInvoicesByCardCode } from '@/services/invoices/invoicesApi';

const COLLECTION = 'trazabilidadCitas';

export type TipoEventoCita = 'ESTADO' | 'CITA_CREADA' | 'DOCUMENTO';

export interface EventoCita {
    id: string;
    codCita: string;
    tipo: TipoEventoCita;
    estado?: AppointmentStatus;
    detalle?: string;          // p. ej. el tipo de documento cargado
    usuario: string;           // código de usuario
    usuarioNombre: string;
    rol: UserRole | string;
    fecha: string;             // ISO
}

export const AREA_POR_ROL: Record<string, string> = {
    [UserRole.ADMIN]: 'Administración',
    [UserRole.PROVEEDOR]: 'Proveedor',
    [UserRole.COMPRAS]: 'Compras',
    [UserRole.FINANZAS]: 'Finanzas',
    [UserRole.CONTABILIDAD]: 'Contabilidad',
    [UserRole.SOLICITANTE]: 'Solicitante',
    [UserRole.CALIDAD]: 'Calidad',
    [UserRole.ALMACEN]: 'Almacén',
    [UserRole.SEGURIDAD]: 'Seguridad',
    [UserRole.PLANEAMIENTO]: 'Planeamiento',
};

/**
 * Registra un evento de la cita con el usuario en sesión. Nunca lanza: si Firestore falla, el flujo de la cita
 * (cambio de estado, carga de archivo) sigue igual y solo se pierde el registro.
 */
export const registrarEventoCita = async (
    codCita: string | undefined,
    evento: { tipo: TipoEventoCita; estado?: AppointmentStatus; detalle?: string }
): Promise<void> => {
    if (!codCita) return;
    const user = useAuthStore.getState().currentUser;
    try {
        await addDoc(collection(db, COLLECTION), {
            codCita: String(codCita),
            tipo: evento.tipo,
            ...(evento.estado ? { estado: evento.estado } : {}),
            ...(evento.detalle ? { detalle: evento.detalle } : {}),
            usuario: user?.userCode || user?.username || '',
            usuarioNombre: user?.fullName || user?.username || '',
            rol: user?.role ?? '',
            fecha: serverTimestamp(),
        });
    } catch (error) {
        console.error('No se pudo registrar el evento de la cita:', error);
    }
};

/**
 * Eventos de la cita en tiempo real: los cambios que hace el usuario (o otra área a la vez) aparecen sin recargar.
 * Devuelve la función para dejar de escuchar.
 */
export const subscribeEventosCita = (
    codCita: string,
    onChange: (eventos: EventoCita[]) => void,
    onError: (error: Error) => void
): Unsubscribe =>
    onSnapshot(
        query(collection(db, COLLECTION), where('codCita', '==', String(codCita))),
        (snapshot) => {
            const eventos = snapshot.docs
                .map((d) => {
                    const data = d.data();
                    // serverTimestamp queda null un instante en la escritura local: se toma la hora del navegador
                    const fecha = data.fecha instanceof Timestamp ? data.fecha.toDate().toISOString() : new Date().toISOString();
                    return { ...(data as Omit<EventoCita, 'id' | 'fecha'>), id: d.id, fecha };
                })
                .sort((a, b) => a.fecha.localeCompare(b.fecha));
            onChange(eventos);
        },
        onError
    );

/** "F041-00013408", "01-F041-13408" o "F041-13408" → "F041-13408" */
export const normalizarComprobante = (value: string): string | null => {
    const match = /([A-Z0-9]{4})-0*(\d{1,8})\s*$/i.exec(value.trim());
    return match ? `${match[1].toUpperCase()}-${match[2]}` : null;
};

const toYyyyMmDd = (date: Date) =>
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

// La factura suele emitirse unos días antes o después de la entrega
const DIAS_VENTANA_FACTURA = 30;

/**
 * Facturas de SAP del proveedor que corresponden a los comprobantes de la cita (por serie y número),
 * con su fecha de registro y sus pagos. CardCode de SAP = "P" + RUC.
 */
export const fetchFacturasSapDeCita = async (
    ruc: string,
    fechaEntrega: string,          // yyyy-MM-dd
    comprobantes: string[]
): Promise<Invoice[]> => {
    const buscados = new Set(comprobantes.map(normalizarComprobante).filter((c): c is string => !!c));
    if (buscados.size === 0 || !/^\d{11}$/.test(ruc)) return [];

    const [year, month, day] = fechaEntrega.split('-').map(Number);
    const entrega = new Date(year, month - 1, day);
    const inicio = new Date(entrega);
    inicio.setDate(inicio.getDate() - DIAS_VENTANA_FACTURA);
    const fin = new Date(entrega);
    fin.setDate(fin.getDate() + DIAS_VENTANA_FACTURA);
    const hoy = new Date();

    const facturas = await fetchInvoicesByCardCode(`P${ruc}`, 'Todos', toYyyyMmDd(inicio), toYyyyMmDd(fin < hoy ? fin : hoy));
    return (facturas ?? []).filter((f) => {
        const numero = normalizarComprobante(f.invoiceNumber);
        return numero !== null && buscados.has(numero);
    });
};
