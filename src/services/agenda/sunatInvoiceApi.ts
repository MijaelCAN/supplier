// src/services/agenda/sunatInvoiceApi.ts
// Validación de facturas en SUNAT. Los datos salen del XML (UBL 2.1) que sube el proveedor; la consulta
// la hace la Cloud Function validarFacturaSunat (functions/index.js), que guarda el resultado en Firestore.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db, firebaseApp } from '@/lib/firebase';

const COLLECTION = 'validacionesSunat';

/** Datos del comprobante que pide SUNAT (mismos nombres que validarcomprobante) */
export interface InvoiceXmlData {
    numRuc: string;
    codComp: string;
    numeroSerie: string;
    numero: string;
    fechaEmision: string; // dd/MM/yyyy
    monto: string; // 2 decimales
}

export interface SunatInvoiceValidation extends InvoiceXmlData {
    id: string;
    codCita: string;
    archivo: string; // nombre del XML subido (name_file)
    estadoCp: string | null;
    estadoRuc: string | null;
    condDomiRuc: string | null;
    observaciones: string[];
    mensaje: string | null; // SUNAT respondió sin éxito
    validadoEn: string | null; // ISO
}

export const isXmlFile = (fileName: string): boolean => /\.xml$/i.test(fileName);

// Hijos directos por nombre local: el XML trae prefijos (cbc:, cac:) que varían entre emisores
const child = (parent: Element | null | undefined, name: string): Element | null =>
    parent ? Array.from(parent.children).find((el) => el.localName === name) ?? null : null;

const childPath = (parent: Element | null | undefined, ...names: string[]): Element | null =>
    names.reduce<Element | null>((el, name) => child(el, name), parent ?? null);

const text = (el: Element | null): string => el?.textContent?.trim() ?? '';

const parseXmlRoot = (xml: string): Element => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('El archivo XML no es válido.');
    }
    return doc.documentElement;
};

/** ¿Es el CDR (constancia de recepción de SUNAT) y no la factura? */
export const isCdrXml = (xml: string): boolean => {
    try {
        return parseXmlRoot(xml).localName === 'ApplicationResponse';
    } catch {
        return false;
    }
};

/** Lee serie, número, fecha, monto y RUC emisor del XML de una factura o boleta electrónica */
export const parseInvoiceXml = (xml: string): InvoiceXmlData => {
    const root = parseXmlRoot(xml);
    if (root.localName === 'ApplicationResponse') {
        throw new Error('El XML es el CDR de SUNAT, no la factura. Sube también el XML de la factura.');
    }
    if (root.localName !== 'Invoice') {
        throw new Error('El XML no corresponde a una factura electrónica.');
    }

    const [serie = '', correlativo = ''] = text(child(root, 'ID')).split('-');
    const codComp = text(child(root, 'InvoiceTypeCode'));
    const [year, month, day] = text(child(root, 'IssueDate')).split('-');
    const supplier = childPath(root, 'AccountingSupplierParty');
    // UBL 2.1: Party/PartyIdentification/ID; UBL 2.0 (XML antiguos): CustomerAssignedAccountID
    const numRuc = text(childPath(supplier, 'Party', 'PartyIdentification', 'ID'))
        || text(child(supplier, 'CustomerAssignedAccountID'));
    const monto = Number(text(childPath(root, 'LegalMonetaryTotal', 'PayableAmount')));

    if (!/^[A-Z0-9]{4}$/i.test(serie) || !/^\d{1,8}$/.test(correlativo)) {
        throw new Error('No se encontró la serie y número de la factura en el XML.');
    }
    if (!/^\d{11}$/.test(numRuc)) throw new Error('No se encontró el RUC del emisor en el XML.');
    if (!year || !month || !day) throw new Error('No se encontró la fecha de emisión en el XML.');
    if (!Number.isFinite(monto)) throw new Error('No se encontró el importe total en el XML.');

    return {
        numRuc,
        codComp: codComp || '01',
        numeroSerie: serie.toUpperCase(),
        numero: String(parseInt(correlativo, 10)),
        fechaEmision: `${day}/${month}/${year}`,
        monto: monto.toFixed(2),
    };
};

/**
 * Lee el XML antes de subirlo; rechaza facturas de otro RUC que el proveedor de la cita.
 * El CDR (constancia de SUNAT) también se sube en Factura: devuelve null y no se valida.
 */
export const readInvoiceXmlFile = async (file: File, supplierRuc?: string): Promise<InvoiceXmlData | null> => {
    const xml = await file.text();
    if (parseXmlRoot(xml).localName === 'ApplicationResponse') return null;
    const data = parseInvoiceXml(xml);
    const expected = (supplierRuc ?? '').replace(/\D/g, '');
    if (expected.length === 11 && data.numRuc !== expected) {
        throw new Error(`La factura del XML es del RUC ${data.numRuc}, no del proveedor de la cita (${expected}).`);
    }
    return data;
};

const callValidate = httpsCallable<InvoiceXmlData & { codCita: string; archivo: string }, SunatInvoiceValidation>(
    getFunctions(firebaseApp),
    'validarFacturaSunat'
);

export const validateInvoiceInSunat = async (
    codCita: string,
    archivo: string,
    data: InvoiceXmlData
): Promise<SunatInvoiceValidation> => {
    const result = await callValidate({ ...data, codCita, archivo });
    return result.data;
};

