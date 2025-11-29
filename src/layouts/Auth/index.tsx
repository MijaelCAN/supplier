import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {DrawerProps} from "@heroui/react";
import {
    addToast,
    Alert,
    Button,
    Card,
    CardBody,
    CardHeader,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    Input,
    Tab,
    Tabs,
    ToastProvider,
    useDisclosure,
} from "@heroui/react";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/icons.tsx";
import { useAuthStore } from "@/store/authStore";
import { sendPasswordRecoveryCode } from "@/services/email/emailApi";
import {RoleType} from "@/services/auth/apiAuth.ts";


const Login = () => {
    const navigate = useNavigate();

    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const authError = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const currentUser = useAuthStore((state) => state.currentUser);
    //const findUserByUsername = useAuthStore((state) => state.findUserByUsername);
    const getProviderEmailByRuc = useAuthStore((state) => state.getProviderEmailByRuc);
    const updateUserPassword = useAuthStore((state) => state.updateUserPassword);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<"proveedor" | "corporativo">("proveedor");
    const [formError, setFormError] = useState("");

    const [resetStep, setResetStep] = useState<'username' | 'code' | 'password'>('username');
    const [resetUsername, setResetUsername] = useState('');
    const [resetError, setResetError] = useState('');
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [resetUser, setResetUser] = useState<{ id: string; email?: string; fullName?: string } | null>(null);
    const [verificationDigits, setVerificationDigits] = useState<string[]>(() => Array(6).fill(''));
    const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [confirmPasswordValue, setConfirmPasswordValue] = useState('');

    const toggleVisibility = () => setIsVisible(!isVisible);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [backdrop, setBackdrop] = useState<DrawerProps["backdrop"]>("opaque");

    const resetRecoveryFlow = useCallback(() => {
        setResetStep('username');
        setResetUsername('');
        setResetError('');
        setIsResetLoading(false);
        setGeneratedCode('');
        setResetUser(null);
        setVerificationDigits(Array(6).fill(''));
        setNewPasswordValue('');
        setConfirmPasswordValue('');
    }, []);

    const handleBackdropChange = (nextBackdrop: DrawerProps["backdrop"]) => {
        setBackdrop(nextBackdrop);
        resetRecoveryFlow();
        onOpen();
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");
        clearError();

        if (!username.trim() || !password.trim()) {
            const message = "Los campos 'Usuario' y 'Contraseña' son obligatorios.";
            setFormError(message);
            addToast({
                title: "Datos incompletos",
                description: message,
                timeout: 3000,
                color: "warning",
                shouldShowTimeoutProgress: true,
            });
            return;
        }

        // Validar si la contraseña es igual al usuario (primera vez)
        if (password === username.trim()) {
            setFormError("La contraseña no puede ser igual al usuario. Por favor, actualice su contraseña.");
            addToast({
                title: "Contraseña inválida",
                description: "La contraseña no puede ser igual al usuario. Por favor, use la opción 'Recuperar Contraseña' para actualizarla.",
                timeout: 5000,
                color: "warning",
                shouldShowTimeoutProgress: true,
            });
            // Abrir el drawer de recuperación de contraseña
            handleBackdropChange("opaque");
            setResetUsername(username.trim());
            return;
        }

        const selectedRole: RoleType = activeTab === "proveedor" ? "provider" : "internal";
        const result = await login(username.trim().toLowerCase(), password, selectedRole);

        if (result.success) {
            addToast({
                title: "Login exitoso",
                description: `Bienvenido ${result.user.fullName}`,
                timeout: 2500,
                color: "success",
                shouldShowTimeoutProgress: true,
            });

            switch (result.user.role) {
                case 'admin':
                case 'compras':
                case 'finanzas':
                case 'almacen':
                default:
                    navigate("/");
                    break;
                case 'proveedor':
                    navigate("/proveedor/perfil");
                    break;
            }
        } else {
            // Manejar error especial de contraseña igual a usuario
            if (result.code === 'PASSWORD_EQUALS_USERNAME') {
                setFormError(result.message);
                addToast({
                    title: "Actualización de contraseña requerida",
                    description: result.message,
                    timeout: 5000,
                    color: "warning",
                    shouldShowTimeoutProgress: true,
                });
                // Abrir el drawer de recuperación de contraseña
                handleBackdropChange("opaque");
                setResetUsername(username.trim());
            } else {
                setFormError(result.message);
                addToast({
                    title: "Error de autenticación",
                    description: result.message,
                    timeout: 3000,
                    color: "danger",
                    shouldShowTimeoutProgress: true,
                });
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated && currentUser) {
            navigate("/");
        }
    }, [isAuthenticated, currentUser, navigate]);

    useEffect(() => {
        setUsername("");
        setPassword("");
        setFormError("");
        clearError();
    }, [activeTab, clearError]);

    useEffect(() => {
        if (authError) {
            setFormError(authError);
        }
    }, [authError]);

    useEffect(() => {
        if (!isOpen) {
            resetRecoveryFlow();
        }
    }, [isOpen, resetRecoveryFlow]);

    useEffect(() => {
        if (isOpen && resetStep === 'code') {
            codeInputRefs.current[0]?.focus();
        }
    }, [isOpen, resetStep]);

    const tabs = [
        {
            id: "proveedor",
            label: "Soy Proveedor",
            content:
                "Lorem ipsum dolor sit amet.",
        },
        {
            id: "corporativo",
            label: "Soy Corporativo",
            content:
                "Ut enim ad minim nulla pariatur.",
        },
    ];
    const toastPlacement = "bottom-right" as const;

    const handleSendRecoveryCode = async () => {
        setResetError('');
        if (!resetUsername.trim()) {
            setResetError('Por favor ingresa tu usuario (RUC).');
            return;
        }

        setIsResetLoading(true);
        try {
            // Obtener correo del proveedor usando el API
            const providerInfo = await getProviderEmailByRuc(resetUsername.trim());
            
            if (!providerInfo) {
                setResetError('No se encuentra registrado como Proveedor para Vistony');
                return;
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);
            setResetUser({
                id: providerInfo.codUsuario,
                email: providerInfo.email,
                fullName: providerInfo.nombreCompleto,
            });
            setVerificationDigits(Array(6).fill(''));
            setResetStep('code');

            // Enviar correo con código de recuperación
            if (providerInfo.email) {
                try {
                    const emailResult = await sendPasswordRecoveryCode({
                        to: providerInfo.email,
                        recoveryData: {
                            code,
                            userName: providerInfo.nombreCompleto || resetUsername.trim(),
                            expiresIn: 15, // 15 minutos
                        },
                    });

                    if (emailResult.success) {
                        addToast({
                            title: 'Código enviado',
                            description: `Hemos enviado un código de verificación al correo ${providerInfo.email}.`,
                            color: 'success',
                            timeout: 4000,
                            shouldShowTimeoutProgress: true,
                        });
                        console.info('✅ Código de recuperación enviado por correo:', code);
                    } else {
                        console.warn('⚠️ No se pudo enviar el correo:', emailResult.error);
                        addToast({
                            title: 'Código generado',
                            description: `Código: ${code}. No se pudo enviar por correo, pero puedes usarlo para continuar.`,
                            color: 'warning',
                            timeout: 5000,
                            shouldShowTimeoutProgress: true,
                        });
                    }
                } catch (emailError) {
                    console.error('Error al enviar correo de recuperación:', emailError);
                    addToast({
                        title: 'Código generado',
                        description: `Código: ${code}. Error al enviar correo, pero puedes usarlo para continuar.`,
                        color: 'warning',
                        timeout: 5000,
                        shouldShowTimeoutProgress: true,
                    });
                }
            } else {
                // Si no hay email, mostrar el código directamente
                addToast({
                    title: 'Código generado',
                    description: `Código: ${code}. No hay correo registrado, usa este código para continuar.`,
                    color: 'warning',
                    timeout: 5000,
                    shouldShowTimeoutProgress: true,
                });
                console.info('Código de recuperación generado (sin email):', code);
            }
        } catch (error) {
            console.error('Error al enviar el código de recuperación', error);
            const errorMessage = error instanceof Error ? error.message : 'No se pudo enviar el código de recuperación. Inténtalo nuevamente.';
            setResetError(errorMessage);
            addToast({
                title: 'Error',
                description: errorMessage,
                color: 'danger',
                timeout: 4000,
                shouldShowTimeoutProgress: true,
            });
        } finally {
            setIsResetLoading(false);
        }
    };

    const handleCodeDigitChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) {
            return;
        }
        const nextDigits = [...verificationDigits];
        nextDigits[index] = value;
        setVerificationDigits(nextDigits);

        if (value && index < codeInputRefs.current.length - 1) {
            codeInputRefs.current[index + 1]?.focus();
        }
        if (!value && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && !verificationDigits[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
        if (event.key === 'ArrowLeft' && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
        if (event.key === 'ArrowRight' && index < codeInputRefs.current.length - 1) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const paste = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!paste) return;
        const digits = Array(6)
            .fill('')
            .map((_, idx) => paste[idx] ?? '');
        setVerificationDigits(digits);
        if (paste.length === 6) {
            setTimeout(() => {
                codeInputRefs.current[5]?.focus();
            }, 0);
        }
    };

    const handleVerifyCode = () => {
        const inputCode = verificationDigits.join('');
        if (inputCode.length < 6) {
            setResetError('Completa el código de verificación.');
            return;
        }
        if (inputCode !== generatedCode) {
            setResetError('El código ingresado no es correcto.');
            return;
        }
        setResetError('');
        setResetStep('password');
    };

    const handleUpdatePassword = async () => {
        setResetError('');

        if (!newPasswordValue || newPasswordValue.length < 8) {
            setResetError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (newPasswordValue !== confirmPasswordValue) {
            setResetError('Las contraseñas no coinciden.');
            return;
        }
        if (!resetUsername.trim()) {
            setResetError('Ocurrió un problema al actualizar la contraseña. Inténtalo nuevamente.');
            return;
        }

        // Validar que la contraseña no sea igual al usuario
        if (newPasswordValue === resetUsername.trim()) {
            setResetError('La contraseña no puede ser igual al usuario.');
            return;
        }

        setIsResetLoading(true);
        try {
            // Usar el username en lugar del userId para el API
            await updateUserPassword(resetUsername.trim(), newPasswordValue);
            addToast({
                title: 'Contraseña actualizada',
                description: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
                color: 'success',
                timeout: 3500,
                shouldShowTimeoutProgress: true,
            });
            onOpenChange();
            resetRecoveryFlow();
        } catch (error) {
            console.error('Error al actualizar la contraseña', error);
            const errorMessage = error instanceof Error ? error.message : 'No se pudo actualizar la contraseña. Inténtalo nuevamente.';
            setResetError(errorMessage);
            addToast({
                title: 'Error al actualizar contraseña',
                description: errorMessage,
                color: 'danger',
                timeout: 4000,
                shouldShowTimeoutProgress: true,
            });
        } finally {
            setIsResetLoading(false);
        }
    };

    const handleResetBack = () => {
        if (resetStep === 'code') {
            setResetStep('username');
            setVerificationDigits(Array(6).fill(''));
            setGeneratedCode('');
        } else if (resetStep === 'password') {
            setResetStep('code');
            setNewPasswordValue('');
            setConfirmPasswordValue('');
        }
        setResetError('');
    };

    const isCodeComplete = verificationDigits.every((digit) => digit.length === 1);

    return (
        <section className="px-8">
            <ToastProvider placement={toastPlacement} toastOffset={toastPlacement.includes("top") ? 60 : 0}/>
            <div className="container mx-auto h-screen grid place-items-center">
                <Card className="md:px-24 md:py-14 py-8 border border-gray-300">
                    <div className="absolute top-0 left-0 w-16 h-16 bg-rojo clip-triangle"></div>
                    <CardHeader className="text-center">
                        <div className="flex flex-col items-center">
                            <h1 className="mb-4 text-3xl lg:text-4xl text-azul dark:text-white font-semibold">
                                Bienvenido al Portal de Proveedores
                            </h1>
                            <h4 className="text-gray-600 dark:text-gray-400 text-sm text-[18px] font-medium max-w-lg mx-auto">
                                VISTONY cuenta con más de 30 años de trayectoria en el mercado
                                de lubricación a nivel nacional e internacional.
                            </h4>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="flex w-full flex-col items-center">
                            <Tabs
                                aria-label="Dynamic tabs"
                                items={tabs}
                                selectedKey={activeTab}
                                onSelectionChange={(key) =>
                                    setActiveTab(key as "proveedor" | "corporativo")
                                }
                            >
                                {(item) => (
                                    <Tab key={item.id} title={item.label}></Tab>
                                )}
                            </Tabs>
                        </div>
                        <form
                            onSubmit={handleLogin}
                            className="flex flex-col gap-4 md:mt-1"
                        >
                            {formError && (
                                <Alert
                                    color="danger"
                                    variant="flat"
                                    description={formError}
                                />
                            )}
                            <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                                <Input
                                    size="md"
                                    value={username}
                                    onValueChange={(value) => setUsername(value)}
                                    label="Usuario"
                                    placeholder="Ej. jefe_compras_01"
                                    labelPlacement="outside"
                                    type="text"
                                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                                />
                                <Input
                                    value={password}
                                    onValueChange={(value) => setPassword(value)}
                                    size="md"
                                    label="Contraseña"
                                    type={isVisible ? "text" : "password"}
                                    name="password"
                                    labelPlacement="outside"
                                    endContent={
                                        <button
                                            type="button"
                                            onClick={toggleVisibility}
                                        >
                                            {isVisible ? (
                                                <EyeSlashFilledIcon
                                                    className="text-2xl text-default-400 pointer-events-none"/>
                                            ) : (
                                                <EyeFilledIcon
                                                    className="text-2xl text-default-400 pointer-events-none"/>
                                            )}
                                        </button>
                                    }
                                />
                            </div>
                            <Button
                                isLoading={isLoading}
                                type="submit"
                                variant="solid"
                                size="lg"
                                className="bg-gris text-white dark:bg-azul"
                                fullWidth
                                isDisabled={isLoading}
                            >
                                INGRESAR
                            </Button>
                            <Button
                                    isDisabled={isLoading}
                                    onPress={() => handleBackdropChange("opaque")}
                                variant="bordered"
                                size="lg"
                                className="flex h-12 border-blue-gray-200 items-center justify-center gap-2"
                                fullWidth
                            >
                                Recuperar Contraseña
                            </Button>
                            <h6 className="text-center mx-auto max-w-[19rem] text-sm font-medium text-gray-600 dark:text-gray-400">
                                Al iniciar sesión, usted acepta cumplir con nuestros{" "}
                                <a href="#" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-600 transition-colors">
                                    Terminos de Servicio
                                </a>{" "}
                                &{" "}
                                <a href="#" className="text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-600 transition-colors">
                                    Politica de privacidad.
                                </a>
                            </h6>
                        </form>
                    </CardBody>
                </Card>
            </div>


            <Drawer backdrop={backdrop} isOpen={isOpen} onOpenChange={onOpenChange} placement="right" size="md">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">Recuperar Contraseña</DrawerHeader>
                            <DrawerBody>
                                {resetStep === 'username' && (
                                    <div className="space-y-12">
                                        <Alert
                                            color="primary"
                                            variant="flat"
                                            title="Recupera tu acceso"
                                            description="Ingresa tu usuario (RUC) y te enviaremos un código de verificación al correo registrado."
                                        />
                                        <Input
                                            label="Usuario (RUC)"
                                            placeholder="20100000001"
                                            labelPlacement="outside"
                                            value={resetUsername}
                                            onValueChange={setResetUsername}
                                            variant="bordered"
                                            isDisabled={isResetLoading}
                                        />
                                    </div>
                                )}
                                {resetStep === 'code' && (
                                    <div className="space-y-4">
                                        <Alert
                                            color="primary"
                                            variant="flat"
                                            description={`Ingresa el código de 6 dígitos enviado a ${resetUser?.email ?? 'tu correo registrado'}.`}
                                        />
                                        <div className="flex justify-center gap-2">
                                            {verificationDigits.map((digit, index) => (
                                                <Input
                                                    key={index}
                                                    ref={(el) => {
                                                        codeInputRefs.current[index] = el;
                                                    }}
                                                    value={digit}
                                                    onValueChange={(value) => handleCodeDigitChange(index, value)}
                                                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                                                    onPaste={handleCodePaste}
                                                    maxLength={1}
                                                    className="w-12 text-center"
                                                    variant="bordered"
                                                    size="lg"
                                                    inputMode="numeric"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {resetStep === 'password' && (
                                    <div className="space-y-4">
                                        <Alert
                                            color="primary"
                                            variant="flat"
                                            description="Ingresa tu nueva contraseña y confírmala para completar la recuperación."
                                        />
                                        <Input
                                            label="Nueva contraseña"
                                            type="password"
                                            variant="bordered"
                                            value={newPasswordValue}
                                            onValueChange={setNewPasswordValue}
                                            isDisabled={isResetLoading}
                                        />
                                        <Input
                                            label="Confirmar contraseña"
                                            type="password"
                                            variant="bordered"
                                            value={confirmPasswordValue}
                                            onValueChange={setConfirmPasswordValue}
                                            isDisabled={isResetLoading}
                                        />
                                        {resetError && (
                                            <Alert
                                                color="danger"
                                                variant="flat"
                                                className="mt-4"
                                                description={resetError}
                                            />
                                        )}
                                    </div>
                                )}
                                {resetError && (
                                    <div className="space-y-4">
                                        <Alert
                                            color="danger"
                                            variant="flat"
                                            className="mt-4"
                                            description={resetError}
                                        />
                                    </div>
                                )}

                            </DrawerBody>
                            <DrawerFooter>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={() => {
                                        onClose();
                                        resetRecoveryFlow();
                                    }}
                                    isDisabled={isResetLoading}
                                >
                                    Cancelar
                                </Button>
                                {resetStep === 'username' && (
                                    <Button
                                        color="primary"
                                        isLoading={isResetLoading}
                                        onPress={handleSendRecoveryCode}
                                    >
                                        Enviar código
                                    </Button>
                                )}
                                {resetStep === 'code' && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="flat"
                                            onPress={handleResetBack}
                                            isDisabled={isResetLoading}
                                        >
                                            Volver
                                        </Button>
                                        <Button
                                            color="primary"
                                            isDisabled={!isCodeComplete || isResetLoading}
                                            isLoading={isResetLoading}
                                            onPress={handleVerifyCode}
                                        >
                                            Validar código
                                        </Button>
                                    </div>
                                )}
                                {resetStep === 'password' && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="flat"
                                            onPress={handleResetBack}
                                            isDisabled={isResetLoading}
                                        >
                                            Volver
                                        </Button>
                                        <Button
                                            color="primary"
                                            isDisabled={isResetLoading}
                                            isLoading={isResetLoading}
                                            onPress={handleUpdatePassword}
                                        >
                                            Confirmar
                                        </Button>
                                    </div>
                                )}
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>


        </section>
    );
};

export default Login;
