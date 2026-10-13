// src/pages/Agenda/productList.ts
// Formato y agrupación por cita de la vista Lista (citas por producto, /api/Documentos/Productos).
import { ProductApiRecord } from '@/services/agenda/packingListApi';
import { STATUS_CONFIG } from '@/services/agenda/appointmentStatus';

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
