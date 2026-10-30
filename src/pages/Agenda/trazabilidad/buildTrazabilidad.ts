// src/pages/Agenda/trazabilidad/buildTrazabilidad.ts
// Arma la trazabilidad de la cita (de la creación al pago) con lo que hay hoy: el historial que registra el portal
// (Firestore), el packing list, los documentos, SUNAT, las evaluaciones, PCP, el Parte de Ingreso y la factura en SAP.
import type { AppointmentStatus, DeliveryAppointment, DeliveryEvaluation, Invoice, SupplierClaim } from '@/store/types';
import type { PackingListApiRecord, ProductApiRecord } from '@/services/agenda/packingListApi';
import type { AppointmentDocument } from '@/services/agenda/appointmentsApi';
import type { ProductEvaluationArea, SavedProductEvaluation } from '@/services/agenda/productEvaluationsApi';
import { getSunatChipInfo, type SunatInvoiceValidation } from '@/services/agenda/sunatInvoiceApi';
import { STATUS_CONFIG } from '@/services/agenda/appointmentStatus';
import { AREA_POR_ROL, type EventoCita } from '@/services/agenda/trazabilidadApi';
import { UserRole } from '@/routes/menuTypes';

export type Tono = 'success' | 'warning' | 'danger' | 'primary' | 'default';

export type EstadoEtapa = 'completada' | 'observada' | 'rechazada' | 'actual' | 'pendiente' | 'omitida';

export interface Hito {
    id: string;
    titulo: string;
    hecho: boolean;
    fecha?: Date;
    conHora?: boolean;          // false: solo se conoce el día
    quien?: string;
    rolQuien?: string;
    detalle?: string;
    tono: Tono;
}

export type EtapaKey = 'programacion' | 'preparacion' | 'llegada' | 'calidad' | 'almacen' | 'contabilidad' | 'pago';

export interface Etapa {
    key: EtapaKey;
    titulo: string;
    area: string;
    descripcion: string;        // qué pasa en esta etapa, para el tooltip
    estado: EstadoEtapa;
    resultado?: string;         // "Aceptado", "Con concesión", "Pago parcial"...
    fecha?: Date;               // cuándo se completó (o el último avance)
    conHora?: boolean;
    hitos: Hito[];
}

export interface Trazabilidad {
    etapas: Etapa[];
    actual: Etapa | null;       // dónde está ahora; null si terminó o se detuvo
    desde?: Date;               // último avance registrado
    desdeConHora?: boolean;
    detenida: { motivo: string; tono: Tono } | null;
    completada: boolean;
}

export interface TrazabilidadInput {
    appointment: DeliveryAppointment;
    eventos: EventoCita[];
    packingLists: PackingListApiRecord[];
    documentos: AppointmentDocument[];
    documentosCompletos: boolean;
    validacionesSunat: SunatInvoiceValidation[];
    evaluacion: DeliveryEvaluation | null;
    /** Evaluación por producto de Calidad y Almacén (/api/Evaluacion/Productos), con fecha y usuario por línea */
    evaluacionesProducto: SavedProductEvaluation[];
    productos: ProductApiRecord[];
    facturasSap: Invoice[] | null;   // null: aún no se consultó
    reclamo: SupplierClaim | null;
}

// Avance de la cita según su estado actual (Cancelada aparte)
const RANGO_ESTADO: Record<AppointmentStatus, number> = {
    REGISTRADA: 0,
    PROGRAMADA: 1,
    REPROGRAMADA: 1,
    TRANSPORTE_COMPLETO: 2,
    DOCUMENTOS_COMPLETOS: 3,
    EN_EXPLANADA: 4,
    EN_ENTREGA: 4,
    CALIDAD_ACEPTADO: 5,
    CALIDAD_OBSERVADO: 5,
    CALIDAD_PARCIAL: 5,
    CALIDAD_RECHAZADO: 5,
    ALMACEN_ACEPTADO: 6,
    ALMACEN_OBSERVADO: 6,
    ALMACEN_PARCIAL: 6,
    ALMACEN_RECHAZADO: 6,
    PARTE_DE_INGRESO_GENERADO: 7,
    ENTREGADO: 8,
    Cancelada: -1,
};

const ESTADOS_CALIDAD: AppointmentStatus[] = ['CALIDAD_ACEPTADO', 'CALIDAD_OBSERVADO', 'CALIDAD_PARCIAL', 'CALIDAD_RECHAZADO'];
const ESTADOS_ALMACEN: AppointmentStatus[] = ['ALMACEN_ACEPTADO', 'ALMACEN_OBSERVADO', 'ALMACEN_PARCIAL', 'ALMACEN_RECHAZADO'];

