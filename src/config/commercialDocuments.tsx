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
}

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
        description: 'PDF, XML, CDR, JPG, PNG',
        prefix: 'FAC',
        keywords: ['fac', 'factura', 'invoice', 'fact']
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
    }
];

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
 * Basado en las palabras clave de cada tipo
 */
export const mapFileNameToDocumentType = (fileName: string): string | null => {
    const lowerFileName = fileName.toLowerCase();
    
    for (const docType of COMMERCIAL_DOCUMENT_TYPES) {
        if (docType.keywords.some(keyword => lowerFileName.includes(keyword))) {
            return docType.key;
        }
    }
    
    return null;
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
