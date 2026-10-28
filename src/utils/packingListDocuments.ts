import { REQUIRED_DOCUMENT_TYPES, getCompletedDocumentTypeKeysFromNames } from '@/config/commercialDocuments';
import type { AppointmentDocument } from '@/services/agenda/appointmentsApi';

/** Grupo de los documentos sin packing list cuando la cita tiene varios (cargados antes de asignarlos) */
export const UNASSIGNED_PACKING_LIST = '';

export interface PackingListDocumentGroup {
    packingList: string;
    documents: AppointmentDocument[];
}

/**
 * Documentos de la cita por packing list, en el orden de los packing lists activos.
 * - Sin packing list: van al único packing list de la cita, o a "Sin packing list" si hay varios.
 * - De un packing list que ya no está entre los activos (eliminado, OBS-009): no se muestran.
 * - Si no se pudieron cargar los packing lists, se agrupa por lo que trae cada documento.
 */
export const groupDocumentsByPackingList = (
    documents: AppointmentDocument[],
    activePackingLists: string[]
): PackingListDocumentGroup[] => {
    const groups = new Map<string, AppointmentDocument[]>(activePackingLists.map((number) => [number, []]));
    const onlyPackingList = activePackingLists.length === 1 ? activePackingLists[0] : UNASSIGNED_PACKING_LIST;

    documents.forEach((doc) => {
        const number = doc.u_packing_list?.trim() || onlyPackingList;
        if (activePackingLists.length > 0 && number !== UNASSIGNED_PACKING_LIST && !groups.has(number)) return;
        groups.set(number, [...(groups.get(number) ?? []), doc]);
    });

    // "Sin packing list" al final
    return Array.from(groups, ([packingList, docs]) => ({ packingList, documents: docs }))
        .sort((a, b) => Number(a.packingList === UNASSIGNED_PACKING_LIST) - Number(b.packingList === UNASSIGNED_PACKING_LIST));
};

/** Todos los tipos requeridos tienen al menos un archivo válido (la factura, su XML); los opcionales no cuentan */
export const areDocumentTypesComplete = (documents: AppointmentDocument[]): boolean => {
    const completed = getCompletedDocumentTypeKeysFromNames(documents.map((doc) => doc.u_name_file));
    return REQUIRED_DOCUMENT_TYPES.every((docType) => completed.has(docType.key));
};

/**
 * Documentos completos de la cita: cada packing list activo tiene todos sus tipos.
 * Si ningún documento trae packing list (cargados antes de asignarlos), se evalúa la cita entera como antes.
 */
export const areAllPackingListDocumentsComplete = (
    documents: AppointmentDocument[],
    activePackingLists: string[]
): boolean => {
    if (!documents.some((doc) => doc.u_packing_list?.trim())) {
        return documents.length > 0 && areDocumentTypesComplete(documents);
    }
    const groups = groupDocumentsByPackingList(documents, activePackingLists)
        .filter((group) => group.packingList !== UNASSIGNED_PACKING_LIST);
    return groups.length > 0 && groups.every((group) => areDocumentTypesComplete(group.documents));
};