const RESULTADO_EVALUACION: Partial<Record<AppointmentStatus, { label: string; tono: Tono }>> = {
    CALIDAD_ACEPTADO: { label: 'Aceptado', tono: 'success' },
    CALIDAD_OBSERVADO: { label: 'Con concesión', tono: 'warning' },
    CALIDAD_PARCIAL: { label: 'Parcial', tono: 'warning' },
    CALIDAD_RECHAZADO: { label: 'Rechazado', tono: 'danger' },
    ALMACEN_ACEPTADO: { label: 'Conforme', tono: 'success' },
    ALMACEN_OBSERVADO: { label: 'Observado', tono: 'warning' },
    ALMACEN_PARCIAL: { label: 'Parcial', tono: 'warning' },
    ALMACEN_RECHAZADO: { label: 'Rechazado', tono: 'danger' },
};

interface FechaParseada {
    fecha: Date;
    conHora: boolean;
}

/** Fechas del API en sus distintos formatos: ISO, "21/10/2026 00:00:00", "20261021" o "2026-10-21" */
export const parseFecha = (value?: string | null): FechaParseada | null => {
    const text = value?.trim();
    if (!text) return null;

    const dmy = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(text);
    if (dmy) {
        const [, d, m, y, hh = '00', mm = '00'] = dmy;
        return { fecha: new Date(+y, +m - 1, +d, +hh, +mm), conHora: hh !== '00' || mm !== '00' };
    }
    const compact = /^(\d{4})(\d{2})(\d{2})$/.exec(text);
    if (compact) {
        const [, y, m, d] = compact;
        return { fecha: new Date(+y, +m - 1, +d), conHora: false };
    }
    const soloDia = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?)?$/.exec(text);
    if (soloDia) {
        const [, y, m, d] = soloDia;
        return { fecha: new Date(+y, +m - 1, +d), conHora: false };
    }
    const iso = new Date(text);
    return Number.isNaN(iso.getTime()) ? null : { fecha: iso, conHora: true };
};

/** Día en que se subió el archivo, por la carpeta de la ruta (…/B1H_VIST_PE/20261021/FAC_x.pdf) */
const fechaDeArchivo = (url: string): FechaParseada | null => {
    const match = /\/(\d{8})\//.exec(decodeURIComponent(url));
    return match ? parseFecha(match[1]) : null;
};

const desdeEvento = (evento?: EventoCita) =>
    evento ? { fecha: new Date(evento.fecha), conHora: true, quien: evento.usuarioNombre || evento.usuario, rolQuien: evento.rol } : {};

const ultimo = <T,>(items: T[]): T | undefined => items[items.length - 1];

const masReciente = (fechas: (FechaParseada | null | undefined)[]): FechaParseada | null =>
    fechas.reduce<FechaParseada | null>((max, f) => (f && (!max || f.fecha > max.fecha) ? f : max), null);

const comprobanteDe = (v: SunatInvoiceValidation) => `${v.numeroSerie}-${v.numero}`;

