# Configuración de Variables de Entorno para Email Service

## Variables Requeridas

### Configuración del Servidor de Correo

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

### Variables Opcionales

#### URL Base para Imágenes
```env
EMAIL_BASE_URL=http://localhost:3001
# O en producción:
EMAIL_BASE_URL=https://tu-dominio.com
```

#### Información de Contacto (Opcional)
Si no se configuran, la sección de contacto no aparecerá en los correos.

## Notas Importantes

1. **Imagen Header**: La imagen `subtract.png` se servirá desde `/images/subtract.png` del servidor de email.
   - Asegúrate de que la imagen esté en `public/subtract.png` del proyecto
   - O configura `EMAIL_BASE_URL` para apuntar a donde esté servida la imagen

2. **Logo**: Por defecto usa el logo de Vistony desde su sitio web.

3. **Contacto**: Si no configuras las variables de contacto, esa sección no aparecerá en los correos.

## Ejemplo de .env

```env
# Servidor
PORT=3001
EMAIL_BASE_URL=http://localhost:3001

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notificaciones@vistony.com
EMAIL_PASSWORD=app-password-aqui

# Contacto (Opcional)
CONTACT_NAME=Luis José M. Bravo Urtecho
CONTACT_POSITION=Jefe Comercial
CONTACT_PHONE=954694196
CONTACT_EMAIL=luis.bravo@ndiasa.com.pe
CONTACT_WEBSITE=www.vistony.com
CONTACT_ADDRESS=Mz N Lote 10-11 C.P El Milagro, Huanchaco - Trujillo
```






