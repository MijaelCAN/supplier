/**
 * Tipos para el servicio de correo electrónico
 */

export interface EmailSendRequest {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

export interface OrderNotificationData {
    orderNumber: string;
    supplierName: string;
    total: number;
    items: OrderItem[];
    deliveryDate?: string;
}

export interface OrderNotificationRequest {
    to: string | string[];
    orderData: OrderNotificationData;
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

