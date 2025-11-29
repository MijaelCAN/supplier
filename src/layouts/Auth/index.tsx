import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {DrawerProps} from "@heroui/react";
import {
    addToast,
    Alert,
    Button,
    Card,
    CardBody,
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
import { useTheme } from "@heroui/use-theme";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/icons.tsx";
import { useAuthStore } from "@/store/authStore";
import { sendPasswordRecoveryCode } from "@/services/email/emailApi";
import {RoleType} from "@/services/auth/apiAuth.ts";


const Login = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === "dark";

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
        <section className="relative min-h-screen overflow-hidden px-4 md:px-8">
            <ToastProvider placement={toastPlacement} toastOffset={toastPlacement.includes("top") ? 60 : 0}/>
            
            {/* Fondo con imagen TANQUES */}
            <div className="absolute inset-0">
                {/* Imagen de fondo - usando archivo local */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url(/tanques.webp)'
                    }}
                ></div>
                
                {/* Overlay glassmorphism sutil - efecto espejo empañado */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20"></div>
            </div>

            {/* Contenido principal - Layout de dos columnas */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 lg:py-12">
                
                <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Columna izquierda - Logo e información (va segundo en móvil, primero en desktop) */}
                    <div className="flex flex-col items-center lg:items-start space-y-6 order-2 lg:order-1">
                        {/* Logo destacado - más grande */}
                        <div className="w-full flex justify-center lg:justify-start">
                            <img 
                                src="/logoVersiónPositivo.png"
                                alt="VISTO LINK - Portal de Proveedores"
                                className="w-full max-w-lg md:max-w-xl lg:max-w-2xl h-auto object-contain drop-shadow-2xl"
                            />
                        </div>
                        
                        {/* Información de VISTONY */}
                        <div className="w-full space-y-4 text-center lg:text-left">
                            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed font-light text-white">
                                VISTONY cuenta con más de 30 años de trayectoria en el mercado de lubricación a nivel nacional e internacional.
                            </p>
                            <div className="w-20 h-1 bg-rojo mx-auto lg:mx-0 shadow-lg shadow-rojo/50"></div>
                        </div>
                    </div>

                    {/* Columna derecha - Formulario de Login (va primero en móvil, segundo en desktop) */}
                    <div className="w-full order-1 lg:order-2">
                        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
                            <CardBody className="p-6 md:p-8">
                                <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">
                                    Iniciar Sesión
                                </h3>
                                
                                {/* Tabs centrados */}
                                <div className="flex w-full flex-col items-center mb-6">
                                    <Tabs
                                        aria-label="Tipo de usuario"
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

                                {/* Formulario */}
                                <form
                                    onSubmit={handleLogin}
                                    className="flex flex-col gap-4"
                                >
                                    {formError && (
                                        <Alert
                                            color="danger"
                                            variant="flat"
                                            description={formError}
                                            className="bg-red-500/20 border-2 border-red-500/50 text-white"
                                        />
                                    )}
                                    
                                    <div className="flex w-full flex-col gap-4">
                                        <Input
                                            size="md"
                                            value={username}
                                            onValueChange={(value) => setUsername(value)}
                                            label="Usuario"
                                            placeholder="Ingrese RUC"
                                            labelPlacement="outside"
                                            type="text"
                                            className=" w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200 "
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
                                                    className={isDark ? "text-white/70 hover:text-white transition-colors" : "text-gray-500 hover:text-gray-700 transition-colors"}
                                                >
                                                    {isVisible ? (
                                                        <EyeSlashFilledIcon className="text-2xl pointer-events-none"/>
                                                    ) : (
                                                        <EyeFilledIcon className="text-2xl pointer-events-none"/>
                                                    )}
                                                </button>
                                            }
                                        />
                                    </div>
                                    
                                    <Button
                                        isLoading={isLoading}
                                        type="submit"
                                        variant="solid"
                                        size="md"
                                        className="bg-red-800 text-white font-semibold hover:bg-gris/90 transition-all duration-200"
                                        fullWidth
                                        isDisabled={isLoading}
                                    >
                                        {isLoading ? "Ingresando..." : "INGRESAR"}
                                    </Button>
                                    
                                    <Button
                                        isDisabled={isLoading}
                                        onPress={() => handleBackdropChange("opaque")}
                                        variant="bordered"
                                        size="md"
                                        className=" hover:bg-white/10 hover:border-white/30 transition-all duration-200 text-white"
                                        fullWidth
                                    >
                                        Recuperar Contraseña
                                    </Button>
                                    
                                    <p className="text-white text-center text-sm mt-6 leading-relaxed">
                                        Al iniciar sesión, usted acepta cumplir con nuestros{" "}
                                        <a href="#" className="hover:text-rojo transition-colors underline font-medium ">
                                            Términos de Servicio
                                        </a>
                                        {" "}y{" "}
                                        <a href="#" className="hover:text-rojo transition-colors underline font-medium ">
                                            Política de Privacidad
                                        </a>
                                    </p>
                                </form>
                            </CardBody>
                        </Card>
                    </div>
                </div>

            </div>


            <Drawer backdrop={backdrop} isOpen={isOpen} onOpenChange={onOpenChange} placement="right" size="md">
                <DrawerContent className="bg-white/50 backdrop-blur-2xl border-l border-white/20">
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-2 border-b border-white/20 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-black">Recuperar Contraseña</h2>
                                        <p className="text-sm text-black/70">Sigue los pasos para restablecer tu acceso</p>
                                    </div>
                                </div>
                            </DrawerHeader>
                            <DrawerBody className="px-6 py-5 bg-transparent">
                                {resetStep === 'username' && (
                                    <div className="space-y-6 max-w-md mx-auto">
                                        <Alert
                                            color="primary"
                                            variant="solid"
                                            title="Recupera tu acceso"
                                            description="Ingresa tu usuario (RUC) y te enviaremos un código de verificación al correo registrado."
                                            className="bg-blue-500/20 border-2 border-blue-500/50 text-white"
                                        />
                                        <div className="space-y-4">
                                            <Input
                                                label="Usuario (RUC)"
                                                placeholder="20100000001"
                                                labelPlacement="inside"
                                                value={resetUsername}
                                                onValueChange={setResetUsername}
                                                isDisabled={isResetLoading}
                                                size="md"

                                            />
                                        </div>
                                    </div>
                                )}
                                {resetStep === 'code' && (
                                    <div className="space-y-6 max-w-md mx-auto">
                                        <Alert
                                            color="primary"
                                            variant="flat"
                                            description={`Ingresa el código de 6 dígitos enviado a ${resetUser?.email ?? 'tu correo registrado'}.`}
                                            className="bg-blue-500/20 border-2 border-blue-500/50 text-white"
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
                                                    className="w-12 h-12 text-center text-xl font-bold"
                                                    variant="bordered"
                                                    size="md"
                                                    inputMode="numeric"
                                                    classNames={{
                                                        input: "bg-white/10 text-white text-center text-xl font-bold",
                                                        inputWrapper: "bg-white/10 border-white/20 hover:border-white/40 focus-within:border-rojo",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {resetStep === 'password' && (
                                    <div className="space-y-6 max-w-md mx-auto">
                                        <Alert
                                            color="primary"
                                            variant="flat"
                                            description="Ingresa tu nueva contraseña y confírmala para completar la recuperación."
                                            className="bg-blue-500/20 border-2 border-blue-500/50 text-white"
                                        />
                                        <div className="space-y-4">
                                            <Input
                                                label="Nueva contraseña"
                                                type="password"
                                                variant="bordered"
                                                value={newPasswordValue}
                                                onValueChange={setNewPasswordValue}
                                                isDisabled={isResetLoading}
                                                size="md"
                                                classNames={{
                                                    label: "text-white font-medium mb-2",
                                                    input: "bg-white/10 text-white placeholder:text-white/50",
                                                    inputWrapper: "bg-white/10 border-white/20 hover:border-white/40 focus-within:border-rojo",
                                                }}
                                            />
                                            <Input
                                                label="Confirmar contraseña"
                                                type="password"
                                                variant="bordered"
                                                value={confirmPasswordValue}
                                                onValueChange={setConfirmPasswordValue}
                                                isDisabled={isResetLoading}
                                                size="md"
                                                classNames={{
                                                    label: "text-white font-medium mb-2",
                                                    input: "bg-white/10 text-white placeholder:text-white/50",
                                                    inputWrapper: "bg-white/10 border-white/20 hover:border-white/40 focus-within:border-rojo",
                                                }}
                                            />
                                        </div>
                                        {resetError && (
                                            <Alert
                                                color="danger"
                                                variant="flat"
                                                description={resetError}
                                                className="bg-red-500/20 border-2 border-red-500/50 text-white"
                                            />
                                        )}
                                    </div>
                                )}
                                {resetError && resetStep !== 'password' && (
                                    <div className="space-y-4 max-w-md mx-auto">
                                        <Alert
                                            color="danger"
                                            variant="flat"
                                            description={resetError}
                                            className="bg-red-500/20 border-2 border-red-500/50 text-white"
                                        />
                                    </div>
                                )}

                            </DrawerBody>
                            <DrawerFooter className="px-6 py-5 border-t border-white/20 bg-transparent">
                                <div className="flex gap-3 w-full max-w-md mx-auto">
                                    <Button
                                        color="danger"
                                        variant="flat"
                                        onPress={() => {
                                            onClose();
                                            resetRecoveryFlow();
                                        }}
                                        isDisabled={isResetLoading}
                                        size="md"
                                        className="text-white border-white/20 hover:bg-red-500/20 hover:border-red-500/50"
                                    >
                                        Cancelar
                                    </Button>
                                    {resetStep === 'username' && (
                                        <Button
                                            color="primary"
                                            isLoading={isResetLoading}
                                            onPress={handleSendRecoveryCode}
                                            size="md"
                                            className="bg-red-800 text-white hover:bg-red-800/90 font-semibold"
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
                                                size="md"
                                                className="text-white border-white/20 hover:bg-white/10 hover:border-white/30"
                                            >
                                                Volver
                                            </Button>
                                            <Button
                                                color="primary"
                                                isDisabled={!isCodeComplete || isResetLoading}
                                                isLoading={isResetLoading}
                                                onPress={handleVerifyCode}
                                                size="md"
                                                className="bg-red-800 text-white hover:bg-red-800/90 font-semibold"
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
                                                size="md"
                                                className="text-white border-white/20 hover:bg-white/10 hover:border-white/30"
                                            >
                                                Volver
                                            </Button>
                                            <Button
                                                color="primary"
                                                isDisabled={isResetLoading}
                                                isLoading={isResetLoading}
                                                onPress={handleUpdatePassword}
                                                size="md"
                                                className="bg-red-800 text-white hover:bg-red-800/90 font-semibold"
                                            >
                                                Confirmar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>


        </section>
    );
};

export default Login;
