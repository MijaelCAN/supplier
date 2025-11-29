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

interface ContactInfo {
    name?: string;
    position?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
}

interface EmailTemplateOptions {
    title: string;
    content: string;
    contactInfo?: ContactInfo;
    headerImageUrl?: string;
    logoUrl?: string;
    actionButton?: {
        text: string;
        url: string;
    };
}

export class EmailService {
    private transporter: nodemailer.Transporter;
    private baseUrl: string;

    constructor(config: EmailConfig, baseUrl?: string) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure ?? false,
            auth: {
                user: config.auth.user,
                pass: config.auth.password,
            },
        });
        // URL base para imágenes (puede venir de variable de entorno)
        this.baseUrl = baseUrl || process.env.EMAIL_BASE_URL || process.env.BASE_URL || 'http://localhost:3001';
    }

    /**
     * Genera el template base de email con el diseño de Vistony
     */
    private generateEmailTemplate(options: EmailTemplateOptions): string {
        const {
            title,
            content,
            contactInfo,
            headerImageUrl,
            logoUrl,
        } = options;

        // URLs de imágenes - usar URLs absolutas
        // La imagen se sirve desde el servidor de email en /images/subtract.png
        const headerImg = headerImageUrl || `${this.baseUrl}/images/subtract.png`;
        const logo = logoUrl || 'https://vistony.pe/wp-content/uploads/2025/04/logo.svg';

        // Generar sección de contacto si hay información
        const contactSection = contactInfo && (
            contactInfo.name || 
            contactInfo.position || 
            contactInfo.phone || 
            contactInfo.email || 
            contactInfo.website || 
            contactInfo.address
        ) ? `
            <!-- Información de contacto -->
            <tr>
                <td style="background-color: #f8f9fa; padding: 25px 30px; border-top: 3px solid #0051A5;">
                    <h3 style="color: #0051A5; font-size: 16px; margin: 0 0 15px 0;">Contacto Comercial</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="color: #666666; font-size: 14px; line-height: 1.6;">
                                ${contactInfo.name ? `<strong style="color: #0051A5;">${contactInfo.name}</strong><br>` : ''}
                                ${contactInfo.position ? `${contactInfo.position}<br>` : ''}
                                ${contactInfo.phone ? `${contactInfo.phone}<br>` : ''}
                                ${contactInfo.email ? `<a href="mailto:${contactInfo.email}" style="color: #0051A5; text-decoration: none;">${contactInfo.email}</a><br>` : ''}
                                ${contactInfo.website ? `<a href="${contactInfo.website.startsWith('http') ? contactInfo.website : 'http://' + contactInfo.website}" style="color: #0051A5; text-decoration: none;">${contactInfo.website}</a><br>` : ''}
                                ${contactInfo.address ? `<span style="color: #666666; font-size: 13px;">${contactInfo.address}</span>` : ''}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        ` : '';

        // Botón de acción si existe
        const actionButton = options.actionButton ? `
            <p style="margin-top:30px; text-align: center">
                <a href="${options.actionButton.url}" target="_blank"
                   style="background:#e60012; color:#ffffff; padding:12px 25px; 
                          text-decoration:none; font-size:15px; border-radius:2px; display:inline-block;">
                    ${options.actionButton.text}
                </a>
            </p>
        ` : '';

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title} - Portal de Proveedores Vistony</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table width="65%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 650px;">
                                <!-- Header con imagen decorativa y logo -->
                                <tr>
                                    <td style="padding: 0; margin: 0; position: relative;">
                                        <img src="${headerImg}"
                                             alt=""
                                             style="display:block; width:100%; height:auto; max-width: 100%;">
                                
                                        <div style="position: absolute; top: 30px; left: 30px;">
                                            <img src="${logo}"
                                                 alt="Vistony Logo"
                                                 style="height: 50px; max-width: 200px;">
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Contenido principal -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <div style="text-align: center;">
                                          <h1 style="color: #0051A5; font-size: 24px; margin: 30px 0 50px 0; font-weight: bold;">${title}</h1>
                                        </div>
                                        
                                        ${content}
                                        
                                        ${actionButton}
                                        
                                    </td>
                                </tr>
                                
                                ${contactSection}
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #0051A5; padding: 20px; text-align: center;">
                                        <p style="color: #ffffff; font-size: 12px; margin: 0;">
                                            © ${new Date().getFullYear()} VISTONY - Tecnología en Lubricación
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
    }

    /**
     * Obtiene información de contacto desde variables de entorno
     */
    private getContactInfo(): ContactInfo | undefined {
        const contactInfo: ContactInfo = {};
        
        if (process.env.CONTACT_NAME) contactInfo.name = process.env.CONTACT_NAME;
        if (process.env.CONTACT_POSITION) contactInfo.position = process.env.CONTACT_POSITION;
        if (process.env.CONTACT_PHONE) contactInfo.phone = process.env.CONTACT_PHONE;
        if (process.env.CONTACT_EMAIL) contactInfo.email = process.env.CONTACT_EMAIL;
        if (process.env.CONTACT_WEBSITE) contactInfo.website = process.env.CONTACT_WEBSITE;
        if (process.env.CONTACT_ADDRESS) contactInfo.address = process.env.CONTACT_ADDRESS;

        // Si hay al menos un campo, retornar el objeto
        if (Object.keys(contactInfo).length > 0) {
            return contactInfo;
        }

        return undefined;
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
        const itemsHtml = orderData.items.map(item => `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br>
                <span style="color: #666; font-size: 14px;">
                    Cantidad: ${item.quantity} | Precio unitario: $${item.price.toFixed(2)}
                </span>
            </div>
        `).join('');

        const content = `
            <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                Estimado proveedor, <strong>${orderData.supplierName}</strong>
            </p>

            <p style="color:#555; font-size:15px; line-height:1.6;">
                Se ha generado una nueva orden de compra que requiere su atención:
            </p>
            
            <div style="border-radius: 8px; margin-top:25px; padding:20px; background:#f1f7ff; border-left:4px solid #004b9b;">
                <h2 style="color: #0051A5; font-size: 20px; margin: 0 0 15px 0;">Orden #${orderData.orderNumber}</h2>
                ${orderData.deliveryDate ? `<p style="color:#444; font-size:14px; margin:5px 0;"><strong>Fecha de entrega:</strong> ${orderData.deliveryDate}</p>` : ''}
                
                <h3 style="color: #0051A5; font-size: 16px; margin: 15px 0 10px 0;">Items:</h3>
                ${itemsHtml}
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #004b9b;">
                    <p style="font-size: 18px; font-weight: bold; color: #0051A5; margin: 0;">
                        Total: $${orderData.total.toFixed(2)}
                    </p>
                </div>
            </div>
            
            <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                Por favor, revise los detalles de la orden en el portal de proveedores.
            </p>
        `;

        const html = this.generateEmailTemplate({
            title: 'Nueva Orden de Compra',
            content,
            contactInfo: this.getContactInfo(),
            actionButton: {
                text: 'Ver Orden en el Portal',
                url: `${this.baseUrl}/orden-compra`
            }
        });

        return this.sendEmail({
            to,
            subject: `Nueva Orden de Compra #${orderData.orderNumber} - Portal de Proveedores Vistony`,
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
        const content = `
            <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                ${message}
            </p>
        `;

        const html = this.generateEmailTemplate({
            title,
            content,
            contactInfo: this.getContactInfo(),
            actionButton: actionUrl && actionText ? {
                text: actionText,
                url: actionUrl
            } : undefined
        });

        return this.sendEmail({
            to,
            subject: `${title} - Portal de Proveedores Vistony`,
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
        const featuresHtml = `
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; color: #222; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #0051A5; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                        <span style="font-size: 15px; color: #555">Visualizar el estado de sus Ordenes de Compra</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #0051A5; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                        <span style="font-size: 15px; color: #555">Visualizar el estado de sus facturas por fechas</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #0051A5; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                        <span style="font-size: 15px; color: #555">Visualizar y actualizar su información comercial</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #0051A5; font-weight: 700; font-size: 18px; margin-right: 12px;">✓</span>
                        <span style="font-size: 15px; color: #555">Acceder a documentación importante</span>
                    </td>
                </tr>
            </table>
        `;

        const content = `
            <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                Estimado proveedor, <strong>${credentials.supplierName}</strong>
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
            
            ${featuresHtml}
            
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
        `;

        const html = this.generateEmailTemplate({
            title: '¡Bienvenido al Portal de Proveedores Vistony!',
            content,
            contactInfo: this.getContactInfo(),
            actionButton: credentials.portalLink ? {
                text: 'Ingresar al Portal',
                url: credentials.portalLink
            } : undefined
        });

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

        const content = `
            <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                Estimado/a <strong>${recoveryData.userName}</strong>,
            </p>
            
            <p style="color:#555; font-size:15px; line-height:1.6;">
                Hemos recibido una solicitud para recuperar su contraseña en el Portal de Proveedores.
            </p>
            
            <div style="background-color: white; padding: 30px; margin: 20px 0; text-align: center; border-radius: 8px; border: 2px solid #e5e7eb;">
                <p style="margin-top: 0; color: #6b7280; font-size: 14px;">Su código de verificación es:</p>
                <div style="font-size: 36px; font-weight: bold; color: #0051A5; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 20px 0;">
                    ${recoveryData.code}
                </div>
                <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">${expiresText}</p>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong style="color: #92400e;">⚠️ Importante:</strong> 
                <span style="color: #78350f;">Por seguridad, no comparta este código con nadie. Si no solicitó este código, ignore este correo.</span>
            </div>
            
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong style="color: #1e40af;">ℹ️ Instrucciones:</strong>
                <ol style="margin: 10px 0; padding-left: 20px; color: #1e3a8a;">
                    <li>Ingrese el código de 6 dígitos en el formulario de recuperación</li>
                    <li>Complete la verificación</li>
                    <li>Establezca su nueva contraseña</li>
                </ol>
            </div>
            
            <p style="color:#555; font-size:15px; line-height:1.6; margin-top:20px;">
                Si tiene problemas para acceder, contacte al soporte técnico.
            </p>
        `;

        const html = this.generateEmailTemplate({
            title: 'Recuperación de Contraseña',
            content,
            contactInfo: this.getContactInfo(),
        });

        return this.sendEmail({
            to,
            subject: `Código de Recuperación de Contraseña - Portal de Proveedores Vistony`,
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