const formatMonto = (moneda: string, monto: number) =>
    `${moneda === 'USD' ? 'US$' : 'S/'} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildTrazabilidad = (input: TrazabilidadInput): Trazabilidad => {
    const { appointment, eventos, packingLists, documentos, validacionesSunat, evaluacion, evaluacionesProducto, productos, facturasSap, reclamo } = input;
    const status = appointment.status;
    const rango = RANGO_ESTADO[status] ?? 0;

    const eventosEstado = (estados: AppointmentStatus[]) =>
        eventos.filter((e) => (e.tipo === 'ESTADO' || e.tipo === 'CITA_CREADA') && e.estado && estados.includes(e.estado));
    const eventoEvaluacion = (criterio: string) => ultimo(eventos.filter((e) => e.tipo === 'EVALUACION' && e.detalle === criterio));
    // El estado más avanzado al que llegó la cita, aunque luego haya cambiado (p. ej. al eliminar un documento)
    const rangoHistorico = Math.max(rango, ...eventos.map((e) => (e.estado ? RANGO_ESTADO[e.estado] ?? -1 : -1)));

    // ── 1. Programación (Compras) ─────────────────────────────────────────────
    const creada = eventos.find((e) => e.tipo === 'CITA_CREADA') ?? eventosEstado(['REGISTRADA'])[0];
    const reprogramaciones = eventosEstado(['REPROGRAMADA']);
    const programacion: Hito[] = [
        { id: 'creada', titulo: 'Cita registrada', hecho: true, tono: 'success', ...desdeEvento(creada) },
        ...packingLists.map((pl): Hito => {
            const f = parseFecha(pl.create_at);
            return {
                id: `pl-${pl.number}`,
                titulo: `Packing list ${pl.number}`,
                detalle: 'Registrado',
                hecho: true,
                tono: 'success',
                ...(f ?? {}),
            };
        }),
        ...reprogramaciones.map((e): Hito => ({
            id: `reprog-${e.id}`, titulo: 'Cita reprogramada', hecho: true, tono: 'warning', ...desdeEvento(e),
        })),
    ];
    if (packingLists.length === 0) {
        programacion.push({ id: 'pl-pendiente', titulo: 'Registrar packing list', hecho: false, tono: 'default' });
    }

    // ── 2. Preparación del proveedor ─────────────────────────────────────────
    const transporteEvento = ultimo(eventosEstado(['TRANSPORTE_COMPLETO']));
    const documentosEvento = ultimo(eventosEstado(['DOCUMENTOS_COMPLETOS']));
    const ultimoDocumento = masReciente(documentos.map((d) => fechaDeArchivo(d.u_link_documento)));
    const preparacion: Hito[] = [
        {
            id: 'transporte',
            titulo: 'Datos de transporte',
            detalle: appointment.transportData?.vehiclePlate ? `Placa ${appointment.transportData.vehiclePlate}` : undefined,
            hecho: !!appointment.transportData,
            tono: appointment.transportData ? 'success' : 'default',
            ...desdeEvento(transporteEvento),
        },
        {
            id: 'documentos',
            titulo: input.documentosCompletos ? 'Documentos completos' : 'Carga de documentos',
            detalle: documentos.length > 0 ? `${documentos.length} archivo${documentos.length === 1 ? '' : 's'}` : undefined,
            hecho: input.documentosCompletos,
            tono: input.documentosCompletos ? 'success' : documentos.length > 0 ? 'primary' : 'default',
            ...(documentosEvento ? desdeEvento(documentosEvento) : ultimoDocumento ?? {}),
        },
        ...eventos.filter((e) => e.tipo === 'DOCUMENTO').map((e): Hito => ({
            id: `doc-${e.id}`, titulo: `Cargó ${e.detalle ?? 'un documento'}`, hecho: true, tono: 'success', ...desdeEvento(e),
        })),
        ...validacionesSunat.map((v): Hito => {
            const info = getSunatChipInfo(v);
            const f = parseFecha(v.validadoEn);
            return {
                id: `sunat-${v.id}`,
                titulo: `Factura ${comprobanteDe(v)} en SUNAT`,
                detalle: info.label,
                hecho: true,
                tono: info.color === 'default' ? 'default' : info.color,
                ...(f ?? {}),
            };
        }),
    ];

    // ── 3. Llegada (Seguridad) ───────────────────────────────────────────────
    const llegadaEvento = eventosEstado(['EN_EXPLANADA', 'EN_ENTREGA'])[0];
    const llegada: Hito[] = [
        { id: 'llegada', titulo: 'Proveedor en planta', hecho: rangoHistorico >= 4, tono: rangoHistorico >= 4 ? 'success' : 'default', ...desdeEvento(llegadaEvento) },
    ];
    // /api/Evaluacion no tiene fecha por criterio: sale del historial (desde que se registra)
    const evaluacionHito = (id: string, titulo: string, criterio: string, score?: DeliveryEvaluation['puntualidad']): Hito | null => {
        if (!score) return null;
        const cumple = score.puntaje >= 10;
        return { id, titulo, detalle: cumple ? 'Cumple' : 'No cumple', hecho: true, tono: cumple ? 'success' : 'warning', ...desdeEvento(eventoEvaluacion(criterio)) };
    };
    [evaluacionHito('puntualidad', 'Puntualidad evaluada', 'PUNTUALIDAD', evaluacion?.puntualidad),
        evaluacionHito('documentacion', 'Documentación evaluada', 'DOCUMENTACION', evaluacion?.documentacion)]
        .forEach((h) => h && llegada.push(h));

    /**
     * Evaluación por producto de un área: cuántos productos quedaron en cada resultado, cuándo fue la última y quién
     * la hizo. La fecha y el usuario del historial (cambio de estado) tienen prioridad porque traen el nombre completo.
     */
    const resumenPorProducto = (area: ProductEvaluationArea): Partial<Hito> & { evaluado: boolean } => {
        const lineas = evaluacionesProducto.filter((e) => e.area === area);
        if (lineas.length === 0) return { evaluado: false };
        const cuenta = (estado: string) => lineas.filter((l) => l.estado === estado).length;
        const partes = [
            [cuenta('ACEPTADO'), 'aceptado'],
            [cuenta('OBSERVADO'), 'con concesión'],
            [cuenta('PARCIAL'), 'parcial'],
            [cuenta('RECHAZADO'), 'rechazado'],
        ].filter(([n]) => (n as number) > 0).map(([n, label]) => `${n} ${label}`);
        const masNueva = lineas
            .map((l) => ({ linea: l, f: parseFecha(l.fecha) }))
            .filter((x) => x.f)
            .sort((a, b) => b.f!.fecha.getTime() - a.f!.fecha.getTime())[0];
        return {
            evaluado: true,
            detalle: `${lineas.length} producto${lineas.length === 1 ? '' : 's'}: ${partes.join(', ')}`,
            tono: cuenta('RECHAZADO') > 0 || cuenta('PARCIAL') > 0 || cuenta('OBSERVADO') > 0 ? 'warning' : 'success',
            ...(masNueva ? { fecha: masNueva.f!.fecha, conHora: masNueva.f!.conHora, quien: masNueva.linea.usuario } : {}),
            rolQuien: area === 'CALIDAD' ? UserRole.CALIDAD : UserRole.ALMACEN,
        };
    };

    // ── 4. Calidad ───────────────────────────────────────────────────────────
    const calidadEstado = ESTADOS_CALIDAD.includes(status) ? status : ultimo(eventosEstado(ESTADOS_CALIDAD))?.estado;
    const calidadEvento = ultimo(eventosEstado(ESTADOS_CALIDAD));
    const calidadResultado = calidadEstado ? RESULTADO_EVALUACION[calidadEstado] : undefined;
    const { evaluado: calidadPorProducto, ...calidadProductos } = resumenPorProducto('CALIDAD');
    const calidadHecha = rangoHistorico >= 5 || calidadPorProducto || !!evaluacion?.estadoMercaderia;
    const calidad: Hito[] = [{
        id: 'calidad',
        titulo: 'Inspección de calidad',
        hecho: calidadHecha,
        ...calidadProductos,
        detalle: calidadProductos.detalle ?? calidadResultado?.label ?? evaluacion?.estadoMercaderia?.estado,
        tono: calidadResultado?.tono ?? calidadProductos.tono ?? (calidadHecha ? 'success' : 'default'),
        ...desdeEvento(calidadEvento ?? eventoEvaluacion('ESTADO_MERCADERIA')),
    }];
    if (reclamo) {
        const emitido = parseFecha(reclamo.fechaReclamo);
        calidad.push({
            id: 'reclamo',
            titulo: `Reclamo ${reclamo.numeroReclamo}`,
            detalle: reclamo.areaEmite ? `Emitido por ${reclamo.areaEmite}` : 'Emitido',
            quien: reclamo.responsable,
            hecho: true,
            tono: 'warning',
            ...(emitido ?? {}),
        });
        const cierre = parseFecha(reclamo.cierreReclamo?.fechaCierre);
        if (cierre) calidad.push({ id: 'reclamo-cierre', titulo: 'Reclamo cerrado', hecho: true, tono: 'success', ...cierre });
    }

    // ── 5. Almacén (recepción, PCP y Parte de Ingreso) ──────────────────────
    const almacenEstado = ESTADOS_ALMACEN.includes(status) ? status : ultimo(eventosEstado(ESTADOS_ALMACEN))?.estado;
    const almacenEvento = ultimo(eventosEstado(ESTADOS_ALMACEN));
    const almacenResultado = almacenEstado ? RESULTADO_EVALUACION[almacenEstado] : undefined;
    const { evaluado: almacenPorProducto, ...almacenProductos } = resumenPorProducto('ALMACEN');
    const almacenHecho = rangoHistorico >= 6 || almacenPorProducto || !!evaluacion?.cantidadCorrecta;
    const almacen: Hito[] = [{
        id: 'almacen',
        titulo: 'Conteo y recepción',
        hecho: almacenHecho,
        ...almacenProductos,
        detalle: almacenProductos.detalle ?? almacenResultado?.label ?? evaluacion?.cantidadCorrecta?.estado,
        tono: almacenResultado?.tono ?? almacenProductos.tono ?? (almacenHecho ? 'success' : 'default'),
        ...desdeEvento(almacenEvento ?? eventoEvaluacion('CANTIDAD_CORRECTA')),
    }];
    // PCP: una validación por packing list (el API la repite en cada producto)
    const pcp = new Map<string, ProductApiRecord>();
    productos.forEach((p) => {
        if (p.confirmacion_pcp && p.packing_list_number && !pcp.has(p.packing_list_number)) pcp.set(p.packing_list_number, p);
    });
    pcp.forEach((p, packingList) => {
        const conforme = p.confirmacion_pcp === 'CONFORME';
        almacen.push({
            id: `pcp-${packingList}`,
            titulo: `Validación PCP · ${packingList}`,
            detalle: conforme ? 'Conforme' : 'No conforme',
            quien: p.pcp_validado_por ?? undefined,
            hecho: true,
            tono: conforme ? 'success' : 'warning',
            ...(parseFecha(p.pcp_fecha_validacion) ?? {}),
        });
    });
    const partes = Array.from(new Set(productos.map((p) => p.num_parte_ingreso?.trim()).filter((n): n is string => !!n)));
    const parteEvento = ultimo(eventosEstado(['PARTE_DE_INGRESO_GENERADO']));
    almacen.push({
        id: 'parte-ingreso',
        titulo: partes.length > 0 ? `Parte de Ingreso ${partes.join(', ')}` : 'Parte de Ingreso',
        detalle: partes.length > 0 || rangoHistorico >= 7 ? 'Generado en SAP' : undefined,
        hecho: partes.length > 0 || rangoHistorico >= 7,
        tono: partes.length > 0 || rangoHistorico >= 7 ? 'success' : 'default',
        ...desdeEvento(parteEvento),
    });
    const entregadoEvento = ultimo(eventosEstado(['ENTREGADO']));
    if (rangoHistorico >= 8) {
        almacen.push({ id: 'entregado', titulo: 'Entrega cerrada', hecho: true, tono: 'success', ...desdeEvento(entregadoEvento) });
    }

    // ── 6. Contabilidad (factura registrada en SAP) ─────────────────────────
    const facturas = facturasSap ?? [];
    const conAsiento = facturas.length > 0 || productos.some((p) => p.status_factura === true || p.status_factura === 'true');
    const contabilidad: Hito[] = facturas.length > 0
        ? facturas.map((f): Hito => ({
            id: `factura-${f.id}`,
            titulo: `Factura ${f.invoiceNumber}`,
            detalle: `Registrada · ${formatMonto(f.currency, f.amount)}`,
            hecho: true,
            tono: 'success',
            ...(parseFecha(f.taxDate || f.receivedDate) ?? {}),
        }))
        : [{
            id: 'factura',
            titulo: 'Registro de la factura en SAP',
            detalle: conAsiento ? 'Registrada' : undefined,
            hecho: conAsiento,
            tono: conAsiento ? 'success' : 'default',
        }];

    // ── 7. Pago (Finanzas / Tesorería) ──────────────────────────────────────
    const pagos = facturas.flatMap((f) => (f.pagos ?? []).map((p) => ({ factura: f, pago: p })));
    const pagadas = facturas.length > 0 && facturas.every((f) => (f.saldo ?? 0) <= 0.009 && (f.pagos?.length ?? 0) > 0);
    const pago: Hito[] = pagos.map(({ factura, pago: p }): Hito => ({
        id: `pago-${factura.id}-${p.docEntry}`,
        titulo: `Pago de ${factura.invoiceNumber}`,
        detalle: formatMonto(factura.currency, p.sumApplied),
        hecho: true,
        tono: 'success',
        ...(parseFecha(p.docDate) ?? {}),
    }));
    facturas.filter((f) => (f.saldo ?? 0) > 0.009).forEach((f) => {
        const vence = parseFecha(f.dueDate);
        pago.push({
            id: `pendiente-${f.id}`,
            titulo: `Saldo de ${f.invoiceNumber}`,
            detalle: `${formatMonto(f.currency, f.saldo ?? 0)}${vence ? ` · vence ${vence.fecha.toLocaleDateString('es-PE')}` : ''}`,
            hecho: false,
            tono: 'default',
        });
    });
    if (pago.length === 0) pago.push({ id: 'pago', titulo: 'Pago al proveedor', hecho: false, tono: 'default' });

    // ── Etapas ───────────────────────────────────────────────────────────────
    const etapas: Etapa[] = [
        { key: 'programacion', titulo: 'Programación', area: 'Compras', descripcion: 'Compras registra la cita y su packing list.', hitos: programacion,
            estado: rangoHistorico >= 1 || packingLists.length > 0 ? 'completada' : 'pendiente' },
        { key: 'preparacion', titulo: 'Preparación', area: 'Proveedor', descripcion: 'El proveedor completa el transporte y carga sus documentos.', hitos: preparacion,
            estado: rangoHistorico >= 3 || (!!appointment.transportData && input.documentosCompletos) ? 'completada' : 'pendiente' },
        { key: 'llegada', titulo: 'Llegada', area: 'Seguridad', descripcion: 'Seguridad registra el ingreso del proveedor a planta.', hitos: llegada,
            estado: rangoHistorico >= 4 ? 'completada' : 'pendiente' },
        { key: 'calidad', titulo: 'Calidad', area: 'Calidad', descripcion: 'Calidad inspecciona la mercadería.', hitos: calidad, resultado: calidadResultado?.label,
            estado: calidadResultado?.tono === 'danger' ? 'rechazada' : calidadResultado?.tono === 'warning' ? 'observada' : rangoHistorico >= 5 ? 'completada' : 'pendiente' },
        { key: 'almacen', titulo: 'Almacén', area: 'Almacén', descripcion: 'Almacén cuenta lo recibido y genera el Parte de Ingreso.', hitos: almacen, resultado: almacenResultado?.label,
            estado: almacenResultado?.tono === 'danger' ? 'rechazada' : partes.length > 0 || rangoHistorico >= 7 ? (almacenResultado?.tono === 'warning' ? 'observada' : 'completada') : 'pendiente' },
        { key: 'contabilidad', titulo: 'Registro contable', area: 'Contabilidad', descripcion: 'Contabilidad registra la factura en SAP.', hitos: contabilidad,
            estado: conAsiento ? 'completada' : 'pendiente' },
        { key: 'pago', titulo: 'Pago', area: 'Finanzas', descripcion: 'Finanzas programa y realiza el pago de la factura.', hitos: pago,
            resultado: pagadas ? 'Pagado' : pagos.length > 0 ? 'Pago parcial' : undefined,
            estado: pagadas ? 'completada' : pagos.length > 0 ? 'observada' : 'pendiente' },
    ];

    // Fecha de cada etapa: la del hito con fecha más reciente
    etapas.forEach((etapa) => {
        const f = masReciente(etapa.hitos.filter((h) => h.hecho && h.fecha).map((h) => ({ fecha: h.fecha!, conHora: !!h.conHora })));
        if (f && etapa.estado !== 'pendiente') {
            etapa.fecha = f.fecha;
            etapa.conHora = f.conHora;
        }
    });

    // Una etapa rechazada o la cita cancelada detienen el flujo: lo que sigue no se hará
    const rechazo = etapas.findIndex((e) => e.estado === 'rechazada');
    const cancelada = status === 'Cancelada';
    let detenida: Trazabilidad['detenida'] = null;
    if (rechazo >= 0) {
        detenida = { motivo: `Rechazado en ${etapas[rechazo].area}`, tono: 'danger' };
        etapas.slice(rechazo + 1).forEach((e) => { if (e.estado === 'pendiente') e.estado = 'omitida'; });
    } else if (cancelada) {
        detenida = { motivo: 'Cita cancelada', tono: 'danger' };
        etapas.forEach((e) => { if (e.estado === 'pendiente') e.estado = 'omitida'; });
    }

    const actual = detenida ? null : etapas.find((e) => e.estado === 'pendiente') ?? null;
    if (actual) actual.estado = 'actual';

    const ultimoAvance = masReciente(etapas.flatMap((e) => e.hitos)
        .filter((h) => h.hecho && h.fecha)
        .map((h) => ({ fecha: h.fecha!, conHora: !!h.conHora })));

    return {
        etapas,
        actual,
        desde: ultimoAvance?.fecha,
        desdeConHora: ultimoAvance?.conHora,
        detenida,
        completada: !detenida && !actual,
    };
};

/** Nombre del área de quien hizo un hito, a partir de su rol */
export const areaDeRol = (rol?: string) => (rol ? AREA_POR_ROL[rol] ?? rol : undefined);

/** Los proveedores no ven los nombres del personal interno, solo el área */
export const esUsuarioInterno = (rol?: string) => !!rol && rol !== UserRole.PROVEEDOR;

export const etiquetaEstado = (estado: AppointmentStatus) => STATUS_CONFIG[estado]?.label ?? estado;
