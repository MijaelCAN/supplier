import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { SupplierPDF } from '@/components/PDF/SupplierPDF';
import { ReclamoPDF } from '@/components/PDF/ReclamoPDF';
import {Supplier, SupplierClaim} from "@/store/types.ts";

/**
 * Genera y descarga el PDF del proveedor
 */
export const generateSupplierPDF = async (
    supplier: Supplier
): Promise<void> => {
    try {

        // Crear el documento PDF
        const blob = await pdf(
            SupplierPDF({ supplier }),
        ).toBlob();

        // Generar nombre de archivo con timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Proveedor_${supplier.cardCode}_${timestamp}.pdf`;

        // Descargar el archivo
        saveAs(blob, fileName);
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        throw new Error('No se pudo generar el PDF. Por favor, intente nuevamente.');
    }
};

/**
 * Abre el PDF del proveedor en una nueva pestaña
 */
export const openSupplierPDFInNewTab = async (
    supplier: Supplier,
): Promise<void> => {
    try {
        // Crear el documento PDF
        const blob = await pdf(
            SupplierPDF({ supplier }),
        ).toBlob();

        // Crear URL temporal
        const url = URL.createObjectURL(blob);

        // Abrir en nueva pestaña
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
            throw new Error('Popup bloqueado. Por favor, permite las ventanas emergentes.');
        }

        // Limpiar la URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('Error al abrir el PDF:', error);
        throw new Error('No se pudo abrir el PDF. Por favor, intente nuevamente.');
    }
};

/**
 * Genera y descarga el PDF del reclamo
 */
export const generateClaimPDF = async (
    claim: SupplierClaim
): Promise<void> => {
    try {
        // Crear el documento PDF
        const blob = await pdf(
            ReclamoPDF({ claim }),
        ).toBlob();

        // Generar nombre de archivo con timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Reclamo_${claim.numeroReclamo}_${timestamp}.pdf`;

        // Descargar el archivo
        saveAs(blob, fileName);
    } catch (error) {
        console.error('Error al generar el PDF del reclamo:', error);
        throw new Error('No se pudo generar el PDF. Por favor, intente nuevamente.');
    }
};

/**
 * Abre el PDF del reclamo en una nueva pestaña
 */
export const openClaimPDFInNewTab = async (
    claim: SupplierClaim,
): Promise<void> => {
    try {
        // Crear el documento PDF
        const blob = await pdf(
            ReclamoPDF({ claim }),
        ).toBlob();

        // Crear URL temporal
        const url = URL.createObjectURL(blob);

        // Abrir en nueva pestaña
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
            throw new Error('Popup bloqueado. Por favor, permite las ventanas emergentes.');
        }

        // Limpiar la URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('Error al abrir el PDF del reclamo:', error);
        throw new Error('No se pudo abrir el PDF. Por favor, intente nuevamente.');
    }
};
