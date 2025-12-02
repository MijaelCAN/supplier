import { UserRole } from '@/routes/menuTypes';
import { httpClient } from '@/services/http/httpClient';

export type RoleType = 'internal' | 'provider';

export interface PortalUser {
    id: string;
    username: string;
    email: string;
    userCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    roleType: RoleType;
    department?: string;
    position?: string;
    phone?: string;
    avatar?: string;
    supplierId?: string;
    accountStatus: 'active' | 'inactive' | 'suspended';
    useSupplierPortal: boolean;
    settings: Record<string, boolean>;
    lastLogin?: string;
}

export type AuthErrorCode =
    | 'MISSING_FIELDS'
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_INACTIVE'
    | 'USER_NOT_FOUND'
    | 'PASSWORD_EQUALS_USERNAME'
    | 'UNKNOWN';

export class AuthError extends Error {
    constructor(
        public readonly code: AuthErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export interface LoginPayload {
    username: string;
    password: string;
    roleType: RoleType;
}

export interface LoginSuccess {
    token: string;
    user: PortalUser;
}

// API Response Types
interface ApiLoginRequest {
    role_type: 'internal' | 'provider';
    usuario: string;
    password: string;
}

interface ApiSetting {
    U_Acceso: string;
    U_Active: 'Y' | 'N';
}

interface ApiLoginResponseData {
    id: string;
    ruc: string;
    email: string;
    avatar: string;
    account_status: 'Y' | 'N' | 'S';
    role: string;
    role_type: 'internal' | 'provider';
    nombre: string;
    token: string;
    Setting: ApiSetting[];
}

interface ApiLoginResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: ApiLoginResponseData;
}

interface ApiUpdatePasswordRequest {
    usuario: string;
    password: string;
    role_type: 'internal' | 'provider';
}

interface ApiUpdatePasswordResponse {
    statusCode: number;
    message: string | null;
    data: string;
}

// Configuration
const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key] as string;
    }
    return undefined;
};

const getAuthApiBaseUrl = (): string => {
    return resolveEnv('VITE_AUTH_API_BASE_URL') || 'http://192.168.254.27:8082';
};

// Helper functions
const normalizeName = (userName: string) => {
    const parts = userName.trim().split(' ');
    if (parts.length === 1) {
        return {
            firstName: parts[0],
            lastName: '',
        };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
};

const mapAccountStatus = (status: 'Y' | 'N' | 'S'): 'active' | 'inactive' | 'suspended' => {
    switch (status) {
        case 'Y':
            return 'active';
        case 'N':
            return 'inactive';
        case 'S':
            return 'suspended';
        default:
            return 'inactive';
    }
};

const mapRole = (role: string): UserRole => {
    const roleMap: Record<string, UserRole> = {
        'admin': UserRole.ADMIN,
        'proveedor': UserRole.PROVEEDOR,
        'compras': UserRole.COMPRAS,
        'finanzas': UserRole.FINANZAS,
        'almacen': UserRole.ALMACEN,
        'solicitante': UserRole.SOLICITANTE,
        'calidad': UserRole.CALIDAD,
        'seguridad': UserRole.SEGURIDAD,
    };
    return roleMap[role.toLowerCase()] || UserRole.PROVEEDOR;
};

const mapSettings = (settings: ApiSetting[]): Record<string, boolean> => {
    const mappedSettings: Record<string, boolean> = {};
    settings.forEach((setting) => {
        mappedSettings[setting.U_Acceso] = setting.U_Active === 'Y';
    });
    return mappedSettings;
};

const sanitizeUser = (data: ApiLoginResponseData): PortalUser => {
    const { firstName, lastName } = normalizeName(data.nombre);

    return {
        id: data.id,
        username: data.ruc,
        email: data.email,
        userCode: data.id,
        firstName,
        lastName,
        fullName: data.nombre,
        role: mapRole(data.role),
        roleType: data.role_type,
        avatar: data.avatar || undefined,
        accountStatus: mapAccountStatus(data.account_status),
        useSupplierPortal: data.role_type === 'provider',
        settings: mapSettings(data.Setting || []),
    };
};

/**
 * Login with API
 */
export const loginWithAPI = async (
    payload: LoginPayload,
): Promise<LoginSuccess> => {
    const { username, password, roleType } = payload;

    if (!username || !password || !roleType) {
        throw new AuthError(
            'MISSING_FIELDS',
            "Los campos 'username', 'password' y 'role_type' son obligatorios.",
        );
    }

    // Validar si la contraseña es igual al usuario
    if (password === username) {
        throw new AuthError(
            'PASSWORD_EQUALS_USERNAME',
            'La contraseña no puede ser igual al usuario. Por favor, actualice su contraseña.',
        );
    }

    const baseUrl = getAuthApiBaseUrl();
    const url = `${baseUrl}/api/Login`;

    const requestBody: ApiLoginRequest = {
        role_type: roleType,
        usuario: username.trim(),
        password: password,
    };

    try {
        const response = await httpClient(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            skipAuth: true, // No incluir token en el login
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new AuthError(
                    'INVALID_CREDENTIALS',
                    'Credenciales de acceso incorrectas.',
                );
            }
            if (response.status === 404) {
                throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado.');
            }

            const errorData = await response.json().catch(() => ({}));
            throw new AuthError(
                'UNKNOWN',
                errorData.message || `Error al iniciar sesión: ${response.statusText}`,
            );
        }

        const apiResponse: ApiLoginResponse = await response.json();

        if (apiResponse.statusCode !== 200 || !apiResponse.success) {
            throw new AuthError(
                'INVALID_CREDENTIALS',
                apiResponse.message || 'Credenciales de acceso incorrectas.',
            );
        }

        const userData = apiResponse.data;

        // Validar estado de cuenta
        if (userData.account_status !== 'Y') {
            throw new AuthError(
                'ACCOUNT_INACTIVE',
                'Su cuenta está inactiva. Contacte con el administrador.',
            );
        }

        const user = sanitizeUser(userData);
        const token = userData.token;

        return {
            token,
            user,
        };
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }

        // Manejar errores de red
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new AuthError(
                'UNKNOWN',
                'No se pudo conectar con el servidor. Verifique su conexión.',
            );
        }

        throw new AuthError(
            'UNKNOWN',
            error instanceof Error ? error.message : 'Error desconocido al iniciar sesión.',
        );
    }
};

