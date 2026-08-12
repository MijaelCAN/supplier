import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { useAuthStore } from '@/store/authStore';
import {
    AUTH_ERROR_EVENT,
    AUTH_STORAGE_KEY,
    emitAuthError,
    getStoredSessionToken,
    msUntilSessionExpiry,
    SESSION_EXPIRED_MESSAGE,
} from '@/services/auth/sessionToken';

/**
 * Tope entre comprobaciones. El temporizador se programa al instante exacto del
 * vencimiento, pero si el equipo se suspende o la pestaña queda en segundo plano
 * el reloj puede saltar; revisando al menos cada minuto nos recuperamos solos.
 */
const MAX_CHECK_INTERVAL_MS = 60_000;

/**
 * Overlay que se muestra cuando la sesión deja de ser válida.
 *
 * Reacciona a dos cosas:
 *  1. El evento 'auth-error' que emite httpClient ante un 401/403 del API.
 *  2. El vencimiento del propio JWT, vigilado con un temporizador, para que el
 *     modal aparezca solo en cualquier pantalla aunque no haya ninguna petición
 *     en curso (hoy casi ningún endpoint del API valida el Bearer).
 */
const AuthErrorHandler = () => {
    const logout = useAuthStore((state) => state.logout);
    const sessionToken = useAuthStore((state) => state.sessionToken);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        const handleAuthError = () => {
            logout();
            setSessionExpired(true);
        };

        window.addEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener);
        return () => {
            window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener);
        };
    }, [logout]);

    const notifyExpired = useCallback(() => {
        emitAuthError({ reason: 'expired', message: SESSION_EXPIRED_MESSAGE });
    }, []);

    // Vigilancia del vencimiento del token
    useEffect(() => {
        if (!sessionToken || sessionExpired) {
            return;
        }

        let timeoutId: number | undefined;

        const scheduleCheck = () => {
            const remaining = msUntilSessionExpiry();

            // Token sin claim `exp`: no hay vencimiento que vigilar
            if (remaining === null) {
                return;
            }

            if (remaining <= 0) {
                notifyExpired();
                return;
            }

            timeoutId = window.setTimeout(
                scheduleCheck,
                Math.min(remaining, MAX_CHECK_INTERVAL_MS),
            );
        };

        // Al volver a la pestaña revalidamos de inmediato: los temporizadores en
        // segundo plano se ralentizan y pueden dispararse tarde.
        const revalidate = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            window.clearTimeout(timeoutId);
            scheduleCheck();
        };

        // Si otra pestaña cierra o invalida la sesión, esta se entera igual.
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== AUTH_STORAGE_KEY) {
                return;
            }
            if (!getStoredSessionToken()) {
                notifyExpired();
                return;
            }
            revalidate();
        };

        scheduleCheck();
        document.addEventListener('visibilitychange', revalidate);
        window.addEventListener('focus', revalidate);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', revalidate);
            window.removeEventListener('focus', revalidate);
            window.removeEventListener('storage', handleStorage);
        };
    }, [sessionToken, sessionExpired, notifyExpired]);

    if (!sessionExpired) return null;

    const handleGoToLogin = () => {
        setSessionExpired(false);
        window.location.href = '/login';
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl max-w-sm w-full mx-4">
                <CardBody className="p-8 flex flex-col items-center gap-5 text-center">

                    {/* Icono candado */}
                    <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                    </div>

                    {/* Texto */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white">Sesión Finalizada</h2>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Tu sesión ha expirado. Por favor, inicia sesión
                            nuevamente para continuar.
                        </p>
                    </div>

                    {/* Botón */}
                    <Button
                        onPress={handleGoToLogin}
                        size="md"
                        fullWidth
                        className="bg-red-800 text-white font-semibold hover:bg-red-700 transition-all duration-200 mt-2"
                    >
                        Volver a Iniciar Sesión
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
};

export default AuthErrorHandler;
