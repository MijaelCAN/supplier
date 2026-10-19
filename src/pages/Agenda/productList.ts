// src/pages/Agenda/productList.ts
// Formato y agrupación por cita de la vista Lista (citas por producto, /api/Documentos/Productos).
import { ProductApiRecord } from '@/services/agenda/packingListApi';
import { STATUS_CONFIG } from '@/services/agenda/appointmentStatus';
import { DeliveryAppointment } from '@/store/types';

/** "19/01/2026 00:00:00" → "19/01/2026" */
export const formatDateFromAPI = (dateStr: string): string => {
    const [day, month, year] = (dateStr ?? '').split(' ')[0].split('/');
    return day && month && year ? `${day}/${month}/${year}` : dateStr;
};

/** "800 - 1100" → "08:00 - 11:00" */
export const formatHorario = (horario: string): string => {
    if (!horario) return '-';
    const parts = horario.split(' - ');
    if (parts.length !== 2) return horario;
    const formatTime = (time: string) => {
        const clean = time.trim();
        const padded = clean.length === 3 ? `0${clean}` : clean;
        return padded.length === 4 ? `${padded.substring(0, 2)}:${padded.substring(2, 4)}` : clean;
    };
    return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
};

/** La cobertura a veces llega como string en vez de number */
export const formatCobertura = (value: number | string | null | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? '-' : num.toFixed(2);
};

export const getStatusCitaConfig = (status?: string | null) =>
    status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : undefined;

export const formatStatusCita = (status?: string | null): string =>
    status ? getStatusCitaConfig(status)?.label ?? status : '-';

/** status_factura llega como texto "true"/"false"; null si el API no lo envía */
export const parseStatusFactura = (value?: boolean | string | null): boolean | null => {
    if (value === undefined || value === null || value === '') return null;
    return value === true || String(value).toLowerCase() === 'true';
};

export const formatStatusFactura = (value?: boolean | string | null): string => {
    const hasInvoice = parseStatusFactura(value);
    return hasInvoice === null ? '-' : hasInvoice ? 'Sí' : 'No';
};

/** Factura SAP de la cita, contada sobre todos sus productos (cada uno según su packing list) */
export interface InvoiceSummary {
    total: number;
    withInvoice: number;
    missing: number; // sin factura o sin dato
    hasData: boolean; // false si ningún producto trae status_factura (producción)
}

export const summarizeInvoices = (products: ProductApiRecord[]): InvoiceSummary => {
    const statuses = products.map((p) => parseStatusFactura(p.status_factura));
    const withInvoice = statuses.filter((s) => s === true).length;
    return {
        total: products.length,
        withInvoice,
        missing: products.length - withInvoice,
        hasData: statuses.some((s) => s !== null),
    };
};

/** "Sí" si todos tienen factura, "Faltan 3 de 5" si no, "-" sin dato */
export const formatInvoiceSummary = (summary: InvoiceSummary): string => {
    if (!summary.hasData) return '-';
    return summary.missing === 0 ? 'Sí' : `Faltan ${summary.missing} de ${summary.total}`;
};

/**
 * Productos de una misma cita: comparten fecha, horario, proveedor, estado y adjuntos.
 * El parte de ingreso y la factura son por línea, así que van en cada producto.
 */
export interface ProductGroup {
    key: string;
    first: ProductApiRecord;
    products: ProductApiRecord[];
    orders: string[]; // OC distintas de la cita
    invoice: InvoiceSummary;
}

const unique = (values: (string | null | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => !!v)));

const citaKey = (product: ProductApiRecord) =>
    `${product.u_fecha}|${product.horario}|${product.u_razon_social}`;

const groupByKey = (products: ProductApiRecord[]) => {
    const groups = new Map<string, ProductApiRecord[]>();
    products.forEach((product) => {
        const key = citaKey(product);
        const list = groups.get(key);
        if (list) list.push(product);
        else groups.set(key, [product]);
    });
    return groups;
};

/**
 * Agrupa por cita conservando el orden del API. /Productos no trae cod_cita, así que la
 * cita se identifica por fecha + horario + proveedor (mismo criterio que "Ver cita").
 * `products` son los que pasan los filtros; la factura se resume con `allProducts`
 * para que "Faltan X de N" cuente toda la cita aunque se muestren solo algunos.
 */
export const groupProductsByCita = (
    products: ProductApiRecord[],
    allProducts: ProductApiRecord[] = products,
): ProductGroup[] => {
    const allGroups = products === allProducts ? null : groupByKey(allProducts);
    return Array.from(groupByKey(products), ([key, list]) => ({
        key,
        first: list[0],
        products: list,
        orders: unique(list.map((p) => p.number)),
        invoice: summarizeInvoices(allGroups?.get(key) ?? list),
    }));
};

/** "19/01/2026 00:00:00" → "2026-01-19" */
const toIsoDate = (dateStr: string): string | null => {
    const [day, month, year] = (dateStr ?? '').split(' ')[0].split('/');
    return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : null;
};

const sameSupplier = (apt: DeliveryAppointment, product: ProductApiRecord) => {
    const aptName = apt.supplierName?.toLowerCase().trim() || '';
    const productName = product.u_razon_social?.toLowerCase().trim() || '';
    return !aptName || !productName || aptName.includes(productName) || productName.includes(aptName);
};