/**
 * Update user password via API
 */
export const updatePasswordWithAPI = async (
    username: string,
    newPassword: string,
    roleType: RoleType
): Promise<void> => {
    if (!username || !newPassword) {
        throw new AuthError(
            'MISSING_FIELDS',
            'El usuario y la nueva contraseña son obligatorios.',
        );
    }

    if (newPassword.length < 8) {
        throw new AuthError(
            'INVALID_CREDENTIALS',
            'La contraseña debe tener al menos 8 caracteres.',
        );
    }

    // Validar si la contraseña es igual al usuario
    if (newPassword === username) {
        throw new AuthError(
            'PASSWORD_EQUALS_USERNAME',
            'La contraseña no puede ser igual al usuario.',
        );
    }

    const baseUrl = getAuthApiBaseUrl();
    const url = `${baseUrl}/api/Login/Actualizar_Contrasenia`;

    const requestBody: ApiUpdatePasswordRequest = {
        usuario: username.trim(),
        password: newPassword,
        role_type: roleType
    };

    try {
        const response = await httpClient(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            skipAuth: true, // No incluir token en la actualización de contraseña
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new AuthError('USER_NOT_FOUND', 'Usuario no encontrado.');
            }

            const errorData = await response.json().catch(() => ({}));
            throw new AuthError(
                'UNKNOWN',
                errorData.message || `Error al actualizar la contraseña: ${response.statusText}`,
            );
        }

        const apiResponse: ApiUpdatePasswordResponse = await response.json();

        if (apiResponse.statusCode !== 200) {
            throw new AuthError(
                'UNKNOWN',
                apiResponse.message || 'Error al actualizar la contraseña.',
            );
        }

        // Éxito - la contraseña se actualizó correctamente
        return;
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }

        // Manejar errores de red
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new AuthError(
                'UNKNOWN',
                'No se pudo conectar con el servidor. Verifique su conexión.',
            );
        }

        throw new AuthError(
            'UNKNOWN',
            error instanceof Error ? error.message : 'Error desconocido al actualizar la contraseña.',
        );
    }
};

/**
 * Get provider email by RUC
 */
interface ApiProviderEmailResponseData {
    CodUsuario: string;
    NumIdentidad: string;
    NombreCompleto: string;
    Correo: string;
}

interface ApiProviderEmailResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: ApiProviderEmailResponseData;
}

export interface ProviderEmailInfo {
    codUsuario: string;
    ruc: string;
    nombreCompleto: string;
    email: string;
}

/**
 * Get provider email by RUC
 */
export const getProviderEmailByRuc = async (
    ruc: string,
): Promise<ProviderEmailInfo> => {
    if (!ruc || !ruc.trim()) {
        throw new AuthError(
            'MISSING_FIELDS',
            'El RUC es obligatorio.',
        );
    }

    const baseUrl = getAuthApiBaseUrl();
    const url = `${baseUrl}/api/Login/CorreoProveedor?Ruc=${encodeURIComponent(ruc.trim())}`;

    try {
        const response = await httpClient(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            skipAuth: true, // No requiere autenticación
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new AuthError('USER_NOT_FOUND', 'Proveedor no encontrado.');
            }

            const errorData = await response.json().catch(() => ({}));
            throw new AuthError(
                'UNKNOWN',
                errorData.message || `Error al obtener el correo del proveedor: ${response.statusText}`,
            );
        }

        const apiResponse: ApiProviderEmailResponse = await response.json();

        if (apiResponse.statusCode !== 200) {
            throw new AuthError(
                'UNKNOWN',
                apiResponse.message || 'Error al obtener el correo del proveedor.',
            );
        }

        const data = apiResponse.data;

        return {
            codUsuario: data.CodUsuario,
            ruc: data.NumIdentidad,
            nombreCompleto: data.NombreCompleto,
            email: data.Correo,
        };
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }

        // Manejar errores de red
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new AuthError(
                'UNKNOWN',
                'No se pudo conectar con el servidor. Verifique su conexión.',
            );
        }

        throw new AuthError(
            'UNKNOWN',
            error instanceof Error ? error.message : 'Error desconocido al obtener el correo del proveedor.',
        );
    }
};

