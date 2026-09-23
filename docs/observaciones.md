# Observaciones — Supplier Portal

Registro de observaciones (bugs, mejoras, pedidos de usuarios) y su seguimiento.
Se agregan con el comando `/obs <texto>`.

**Estados:** 🔴 Pendiente · 🟡 En progreso · 🟢 Resuelto · ⚪ Descartado
**Prioridad:** Alta · Media · Baja

## Resumen

| ID | Fecha | Título | Módulo | Prioridad | Estado |
|----|-------|--------|--------|-----------|--------|
| OBS-001 | 2026-09-23 | Almacén y Calidad no deben depender de la evaluación de Seguridad | Agenda / Detalle de cita – Evaluación | Alta | 🟢 Resuelto |
| OBS-002 | 2026-09-23 | PackingList: permitir cantidad hasta 20% sobre lo pendiente | Agenda / Crear PackingList | Media | 🟢 Resuelto |
| OBS-003 | 2026-09-23 | Versión del sidebar en duro, no se toma de package.json | Layout / Sidebar | Baja | 🟢 Resuelto |

---

## Detalle

<!-- Plantilla (no borrar):

### OBS-000 — Título corto
- **Fecha registro:** AAAA-MM-DD
- **Módulo / pantalla:**
- **Prioridad:** Alta | Media | Baja
- **Estado:** 🔴 Pendiente
- **Rama:**

**Observación (texto original):**
> ...

**Análisis / causa:**
...

**Solución:**
...

**Archivos modificados:**
- ...

**Fecha solución:**
**Commit:**

-->

### OBS-001 — Almacén y Calidad no deben depender de la evaluación de Seguridad
- **Fecha registro:** 2026-09-23
- **Módulo / pantalla:** Agenda → Detalle de cita (`AppointmentDetail.tsx`) y página de evaluación (`EvaluationPage.tsx`)
- **Prioridad:** Alta (sugerida — bloquea a Almacén/Calidad hasta que Seguridad califique)
- **Estado:** 🟢 Resuelto
- **Rama:** release/1.0.0

**Observación (texto original):**
> No limitar la evaluacion ni de almacen ni de calidad si e sque seguridad no lo hizo aun

**Análisis / causa:**
`canEvaluateCalidadYCantidad()` exige que `puntualidad` (criterio de Seguridad) ya esté calificada antes de permitir evaluar `estadoMercaderia` (Calidad) y `cantidadCorrecta` (Almacén). Si Seguridad no registró la puntualidad, Calidad y Almacén quedan bloqueados con el mensaje "primero debe calificarse la Puntualidad (asistencia)".
Lógica duplicada en:
- `src/pages/Agenda/AppointmentDetail.tsx:582` (`canEvaluateCalidadYCantidad`) usada en `canOpenEvaluationModal`.
- `src/pages/Agenda/EvaluationPage.tsx:168` (`canEvaluateCalidadYCantidad`) usada en `handleOpenModal`, y su mensaje en `getEvaluationErrorMessage` (línea ~181).
Solución probable: quitar esa dependencia (que `estadoMercaderia`/`cantidadCorrecta` no validen puntualidad) en ambos archivos y ajustar/eliminar el mensaje de error asociado.

**Solución:**
Se eliminó `canEvaluateCalidadYCantidad()` y su mensaje de error en ambas pantallas. `estadoMercaderia` (Calidad) y `cantidadCorrecta` (Almacén) ya no exigen que `puntualidad` esté calificada; solo se bloquean si ya fueron evaluados. Las reglas de Seguridad (puntualidad desde 1 h antes de la cita, documentación con documentos cargados) no cambian.

**Archivos modificados:**
- `src/pages/Agenda/AppointmentDetail.tsx`
- `src/pages/Agenda/EvaluationPage.tsx`

**Fecha solución:** 2026-09-23
**Commit:** fae4ba0

### OBS-002 — PackingList: permitir cantidad hasta 20% sobre lo pendiente
- **Fecha registro:** 2026-09-23
- **Módulo / pantalla:** Agenda → modal Crear PackingList (`index.tsx`) y detalle de cita (`AppointmentDetail.tsx`)
- **Prioridad:** Media (sugerida — cambio de regla de negocio; hoy impide registrar sobre-entregas)
- **Estado:** 🟢 Resuelto
- **Rama:** release/1.0.0

