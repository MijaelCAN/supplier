import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    Select,
    SelectItem,
    Tab,
    Tabs,
    ToastProvider,
    useDisclosure,
} from "@heroui/react";
import { EyeFilledIcon, EyeSlashFilledIcon, MailIcon } from "@/components/icons.tsx";
import { Divider } from "@heroui/divider";
import { RoleType, useAuthStore } from "@/store/authStore";


const Login = () => {
    const navigate = useNavigate();

    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const authError = useAuthStore((state) => state.error);
    const clearError = useAuthStore((state) => state.clearError);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const currentUser = useAuthStore((state) => state.currentUser);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [roleType, setRoleType] = useState<RoleType>("provider");
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<"proveedor" | "corporativo">("proveedor");
    const [formError, setFormError] = useState("");

    const toggleVisibility = () => setIsVisible(!isVisible);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [backdrop, setBackdrop] = useState("opaque");

    const handleBackdropChange = (nextBackdrop: "opaque" | "blur") => {
        setBackdrop(nextBackdrop);
        onOpen();
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");
        clearError();

        if (!username.trim() || !password.trim()) {
            const message = "Los campos 'Usuario', 'Contraseña' y 'Tipo de Rol' son obligatorios.";
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

        const result = await login(username.trim().toLowerCase(), password, roleType);

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
            setFormError(result.message);
            addToast({
                title: "Error de autenticación",
                description: result.message,
                timeout: 3000,
                color: "danger",
                shouldShowTimeoutProgress: true,
            });
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
        setRoleType(activeTab === "proveedor" ? "provider" : "internal");
        setFormError("");
        clearError();
    }, [activeTab, clearError]);

    useEffect(() => {
        if (authError) {
            setFormError(authError);
        }
    }, [authError]);

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
                                    onChange={(e) => setUsername(e.target.value)}
                                    label="Usuario"
                                    placeholder="Ej. jefe_compras_01"
                                    labelPlacement="outside"
                                    type="text"
                                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                                />
                                <Input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                            <Select
                                selectedKeys={[roleType]}
                                onSelectionChange={(keys) =>
                                    setRoleType(Array.from(keys)[0] as RoleType)
                                }
                                label="Tipo de Rol"
                                labelPlacement="outside"
                            >
                                <SelectItem key="internal" value="internal">
                                    Usuario interno
                                </SelectItem>
                                <SelectItem key="provider" value="provider">
                                    Proveedor
                                </SelectItem>
                            </Select>
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


            <Drawer backdrop={backdrop} isOpen={isOpen} onOpenChange={onOpenChange} placement="right">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">Recuperar Contraseña</DrawerHeader>
                            <DrawerBody>
                                <Input
                                    endContent={
                                        <MailIcon
                                            className="text-2xl text-default-400 pointer-events-none flex-shrink-0"/>
                                    }
                                    label="Email"
                                    placeholder="Digite su correo"
                                    variant="bordered"
                                />

                                <Divider className="mb-6 mt-6"/>
                            </DrawerBody>
                            <DrawerFooter>
                                <Button color="danger" variant="flat" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                Sign in
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>


        </section>
    );
};

export default Login;
{/*
<div classNameName="flex min-h-screen items-center justify-center ">
                <div classNameName="w-full max-w-md bg-gray-100 p-8 rounded-lg shadow-lg">

                </div>
            </div>
*/
}
{/*<div classNameName="flex min-h-screen items-center justify-center ">
            <Card>
                <CardHeader classNameName="pb-0 pt-2 px-4 flex-col items-center">
                    <p classNameName="text-tiny uppercase font-bold">Bienvenido</p>
                    <small classNameName="text-default-500">Portal de proveedores</small>
                    <h1 classNameName="font-bold text-large">Iniciar Sesión</h1>
                </CardHeader>
                <CardBody>
                    <h2 classNameName="text-2xl font-bold text-center text-gris">Iniciar Sesión</h2>
                    <form onSubmit={handleLogin} classNameName="mt-6">
                        <div classNameName="mb-4">
                            <label classNameName="block text-gris">Correo Electrónico</label>
                            <input
                                type="email"
                                classNameName="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-azul"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div classNameName="mb-4">
                            <label classNameName="block text-gris">Contraseña</label>
                            <input
                                type="password"
                                classNameName="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-azul"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            classNameName="w-full py-2 bg-rojo text-white font-bold rounded-lg hover:bg-red-700"
                        >
                            Ingresar
                        </button>
                    </form>
                </CardBody>
            </Card>
        </div>*/
}