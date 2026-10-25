/**
 * Configuración de tipos de documentos comerciales
 * Esta configuración puede ser reemplazada en el futuro por datos de una API
 */

import type { ReactNode } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export interface CommercialDocumentType {
    key: string;
    label: string;
    accept: string; // Formatos aceptados: .pdf,.xml,.cdr, etc.
    icon: ReactNode;
    description: string; // Descripción de formatos aceptados
    prefix: string; // Prefijo para el nombre del archivo (ej: 'FAC', 'OC', 'GR')
    keywords: string[]; // Palabras clave para identificar el documento en archivos cargados
    // El tipo no está completo sin un archivo que cumpla esto (ej: el XML de la factura); requiredLabel es lo que falta
    isRequiredFile?: (fileName: string) => boolean;
    requiredLabel?: string;
    // Se puede cargar pero no cuenta para "documentos completos" ni se marca como faltante (ej: la Letra, OBS-030)
    optional?: boolean;
}

/** CDR de SUNAT: "R-<ruc>-01-F001-123.xml", guardado como "FAC_R-..." */
export const isCdrFileName = (fileName: string): boolean => /^(FAC_)?R-/i.test(fileName);

/** XML de la factura (no el CDR, que también es XML) */
export const isInvoiceXmlFileName = (fileName: string): boolean =>
    /\.xml$/i.test(fileName) && !isCdrFileName(fileName);

/**
 * Lista de tipos de documentos comerciales
 * Cada documento puede aceptar múltiples formatos (CDR, XML, PDF, etc.)
 */
export const COMMERCIAL_DOCUMENT_TYPES: CommercialDocumentType[] = [
    {
        key: 'invoice',
        label: 'Factura',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'XML obligatorio (se valida en SUNAT) + PDF, CDR, JPG, PNG',
        prefix: 'FAC',
        keywords: ['fac', 'factura', 'invoice', 'fact'],
        isRequiredFile: isInvoiceXmlFileName,
        requiredLabel: 'XML'
    },
    {
        key: 'purchaseOrder',
        label: 'Orden de Compra',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'OC',
        keywords: ['oc', 'orden', 'compra', 'purchase', 'order']
    },
    {
        key: 'deliveryGuide',
        label: 'Guía de Remisión',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'GR',
        keywords: ['gr', 'guia', 'remision', 'delivery', 'guide']
    },
    {
        key: 'qualityCertificate',
        label: 'Certificado de Calidad',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'CC',
        keywords: ['certificado', 'calidad', 'quality', 'certificate']
    },
    {
        key: 'transportGuide',
        label: 'Guía de Transportista',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'GT',
        keywords: ['transportista', 'transport', 'guia transportista', 'transport guide']
    },
    {
        key: 'packingList',
        label: 'PackingList',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'PL',
        keywords: ['packing', 'list', 'packinglist', 'empaque']
    },
    {
        key: 'safetySheet',
        label: 'Hoja de Seguridad',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'HS',
        keywords: ['seguridad', 'safety', 'hoja seguridad', 'safety sheet', 'msds']
    },
    {
        key: 'analysisCertificate',
        label: 'Certificado de Análisis',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'CA',
        keywords: ['analisis', 'analysis', 'certificado analisis', 'analysis certificate', 'coa']
    },
    {
        key: 'technicalSheet',
        label: 'Ficha Técnica',
        accept: '.pdf,.xml,.cdr,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'FT',
        keywords: ['ficha', 'tecnica', 'ficha tecnica', 'technical', 'sheet', 'technical sheet', 'datasheet']
    },
    {
        key: 'billOfExchange',
        label: 'Letra',
        accept: '.pdf,.jpg,.jpeg,.png',
        icon: <DocumentTextIcon className="w-5 h-5" />,
        description: 'Opcional, solo si el pago es con letra. PDF, JPG, PNG',
        prefix: 'LT',
        keywords: ['letra'],
        optional: true
    }
];

/** Tipos que deben estar cargados para que los documentos queden completos */
export const REQUIRED_DOCUMENT_TYPES = COMMERCIAL_DOCUMENT_TYPES.filter(doc => !doc.optional);

/**
 * Mapeo de tipos de documento a prefijos de nombre de archivo
 * Generado dinámicamente desde COMMERCIAL_DOCUMENT_TYPES
 */
export const DOCUMENT_TYPE_PREFIXES: Record<string, string> = 
    COMMERCIAL_DOCUMENT_TYPES.reduce((acc, doc) => {
        acc[doc.key] = doc.prefix;
        return acc;
    }, {} as Record<string, string>);

/**
 * Función para obtener un tipo de documento por su key
 */
export const getDocumentTypeByKey = (key: string): CommercialDocumentType | undefined => {
    return COMMERCIAL_DOCUMENT_TYPES.find(doc => doc.key === key);
};

/**
 * Función para mapear un nombre de archivo a un tipo de documento
 * Primero por el prefijo con que se guarda al subir (`FAC_...`, `OC_...`, ver generateFileName);
 * las palabras clave quedan como respaldo para archivos antiguos sin prefijo.
 */
export const mapFileNameToDocumentType = (fileName: string): string | null => {
    const lowerFileName = fileName.toLowerCase();

    const byPrefix = COMMERCIAL_DOCUMENT_TYPES.find(docType =>
        lowerFileName.startsWith(`${docType.prefix.toLowerCase()}_`)
    );
    if (byPrefix) return byPrefix.key;

    for (const docType of COMMERCIAL_DOCUMENT_TYPES) {
        if (docType.keywords.some(keyword => lowerFileName.includes(keyword))) {
            return docType.key;
        }
    }
    
    return null;
};

/** ¿El archivo cumple lo obligatorio de su tipo? (los tipos sin isRequiredFile aceptan cualquiera) */
export const meetsRequiredFile = (typeKey: string, fileName: string): boolean => {
    const isRequiredFile = getDocumentTypeByKey(typeKey)?.isRequiredFile;
    return !isRequiredFile || isRequiredFile(fileName);
};

/**
 * Tipos que ya tienen al menos un archivo válido. La factura solo cuenta si se cargó su XML.
 */
export const getCompletedDocumentTypeKeysFromNames = (fileNames: string[]): Set<string> => {
    const keys = new Set<string>();
    fileNames.forEach((name) => {
        const typeKey = mapFileNameToDocumentType(name);
        if (typeKey && meetsRequiredFile(typeKey, name)) keys.add(typeKey);
    });
    return keys;
};

/**
 * Función para obtener todos los keys de tipos de documentos
 */
export const getDocumentTypeKeys = (): string[] => {
    return COMMERCIAL_DOCUMENT_TYPES.map(doc => doc.key);
};

/**
 * Función para cargar tipos de documentos desde una API (futuro)
 * Esta función puede ser implementada cuando se tenga el endpoint
 */
export const loadDocumentTypesFromApi = async (): Promise<CommercialDocumentType[]> => {
    // TODO: Implementar llamada a API cuando esté disponible
    // Por ahora retorna la configuración estática
    return COMMERCIAL_DOCUMENT_TYPES;
};
