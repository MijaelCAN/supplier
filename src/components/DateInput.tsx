import { FC, useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@heroui/react';

interface DateInputProps extends Omit<InputProps, 'type' | 'onValueChange' | 'value'> {
    value: string;
    onValueChange: (value: string) => void;
    /**
     * Si es true, actualiza inmediatamente al cambiar cualquier parte de la fecha
     * Si es false (default), solo actualiza cuando se selecciona un día completo
     */
    immediateUpdate?: boolean;
    /**
     * Tiempo de espera en milisegundos antes de disparar onValueChange (debounce)
     * Default: 800ms - tiempo suficiente para que el usuario termine de navegar
     */
    debounceMs?: number;
}

/**
 * Componente de input de fecha que solo dispara onChange cuando se selecciona un día completo,
 * no cuando se cambia el mes o año navegando por el calendario.
 * Usa debounce para evitar llamadas al API mientras el usuario navega.
 */
export const DateInput: FC<DateInputProps> = ({
    value,
    onValueChange,
    immediateUpdate = false,
    debounceMs = 800,
    ...props
}) => {
    const [tempValue, setTempValue] = useState<string>(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const previousValueRef = useRef<string>(value);
    const confirmedValueRef = useRef<string>(value); // Último valor confirmado (que disparó onValueChange)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isNavigatingRef = useRef<boolean>(false);
    const lastChangeTimeRef = useRef<number>(0);
    const changeCountRef = useRef<number>(0); // Contador de cambios rápidos (para detectar navegación)
    const initialValueOnFocusRef = useRef<string>(value); // Valor inicial cuando se abre el calendario

    // Sincronizar tempValue cuando value cambia externamente
    useEffect(() => {
        if (value !== confirmedValueRef.current) {
            setTempValue(value);
            previousValueRef.current = value;
            confirmedValueRef.current = value;
        }
    }, [value]);

    // Limpiar timer al desmontar
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleChange = (newValue: string) => {
        setTempValue(newValue);
        const now = Date.now();
        const timeSinceLastChange = now - lastChangeTimeRef.current;
        lastChangeTimeRef.current = now;
        
        // Si immediateUpdate está activado, actualizar inmediatamente
        if (immediateUpdate) {
            // Limpiar timer anterior si existe
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            onValueChange(newValue);
            previousValueRef.current = newValue;
            confirmedValueRef.current = newValue;
            changeCountRef.current = 0;
            return;
        }

        // Validar que sea una fecha completa válida (formato YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newValue) || newValue.length !== 10) {
            // No es una fecha completa, solo actualizar tempValue
            // Limpiar timer si existe porque no es una fecha válida
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            changeCountRef.current = 0;
            return;
        }

        // Verificar que la fecha sea válida
        const date = new Date(newValue);
        if (isNaN(date.getTime())) {
            // Limpiar timer si existe porque la fecha no es válida
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            changeCountRef.current = 0;
            return;
        }

        // Si el valor es el mismo que el último confirmado, no hacer nada
        if (newValue === confirmedValueRef.current) {
            // Limpiar timer si existe
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            changeCountRef.current = 0;
            return;
        }

        // Detectar si hay múltiples cambios rápidos (navegación)
        // Si hay cambios en menos de 500ms, probablemente está navegando
        if (timeSinceLastChange < 500) {
            changeCountRef.current += 1;
        } else {
            // Si pasó más tiempo, resetear el contador
            changeCountRef.current = 1;
        }

        // Limpiar cualquier timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        // Si hay múltiples cambios rápidos (más de 1 cambio en menos de 500ms), es navegación
        // NO llamar al API, solo actualizar tempValue visualmente
        if (changeCountRef.current > 1) {
            // El usuario está navegando (cambiar mes/año), NO llamar al API
            isNavigatingRef.current = true;
            previousValueRef.current = newValue;
            return; // No establecer timer, solo actualizar visualmente
        }

        // Si es el primer cambio o pasó suficiente tiempo, usar debounce largo (800ms)
        // para asegurar que el usuario terminó de navegar antes de llamar al API
        const capturedValue = newValue;
        const capturedChangeCount = changeCountRef.current;
        
        debounceTimerRef.current = setTimeout(() => {
            // Verificar que el valor actual sea el mismo que cuando se inició el timer
            const currentInputValue = inputRef.current?.value || tempValue;
            
            // Solo llamar al API si:
            // 1. El valor se mantuvo estable
            // 2. No hubo más cambios rápidos (no está navegando)
            if (currentInputValue === capturedValue && capturedChangeCount === 1) {
                // El valor se mantuvo estable y no hubo navegación - es una selección real
                const finalDate = new Date(capturedValue);
                if (!isNaN(finalDate.getTime())) {
                    // Verificar si realmente cambió algo significativo
                    const confirmedDate = new Date(confirmedValueRef.current);
                    
                    if (confirmedDate.getTime() !== finalDate.getTime()) {
                        // Disparar onValueChange - el usuario seleccionó un día
                        onValueChange(capturedValue);
                        previousValueRef.current = capturedValue;
                        confirmedValueRef.current = capturedValue;
                        changeCountRef.current = 0;
                    }
                }
            }
            debounceTimerRef.current = null;
        }, debounceMs); // Usar debounceMs (default 800ms) para dar tiempo a que termine de navegar

        // Marcar que estamos navegando (se actualizará si realmente se selecciona)
        isNavigatingRef.current = true;
        previousValueRef.current = newValue;
    };

    const handleBlur = () => {
        // Limpiar timer si existe
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        // Resetear contador de cambios
        changeCountRef.current = 0;

        // Esperar un momento para que el input termine de procesar cualquier cambio pendiente
        // Esto es necesario porque el blur puede dispararse antes de que el input actualice su valor
        setTimeout(() => {
            const finalValue = inputRef.current?.value || tempValue;
            
            // Solo llamar al API si:
            // 1. El valor final es diferente al valor inicial cuando se abrió el calendario
            // 2. El valor final es diferente al último confirmado
            // 3. NO hubo múltiples cambios rápidos (no estaba navegando)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(finalValue) && finalValue.length === 10) {
                const date = new Date(finalValue);
                if (!isNaN(date.getTime())) {
                    const initialDate = new Date(initialValueOnFocusRef.current);
                    const confirmedDate = new Date(confirmedValueRef.current);
                    const finalDate = new Date(finalValue);
                    
                    // Verificar si el valor cambió desde que se abrió el calendario
                    const changedFromInitial = initialDate.getTime() !== finalDate.getTime();
                    const changedFromConfirmed = confirmedDate.getTime() !== finalDate.getTime();
                    
                    // Solo actualizar si:
                    // - Cambió desde el valor inicial (el usuario hizo algo)
                    // - Cambió desde el último confirmado
                    // - Y no hubo navegación (changeCountRef fue resetado a 0, o solo hubo 1 cambio)
                    if (changedFromInitial && changedFromConfirmed) {
                        // Llamar al API - el usuario seleccionó un día diferente
                        onValueChange(finalValue);
                        previousValueRef.current = finalValue;
                        confirmedValueRef.current = finalValue;
                        setTempValue(finalValue);
                    } else {
                        // No cambió nada o solo navegó, mantener el valor confirmado
                        setTempValue(confirmedValueRef.current);
                    }
                } else {
                    // Si no es válido, restaurar el valor confirmado
                    setTempValue(confirmedValueRef.current);
                }
            } else {
                // Si no es válido, restaurar el valor confirmado
                setTempValue(confirmedValueRef.current);
            }
            isNavigatingRef.current = false;
        }, 100);
    };

    // Detectar cuando el usuario hace clic en el input (abre el calendario)
    const handleFocus = () => {
        // Guardar el valor inicial cuando se abre el calendario
        // Esto nos permite detectar si el usuario realmente cambió algo
        initialValueOnFocusRef.current = tempValue;
        confirmedValueRef.current = previousValueRef.current;
        lastChangeTimeRef.current = Date.now();
        changeCountRef.current = 0; // Resetear contador de cambios
    };

    // Manejar el clear
    const handleClear = () => {
        setTempValue('');
        onValueChange('');
        previousValueRef.current = '';
        confirmedValueRef.current = '';
        changeCountRef.current = 0;
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    };

    return (
        <Input
            {...props}
            ref={inputRef}
            type="date"
            value={tempValue}
            onValueChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            isClearable={props.isClearable !== false && tempValue !== ''}
            onClear={handleClear}
        />
    );
};

