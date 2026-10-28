// src/pages/Agenda/appointmentsReport.ts
// Reporte Excel de las citas de la semana desde el calendario: una fila por producto de sus packing list.
// No depende de /api/Documentos/Productos; sale de las citas ya cargadas y de PackinList por cita.
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DeliveryAppointment } from '@/store/types';
import { fetchPackingListFromApi, PackingListApiRecord } from '@/services/agenda/packingListApi';
import { formatDateForAPI } from '@/services/agenda/appointmentsApi';
import { formatStatusCita } from './productList';

/** Rango amplio para ubicar los packing list de la cita aunque se haya reprogramado */
const PACKING_LIST_LOOKUP_DAYS = 365;
/** Consultas de packing list en paralelo, para no saturar el API con semanas de muchas citas */
const CONCURRENCY = 6;

const NO_PACKING_LIST = 'Sin packing list';
const PACKING_LIST_ERROR = 'No se pudo consultar';

/** "2026-10-22" → "22/10/2026" */
const formatDate = (isoDate: string): string => {
    const [year, month, day] = (isoDate ?? '').split('-');
    return year && month && day ? `${day}/${month}/${year}` : isoDate;
};

const mapWithConcurrency = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
};

const fetchCitaPackingLists = async (codCita: string, weekStart: Date, weekEnd: Date): Promise<PackingListApiRecord[]> => {
    const lookupStart = new Date(weekStart);
    lookupStart.setDate(lookupStart.getDate() - PACKING_LIST_LOOKUP_DAYS);
    const lookupEnd = new Date(weekEnd);
    lookupEnd.setDate(lookupEnd.getDate() + PACKING_LIST_LOOKUP_DAYS);
    const records = await fetchPackingListFromApi(formatDateForAPI(lookupStart), formatDateForAPI(lookupEnd), codCita);
    // Por si el API ignorara CodCita
    return records.filter((pl) => !pl.appointment_code || String(pl.appointment_code) === codCita);
};

/**
 * Descarga el Excel de las citas recibidas (las que se ven en el calendario, con su filtro de estado).
 * Las citas sin packing list salen igual, en una fila sin productos.
 * @returns cantidad de filas exportadas
 */
export const exportAppointmentsReport = async (
    appointments: DeliveryAppointment[],
    weekStart: Date,
    weekEnd: Date
): Promise<number> => {
    const sorted = [...appointments].sort((a, b) =>
        `${a.deliveryDate} ${a.deliveryTime}`.localeCompare(`${b.deliveryDate} ${b.deliveryTime}`)
    );

    const packingListsByCita = await mapWithConcurrency(sorted, CONCURRENCY, async (apt) => {
        const codCita = String(apt.docEntry ?? apt.appointmentNumber ?? '');
        if (!codCita) return [];
        try {
            return await fetchCitaPackingLists(codCita, weekStart, weekEnd);
        } catch (error) {
            console.error(`Error al consultar packing list de la cita ${codCita}:`, error);
            return null;
        }
    });

    const rows = sorted.flatMap((apt, index): Record<string, string | number>[] => {
        const cita = {
            'N.º Cita': apt.docEntry || apt.appointmentNumber,
            'Fecha': formatDate(apt.deliveryDate),
            'Horario': `${apt.deliveryTime} - ${apt.deliveryTimeEnd}`,
            'Proveedor': apt.supplierName,
            'RUC': apt.supplierRUC,
            'Almacén': apt.warehouse || '-',
            'Estado Cita': formatStatusCita(apt.status),
            'Adjuntos': apt.rawDocuments?.length ?? 0,
        };
        const packingLists = packingListsByCita[index];
        const products = (packingLists ?? []).flatMap((pl) =>
            (pl.detalle_packin_list ?? pl.DetallePackinList ?? []).map((item) => ({
                ...cita,
                'Packing List': pl.number,
                'N.º OC': pl.number.split('_')[0],
                'Código': item.item_code || '-',
                'Descripción': item.item_name || '-',
                'Cantidad': Number(item.quantity) || 0,
            }))
        );
        if (products.length > 0) return products;
        return [{
            ...cita,
            'Packing List': packingLists === null ? PACKING_LIST_ERROR : NO_PACKING_LIST,
            'N.º OC': '-',
            'Código': '-',
            'Descripción': '-',
            'Cantidad': '',
        }];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
        { wch: 9 },  // N.º Cita
        { wch: 12 }, // Fecha
        { wch: 14 }, // Horario
        { wch: 40 }, // Proveedor
        { wch: 13 }, // RUC
        { wch: 10 }, // Almacén
        { wch: 24 }, // Estado Cita
        { wch: 9 },  // Adjuntos
        { wch: 18 }, // Packing List
        { wch: 12 }, // N.º OC
        { wch: 12 }, // Código
        { wch: 50 }, // Descripción
        { wch: 10 }, // Cantidad
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Citas');

    const fileName = `Citas_${formatDateForAPI(weekStart)}_${formatDateForAPI(weekEnd)}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
    return rows.length;
};