const callGetXml = httpsCallable<{ name: string }, { xml: string }>(getFunctions(firebaseApp), 'obtenerXmlFactura');

/**
 * Contenido de un XML ya subido. El endpoint de archivos del API (/Citas/Photo?Name=...) no envía
 * cabeceras CORS, así que no se puede leer con fetch: lo descarga la Cloud Function obtenerXmlFactura.
 */
export const fetchUploadedXml = async (url: string): Promise<string> => {
    const name = new URL(url).searchParams.get('Name');
    if (!name) throw new Error('No se reconoce la ruta del XML.');
    const result = await callGetXml({ name });
    return result.data.xml;
};

export const fetchInvoiceValidations = async (codCita: string): Promise<SunatInvoiceValidation[]> => {
    const snapshot = await getDocs(query(collection(db, COLLECTION), where('codCita', '==', codCita)));
    return snapshot.docs.map((d) => {
        const data = d.data();
        const validadoEn = data.validadoEn instanceof Timestamp ? data.validadoEn.toDate().toISOString() : null;
        return { ...(data as Omit<SunatInvoiceValidation, 'id' | 'validadoEn'>), id: d.id, validadoEn };
    });
};

/**
 * Validación de una factura por su número ("01-F041-00013408" o "F041-13408"), para llegar a su cita.
 * Solo existen las de facturas cuyo XML se subió al portal.
 */
export const findInvoiceValidationByNumber = async (
    invoiceNumber: string,
    ruc?: string
): Promise<SunatInvoiceValidation | null> => {
    const parts = invoiceNumber.trim().toUpperCase().split('-');
    if (parts.length < 2) return null;
    const serie = parts[parts.length - 2];
    const numero = String(parseInt(parts[parts.length - 1], 10));
    if (!serie || numero === 'NaN') return null;

    const filters = [where('numeroSerie', '==', serie), where('numero', '==', numero)];
    const numRuc = (ruc ?? '').replace(/\D/g, '');
    if (numRuc.length === 11) filters.push(where('numRuc', '==', numRuc));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...filters));
    const found = snapshot.docs.map((d) => d.data()).find((data) => data.codCita);
    return found ? { ...(found as Omit<SunatInvoiceValidation, 'validadoEn'>), validadoEn: null } : null;
};

// Códigos de validarcomprobante
const ESTADO_CP: Record<string, { label: string; color: 'success' | 'warning' | 'danger' }> = {
    '0': { label: 'No existe en SUNAT', color: 'warning' },
    '1': { label: 'Aceptada SUNAT', color: 'success' },
    '2': { label: 'Anulada', color: 'danger' },
    '3': { label: 'Autorizada SUNAT', color: 'success' },
    '4': { label: 'No autorizada', color: 'danger' },
};
const ESTADO_RUC: Record<string, string> = {
    '00': 'ACTIVO', '01': 'BAJA PROVISIONAL', '02': 'BAJA PROV. POR OFICIO', '03': 'SUSPENSIÓN TEMPORAL',
    '10': 'BAJA DEFINITIVA', '11': 'BAJA DE OFICIO', '22': 'INHABILITADO-VENT.UNICA',
};
const COND_DOMICILIO: Record<string, string> = {
    '00': 'HABIDO', '09': 'PENDIENTE', '11': 'POR VERIFICAR', '12': 'NO HABIDO', '20': 'NO HALLADO',
};

export interface SunatChipInfo {
    label: string;
    color: 'success' | 'warning' | 'danger' | 'default';
    detail: string; // tooltip
    isValid: boolean;
}

export const getSunatChipInfo = (validation?: SunatInvoiceValidation): SunatChipInfo => {
    if (!validation) {
        return { label: 'Sin validar', color: 'default', detail: 'La factura aún no se validó en SUNAT', isValid: false };
    }
    const comprobante = `${validation.numeroSerie}-${validation.numero}`;
    const fecha = validation.validadoEn ? ` · validado ${new Date(validation.validadoEn).toLocaleString('es-PE')}` : '';
    if (validation.estadoCp === null || validation.estadoCp === undefined) {
        return {
            label: 'No se pudo validar',
            color: 'warning',
            detail: `${comprobante}: ${validation.mensaje ?? 'SUNAT no devolvió el estado'}${fecha}`,
            isValid: false,
        };
    }
    const estado = ESTADO_CP[validation.estadoCp] ?? { label: `Estado ${validation.estadoCp}`, color: 'warning' as const };
    const rucActivo = !validation.estadoRuc || validation.estadoRuc === '00';
    const habido = !validation.condDomiRuc || validation.condDomiRuc === '00';
    const ruc = `RUC ${ESTADO_RUC[validation.estadoRuc ?? ''] ?? validation.estadoRuc ?? '-'} / ${COND_DOMICILIO[validation.condDomiRuc ?? ''] ?? validation.condDomiRuc ?? '-'}`;
    const isValid = estado.color === 'success';
    return {
        // Comprobante válido pero proveedor con RUC no activo o no habido: se avisa en el mismo chip
        label: isValid && (!rucActivo || !habido) ? `${estado.label} · RUC observado` : estado.label,
        color: isValid && (!rucActivo || !habido) ? 'warning' : estado.color,
        detail: `${comprobante} · ${ruc}${fecha}`,
        isValid,
    };
};
