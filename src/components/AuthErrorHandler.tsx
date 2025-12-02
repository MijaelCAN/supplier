import { useEffect } from 'react';
import { addToast } from '@heroui/react';
import { useAuthStore } from '@/store/authStore';

/**
 * Componente que escucha eventos de error de autenticación
 * y maneja la expiración de sesión mostrando un toast y redirigiendo al login
 */
const AuthErrorHandler = () => {
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const handleAuthError = (event: CustomEvent) => {
            const { message } = event.detail;

            // Mostrar toast de error
            addToast({
                title: 'Sesión Expirada',
                description: message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                color: 'warning',
                timeout: 5000,
                shouldShowTimeoutProgress: true,
            });

            // Limpiar el estado de autenticación
            logout();

            // Redirigir al login si no estamos ya ahí
            // Usar window.location para evitar problemas con el router
            if (window.location.pathname !== '/login') {
                // Pequeño delay para que el toast se muestre antes de redirigir
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
            }
        };

        // Escuchar el evento personalizado
        window.addEventListener('auth-error', handleAuthError as EventListener);

        // Limpiar el listener al desmontar
        return () => {
            window.removeEventListener('auth-error', handleAuthError as EventListener);
        };
    }, [logout]);

    // Este componente no renderiza nada
    return null;
};

export default AuthErrorHandler;

