// src/pages/Agenda/ProductEvaluationList.tsx
// Evaluación por producto de Calidad / Almacén (OBS-008, parte 1).
import React from 'react';
import { Button, Chip, Input, Textarea } from '@heroui/react';
import {
    getEvaluationBaseQuantity,
    getProductLineKey,
    ProductEvaluationArea,
    ProductEvaluationDecision,
    ProductEvaluationLine,
} from '@/services/agenda/productEvaluationsApi';
import { parsePackingListQuantityInput } from '@/utils/packingList';

export interface ProductEvaluationDraft {
    decision: ProductEvaluationDecision | '';
    /** Texto del input (puede estar a medio escribir, p. ej. "12.") */
    rejectedQuantityText: string;
    motivo: string;
}

interface ProductEvaluationListProps {
    area: ProductEvaluationArea;
    lines: ProductEvaluationLine[];
    drafts: Record<string, ProductEvaluationDraft>;
    onDraftChange: (lineKey: string, draft: ProductEvaluationDraft) => void;
    onAcceptAll: () => void;
    isDisabled?: boolean;
}

// El valor interno 'OBSERVADO' se mantiene; en Calidad se muestra como concesión (término de Auditoría)
const DECISION_LABELS: Record<ProductEvaluationArea, Record<ProductEvaluationDecision, string>> = {
    CALIDAD: { ACEPTADO: 'Aceptado', OBSERVADO: 'Aprobado por concesión', RECHAZADO: 'Rechazado' },
    ALMACEN: { ACEPTADO: 'Aceptado', OBSERVADO: 'Observado', RECHAZADO: 'Rechazado' },
};

const DECISION_STYLES: Record<ProductEvaluationDecision, string> = {
    ACEPTADO: 'border-green-500 bg-green-50 text-green-700',
    OBSERVADO: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    RECHAZADO: 'border-red-500 bg-red-50 text-red-700',
};

/** Líneas que el área puede evaluar: Almacén no ve lo que Calidad rechazó por completo. */
export const getEvaluableLines = (lines: ProductEvaluationLine[], area: ProductEvaluationArea): ProductEvaluationLine[] =>
    lines.filter((line) => getEvaluationBaseQuantity(line, area) > 0);

export const parseRejectedQuantity = (draft: ProductEvaluationDraft): number =>
    parsePackingListQuantityInput(draft.rejectedQuantityText)?.quantity ?? 0;

/** Mensaje de error de una línea, o null si está completa. */
export const getDraftError = (draft: ProductEvaluationDraft | undefined, baseQuantity: number): string | null => {
    if (!draft?.decision) return 'Seleccione un estado';
    if (draft.decision === 'RECHAZADO') {
        const rejected = parseRejectedQuantity(draft);
        if (rejected <= 0) return 'Ingrese la cantidad rechazada';
        if (rejected > baseQuantity) return `La cantidad rechazada no puede ser mayor a ${baseQuantity}`;
    }
    if (draft.decision !== 'ACEPTADO' && !draft.motivo.trim()) return 'Ingrese el motivo';
    return null;
};

const ProductEvaluationList: React.FC<ProductEvaluationListProps> = ({
    area,
    lines,
    drafts,
    onDraftChange,
    onAcceptAll,
    isDisabled,
}) => {
    const evaluableLines = getEvaluableLines(lines, area);

    if (evaluableLines.length === 0) {
        return (
            <div className="p-3 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                {area === 'ALMACEN'
                    ? 'No hay productos para evaluar: Calidad rechazó todos los productos de la cita.'
                    : 'La cita no tiene productos en el PackingList.'}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    Productos ({evaluableLines.length}) *
                </label>
                <Button size="sm" variant="flat" color="success" onPress={onAcceptAll} isDisabled={isDisabled}>
                    Aceptar todos
                </Button>
            </div>

            {evaluableLines.map((line) => {
                const lineKey = getProductLineKey(line);
                const baseQuantity = getEvaluationBaseQuantity(line, area);
                const draft = drafts[lineKey] ?? { decision: '', rejectedQuantityText: '', motivo: '' };
                const rejectedQuantity = parseRejectedQuantity(draft);
                const isPartial = draft.decision === 'RECHAZADO' && rejectedQuantity > 0 && rejectedQuantity < baseQuantity;

                const updateDraft = (changes: Partial<ProductEvaluationDraft>) =>
                    onDraftChange(lineKey, { ...draft, ...changes });

                return (
                    <div key={lineKey} className="p-3 rounded-lg border border-gray-200 bg-white space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate" title={line.item_name}>
                                    {line.item_name || line.item_code}
                                </p>
                                <p className="text-xs text-gray-500">{line.item_code}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs text-gray-500">
                                    {area === 'ALMACEN' ? 'Aceptado por Calidad' : 'Cantidad'}
                                </p>
                                <p className="text-sm font-semibold text-gray-900">{baseQuantity}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {(['ACEPTADO', 'OBSERVADO', 'RECHAZADO'] as const).map((decision) => (
                                <button
                                    key={decision}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() =>
                                        updateDraft({
                                            decision,
                                            // Por defecto se rechaza todo; se reduce para un rechazo parcial
                                            rejectedQuantityText:
                                                decision === 'RECHAZADO' && !draft.rejectedQuantityText
                                                    ? String(baseQuantity)
                                                    : draft.rejectedQuantityText,
                                        })
                                    }
                                    className={`px-2 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                                        draft.decision === decision
                                            ? DECISION_STYLES[decision]
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    {DECISION_LABELS[area][decision]}
                                </button>
                            ))}
                        </div>

                        {draft.decision === 'RECHAZADO' && (
                            <div className="flex items-end gap-3">
                                <Input
                                    size="sm"
                                    label="Cantidad rechazada"
                                    value={draft.rejectedQuantityText}
                                    onValueChange={(value) => {
                                        if (parsePackingListQuantityInput(value) === null) return;
                                        updateDraft({ rejectedQuantityText: value });
                                    }}
                                    isInvalid={rejectedQuantity <= 0 || rejectedQuantity > baseQuantity}
                                    isDisabled={isDisabled}
                                    className="max-w-[180px]"
                                />
                                <div className="text-xs text-gray-600 pb-2">
                                    Se acepta: <span className="font-semibold">{Math.max(baseQuantity - rejectedQuantity, 0)}</span>
                                </div>
                                {isPartial && (
                                    <Chip size="sm" color="warning" variant="flat" className="mb-1">
                                        Rechazo parcial
                                    </Chip>
                                )}
                            </div>
                        )}

                        {draft.decision && draft.decision !== 'ACEPTADO' && (
                            <Textarea
                                size="sm"
                                label={draft.decision === 'OBSERVADO'
                                    ? (area === 'CALIDAD' ? 'Motivo de aprobación por concesión' : 'Motivo de la observación')
                                    : 'Motivo de rechazo'}
                                value={draft.motivo}
                                onValueChange={(value) => updateDraft({ motivo: value })}
                                minRows={2}
                                isRequired
                                isDisabled={isDisabled}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ProductEvaluationList;
