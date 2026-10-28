import { PackingListItem } from '@/store/types';

/** Tolerancia de sobre-entrega permitida sobre la cantidad pendiente (20%). */
export const PACKING_LIST_TOLERANCE = 0.2;

/** Decimales permitidos en la cantidad del PackingList. */
export const PACKING_LIST_DECIMALS = 2;

/** Texto válido mientras se escribe: dígitos con hasta 2 decimales (acepta punto o coma). */
const QUANTITY_INPUT_REGEX = new RegExp(`^\\d*([.,]\\d{0,${PACKING_LIST_DECIMALS}})?$`);

const roundQuantity = (value: number): number => {
    const factor = 10 ** PACKING_LIST_DECIMALS;
    return Math.round(value * factor) / factor;
};

/**
 * Cantidad máxima que se puede ingresar en el PackingList para un item:
 * lo pendiente más un 20% de lo pendiente (pendiente 100 → hasta 120; tras un parcial, pendiente 40 → hasta 48).
 */
export const getMaxPackingListQuantity = (item: Pick<PackingListItem, 'pendingQuantity'>): number => {
    const factor = 10 ** PACKING_LIST_DECIMALS;
    // Se trunca (no redondea) para no superar nunca el 20% de tolerancia
    return Math.floor(roundQuantity(item.pendingQuantity * (1 + PACKING_LIST_TOLERANCE) * factor)) / factor;
};

/**
 * Interpreta lo digitado en el input de cantidad.
 * Devuelve `null` si el texto no es válido (letras, más de 2 decimales, etc.) para ignorar ese cambio.
 */
export const parsePackingListQuantityInput = (value: string): { text: string; quantity: number } | null => {
    if (!QUANTITY_INPUT_REGEX.test(value)) return null;
    const text = value.replace(',', '.');
    return { text, quantity: roundQuantity(parseFloat(text) || 0) };
};

/**
 * Texto a mostrar en el input: conserva lo que el usuario está escribiendo (p. ej. "12." o "12.50")
 * mientras corresponda a la cantidad actual; si la cantidad cambió por otro lado (reset a 0), muestra la cantidad.
 */
export const getPackingListQuantityText = (item: Pick<PackingListItem, 'quantity' | 'quantityText'>): string =>
    item.quantityText !== undefined && (parseFloat(item.quantityText) || 0) === item.quantity
        ? item.quantityText
        : item.quantity.toString();
