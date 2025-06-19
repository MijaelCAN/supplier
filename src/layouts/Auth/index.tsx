import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import {
    Accordion,
    addToast, Alert,
    Button,
    Card,
    CardBody,
    CardHeader, Checkbox,
    Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader,
    Listbox,
    ListboxItem,
    Tab,
    Tabs, ToastProvider, useDisclosure
} from "@heroui/react";
import {Input} from "@heroui/react";
import {EyeFilledIcon, EyeSlashFilledIcon, LockIcon, MailIcon} from "@/components/icons.tsx";
import {Link} from "@heroui/link";
import {Divider} from "@heroui/divider";


const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("proveedor");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSupplier, setIsSupplier] = useState(false)
    const [documentNumber, setDocumentNumber] = useState('');
    const navigate = useNavigate();

    const toggleVisibility = () => setIsVisible(!isVisible);

    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [backdrop, setBackdrop] = useState("opaque");

    const handleBackdropChange = (backdrop) => {
        setBackdrop(backdrop);
        onOpen();
    };

    const handleValueChange = (e) => {
        const value = e.target.value;
        if (value.length <= 11) {
            if (/^\d*$/.test(value)) {
                setDocumentNumber(value);
            }
        }
    };



    const handleRegister = () => {
        setPlacement("top-left")
        addToast({
            title: "Registro",
            description: "Se esta navegand a la seccion de registro de un Proveedor",
            timeout: 3000,
            color: "primary",
            shouldShowTimeoutProgress: true,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://192.168.254.27:8085/api/Login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    correo: email,
                    clave: password,
                }),
            });

            const result = await response.json();

            if (result.statusCode === 200 && result.data.length > 0) {
                const proveedor = result.data[0];

                // Guarda el token y los datos del proveedor en localStorage
                localStorage.setItem("token", proveedor.token);
                localStorage.setItem("supplier", JSON.stringify(proveedor));

                // Redirige al dashboard
                navigate("/dashboard");
            } else {
                addToast({
                    title: "Error de Login",
                    description: "Correo o contraseña incorrectos.",
                    timeout: 3000,
                    color: "danger",
                    shouldShowTimeoutProgress: true,
                });
            }
        } catch (error) {
            setError("Error en el servidor.");
            addToast({
                title: "Error del servidor",
                description: "No se pudo conectar al servidor.",
                timeout: 3000,
                color: "danger",
                shouldShowTimeoutProgress: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setEmail("");
        setPassword("");
        setIsLoading(false)
    },[activeTab])

    let tabs = [
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

    const [placement, setPlacement] = useState("bottom-right");

    return (
        <section className="px-8">
            <ToastProvider placement={placement} toastOffset={placement.includes("top") ? 60 : 0}/>
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
                            <Tabs aria-label="Dynamic tabs" items={tabs} selectedKey={activeTab} onSelectionChange={setActiveTab}>
                                {(item) => (
                                    <Tab key={item.id} title={item.label}></Tab>
                                )}
                            </Tabs>
                        </div>
                        <form
                            onSubmit={handleLogin}
                            className="flex flex-col gap-4 md:mt-1"
                        >
                            <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 md:gap-4">
                                <Input
                                    key="outside"
                                    size="md"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    label="Correo"
                                    labelPlacement="outside"
                                    type="email"
                                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                                />
                                <Input
                                    key="password"
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
                            <Button
                                isLoading={isLoading}
                                type="submit"
                                variant={"solid"}
                                size="lg"
                                className="bg-gris text-white dark:bg-azul" fullWidth
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
                                    {/*<img
                                        src={`https://www.material-tailwind.com/logos/logo-google.png`}
                                        alt="google"
                                        className="h-6 w-6"
                                    />{" "}*/}
                                    Registrarse
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
                            <DrawerHeader className="flex flex-col gap-1">Registro de Proveedor</DrawerHeader>
                            <DrawerBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="RUC"
                                        type="text"
                                        size="sm"
                                        labelPlacement="outside-left"
                                        isRequired
                                        className="flex-1"
                                        value={documentNumber}
                                        onChange={handleValueChange}
                                    />
                                    <Button
                                        color="danger"
                                        size="sm"
                                        className="bg-gris text-white dark:bg-azul"
                                        onPress={() => {
                                            handleRegister()
                                        }}
                                    >
                                        Consultar
                                    </Button>
                                </div>
                                <Divider className="mb-6 mt-6"/>

                                <Input
                                    label="Razon social"
                                    type="text"
                                    size="sm"
                                    labelPlacement="outside"
                                    placeholder="Rason social"
                                    isRequired
                                />
                                <Input
                                    type="text"
                                    size="sm"
                                    placeholder="Digite dirección"
                                    isRequired
                                />
                                <Input
                                    label="Persona de contacto"
                                    type="text"
                                    size="sm"
                                    labelPlacement="outside"
                                    placeholder="Digite"
                                    isRequired
                                />


                                <Input
                                    endContent={
                                        <MailIcon
                                            className="text-2xl text-default-400 pointer-events-none flex-shrink-0"/>
                                    }
                                    label="Email"
                                    placeholder="Enter your email"
                                    variant="bordered"
                                />

                                <Input
                                    endContent={
                                        <LockIcon
                                            className="text-2xl text-default-400 pointer-events-none flex-shrink-0"/>
                                    }
                                    label="Password"
                                    placeholder="Enter your password"
                                    type="password"
                                    variant="bordered"
                                />
                                <div className="flex py-2 px-1 justify-between">
                                    <Checkbox
                                        classNames={{
                                            label: "text-small",
                                        }}
                                    >
                                        Remember me
                                    </Checkbox>
                                    <Link color="primary" href="#" size="sm">
                                        Forgot password?
                                    </Link>
                                </div>
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