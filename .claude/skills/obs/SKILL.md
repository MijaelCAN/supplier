---
name: obs
description: Registra una nueva observación (bug, mejora o pedido) en docs/observaciones.md, o actualiza el estado/solución de una existente. Usar cuando el usuario escriba /obs <texto>.
argument-hint: <texto de la observación> | <OBS-### estado/solución>
---

# /obs — Gestión de observaciones

Archivo: `docs/observaciones.md` (raíz del proyecto). Argumentos: `$ARGUMENTS`

## Si el argumento es una observación nueva

1. Lee `docs/observaciones.md` y calcula el siguiente ID (`OBS-001`, `OBS-002`, ...).
2. Analiza el texto y, si hace falta, busca en el código el módulo/pantalla afectada para completar los campos.
3. Agrega una fila a la tabla **Resumen** y una sección en **Detalle** siguiendo la plantilla del archivo:
   - **Fecha registro:** fecha de hoy (AAAA-MM-DD).
   - **Módulo / pantalla:** inferido del texto o del código.
   - **Prioridad:** inferida (Alta si bloquea o rompe funcionalidad; Media si afecta UX; Baja si es cosmético). Indícala como sugerida.
   - **Estado:** 🔴 Pendiente.
   - **Rama:** rama git actual.
   - **Observación (texto original):** el texto del usuario tal cual, en cita.
   - **Análisis / causa:** breve análisis inicial si se pudo identificar; si no, "Por analizar".
   - Solución, archivos, fecha solución y commit quedan vacíos.
4. Las observaciones más nuevas van al final (orden cronológico).
5. No empieces a corregir el código salvo que el usuario lo pida; responde con el ID asignado, un resumen de una línea y el análisis inicial.

## Si el argumento referencia una existente (ej. `/obs OBS-003 resuelto`)

Actualiza estado, solución, archivos modificados, fecha solución y commit tanto en la sección de detalle como en la fila del resumen.

## Al resolver una observación en cualquier conversación

Cuando corrijas algo que corresponde a una observación registrada, actualiza su entrada: estado 🟢 Resuelto (o 🟡 En progreso si queda pendiente), solución aplicada, archivos modificados, fecha y hash del commit si existe.
