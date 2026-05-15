import { useEffect, useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { useAuthStore } from '@/store/authStore';

/**
 * Overlay que se muestra cuando la sesión expira (401/403).
 * Escucha el evento 'auth-error' emitido por httpClient,
 * limpia la sesión y muestra un card con botón para volver al login.
 */
const AuthErrorHandler = () => {
    const logout = useAuthStore((state) => state.logout);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        const handleAuthError = () => {
            logout();
            setSessionExpired(true);
        };

        window.addEventListener('auth-error', handleAuthError as EventListener);
        return () => {
            window.removeEventListener('auth-error', handleAuthError as EventListener);
        };
    }, [logout]);

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
                            Tu sesión ha expirado por inactividad. Por favor, inicia sesión
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
