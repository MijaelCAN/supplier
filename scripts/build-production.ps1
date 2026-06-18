# Script de Build para Producción
# Este script construye el proyecto con las variables de entorno correctas

Write-Host "🚀 Iniciando build para producción..." -ForegroundColor Green

# Verificar que existe el archivo .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ ERROR: No se encontró el archivo .env.production" -ForegroundColor Red
    Write-Host "📝 Por favor, crea el archivo .env.production con la siguiente configuración:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "VITE_EMAIL_SERVER_URL=http://portalproveedores.vistony.com:3001" -ForegroundColor Cyan
    Write-Host "VITE_BASE_URL=http://portalproveedores.vistony.com:8051" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Puedes copiar el archivo env.production.example como referencia." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo .env.production encontrado" -ForegroundColor Green

# Leer y mostrar la configuración
Write-Host ""
Write-Host "📋 Configuración detectada:" -ForegroundColor Cyan
Get-Content ".env.production" | ForEach-Object {
    if ($_ -match "^VITE_") {
        Write-Host "   $_" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔨 Ejecutando npm run build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completado exitosamente!" -ForegroundColor Green
    
    # Verificar que no haya localhost en los archivos compilados
    Write-Host ""
    Write-Host "🔍 Verificando que no haya referencias a localhost..." -ForegroundColor Yellow
    
    $localhostFound = $false
    Get-ChildItem -Path "dist\assets\*.js" -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match "localhost:3001") {
            Write-Host "   ⚠️  ADVERTENCIA: Se encontró 'localhost:3001' en $($_.Name)" -ForegroundColor Red
            $localhostFound = $true
        }
    }
    
    if (-not $localhostFound) {
        Write-Host "   ✅ No se encontraron referencias a localhost" -ForegroundColor Green
    }
    
    # Verificar que la URL de producción esté presente
    Write-Host ""
    Write-Host "🔍 Verificando que la URL de producción esté presente..." -ForegroundColor Yellow
    
    $productionUrlFound = $false
    Get-ChildItem -Path "dist\assets\*.js" -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match "portalproveedores\.vistony\.com:3001") {
            Write-Host "   ✅ URL de producción encontrada en $($_.Name)" -ForegroundColor Green
            $productionUrlFound = $true
        }
    }
    
    if (-not $productionUrlFound) {
        Write-Host "   ⚠️  ADVERTENCIA: No se encontró la URL de producción" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📦 Archivos listos en la carpeta 'dist/'" -ForegroundColor Green
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Copiar la carpeta 'dist/' al servidor IIS" -ForegroundColor White
    Write-Host "   2. Verificar que 'web.config' esté presente" -ForegroundColor White
    Write-Host "   3. Configurar el sitio en IIS Manager" -ForegroundColor White
    Write-Host "   4. Asegurar que el servidor de correo esté corriendo" -ForegroundColor White
    
} else {
    Write-Host ""
    Write-Host "❌ ERROR: El build falló" -ForegroundColor Red
    exit 1
}








