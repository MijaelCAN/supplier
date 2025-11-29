# Servidor de Notificaciones por Correo

Backend para el envío de notificaciones por correo electrónico del Supplier Portal.

## Configuración

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `server` con la siguiente configuración:

```env
# Configuración del servidor
PORT=3001

# Configuración del servidor de correo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Credenciales de correo // DAVIS RAMOS - ENTREGA
EMAIL_USER=portalproveedores@vistony.com
EMAIL_PASSWORD=Pr0v33d0r3s$$*
```

### 3. Configuración para Gmail

Si usas Gmail, necesitas:

1. Habilitar la verificación en 2 pasos en tu cuenta de Google
2. Generar una "Contraseña de aplicación":
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Ingresa "Supplier Portal" como nombre
   - Copia la contraseña generada y úsala en `EMAIL_PASSWORD`

### 4. Otros proveedores de correo

- **Outlook/Hotmail**: `smtp-mail.outlook.com`, puerto `587`
- **Yahoo**: `smtp.mail.yahoo.com`, puerto `587`
- **Servidor propio**: Configura según las especificaciones de tu proveedor

## Ejecución

### Modo desarrollo (con recarga automática)

```bash
npm run dev
```

### Compilar TypeScript

```bash
npm run build
```

### Ejecutar en producción

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3001` (o el puerto configurado en `.env`)

## Endpoints del API

### GET `/health`
Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "service": "Email Notification Service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/email/verify`
Verifica la conexión con el servidor de correo.

**Respuesta:**
```json
{
  "success": true,
  "message": "Conexión con el servidor de correo verificada"
}
```

### POST `/api/email/send`
Envía un correo genérico.

**Body:**
```json
{
  "to": "destinatario@example.com",
  "subject": "Asunto del correo",
  "html": "<h1>Contenido HTML</h1>",
  "text": "Contenido en texto plano (opcional)",
  "cc": "copia@example.com (opcional)",
  "bcc": "copia-oculta@example.com (opcional)"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Correo enviado exitosamente",
  "messageId": "<message-id>"
}
```

### POST `/api/email/order-notification`
Envía una notificación de orden de compra.

**Body:**
```json
{
  "to": "proveedor@example.com",
  "orderData": {
    "orderNumber": "OC-2024-001",
    "supplierName": "Nombre del Proveedor",
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

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación de orden enviada exitosamente",
  "messageId": "<message-id>"
}
```

### POST `/api/email/notification`
Envía una notificación genérica con plantilla HTML.

**Body:**
```json
{
  "to": "usuario@example.com",
  "title": "Título de la notificación",
  "message": "Mensaje de la notificación",
  "actionUrl": "https://example.com/accion (opcional)",
  "actionText": "Ir a la acción (opcional)"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación enviada exitosamente",
  "messageId": "<message-id>"
}
```

## Ejemplo de uso desde el frontend

```typescript
// Enviar notificación de orden
const response = await fetch('http://localhost:3001/api/email/order-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
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
  })
});

const result = await response.json();
console.log(result);
```

## Estructura del proyecto

```
server/
├── server.ts          # Servidor Express principal
├── emailService.ts    # Servicio de envío de correos
├── package.json       # Dependencias y scripts
├── tsconfig.json      # Configuración de TypeScript
├── .env              # Variables de entorno (no incluido en git)
└── dist/             # Código compilado (generado)
```



