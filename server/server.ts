import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmailService } from './emailService.js';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes estáticas para los correos
app.use('/images', express.static(path.join(__dirname, '../public')));

// Inicializar servicio de correo
let emailService: EmailService | null = null;

try {
    const baseUrl = process.env.EMAIL_BASE_URL || process.env.BASE_URL || `http://localhost:${PORT}`;
    emailService = new EmailService({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER || '',
            password: process.env.EMAIL_PASSWORD || '',
        },
    }, baseUrl);

    // Verificar conexión al iniciar
    emailService.verifyConnection().then((isConnected) => {
        if (isConnected) {
            console.log('✅ Servicio de correo configurado correctamente');
        } else {
            console.warn('⚠️  No se pudo verificar la conexión del servicio de correo');
        }
    });
} catch (error) {
    console.error('❌ Error inicializando servicio de correo:', error);
}

// Middleware para verificar que el servicio de correo esté disponible
const checkEmailService = (_req: Request, res: Response, next: express.NextFunction): void => {
    if (!emailService) {
        res.status(503).json({
            success: false,
            error: 'Servicio de correo no disponible. Verifique la configuración.',
        });
        return;
    }
    next();
};

// Ruta de salud
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'Email Notification Service',
        timestamp: new Date().toISOString(),
    });
});

// Ruta para verificar conexión del servicio de correo
app.get('/api/email/verify', checkEmailService, async (_req: Request, res: Response): Promise<void> => {
    try {
        const isConnected = await emailService!.verifyConnection();
        res.json({
            success: isConnected,
            message: isConnected
                ? 'Conexión con el servidor de correo verificada'
                : 'No se pudo verificar la conexión con el servidor de correo',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});

// Ruta para enviar correo genérico
app.post('/api/email/send', checkEmailService, async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, subject, html, text, cc, bcc } = req.body;

        // Validaciones
        if (!to) {
            res.status(400).json({
                success: false,
                error: 'El campo "to" (destinatario) es requerido',
            });
            return;
        }

        if (!subject) {
            res.status(400).json({
                success: false,
                error: 'El campo "subject" (asunto) es requerido',
            });
            return;
        }

        if (!html) {
            res.status(400).json({
                success: false,
                error: 'El campo "html" (contenido) es requerido',
            });
            return;
        }

        const result = await emailService!.sendEmail({
            to,
            subject,
            html,
            text,
            cc,
            bcc,
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Correo enviado exitosamente',
                messageId: result.messageId,
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Error al enviar correo',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});

// Ruta para enviar notificación de orden de compra
app.post('/api/email/order-notification', checkEmailService, async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, orderData } = req.body;

        // Validaciones
        if (!to) {
            res.status(400).json({
                success: false,
                error: 'El campo "to" (destinatario) es requerido',
            });
            return;
        }

        if (!orderData) {
            res.status(400).json({
                success: false,
                error: 'El campo "orderData" es requerido',
            });
            return;
        }

        const requiredFields = ['orderNumber', 'supplierName', 'total', 'items'];
        const missingFields = requiredFields.filter((field) => !orderData[field]);

        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                error: `Faltan campos requeridos: ${missingFields.join(', ')}`,
            });
            return;
        }

        const result = await emailService!.sendOrderNotification(to, orderData);

        if (result.success) {
            res.json({
                success: true,
                message: 'Notificación de orden enviada exitosamente',
                messageId: result.messageId,
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Error al enviar notificación',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});

// Ruta para enviar notificación genérica
app.post('/api/email/notification', checkEmailService, async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, title, message, actionUrl, actionText } = req.body;

        // Validaciones
        if (!to) {
            res.status(400).json({
                success: false,
                error: 'El campo "to" (destinatario) es requerido',
            });
            return;
        }

        if (!title) {
            res.status(400).json({
                success: false,
                error: 'El campo "title" (título) es requerido',
            });
            return;
        }

        if (!message) {
            res.status(400).json({
                success: false,
                error: 'El campo "message" (mensaje) es requerido',
            });
            return;
        }

        const result = await emailService!.sendNotification(to, title, message, actionUrl, actionText);

        if (result.success) {
            res.json({
                success: true,
                message: 'Notificación enviada exitosamente',
                messageId: result.messageId,
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Error al enviar notificación',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});

// Ruta para enviar credenciales de proveedor
app.post('/api/email/supplier-credentials', checkEmailService, async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, credentials } = req.body;

        // Validaciones
        if (!to) {
            res.status(400).json({
                success: false,
                error: 'El campo "to" (destinatario) es requerido',
            });
            return;
        }

        if (!credentials) {
            res.status(400).json({
                success: false,
                error: 'El campo "credentials" es requerido',
            });
            return;
        }

        const requiredFields = ['username', 'password', 'supplierName', 'userFullName'];
        const missingFields = requiredFields.filter((field) => !credentials[field]);

        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                error: `Faltan campos requeridos en credentials: ${missingFields.join(', ')}`,
            });
            return;
        }

        const result = await emailService!.sendSupplierCredentials(to, credentials);

        if (result.success) {
            res.json({
                success: true,
                message: 'Credenciales enviadas exitosamente',
                messageId: result.messageId,
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Error al enviar credenciales',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});

// Ruta para enviar código de recuperación de contraseña
app.post('/api/email/password-recovery', checkEmailService, async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, recoveryData } = req.body;

        // Validaciones
        if (!to) {
            res.status(400).json({
                success: false,
                error: 'El campo "to" (destinatario) es requerido',
            });
            return;
        }

        if (!recoveryData) {
            res.status(400).json({
                success: false,
                error: 'El campo "recoveryData" es requerido',
            });
            return;
        }

        const requiredFields = ['code', 'userName'];
        const missingFields = requiredFields.filter((field) => !recoveryData[field]);

        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                error: `Faltan campos requeridos en recoveryData: ${missingFields.join(', ')}`,
            });
            return;
        }

        const result = await emailService!.sendPasswordRecoveryCode(to, recoveryData);

        if (result.success) {
            res.json({
                success: true,
                message: 'Código de recuperación enviado exitosamente',
                messageId: result.messageId,
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Error al enviar código de recuperación',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
});

// Manejo de errores 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
    });
});

// Manejo de errores globales
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de notificaciones corriendo en http://localhost:${PORT}`);
    console.log(`📧 Configuración de correo: ${process.env.EMAIL_HOST || 'No configurado'}`);
});

