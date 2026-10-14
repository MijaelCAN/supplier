// src/pages/Agenda/SunatStatusChip.tsx
import {Button, Chip, Tooltip} from "@heroui/react";
import {ArrowPathIcon} from "@heroicons/react/24/outline";
import {getSunatChipInfo, SunatInvoiceValidation} from "@/services/agenda/sunatInvoiceApi";

interface SunatStatusChipProps {
    validation?: SunatInvoiceValidation;
    /** Si se pasa y la factura no está válida, muestra el botón para volver a consultar SUNAT */
    onRevalidate?: () => void;
    isValidating?: boolean;
}

/** Estado SUNAT de una factura, a la izquierda del tipo de archivo en la pestaña Factura */
const SunatStatusChip = ({validation, onRevalidate, isValidating}: SunatStatusChipProps) => {
    const info = getSunatChipInfo(validation);
    return (
        // stopPropagation: que no abra el visor de la fila
        <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip content={info.detail}>
                <Chip size="sm" variant="flat" color={info.color}>
                    {isValidating ? 'Validando…' : info.label}
                </Chip>
            </Tooltip>
            {onRevalidate && !info.isValid && (
                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    aria-label="Validar en SUNAT"
                    title="Validar en SUNAT"
                    isLoading={isValidating}
                    onPress={onRevalidate}
                    className="min-w-0"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                </Button>
            )}
        </span>
    );
};

export default SunatStatusChip;
