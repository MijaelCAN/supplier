# Script para Verificar el Build de Producción
# Verifica que el build tenga la configuración correcta

Write-Host "🔍 Verificando build de producción..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "dist")) {
    Write-Host "❌ ERROR: No se encontró la carpeta 'dist/'" -ForegroundColor Red
    Write-Host "   Ejecuta 'npm run build' primero" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Carpeta 'dist/' encontrada" -ForegroundColor Green
Write-Host ""

# Verificar web.config
Write-Host "📄 Verificando web.config..." -ForegroundColor Yellow
if (Test-Path "dist\web.config") {
    Write-Host "   ✅ web.config presente" -ForegroundColor Green
} else {
    Write-Host "   ❌ web.config NO encontrado" -ForegroundColor Red
    Write-Host "   📝 Copia 'public/web.config' a 'dist/web.config'" -ForegroundColor Yellow
}

Write-Host ""

# Verificar referencias a localhost
Write-Host "🔍 Buscando referencias a 'localhost:3001'..." -ForegroundColor Yellow
$localhostFiles = @()
Get-ChildItem -Path "dist\assets\*.js" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match "localhost:3001") {
        $localhostFiles += $_.Name
    }
}

if ($localhostFiles.Count -eq 0) {
    Write-Host "   ✅ No se encontraron referencias a localhost:3001" -ForegroundColor Green
} else {
    Write-Host "   ❌ Se encontraron referencias a localhost:3001 en:" -ForegroundColor Red
    $localhostFiles | ForEach-Object {
        Write-Host "      - $_" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "   ⚠️  ADVERTENCIA: El build puede no funcionar en producción" -ForegroundColor Yellow
    Write-Host "   📝 Asegúrate de tener .env.production configurado antes del build" -ForegroundColor Yellow
}

Write-Host ""

# Verificar URL de producción
Write-Host "🔍 Buscando URL de producción 'portalproveedores.vistony.com:3001'..." -ForegroundColor Yellow
$productionFiles = @()
Get-ChildItem -Path "dist\assets\*.js" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match "portalproveedores\.vistony\.com:3001") {
        $productionFiles += $_.Name
    }
}

if ($productionFiles.Count -gt 0) {
    Write-Host "   ✅ URL de producción encontrada en $($productionFiles.Count) archivo(s)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No se encontró la URL de producción" -ForegroundColor Yellow
    Write-Host "   📝 Verifica que .env.production tenga VITE_EMAIL_SERVER_URL configurado" -ForegroundColor Yellow
}

Write-Host ""

# Verificar index.html
Write-Host "📄 Verificando index.html..." -ForegroundColor Yellow
if (Test-Path "dist\index.html") {
    Write-Host "   ✅ index.html presente" -ForegroundColor Green
} else {
    Write-Host "   ❌ index.html NO encontrado" -ForegroundColor Red
}

Write-Host ""

# Resumen
Write-Host "📊 Resumen de Verificación:" -ForegroundColor Cyan
Write-Host "   - Carpeta dist/: " -NoNewline
if (Test-Path "dist") { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }
Write-Host "   - web.config: " -NoNewline
if (Test-Path "dist\web.config") { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }
Write-Host "   - index.html: " -NoNewline
if (Test-Path "dist\index.html") { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }
Write-Host "   - Sin localhost: " -NoNewline
if ($localhostFiles.Count -eq 0) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "❌" -ForegroundColor Red }
Write-Host "   - URL producción: " -NoNewline
if ($productionFiles.Count -gt 0) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "⚠️" -ForegroundColor Yellow }

Write-Host ""

if ($localhostFiles.Count -eq 0 -and $productionFiles.Count -gt 0) {
    Write-Host "✅ El build está listo para producción!" -ForegroundColor Green
} else {
    Write-Host "⚠️  El build necesita correcciones antes de desplegar" -ForegroundColor Yellow
}




