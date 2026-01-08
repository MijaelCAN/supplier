# Script para Configurar el Servidor de Correo en Producción
# Este script ayuda a configurar y ejecutar el servidor de correo

Write-Host "📧 Configurando Servidor de Correo..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "server")) {
    Write-Host "❌ ERROR: No se encontró la carpeta 'server/'" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Set-Location server

# Verificar archivo .env
Write-Host "📄 Verificando archivo .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  No se encontró el archivo .env" -ForegroundColor Yellow
    Write-Host "   📝 Por favor, crea el archivo .env con la configuración:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Puedes usar env.production.example como referencia" -ForegroundColor Cyan
    Write-Host ""
    $create = Read-Host "¿Deseas crear el archivo .env ahora? (S/N)"
    if ($create -eq "S" -or $create -eq "s") {
        Copy-Item "env.production.example" ".env"
        Write-Host "   ✅ Archivo .env creado. Por favor, edítalo con tus credenciales." -ForegroundColor Green
        Write-Host "   📝 Abre .env y configura EMAIL_USER y EMAIL_PASSWORD" -ForegroundColor Yellow
        exit 0
    } else {
        exit 1
    }
} else {
    Write-Host "   ✅ Archivo .env encontrado" -ForegroundColor Green
}

Write-Host ""

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencias encontradas" -ForegroundColor Green
}

Write-Host ""

# Compilar el servidor
Write-Host "🔨 Compilando servidor..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error compilando el servidor" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Servidor compilado" -ForegroundColor Green

Write-Host ""

# Verificar PM2
Write-Host "🔍 Verificando PM2..." -ForegroundColor Yellow
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "   ⚠️  PM2 no está instalado" -ForegroundColor Yellow
    Write-Host "   📝 PM2 es recomendado para ejecutar el servidor en producción" -ForegroundColor Cyan
    Write-Host ""
    $installPm2 = Read-Host "¿Deseas instalar PM2? (S/N)"
    if ($installPm2 -eq "S" -or $installPm2 -eq "s") {
        npm install -g pm2
        Write-Host "   ✅ PM2 instalado" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ PM2 está instalado" -ForegroundColor Green
}

Write-Host ""

# Opciones de ejecución
Write-Host "🚀 Opciones de ejecución:" -ForegroundColor Cyan
Write-Host "   1. Ejecutar con PM2 (Recomendado para producción)" -ForegroundColor White
Write-Host "   2. Ejecutar manualmente (node dist/server.js)" -ForegroundColor White
Write-Host "   3. Solo verificar configuración" -ForegroundColor White
Write-Host ""

$option = Read-Host "Selecciona una opción (1-3)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Iniciando servidor con PM2..." -ForegroundColor Yellow
        
        # Detener si ya está corriendo
        pm2 stop email-server 2>$null
        pm2 delete email-server 2>$null
        
        # Iniciar
        pm2 start dist/server.js --name email-server
        pm2 save
        
        Write-Host ""
        Write-Host "✅ Servidor iniciado con PM2" -ForegroundColor Green
        Write-Host "   Comandos útiles:" -ForegroundColor Cyan
        Write-Host "   - Ver logs: pm2 logs email-server" -ForegroundColor White
        Write-Host "   - Ver estado: pm2 status" -ForegroundColor White
        Write-Host "   - Detener: pm2 stop email-server" -ForegroundColor White
        Write-Host "   - Reiniciar: pm2 restart email-server" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Iniciando servidor manualmente..." -ForegroundColor Yellow
        Write-Host "   Presiona Ctrl+C para detener" -ForegroundColor Cyan
        Write-Host ""
        node dist/server.js
    }
    "3" {
        Write-Host ""
        Write-Host "✅ Configuración verificada" -ForegroundColor Green
        Write-Host "   Para iniciar el servidor, ejecuta:" -ForegroundColor Cyan
        Write-Host "   pm2 start dist/server.js --name email-server" -ForegroundColor White
        Write-Host "   o" -ForegroundColor White
        Write-Host "   node dist/server.js" -ForegroundColor White
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Set-Location ..




