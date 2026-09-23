import { PackingListItem } from '@/store/types';

/** Tolerancia de sobre-entrega permitida sobre la cantidad de la OC (20%). */
export const PACKING_LIST_TOLERANCE = 0.2;

/**
 * Cantidad máxima que se puede ingresar en el PackingList para un item:
 * lo pendiente más un 20% de la cantidad de la OC (OC de 100 sin entregas → hasta 120).
 * Si no se conoce la cantidad de la OC, se aplica el 20% sobre lo pendiente.
 */
export const getMaxPackingListQuantity = (item: Pick<PackingListItem, 'pendingQuantity' | 'cantidadOC'>): number => {
    const base = item.cantidadOC && item.cantidadOC > 0 ? item.cantidadOC : item.pendingQuantity;
    return Math.floor(item.pendingQuantity + base * PACKING_LIST_TOLERANCE);
};
