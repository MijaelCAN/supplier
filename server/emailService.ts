import nodemailer from "nodemailer";

interface EmailConfig {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
        user: string;
        password: string;
    }
}

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(config: EmailConfig) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure ?? false, // true para 465, false para otros puertos
            auth: {
                user: config.auth.user,
                pass: config.auth.password,
            },
        });
    }

    /**
     * Verifica la conexión con el servidor de correo
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Error verificando conexión de correo:', error);
            return false;
        }
    }

    /**
     * Envía un correo electrónico
     */
    async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const info = await this.transporter.sendMail({
                from: `"Supplier Portal" <${process.env.EMAIL_USER}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html),
                cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
                bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
            });

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('Error enviando correo:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido al enviar correo',
            };
        }
    }

    /**
     * Envía un correo de notificación de orden de compra
     */
    async sendOrderNotification(
        to: string | string[],
        orderData: {
            orderNumber: string;
            supplierName: string;
            total: number;
            items: Array<{ name: string; quantity: number; price: number }>;
            deliveryDate?: string;
        }
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9fafb; }
                    .order-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                    .item { padding: 10px; border-bottom: 1px solid #eee; }
                    .total { font-size: 18px; font-weight: bold; color: #4F46E5; margin-top: 15px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nueva Orden de Compra</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${orderData.supplierName}</strong>,</p>
                        <p>Se ha generado una nueva orden de compra que requiere su atención:</p>
                        
                        <div class="order-info">
                            <h2>Orden #${orderData.orderNumber}</h2>
                            ${orderData.deliveryDate ? `<p><strong>Fecha de entrega:</strong> ${orderData.deliveryDate}</p>` : ''}
                            
                            <h3>Items:</h3>
                            ${orderData.items.map(item => `
                                <div class="item">
                                    <strong>${item.name}</strong><br>
                                    Cantidad: ${item.quantity} | Precio unitario: $${item.price.toFixed(2)}
                                </div>
                            `).join('')}
                            
                            <div class="total">
                                Total: $${orderData.total.toFixed(2)}
                            </div>
                        </div>
                        
                        <p>Por favor, revise los detalles de la orden en el portal de proveedores.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>Supplier Portal - Sistema de Gestión</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to,
            subject: `Nueva Orden de Compra #${orderData.orderNumber}`,
            html,
        });
    }

    /**
     * Envía un correo de notificación genérica
     */
    async sendNotification(
        to: string | string[],
        title: string,
        message: string,
        actionUrl?: string,
        actionText?: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9fafb; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${title}</h1>
                    </div>
                    <div class="content">
                        <p>${message}</p>
                        ${actionUrl && actionText ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ''}
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>Supplier Portal - Sistema de Gestión</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to,
            subject: title,
            html,
        });
    }

    /**
     * Envía correo con credenciales de nuevo proveedor
     */
    async sendSupplierCredentials(
        to: string,
        credentials: {
            username: string;
            password: string;
            supplierName: string;
            userFullName: string;
            portalLink?: string;
        }
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { padding: 20px; background-color: #f9fafb; }
                    .credentials-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 2px solid #e5e7eb; }
                    .credential-item { margin: 15px 0; padding: 12px; background-color: #f3f4f6; border-radius: 5px; }
                    .credential-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
                    .credential-value { font-size: 18px; color: #111827; font-family: 'Courier New', monospace; }
                    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bienvenido al Supplier Portal</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${credentials.userFullName}</strong>,</p>
                        <p>Su empresa <strong>${credentials.supplierName}</strong> ha sido registrada exitosamente en el Portal de Proveedores de Vistony.</p>
                        
                        <div class="credentials-box">
                            <h2 style="margin-top: 0; color: #4F46E5;">Sus Credenciales de Acceso</h2>
                            
                            <div class="credential-item">
                                <div class="credential-label">Usuario</div>
                                <div class="credential-value">${credentials.username}</div>
                            </div>
                            
                            <div class="credential-item">
                                <div class="credential-label">Contraseña Temporal</div>
                                <div class="credential-value">${credentials.password}</div>
                            </div>
                        </div>
                        
                        <div class="warning-box">
                            <strong>⚠️ Importante:</strong> Por seguridad, le recomendamos cambiar esta contraseña temporal al iniciar sesión por primera vez.
                        </div>
                        
                        ${credentials.portalLink ? `
                            <p style="text-align: center;">
                                <a href="${credentials.portalLink}" class="button">Acceder al Portal</a>
                            </p>
                        ` : ''}
                        
                        <p>Con estas credenciales podrá:</p>
                        <ul>
                            <li>Acceder a su perfil de proveedor</li>
                            <li>Ver y gestionar sus órdenes de compra</li>
                            <li>Subir documentos y facturas</li>
                            <li>Consultar el estado de sus pagos</li>
                        </ul>
                        
                        <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>Portal de proveedores - Sistema de Gestión Vistony</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to,
            subject: `Bienvenido a Supplier Portal - Credenciales de Acceso`,
            html,
        });
    }

    /**
     * Envía correo con código de recuperación de contraseña
     */
    async sendPasswordRecoveryCode(
        to: string,
        recoveryData: {
            code: string;
            userName: string;
            expiresIn?: number; // minutos
        }
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const expiresText = recoveryData.expiresIn 
            ? `Este código expirará en ${recoveryData.expiresIn} minutos.`
            : 'Este código es válido por tiempo limitado.';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { padding: 20px; background-color: #f9fafb; }
                    .code-box { background-color: white; padding: 30px; margin: 20px 0; text-align: center; border-radius: 5px; border: 2px solid #e5e7eb; }
                    .code { font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 20px 0; }
                    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Recuperación de Contraseña</h1>
                    </div>
                    <div class="content">
                        <p>Estimado/a <strong>${recoveryData.userName}</strong>,</p>
                        <p>Hemos recibido una solicitud para recuperar su contraseña en el Supplier Portal.</p>
                        
                        <div class="code-box">
                            <p style="margin-top: 0; color: #6b7280;">Su código de verificación es:</p>
                            <div class="code">${recoveryData.code}</div>
                            <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">${expiresText}</p>
                        </div>
                        
                        <div class="warning-box">
                            <strong>⚠️ Importante:</strong> Por seguridad, no comparta este código con nadie. Si no solicitó este código, ignore este correo.
                        </div>
                        
                        <div class="info-box">
                            <strong>ℹ️ Instrucciones:</strong>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                <li>Ingrese el código de 6 dígitos en el formulario de recuperación</li>
                                <li>Complete la verificación</li>
                                <li>Establezca su nueva contraseña</li>
                            </ol>
                        </div>
                        
                        <p>Si tiene problemas para acceder, contacte al soporte técnico.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no responder.</p>
                        <p>Portal de proveedores - Sistema de Gestión Vistony</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to,
            subject: `Código de Recuperación de Contraseña - Supplier Portal`,
            html,
        });
    }

    /**
     * Convierte HTML a texto plano (método auxiliar)
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }
}