/** Hora inicial del horario ("730 - 1000" → "07") contra la de la cita ("07:30") */
const sameStartHour = (apt: DeliveryAppointment, product: ProductApiRecord) => {
    if (!product.horario || !apt.deliveryTime) return true;
    const start = product.horario.split(' - ')[0].trim();
    const padded = start.length === 3 ? `0${start}` : start;
    return apt.deliveryTime.includes(padded.substring(0, 2));
};

/**
 * Cita del producto: /Productos no trae cod_cita, así que se ubica por fecha + proveedor + hora de inicio,
 * y si no hay una con esa hora, por fecha + proveedor.
 */
export const findAppointmentForProduct = (
    product: ProductApiRecord,
    appointments: DeliveryAppointment[]
): DeliveryAppointment | undefined => {
    const date = toIsoDate(product.u_fecha);
    if (!date) return undefined;
    const candidates = appointments.filter((apt) => apt.deliveryDate.split('T')[0] === date && sameSupplier(apt, product));
    return candidates.find((apt) => sameStartHour(apt, product)) ?? candidates[0];
};

/** Documentos que definen la documentación completa: los tres archivos por tipo y el Parte de Ingreso de SAP */
const REQUIRED_FILE_TYPES = [
    { prefix: 'OC', label: 'Orden de Compra' },
    { prefix: 'GR', label: 'Guía de Remisión' },
    { prefix: 'FAC', label: 'Factura' },
];

export interface DocumentationStatus {
    complete: boolean;
    missing: string[];
}

/** El parte llega como "261012039-T070-0211277"; sin parte, vacío */
const hasParteIngreso = (product: ProductApiRecord) => !!product.num_parte_ingreso?.split('-')[0].trim();

/**
 * Documentación completa del producto (OC, Guía de Remisión, Factura y Parte de Ingreso).
 * Manda estado_documentos del API ("Completo" / "Incompleto"), que no trae los faltantes.
 * Solo si el API no envía el campo se calcula en la web con los archivos de la cita (con faltantes).
 * No se mezclan: la web ubica la cita por fecha + proveedor + horario y puede no ser la misma del API.
 * null: no hay dato del API ni se ubicó la cita.
 */
export const getProductDocumentation = (
    product: ProductApiRecord,
    appointment: DeliveryAppointment | undefined
): DocumentationStatus | null => {
    const apiValue = product.estado_documentos?.trim().toLowerCase();
    if (apiValue) return { complete: apiValue === 'completo', missing: [] };
    return computeDocumentation(product, appointment);
};

/**
 * Cálculo en la web: archivos de la cita cargados para su OC (u_packing_list "261006989_1"); los que no tienen
 * packing list cuentan si la cita no tiene ninguno asignado o es de una sola OC. null si no se ubicó la cita.
 */
const computeDocumentation = (
    product: ProductApiRecord,
    appointment: DeliveryAppointment | undefined
): DocumentationStatus | null => {
    if (!appointment) return null;
    const documents = appointment.rawDocuments ?? [];
    const orderOf = (packingList: string) => packingList.split('_')[0];
    const assignedOrders = new Set(documents.map((doc) => doc.u_packing_list?.trim()).filter(Boolean).map((pl) => orderOf(pl!)));
    const includeUnassigned = assignedOrders.size === 0 || (assignedOrders.size === 1 && assignedOrders.has(product.number));
    const productDocuments = documents.filter((doc) => {
        const packingList = doc.u_packing_list?.trim();
        return packingList ? orderOf(packingList) === product.number : includeUnassigned;
    });

    // Misma regla que el backend: basta un archivo con el prefijo del tipo (la factura no exige el XML)
    const names = productDocuments.map((doc) => (doc.u_name_file ?? '').toUpperCase());
    const missing = REQUIRED_FILE_TYPES
        .filter((type) => !names.some((name) => name.startsWith(`${type.prefix}_`)))
        .map((type) => type.label);
    if (!hasParteIngreso(product)) missing.push('Parte de Ingreso');
    return { complete: missing.length === 0, missing };
};

export const formatDocumentation = (status: DocumentationStatus | null): string =>
    !status ? '-' : status.complete ? 'Completa' : 'Incompleta';

/** Cabecera de la cita: completa si todos sus productos lo están; null si de ninguno se sabe */
export const summarizeDocumentation = (statuses: (DocumentationStatus | null)[]): DocumentationStatus | null => {
    const known = statuses.filter((s): s is DocumentationStatus => s !== null);
    if (known.length === 0) return null;
    const missing = Array.from(new Set(known.flatMap((s) => s.missing)));
    return { complete: known.every((s) => s.complete), missing };
};

/** Para armar el HTML de Imprimir: que un "&" o "<" en un nombre no rompa la página */
export const escapeHtml = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/** "261009503" o "261009503 (+1)" cuando la cita tiene varias OC */
export const formatOrders = (orders: string[]): string =>
    orders.length === 0 ? '-' : orders.length === 1 ? orders[0] : `${orders[0]} (+${orders.length - 1})`;
