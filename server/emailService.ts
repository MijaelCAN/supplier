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
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bienvenido al Portal de Proveedores - Vistony</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table width="65%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header con logo y líneas decorativas -->
                                
                                <tr>
                                    <td style="padding: 0; margin: 0; position: relative;">
                                        <img src="../public/subtract.png"
                                             alt="Decoración Header"
                                             style="display:block; width:100%; height:auto;">
                                
                                        <div style="position: absolute; top: 30px; left: 30px;">
                                            <img src="https://vistony.pe/wp-content/uploads/2025/04/logo.svg"
                                                 alt="Vistony Logo"
                                                 style="height: 50px;">
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Contenido principal -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <div style="text-align: center;">
                                          <h1 style="color: #0051A5; font-size: 24px; margin: 30px 0 50px 0; font-weight: bold;">¡Bienvenido al Portal de Proveedores Vistony!</h1>
                                        </div>
                                        
                                        <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                                            Estimado proveedor, ${credentials.supplierName}
                                        </p>
                        
                                        <p style="color:#555; font-size:15px; line-height:1.6;">
                                            Es un gusto darte la bienvenida a nuestro 
                                            <strong>Portal de Proveedores</strong>, una plataforma diseñada para mejorar la 
                                            comunicación, agilizar procesos y fortalecer nuestra relación comercial.
                                        </p>
                        
                                        <p style="color:#555; font-size:15px; line-height:1.6;">
                                            A través del portal podrás gestionar documentos, consultar requerimientos, actualizar 
                                            información y realizar un seguimiento más eficiente de tus operaciones.
                                        </p>
                                        
                                        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; color: #222;">
                                          <tr>
                                            <td style="padding: 0px 0; display: flex; align-items: center; margin-left: 100px ">
                                              <span style="color: #555; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                                              <span style="font-size: 15px; color: #555">Visualizar el estado de sus Ordenes de Compra</span>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td style="padding: 0px 0; display: flex; align-items: center; margin-left: 100px ">
                                              <span style="color: #555; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                                              <span style="font-size: 15px; color: #555">Visualizar el estado de sus facturas por fechas</span>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td style="padding: 0px 0; display: flex; align-items: center; margin-left: 100px ">
                                              <span style="color: #555; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                                              <span style="font-size: 15px; color: #555">Visualiar y actualizar su información comercial</span>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td style="padding: 0px 0; display: flex; align-items: center; margin-left: 100px ">
                                              <span style="color: #555; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                                              <span style="font-size: 15px; color: #555">Acceder a documentación importante</span>
                                            </td>
                                          </tr>
                                        </table>
            
                                        
                                        <!-- Credenciales -->
                                        <div style="border-radius: 26px; margin-top:25px; padding:18px; background:#f1f7ff; border-left:4px solid #004b9b;">
                                            <p style="color:#004b9b; font-size:16px; margin:0 0 10px; text-align: center">
                                                <strong>Credenciales de Acceso</strong>
                                            </p>
                        
                                            <p style="color:#444; font-size:14px; margin:5px 0;">
                                                <strong>Usuario:</strong> ${credentials.username}
                                            </p>
                                            <p style="color:#444; font-size:14px; margin:5px 0;">
                                                <strong>Contraseña:</strong> ${credentials.password}
                                            </p>
                        
                                            <p style="color:#777; font-size:12px; margin-top:10px; font-style:italic;">
                                                *Por seguridad, te recomendamos cambiar tu contraseña en tu primer inicio de sesión.
                                            </p>
                                        </div>
                                        
                                        <!-- Botón -->
                                        <p style="margin-top:30px; text-align: center">
                                            <a href="${credentials.portalLink}" target="_blank"
                                               style="background:#e60012; color:#ffffff; padding:12px 25px; 
                                                      text-decoration:none; font-size:15px; border-radius:2px;">
                                                Ingresar al Portal
                                            </a>
                                        </p>
                                        
                                    </td>
                                </tr>
                                
                                <!-- Información de contacto -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 25px 30px; border-top: 3px solid #0051A5;">
                                        <h3 style="color: #0051A5; font-size: 16px; margin: 0 0 15px 0;">Contacto Comercial</h3>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #666666; font-size: 14px; line-height: 1.0;">
                                                    <strong style="color: #0051A5;">Luis José M. Bravo Urtecho</strong><br>
                                                    Jefe Comercial<br>
                                                    954694196<br>
                                                    <a href="mailto:luis.bravo@ndiasa.com.pe" style="color: #0051A5; text-decoration: none;">luis.bravo@ndiasa.com.pe</a><br>
                                                    <a href="http://www.vistony.com" style="color: #0051A5; text-decoration: none;">www.vistony.com</a><br>
                                                    <span style="color: #666666; font-size: 13px;">Mz N Lote 10-11 C.P El Milagro, Huanchaco - Trujillo</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #0051A5; padding: 20px; text-align: center;">
                                        <p style="color: #ffffff; font-size: 12px; margin: 0;">
                                            © 2025 VISTONY - Tecnología en Lubricación
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
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
