// src/pages/PartesIngreso/partesIngresoReport.ts
// Formato, documentos y exportación a Excel de los partes de ingreso (mismo patrón que appointmentsReport.ts).
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ParteIngresoContabilidad } from '@/services/contabilidad/partesIngresoApi';

export interface DocumentoLink {
    key: string;
    label: string;
    url: string;
}

const DOCUMENT_GROUPS: { label: string; field: 'linksOC' | 'linksGuia' | 'linksFactura' | 'linksCC' }[] = [
    { label: 'OC', field: 'linksOC' },
    { label: 'Guía', field: 'linksGuia' },
    { label: 'Factura', field: 'linksFactura' },
    { label: 'CC', field: 'linksCC' },
];

/** "xml" / "pdf" del archivo del link (el nombre va en ?Name=...); otras extensiones no se indican */
const getLinkExtension = (url: string): string | null => {
    const extension = url.split('?').pop()?.split('.').pop()?.toLowerCase();
    return extension === 'xml' || extension === 'pdf' ? extension.toUpperCase() : null;
};

/**
 * Un botón por link, en el orden OC, Guía, Factura, CC. Con varios links del mismo tipo se numeran
 * (Factura 1, Factura 2) y se indica la extensión XML/PDF. Los tipos sin links no aparecen.
 */
export const getDocumentoLinks = (row: ParteIngresoContabilidad): DocumentoLink[] =>
    DOCUMENT_GROUPS.flatMap(({ label, field }) => {
        const links = row[field] ?? [];
        return links.map((url, index) => {
            const extension = getLinkExtension(url);
            const name = links.length > 1 ? `${label} ${index + 1}` : label;
            return { key: `${field}-${index}`, label: extension ? `${name} (${extension})` : name, url };
        });
    });

/** yyyy-MM-dd → dd/MM/yyyy sin pasar por Date (evita el corrimiento de zona horaria) */
export const formatFecha = (value: string): string => {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
};

export const formatTotal = (row: ParteIngresoContabilidad): string =>
    `${row.moneda} ${row.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Exporta las filas visibles (tras los filtros locales); los links de cada tipo separados por salto de línea */
export const exportPartesIngresoReport = (rows: ParteIngresoContabilidad[], fechaInicio: string, fechaFin: string) => {
    const data = rows.map((row) => ({
        'Fecha': formatFecha(row.fechaParteIngreso),
        'Parte de ingreso': row.numeroParteIngreso,
        'Guía': row.numeroGuia,
        'Código proveedor': row.codigoProveedor,
        'Proveedor': row.proveedor,
        'RUC': row.ruc,
        'OC': row.ordenesCompra ?? '',
        'Condición de pago': row.condicionPago ?? '',
        'Moneda': row.moneda,
        'Total': row.total,
        'Factura': row.numeroFactura ?? '',
        'Estado factura': row.estadoFactura,
        'Cita': row.numeroCita ?? '',
        'Packing list': row.numeroPackingList ?? '',
        'Validación': row.validacionDocumentos,
        'Links OC': row.linksOC.join('\n'),
        'Links Guía': row.linksGuia.join('\n'),
        'Links Factura': row.linksFactura.join('\n'),
        'Links CC': row.linksCC.join('\n'),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 40 }, { wch: 14 }, { wch: 22 }, { wch: 18 },
        { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 16 }, { wch: 12 },
        { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 60 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Partes de Ingreso');

    const fileName = `Partes_Ingreso_${fechaInicio}_${fechaFin}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
};
