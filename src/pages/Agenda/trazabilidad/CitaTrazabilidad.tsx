// src/pages/Agenda/trazabilidad/CitaTrazabilidad.tsx
// Trazabilidad de la entrega en el detalle de la cita: dónde está ahora, las 7 etapas con su fecha y, desplegado,
// cada hito con quién lo hizo y cuándo. Reemplaza al stepper PackingList / Transporte / Documentos.
import { ComponentType, SVGProps, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Tooltip } from '@heroui/react';
import {
    ArchiveBoxIcon,
    BanknotesIcon,
    BeakerIcon,
    CalendarDaysIcon,
    CheckIcon,
    ChevronDownIcon,
    ClockIcon,
    DocumentArrowUpIcon,
    DocumentCheckIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import type { DeliveryAppointment, DeliveryEvaluation, Invoice, SupplierClaim } from '@/store/types';
import type { PackingListApiRecord, ProductApiRecord } from '@/services/agenda/packingListApi';
import type { AppointmentDocument } from '@/services/agenda/appointmentsApi';
import type { SunatInvoiceValidation } from '@/services/agenda/sunatInvoiceApi';
import { EventoCita, fetchFacturasSapDeCita, subscribeEventosCita } from '@/services/agenda/trazabilidadApi';
import { areaDeRol, buildTrazabilidad, esUsuarioInterno, Etapa, EtapaKey, EstadoEtapa, Hito, Tono } from './buildTrazabilidad';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const ICONO_ETAPA: Record<EtapaKey, Icon> = {
    programacion: CalendarDaysIcon,
    preparacion: DocumentArrowUpIcon,
    llegada: ShieldCheckIcon,
    calidad: BeakerIcon,
    almacen: ArchiveBoxIcon,
    contabilidad: DocumentCheckIcon,
    pago: BanknotesIcon,
};

const ESTILO_ETAPA: Record<EstadoEtapa, { circulo: string; titulo: string; texto: string }> = {
    completada: { circulo: 'bg-emerald-500 text-white shadow-md shadow-emerald-200', titulo: 'text-gray-900', texto: 'Completado' },
    observada: { circulo: 'bg-amber-500 text-white shadow-md shadow-amber-200', titulo: 'text-gray-900', texto: 'Con observaciones' },
    rechazada: { circulo: 'bg-red-500 text-white shadow-md shadow-red-200', titulo: 'text-red-700', texto: 'Rechazado' },
    actual: { circulo: 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100', titulo: 'text-blue-700', texto: 'En curso' },
    pendiente: { circulo: 'bg-white text-gray-400 border-2 border-gray-200', titulo: 'text-gray-500', texto: 'Pendiente' },
    omitida: { circulo: 'bg-gray-100 text-gray-300', titulo: 'text-gray-400 line-through', texto: 'No aplica' },
};

const CHIP_TONO: Record<Tono, 'success' | 'warning' | 'danger' | 'primary' | 'default'> = {
    success: 'success', warning: 'warning', danger: 'danger', primary: 'primary', default: 'default',
};

const formatCorto = (fecha: Date, conHora?: boolean) => {
    const dia = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).replace('.', '');
    return conHora ? `${dia}, ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : dia;
};

const formatLargo = (fecha: Date, conHora?: boolean) => {
    const dia = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return conHora ? `${dia} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : dia;
};

const haceCuanto = (fecha: Date) => {
    const dias = Math.floor((Date.now() - fecha.getTime()) / 86_400_000);
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'hace 1 día';
    return `hace ${dias} días`;
};

const IconoEstado = ({ etapa }: { etapa: Etapa }) => {
    if (etapa.estado === 'completada') return <CheckIcon className="h-5 w-5" strokeWidth={2.5} />;
    if (etapa.estado === 'observada') return <ExclamationTriangleIcon className="h-5 w-5" />;
    if (etapa.estado === 'rechazada') return <XMarkIcon className="h-5 w-5" strokeWidth={2.5} />;
    const Icono = ICONO_ETAPA[etapa.key];
    return <Icono className="h-5 w-5" />;
};

interface Props {
    appointment: DeliveryAppointment;
    packingLists: PackingListApiRecord[];
    documentos: AppointmentDocument[];
    documentosCompletos: boolean;
    validacionesSunat: SunatInvoiceValidation[];
    evaluacion: DeliveryEvaluation | null;
    productos: ProductApiRecord[];
    reclamo: SupplierClaim | null;
    /** Proveedor: ve el área de quien hizo cada paso, no el nombre del personal interno */
    ocultarUsuariosInternos: boolean;
}

const CitaTrazabilidad = ({
    appointment,
    packingLists,
    documentos,
    documentosCompletos,
    validacionesSunat,
    evaluacion,
    productos,
    reclamo,
    ocultarUsuariosInternos,
}: Props) => {
    const [eventos, setEventos] = useState<EventoCita[]>([]);
    const [facturasSap, setFacturasSap] = useState<Invoice[] | null>(null);
    const [expandido, setExpandido] = useState(false);

    // Historial del portal en tiempo real
    useEffect(() => {
        setEventos([]);
        if (!appointment.docEntry) return;
        return subscribeEventosCita(appointment.docEntry, setEventos, (error) => console.error('Error al leer la trazabilidad:', error));
    }, [appointment.docEntry]);

    // Facturas de la cita en SAP (registro y pagos), por los comprobantes validados en SUNAT
    const comprobantes = useMemo(
        () => validacionesSunat.map((v) => `${v.numeroSerie}-${v.numero}`).sort().join(','),
        [validacionesSunat]
    );
    useEffect(() => {
        if (!comprobantes) {
            setFacturasSap([]);
            return;
        }
        let cancelado = false;
        fetchFacturasSapDeCita(appointment.supplierRUC, appointment.deliveryDate.split('T')[0], comprobantes.split(','))
            .then((facturas) => { if (!cancelado) setFacturasSap(facturas); })
            .catch((error) => {
                console.error('Error al consultar las facturas de la cita en SAP:', error);
                if (!cancelado) setFacturasSap([]);
            });
        return () => { cancelado = true; };
    }, [appointment.supplierRUC, appointment.deliveryDate, comprobantes]);

    const traza = useMemo(
        () => buildTrazabilidad({
            appointment, eventos, packingLists, documentos, documentosCompletos, validacionesSunat, evaluacion, productos, facturasSap, reclamo,
        }),
        [appointment, eventos, packingLists, documentos, documentosCompletos, validacionesSunat, evaluacion, productos, facturasSap, reclamo]
    );

    const quienTexto = (hito: Hito) => {
        const area = areaDeRol(hito.rolQuien);
        // Sin rol (PCP, reclamo) también es personal interno
        const interno = hito.rolQuien ? esUsuarioInterno(hito.rolQuien) : true;
        if (ocultarUsuariosInternos && interno) return area ?? null;
        if (!hito.quien) return area ?? null;
        return area ? `${hito.quien} · ${area}` : hito.quien;
    };

    return (
        <section className="mt-6 border-t border-gray-200 pt-6">
            {/* Resumen: dónde está la entrega */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Trazabilidad de la entrega</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        {traza.detenida ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
                                <XMarkIcon className="h-4 w-4" strokeWidth={2.5} />
                                {traza.detenida.motivo}
                            </span>
                        ) : traza.actual ? (
                            <>
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                                </span>
                                <span className="text-gray-700">
                                    Ahora en <span className="font-semibold text-gray-900">{traza.actual.area}</span>
                                    <span className="text-gray-500"> · {traza.actual.titulo.toLowerCase()}</span>
                                </span>
                            </>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                                Proceso completo
                            </span>
                        )}
                        {traza.desde && (
                            <span className="text-gray-400">
                                · último avance {formatLargo(traza.desde, traza.desdeConHora)} ({haceCuanto(traza.desde)})
                            </span>
                        )}
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => setExpandido((value) => !value)}
                    endContent={<ChevronDownIcon className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`} />}
                    className="self-start sm:self-auto"
                >
                    {expandido ? 'Ocultar detalle' : 'Ver detalle'}
                </Button>
            </div>

            {/* Etapas */}
            <div className="overflow-x-auto pb-2">
                <ol className="flex min-w-[720px]">
                    {traza.etapas.map((etapa, index) => {
                        const estilo = ESTILO_ETAPA[etapa.estado];
                        const anterior = traza.etapas[index - 1];
                        const conectorHecho = anterior && ['completada', 'observada'].includes(anterior.estado);
                        return (
                            <li key={etapa.key} className="relative flex flex-1 flex-col items-center px-1 text-center">
                                {index > 0 && (
                                    <span
                                        aria-hidden
                                        className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${conectorHecho ? 'bg-emerald-400' : 'bg-gray-200'}`}
                                    />
                                )}
                                <Tooltip
                                    placement="bottom"
                                    className="max-w-xs"
                                    content={
                                        <div className="space-y-1.5 p-1 text-left">
                                            <p className="text-xs font-semibold">{etapa.titulo} · {etapa.area}</p>
                                            <p className="text-xs text-gray-500">{etapa.descripcion}</p>
                                            <ul className="space-y-1 pt-1">
                                                {etapa.hitos.map((hito) => (
                                                    <li key={hito.id} className="flex items-start gap-1.5 text-xs">
                                                        {hito.hecho
                                                            ? <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" strokeWidth={3} />
                                                            : <ClockIcon className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />}
                                                        <span className={hito.hecho ? '' : 'text-gray-400'}>
                                                            {hito.titulo}
                                                            {hito.fecha && <span className="text-gray-400"> · {formatCorto(hito.fecha, hito.conHora)}</span>}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() => setExpandido(true)}
                                        aria-label={`${etapa.titulo}: ${estilo.texto}`}
                                        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110 ${estilo.circulo}`}
                                    >
                                        <IconoEstado etapa={etapa} />
                                    </button>
                                </Tooltip>
                                <span className={`mt-2 text-xs font-semibold ${estilo.titulo}`}>{etapa.titulo}</span>
                                <span className="text-[11px] text-gray-400">{etapa.area}</span>
                                <span className={`mt-0.5 text-[11px] ${etapa.estado === 'actual' ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                                    {etapa.fecha
                                        ? formatCorto(etapa.fecha, etapa.conHora)
                                        : etapa.resultado ?? estilo.texto}
                                </span>
                                {etapa.fecha && etapa.resultado && (
                                    <span className={`text-[11px] font-medium ${etapa.estado === 'rechazada' ? 'text-red-600' : etapa.estado === 'observada' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {etapa.resultado}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Detalle: cada hito con fecha y responsable */}
            {expandido && (
                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                    <ol className="relative ms-4 space-y-6 border-s-2 border-gray-200">
                        {traza.etapas.map((etapa) => {
                            const estilo = ESTILO_ETAPA[etapa.estado];
                            return (
                                <li key={etapa.key} className="ms-7">
                                    <span className={`absolute -start-[17px] flex h-8 w-8 items-center justify-center rounded-full ${estilo.circulo} ring-4 ring-gray-50`}>
                                        <IconoEstado etapa={etapa} />
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h5 className={`text-sm font-semibold ${estilo.titulo}`}>{etapa.titulo}</h5>
                                        <Chip size="sm" variant="flat">{etapa.area}</Chip>
                                        <span className="text-xs text-gray-500">{etapa.resultado ?? estilo.texto}</span>
                                    </div>
                                    <ul className="mt-2 space-y-2">
                                        {etapa.hitos.map((hito) => {
                                            const quien = quienTexto(hito);
                                            return (
                                                <li
                                                    key={hito.id}
                                                    className={`flex flex-col gap-1 rounded-lg bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between ${hito.hecho ? '' : 'opacity-60'}`}
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        {hito.hecho
                                                            ? <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                                                            : <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />}
                                                        <span className="truncate text-sm text-gray-800">{hito.titulo}</span>
                                                        {hito.detalle && (
                                                            <Chip size="sm" variant="flat" color={CHIP_TONO[hito.tono]} className="shrink-0">
                                                                {hito.detalle}
                                                            </Chip>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 flex-col text-xs text-gray-500 sm:items-end">
                                                        <span>{hito.fecha ? formatLargo(hito.fecha, hito.conHora) : hito.hecho ? 'Sin fecha registrada' : 'Pendiente'}</span>
                                                        {quien && <span className="text-gray-400">{quien}</span>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </li>
                            );
                        })}
                    </ol>
                    <p className="mt-5 text-xs text-gray-400">
                        Quién y cuándo cambió cada estado se registra desde el 30/10/2026. En citas anteriores se muestran las fechas
                        disponibles en SAP, SUNAT y los documentos.
                    </p>
                </div>
            )}
        </section>
    );
};

export default CitaTrazabilidad;
