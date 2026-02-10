/**
 * Servicio de API para notificaciones por correo electrónico
 * Usa el endpoint configurado desde variables de entorno
 */

import { httpClient, buildSecureUrl } from "@/services/http/httpClient.ts";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_NOTIFICACIONES_API_BASE_URL = getApiBaseUrl();
const NOTIFICACIONES_ENDPOINT = '/api/Notificaciones';

const buildEndpointUrl = (): string => {
    return buildSecureUrl(DEFAULT_NOTIFICACIONES_API_BASE_URL, NOTIFICACIONES_ENDPOINT);
}

interface NotificacionRequest {
    to: string;
    subject: string;
    html: string;
    cc?: string;
    bcc?: string;
}

interface NotificacionResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: null;
}

export interface EmailResponse {
    success: boolean;
    message: string;
    messageId?: string;
    error?: string;
}

/**
 * Envía un correo usando el nuevo endpoint de notificaciones
 */
const sendNotificationEmail = async (request: NotificacionRequest): Promise<EmailResponse> => {
    try {
        const response = await httpClient(buildEndpointUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: request.to,
                subject: request.subject,
                html: request.html,
                cc: request.cc || '',
                bcc: request.bcc || '',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            return {
                success: false,
                message: errorData.message || `Error: ${response.statusText}`,
                error: errorData.message || response.statusText,
            };
        }

        const result: NotificacionResponse = await response.json();
        
        return {
            success: result.success || result.statusCode === 200,
            message: result.message || 'Correo enviado correctamente',
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al enviar correo',
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Genera el HTML para credenciales de proveedor
 */
const generateSupplierCredentialsHTML = (data: {
    username: string;
    password: string;
    supplierName: string;
    userFullName: string;
    portalLink?: string;
}): string => {
    const portalLink = data.portalLink || 'http://localhost:5173/login';
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenida - Credenciales de Acceso</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #d6001c;
        }
        .header h1 {
            color: #d6001c;
            margin: 0;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin: 15px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #495057;
            display: inline-block;
            width: 120px;
        }
        .credential-value {
            color: #212529;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #ced4da;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #d6001c;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #b50018;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bienvenido al Portal de Proveedores</h1>
        </div>
        
        <p>Estimado/a <strong>${data.userFullName}</strong>,</p>
        
        <p>Le damos la bienvenida al Portal de Proveedores de <strong>${data.supplierName}</strong>.</p>
        
        <p>Sus credenciales de acceso han sido generadas. Por favor, utilice la siguiente información para ingresar al portal:</p>
        
        <div class="credentials-box">
            <div class="credential-item">
                <span class="credential-label">Usuario (RUC):</span>
                <span class="credential-value">${data.username}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Contraseña:</span>
                <span class="credential-value">${data.password}</span>
            </div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Importante:</strong> Por seguridad, le recomendamos cambiar su contraseña en el primer ingreso al portal.
        </div>
        
        <div style="text-align: center;">
            <a href="${portalLink}" class="button">Acceder al Portal</a>
        </div>
        
        <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
        
        <p>Saludos cordiales,<br>
        <strong>Equipo de Portal de Proveedores</strong></p>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Genera el HTML para recuperación de contraseña
 */
const generatePasswordRecoveryHTML = (data: {
    code: string;
    userName: string;
    expiresIn?: number;
}): string => {
    const expiresIn = data.expiresIn || 15;
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #d6001c;
        }
        .header h1 {
            color: #d6001c;
            margin: 0;
        }
        .code-box {
            background-color: #f8f9fa;
            border: 2px solid #d6001c;
            border-radius: 4px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #d6001c;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 20px 0;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Recuperación de Contraseña</h1>
        </div>
        
        <p>Estimado/a <strong>${data.userName}</strong>,</p>
        
        <p>Hemos recibido una solicitud para recuperar su contraseña. Utilice el siguiente código de verificación:</p>
        
        <div class="code-box">
            <p style="margin: 0 0 10px 0; color: #6c757d;">Su código de verificación es:</p>
            <div class="code">${data.code}</div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Importante:</strong> Este código expirará en ${expiresIn} minutos. Si no solicitó este código, ignore este correo.
        </div>
        
        <p>Ingrese este código en la página de recuperación de contraseña para continuar con el proceso.</p>
        
        <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
        
        <p>Saludos cordiales,<br>
        <strong>Equipo de Portal de Proveedores</strong></p>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>`;
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
        expiresIn?: number;
    };
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

/**
 * Envía credenciales de nuevo proveedor
 */
export const sendSupplierCredentials = async (
    request: SupplierCredentialsRequest
): Promise<EmailResponse> => {
    const html = generateSupplierCredentialsHTML(request.credentials);
    
    return sendNotificationEmail({
        to: request.to,
        subject: 'Bienvenida - Credenciales de Acceso al Portal de Proveedores',
        html: html,
    });
}

/**
 * Envía código de recuperación de contraseña
 */
export const sendPasswordRecoveryCode = async (
    request: PasswordRecoveryRequest
): Promise<EmailResponse> => {
    const html = generatePasswordRecoveryHTML(request.recoveryData);
    
    return sendNotificationEmail({
        to: request.to,
        subject: 'Recuperación de Contraseña - Código de Verificación',
        html: html,
    });
}

/**
 * Envía una notificación de orden de compra
 */
export const sendOrderNotification = async (
    request: OrderNotificationRequest
): Promise<EmailResponse> => {
    const to = Array.isArray(request.to) ? request.to[0] : request.to;
    const itemsHTML = request.orderData.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">S/ ${item.price.toFixed(2)}</td>
        </tr>
    `).join('');
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de Orden de Compra</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #d6001c;
        }
        .header h1 {
            color: #d6001c;
            margin: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #d6001c;
            color: #ffffff;
            padding: 12px;
            text-align: left;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
        }
        .total {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            margin-top: 20px;
            color: #d6001c;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nueva Orden de Compra</h1>
        </div>
        
        <p>Estimado/a <strong>${request.orderData.supplierName}</strong>,</p>
        
        <p>Se ha generado una nueva orden de compra:</p>
        
        <p><strong>Número de Orden:</strong> ${request.orderData.orderNumber}</p>
        ${request.orderData.deliveryDate ? `<p><strong>Fecha de Entrega:</strong> ${request.orderData.deliveryDate}</p>` : ''}
        
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
        
        <div class="total">
            Total: S/ ${request.orderData.total.toFixed(2)}
        </div>
        
        <p>Por favor, revise los detalles de la orden y confirme su disponibilidad.</p>
        
        <p>Saludos cordiales,<br>
        <strong>Equipo de Compras</strong></p>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>`;
    
    return sendNotificationEmail({
        to: to,
        subject: `Nueva Orden de Compra - ${request.orderData.orderNumber}`,
        html: html,
    });
}

/**
 * Envía una notificación genérica
 */
export const sendNotification = async (
    request: GenericNotificationRequest
): Promise<EmailResponse> => {
    const to = Array.isArray(request.to) ? request.to[0] : request.to;
    const actionButton = request.actionUrl && request.actionText ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${request.actionUrl}" style="display: inline-block; padding: 12px 30px; background-color: #d6001c; color: #ffffff; text-decoration: none; border-radius: 4px;">
                ${request.actionText}
            </a>
        </div>
    ` : '';
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${request.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #d6001c;
        }
        .header h1 {
            color: #d6001c;
            margin: 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${request.title}</h1>
        </div>
        
        <div style="white-space: pre-wrap;">${request.message}</div>
        
        ${actionButton}
        
        <p>Saludos cordiales,<br>
        <strong>Equipo de Portal de Proveedores</strong></p>
        
        <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>`;
    
    return sendNotificationEmail({
        to: to,
        subject: request.title,
        html: html,
    });
}

/**
 * Función genérica para enviar correo (mantiene compatibilidad)
 */
export const sendEmail = async (request: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}): Promise<EmailResponse> => {
    const to = Array.isArray(request.to) ? request.to[0] : request.to;
    const cc = Array.isArray(request.cc) ? request.cc.join(',') : (request.cc || '');
    const bcc = Array.isArray(request.bcc) ? request.bcc.join(',') : (request.bcc || '');
    
    return sendNotificationEmail({
        to: to,
        subject: request.subject,
        html: request.html,
        cc: cc,
        bcc: bcc,
    });
}

/**
 * Verifica la conexión con el servidor de correo (deprecated - mantener por compatibilidad)
 */
export const verifyEmailConnection = async (): Promise<boolean> => {
    // El nuevo endpoint no tiene verificación, siempre retornamos true
    return true;
}

/**
 * Verifica el estado del servidor (deprecated - mantener por compatibilidad)
 */
export const checkServerHealth = async (): Promise<{ status: string; service: string; timestamp: string }> => {
    return {
        status: 'ok',
        service: 'notificaciones',
        timestamp: new Date().toISOString(),
    };
}
