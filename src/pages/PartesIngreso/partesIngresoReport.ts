// src/pages/PartesIngreso/partesIngresoReport.ts
// Formato, documentos y exportación a Excel de los partes de ingreso (mismo patrón que appointmentsReport.ts).
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { EstadoFactura, ParteIngresoContabilidad } from '@/services/contabilidad/partesIngresoApi';
import { COMMERCIAL_DOCUMENT_TYPES, getDocumentTypeByKey, mapFileNameToDocumentType } from '@/config/commercialDocuments';

/** Registro SAP: el API manda el estado de la factura y se muestra si el parte ya tiene asiento */
export const REGISTRO_SAP_LABELS: Record<EstadoFactura, string> = {
    'FALTA FACTURA': 'SIN ASIENTO',
    'FACTURA REGISTRADA': 'CON ASIENTO',
};

export interface DocumentoLink {
    key: string;
    label: string;
    url: string;
    extension: string | null;   // 'XML' | 'PDF' | null
}

export interface DocumentoGrupo {
    key: string;
    label: string;
    shortLabel: string;
    links: DocumentoLink[];
}

const DOCUMENT_GROUPS: { label: string; shortLabel: string; field: 'linksOC' | 'linksGuia' | 'linksFactura' | 'linksCC' }[] = [
    { label: 'OC', shortLabel: 'OC', field: 'linksOC' },
    { label: 'Guía', shortLabel: 'Guía', field: 'linksGuia' },
    { label: 'Factura', shortLabel: 'Fact', field: 'linksFactura' },
    { label: 'CC', shortLabel: 'CC', field: 'linksCC' },
];

/** "xml" / "pdf" del archivo del link (el nombre va en ?Name=...); otras extensiones no se indican */
const getLinkExtension = (url: string): string | null => {
    const extension = url.split('?').pop()?.split('.').pop()?.toLowerCase();
    return extension === 'xml' || extension === 'pdf' ? extension.toUpperCase() : null;
};

/** Con varios links del mismo tipo se numeran (Factura 1, Factura 2) y se indica la extensión XML/PDF */
const buildLinks = (groupKey: string, label: string, urls: string[]): DocumentoLink[] =>
    urls.map((url, index) => {
        const extension = getLinkExtension(url);
        const name = urls.length > 1 ? `${label} ${index + 1}` : label;
        return { key: `${groupKey}-${index}`, label: extension ? `${name} (${extension})` : name, url, extension };
    });

/** Los cuatro tipos (OC, Guía, Factura, CC) siempre, aunque no tengan links, para mostrarlos con su cantidad */
export const getDocumentoGrupos = (row: ParteIngresoContabilidad): DocumentoGrupo[] =>
    DOCUMENT_GROUPS.map(({ label, shortLabel, field }) => ({
        key: field,
        label,
        shortLabel,
        links: buildLinks(field, label, row[field] ?? []),
    }));

const OTRO_TIPO_KEY = 'otro';

/** Nombre del archivo del link (?Name=B1H_VIST_PE/20261021/LT_xxx.pdf → LT_xxx.pdf) */
const getLinkFileName = (url: string): string => {
    const name = url.split('Name=').pop() ?? url;
    return decodeURIComponent(name).split('/').pop() ?? name;
};

/**
 * Los demás archivos de la cita (links_otros) agrupados por tipo según el prefijo del nombre, con los tipos de
 * COMMERCIAL_DOCUMENT_TYPES y en su orden; lo que no se reconoce va al final como "Otro". Solo tipos con archivos.
 */
export const getOtrosDocumentos = (row: ParteIngresoContabilidad): DocumentoGrupo[] => {
    const urlsByType = new Map<string, string[]>();
    row.linksOtros.forEach((url) => {
        const typeKey = mapFileNameToDocumentType(getLinkFileName(url)) ?? OTRO_TIPO_KEY;
        urlsByType.set(typeKey, [...(urlsByType.get(typeKey) ?? []), url]);
    });

    const typeOrder = [...COMMERCIAL_DOCUMENT_TYPES.map((doc) => doc.key), OTRO_TIPO_KEY];
    return typeOrder
        .filter((typeKey) => urlsByType.has(typeKey))
        .map((typeKey) => {
            const label = getDocumentTypeByKey(typeKey)?.label ?? 'Otro';
            return { key: typeKey, label, shortLabel: label, links: buildLinks(typeKey, label, urlsByType.get(typeKey)!) };
        });
};

/** yyyy-MM-dd → dd/MM/yyyy sin pasar por Date (evita el corrimiento de zona horaria) */
export const formatFecha = (value: string): string => {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
};

export const formatTotal = (row: ParteIngresoContabilidad): string =>
    `${row.moneda} ${row.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const isPdfLink = (link: DocumentoLink): boolean => link.extension === 'PDF';

export interface DocumentoVisor extends DocumentoLink {
    grupo: string;
}

/** Los PDF del parte para el visor de cotejo (básicos y otros, en el orden de los chips); los XML no se muestran */
export const getDocumentosVisor = (row: ParteIngresoContabilidad): DocumentoVisor[] =>
    [...getDocumentoGrupos(row), ...getOtrosDocumentos(row)]
        .flatMap((grupo) => grupo.links.filter(isPdfLink).map((link) => ({ ...link, grupo: grupo.label })));

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
        'Registro SAP': REGISTRO_SAP_LABELS[row.estadoFactura],
        'Cita': row.numeroCita ?? '',
        'Packing list': row.numeroPackingList ?? '',
        'Validación': row.validacionDocumentos,
        'Links OC': row.linksOC.join('\n'),
        'Links Guía': row.linksGuia.join('\n'),
        'Links Factura': row.linksFactura.join('\n'),
        'Links CC': row.linksCC.join('\n'),
        'Otros documentos': getOtrosDocumentos(row)
            .flatMap((grupo) => grupo.links.map((link) => `${link.label}: ${link.url}`))
            .join('\n'),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 40 }, { wch: 14 }, { wch: 22 }, { wch: 18 },
        { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 16 }, { wch: 12 },
        { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 80 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Partes de Ingreso');

    const fileName = `Partes_Ingreso_${fechaInicio}_${fechaFin}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
};
