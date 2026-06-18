// src/utils/dateUtils.ts
// Utilidades para manejar fechas y horas correctamente en zona horaria de Perú (UTC-5)

/**
 * Convierte una fecha ISO del API a un objeto Date sin conversión de timezone
 * El API devuelve fechas como "2026-01-06T00:00:00" que representan fechas locales en Perú
 *
 * @param dateString - Fecha en formato ISO del API (ej: "2026-01-06T00:00:00")
 * @returns Date object en timezone local
 */
export const parseApiDate = (dateString: string): Date => {
    // Si la fecha ya incluye timezone info, usarla directamente
    if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('T') && dateString.split('T')[1].includes('-')) {
        return new Date(dateString);
    }

    // Si es solo fecha sin hora (YYYY-MM-DD)
    if (!dateString.includes('T')) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0);
    }

    // Para fechas ISO sin timezone (ej: "2026-01-06T00:00:00")
    // Las parseamos como fecha local, no UTC
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);

    if (timePart) {
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
    }

    return new Date(year, month - 1, day, 0, 0, 0);
};

/**
 * Convierte una hora en formato "HH:MM:SS" a solo "HH:MM"
 *
 * @param timeString - Hora en formato "HH:MM:SS" o "HH:MM"
 * @returns Hora en formato "HH:MM"
 */
export const formatTimeShort = (timeString: string | undefined): string => {
    if (!timeString) return '';

    // Si ya está en formato HH:MM, devolverlo tal cual
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
};

/**
 * Convierte minutos desde medianoche a formato "HH:MM"
 *
 * @param minutes - Minutos desde medianoche (0-1439)
 * @returns Hora en formato "HH:MM"
 */
export const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Convierte una hora en formato "HH:MM:SS" o "HH:MM" a minutos desde medianoche
 *
 * @param timeString - Hora en formato "HH:MM:SS" o "HH:MM"
 * @returns Minutos desde medianoche (0-1439)
 */
export const timeToMinutes = (timeString: string | undefined): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Compara dos fechas ignorando la hora
 *
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si las fechas son el mismo día
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

/**
 * Convierte un Date a string en formato YYYY-MM-DD para input type="date"
 *
 * @param date - Fecha a convertir
 * @returns String en formato YYYY-MM-DD
 */
export const dateToInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha para display en español
 *
 * @param dateString - Fecha en formato ISO del API
 * @returns Fecha formateada (ej: "6 de enero de 2026")
 */
export const formatDateDisplay = (dateString: string): string => {
    const date = parseApiDate(dateString);
    return date.toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

/**
 * Formatea una fecha para display corto en español
 *
 * @param dateString - Fecha en formato ISO del API
 * @returns Fecha formateada (ej: "06/01/2026")
 */
export const formatDateShort = (dateString: string): string => {
    const date = parseApiDate(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Crea un objeto Date a partir de una fecha string sin conversión de timezone
 * Útil para comparaciones de fechas
 *
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date object con hora 00:00:00 local
 */
export const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Obtiene el inicio del día (00:00:00) para una fecha
 *
 * @param date - Fecha
 * @returns Nueva fecha con hora 00:00:00
 */
export const getStartOfDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

/**
 * Obtiene el fin del día (23:59:59.999) para una fecha
 *
 * @param date - Fecha
 * @returns Nueva fecha con hora 23:59:59.999
 */
export const getEndOfDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};