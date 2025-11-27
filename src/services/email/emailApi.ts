/**
 * Servicio de API para notificaciones por correo electrónico
 */

import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";

const nameBaseUrl = 'VITE_EMAIL_SERVER_URL';

const normaliseString = (value?: string | null) => (value ?? '').trim();

const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key];
    }
    return undefined;
}

const buildEndpointUrl = (endpoint: string): string => {
    const BASE_URL = normaliseString(resolveEnv(nameBaseUrl)) || 'http://localhost:3001';
    return buildSecureUrl(BASE_URL, endpoint);
}

const handleResponse = async (response: Response): Promise<any> => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Error: ${response.statusText}`);
    }
    try {
        return await response.json();
    } catch (error) {
        throw new Error('No se pudo parsear la respuesta del servidor');
    }
}

export interface EmailSendRequest {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

export interface OrderNotificationRequest {
    to: string | string[];
    orderData: {
        orderNumber: string;
        supplierName: string;
        total: number;
        items: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
        deliveryDate?: string;
    };
}

export interface GenericNotificationRequest {
    to: string | string[];
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
}

export interface EmailResponse {
    success: boolean;
    message: string;
    messageId?: string;
    error?: string;
}

/**
 * Verifica la conexión con el servidor de correo
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
    try {
        const response = await httpClient(buildEndpointUrl('/api/email/verify'));
        const result = await handleResponse(response);
        return result.success === true;
    } catch (error) {
        console.error('Error verificando conexión de correo:', error);
        return false;
    }
}

/**
 * Envía un correo genérico
 */
export const sendEmail = async (request: EmailSendRequest): Promise<EmailResponse> => {
    try {
        const response = await httpClient(buildEndpointUrl('/api/email/send'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: 'Error al enviar correo',
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Envía una notificación de orden de compra
 */
export const sendOrderNotification = async (
    request: OrderNotificationRequest
): Promise<EmailResponse> => {
    try {
        const response = await httpClient(buildEndpointUrl('/api/email/order-notification'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: 'Error al enviar notificación de orden',
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Envía una notificación genérica
 */
export const sendNotification = async (
    request: GenericNotificationRequest
): Promise<EmailResponse> => {
    try {
        const response = await httpClient(buildEndpointUrl('/api/email/notification'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: 'Error al enviar notificación',
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Verifica el estado del servidor
 */
export const checkServerHealth = async (): Promise<{ status: string; service: string; timestamp: string }> => {
    try {
        const response = await httpClient(buildEndpointUrl('/health'));
        return await handleResponse(response);
    } catch (error) {
        throw new Error('No se pudo conectar con el servidor de notificaciones');
    }
}

export interface SupplierCredentialsRequest {
    to: string;
    credentials: {
        username: string;
        password: string;
        supplierName: string;
        userFullName: string;
        portalLink?: string;
    };
}

export interface PasswordRecoveryRequest {
    to: string;
    recoveryData: {
        code: string;
        userName: string;
        expiresIn?: number; // minutos
    };
}

/**
 * Envía credenciales de nuevo proveedor
 */
export const sendSupplierCredentials = async (
    request: SupplierCredentialsRequest
): Promise<EmailResponse> => {
    try {
        const response = await httpClient(buildEndpointUrl('/api/email/supplier-credentials'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: 'Error al enviar credenciales',
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Envía código de recuperación de contraseña
 */
export const sendPasswordRecoveryCode = async (
    request: PasswordRecoveryRequest
): Promise<EmailResponse> => {
    try {
        const response = await httpClient(buildEndpointUrl('/api/email/password-recovery'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        return await handleResponse(response);
    } catch (error) {
        return {
            success: false,
            message: 'Error al enviar código de recuperación',
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