**Observación (texto original):**
> Al momentode ingresar la canitdad de pakingList, actualemnte restringe si es que no se tiene la cantidad mayor a cero y menoral monto maximo, pero que se pueda ingresar un 20% mas de la cantidad es decir si en la orden dice 100 que me permita ingresar hasta 120.

**Análisis / causa:**
El tope por ítem es `pendingQuantity` (cantidad pendiente de la orden). Se aplica en dos puntos, duplicados en ambos archivos:
- Input de cantidad con `max={item.pendingQuantity}` — `src/pages/Agenda/index.tsx:2856`, `src/pages/Agenda/AppointmentDetail.tsx:2158`.
- Botón "Crear PackingList" deshabilitado si `item.quantity > item.pendingQuantity` — `src/pages/Agenda/index.tsx:2919`, `src/pages/Agenda/AppointmentDetail.tsx:2216`.
Solución probable: calcular un máximo permitido = `pendingQuantity * 1.2` (idealmente con una constante de tolerancia compartida, p. ej. `PACKING_LIST_TOLERANCE = 0.2`) y usarlo en ambos puntos. Por definir: redondeo cuando el resultado no es entero (el input usa `parseInt`, p. ej. `Math.floor`), y si el 20% se aplica sobre la cantidad pendiente o sobre la cantidad original de la orden (el texto dice "en la orden dice 100"). Verificar también si el backend/SAP valida el exceso.

**Solución:**
Nuevo helper `getMaxPackingListQuantity(item)` con constante `PACKING_LIST_TOLERANCE = 0.2`. Máximo = `floor(pendiente + 20% de la cantidad OC)` (si no hay cantidad OC, 20% sobre lo pendiente). Así, una OC de 100 sin entregas permite hasta 120, y el total entregado nunca supera el 120% de la OC. Se usa en el `max` del input y en la validación del botón "Crear PackingList"; además el input se marca en rojo con "Máx. N" cuando se excede.
Pendiente de confirmar: que SAP/backend acepte cantidades mayores a lo pendiente.

**Archivos modificados:**
- `src/utils/packingList.ts` (nuevo)
- `src/pages/Agenda/index.tsx`
- `src/pages/Agenda/AppointmentDetail.tsx`

**Fecha solución:** 2026-09-23
**Commit:** fae4ba0

### OBS-003 — Versión del sidebar en duro, no se toma de package.json
- **Fecha registro:** 2026-09-23
- **Módulo / pantalla:** Layout Dashboard → Sidebar (`src/layouts/Dashboard/sideBar.tsx`)
- **Prioridad:** Baja (sugerida — cosmético/informativo)
- **Estado:** 🟢 Resuelto
- **Rama:** release/1.0.0

**Observación (texto original):**
> la version que se meustra en el sideBar etsa en duro no esta jalando del package.json

**Análisis / causa:**
El texto `v1.0.0` está escrito literal en `src/layouts/Dashboard/sideBar.tsx:58`. Además, `package.json` tiene `"version": "0.0.0"`, así que hay que actualizarlo a la versión real (p. ej. `1.0.0`) antes de enlazarlo o el sidebar mostraría `v0.0.0`.
Solución probable: en `vite.config.ts` exponer la versión con `define: { __APP_VERSION__: JSON.stringify(pkg.version) }` (declarando el tipo en `vite-env.d.ts`) y usar `v{__APP_VERSION__}` en el sidebar.

**Solución:**
`vite.config.ts` lee `package.json` e inyecta su versión como constante global `__APP_VERSION__` (`define`), declarada en `vite-env.d.ts`. El sidebar muestra `v{__APP_VERSION__}`. Se actualizó la versión de `package.json` (0.0.0 → 1.0.1). Verificado: el bundle generado contiene `"1.0.1"`. Para cambiar la versión mostrada basta con editar `package.json` y volver a compilar (en `npm run dev` hay que reiniciar el servidor).

**Archivos modificados:**
- `vite.config.ts`
- `src/vite-env.d.ts`
- `src/layouts/Dashboard/sideBar.tsx`
- `package.json`

**Fecha solución:** 2026-09-23
**Commit:** fae4ba0
