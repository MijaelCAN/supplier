# 📧 Configuración del Backend de Notificaciones por Correo

## ✅ Pasos Completados

### 1. **Estructura del Servidor**
- ✅ Creado `server.ts` con Express y configuración completa
- ✅ Creado `emailService.ts` con servicio de envío de correos
- ✅ Configurado TypeScript para el servidor (`tsconfig.json`)
- ✅ Actualizado `package.json` con todas las dependencias necesarias

### 2. **Dependencias Instaladas**
El `package.json` del servidor incluye:
- `express` - Framework web
- `nodemailer` - Envío de correos
- `cors` - Permite peticiones desde el frontend
- `dotenv` - Manejo de variables de entorno
- `typescript` y `tsx` - Compilación y ejecución de TypeScript
- Tipos de TypeScript para todas las dependencias

### 3. **Servicio de Correo (`emailService.ts`)**
Implementado con:
- ✅ Configuración de transporte SMTP
- ✅ Verificación de conexión
- ✅ Envío de correos genéricos
- ✅ Plantilla HTML para notificaciones de orden de compra
- ✅ Plantilla HTML para notificaciones genéricas
- ✅ Soporte para múltiples destinatarios (to, cc, bcc)

### 4. **API REST (`server.ts`)**
Endpoints implementados:
- ✅ `GET /health` - Estado del servidor
- ✅ `GET /api/email/verify` - Verificar conexión de correo
- ✅ `POST /api/email/send` - Enviar correo genérico
- ✅ `POST /api/email/order-notification` - Notificación de orden
- ✅ `POST /api/email/notification` - Notificación genérica

### 5. **Servicio Frontend**
- ✅ Creado `src/services/email/emailApi.ts`
- ✅ Creado `src/services/email/types.ts`
- ✅ Funciones para consumir todos los endpoints del API

## 📋 Pasos que Faltan (Por Hacer)

### 1. **Instalar Dependencias del Servidor**
```bash
cd server
npm install
```

### 2. **Configurar Variables de Entorno**

Crea un archivo `.env` en la carpeta `server/` con:

```env
# Puerto del servidor
PORT=3001

# Configuración SMTP (ejemplo para Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Credenciales
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

**⚠️ IMPORTANTE para Gmail:**
1. Habilita la verificación en 2 pasos en tu cuenta de Google
2. Ve a: https://myaccount.google.com/apppasswords
3. Genera una "Contraseña de aplicación" para "Correo"
4. Usa esa contraseña en `EMAIL_PASSWORD` (no tu contraseña normal)

### 3. **Configurar Variable de Entorno en el Frontend**

Agrega en tu archivo `.env` del proyecto principal (raíz):

```env
VITE_EMAIL_SERVER_URL=http://localhost:3001
```

O si el servidor está en producción:
```env
VITE_EMAIL_SERVER_URL=https://tu-servidor.com
```

### 4. **Ejecutar el Servidor**

**Modo desarrollo (con recarga automática):**
```bash
cd server
npm run dev
```

**Modo producción:**
```bash
cd server
npm run build
npm start
```

### 5. **Probar el Servidor**

Abre tu navegador en: `http://localhost:3001/health`

Deberías ver:
```json
{
  "status": "ok",
  "service": "Email Notification Service",
  "timestamp": "..."
}
```

### 6. **Integrar en el Frontend**

Ejemplo de uso en un componente React:

```typescript
import { sendOrderNotification } from '@/services/email/emailApi';

// Enviar notificación de orden
const handleSendNotification = async () => {
  const result = await sendOrderNotification({
    to: 'proveedor@example.com',
    orderData: {
      orderNumber: 'OC-2024-001',
      supplierName: 'Proveedor ABC',
      total: 1500.00,
      items: [
        { name: 'Producto 1', quantity: 10, price: 50.00 }
      ],
      deliveryDate: '2024-01-15'
    }
  });

  if (result.success) {
    console.log('Correo enviado:', result.messageId);
  } else {
    console.error('Error:', result.error);
  }
};
```

## 🔧 Funcionamiento del API

### Arquitectura

```
Frontend (React) 
    ↓ HTTP Request
Servidor Express (server.ts)
    ↓ Usa
EmailService (emailService.ts)
    ↓ Conecta a
Servidor SMTP (Gmail, Outlook, etc.)
    ↓ Envía
Correo Electrónico
```

### Flujo de una Notificación de Orden

1. **Frontend** llama a `sendOrderNotification()` desde `emailApi.ts`
2. **emailApi.ts** hace un `POST` a `http://localhost:3001/api/email/order-notification`
3. **server.ts** recibe la petición, valida los datos
4. **emailService.ts** genera el HTML de la plantilla con los datos de la orden
5. **nodemailer** se conecta al servidor SMTP configurado
6. El correo se envía al destinatario
7. Se retorna una respuesta con `success: true` y el `messageId`

### Endpoints Detallados

#### `POST /api/email/order-notification`
**Body:**
```json
{
  "to": "proveedor@example.com",
  "orderData": {
    "orderNumber": "OC-2024-001",
    "supplierName": "Proveedor ABC",
    "total": 1500.00,
    "items": [
      {
        "name": "Producto 1",
        "quantity": 10,
        "price": 50.00
      }
    ],
    "deliveryDate": "2024-01-15"
  }
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Notificación de orden enviada exitosamente",
  "messageId": "<message-id-del-servidor>"
}
```

**Respuesta con error:**
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

### Seguridad

- ✅ Validación de campos requeridos
- ✅ Manejo de errores
- ✅ Variables de entorno para credenciales (no hardcodeadas)
- ⚠️ **Pendiente:** Agregar autenticación si el servidor será público

### Próximas Mejoras Sugeridas

1. **Autenticación:** Agregar JWT o API keys para proteger los endpoints
2. **Rate Limiting:** Limitar cantidad de correos por minuto/hora
3. **Cola de Correos:** Usar Bull o similar para procesar correos en background
4. **Logging:** Guardar logs de correos enviados en base de datos
5. **Plantillas:** Sistema de plantillas más flexible
6. **Múltiples Proveedores:** Soporte para cambiar de proveedor SMTP dinámicamente

## 🐛 Solución de Problemas

### Error: "Servicio de correo no disponible"
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Revisa que `EMAIL_USER` y `EMAIL_PASSWORD` estén configurados

### Error: "Invalid login"
- Si usas Gmail, asegúrate de usar una "Contraseña de aplicación"
- Verifica que la verificación en 2 pasos esté habilitada

### Error: "Connection timeout"
- Verifica que `EMAIL_HOST` y `EMAIL_PORT` sean correctos
- Revisa tu firewall/antivirus
- Para Gmail, usa puerto 587 con `EMAIL_SECURE=false`

### El servidor no inicia
- Ejecuta `npm install` en la carpeta `server`
- Verifica que el puerto 3001 no esté en uso
- Revisa los logs de error en la consola

## 📚 Recursos

- [Documentación de Nodemailer](https://nodemailer.com/about/)
- [Configuración SMTP de Gmail](https://support.google.com/mail/answer/7126229)
- [Express.js Documentation](https://expressjs.com/)






