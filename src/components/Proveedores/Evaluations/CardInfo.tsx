import React from "react";
import {
    Card,
    // CardHeader,
    // CardBody,
    Button,
    // Image,
    // Input,
    // Select,
    // SelectItem,
    Chip
} from "@heroui/react";

interface ProveedorInfoProps {
    datosProveedor: {
        id: number;
        categoria: string;
        logo: string;
        nombre: string;
        ruc: string;
        contacto?: string;
        email?: string;
        telefono?: string;
    };
    tipoDocumento?: string;
}


const ProveedorInfo: React.FC<ProveedorInfoProps> = ({datosProveedor, tipoDocumento = "cotizacion"}) => {
    const tipoConfig = {
        evaluacion: {
            titulo: "Datos de la Evaluación",
            icono: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        cotizacion: {
            titulo: "Datos de la Cotización",
            icono: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>,
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
        },
        contrato: {
            titulo: "Datos del Contrato",
            icono: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200"
        }
    };

    const config = tipoConfig[tipoDocumento] || tipoConfig.evaluacion;

    return (
        <div>
            {/* Hero Section del Proveedor */}
            <Card className="w-full border-none shadow-2xl overflow-hidden" radius="none">
                <div className="relative">
                    {/* Imagen de fondo con overlay */}
                    <div className="relative h-48 md:h-48">
                        {/*<Image
                            radius="none"
                            alt="Proveedor background"
                            className="object-cover object-center w-full h-full"
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                        />*/}
                        {/* Servicios Médicos Integrales */}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                        {/* Elementos decorativos */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"></div>
                        <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/5 rounded-full backdrop-blur-sm"></div>
                    </div>

                    {/* Información del proveedor superpuesta */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {/* Avatar/Logo del proveedor */}
                                <div className="relative">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
                                        {datosProveedor?.logo ? (
                                            <img src={datosProveedor.logo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                                        ) : (
                                            <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2M7 21h2m-2 0H3m4 0V9a2 2 0 012-2h6a2 2 0 012 2v12M9 7V6a1 1 0 011-1h4a1 1 0 011 1v1" />
                                            </svg>
                                        )}
                                    </div>
                                    {/* Badge de verificación */}
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Info básica */}
                                <div className="text-white">
                                    <h1 className="text-2xl md:text-2xl font-bold mb-1">
                                        {/*datosProveedor?.nombre || "Nombre del Proveedor"*/}
                                        EVALUACION DE PROVEEDOR
                                    </h1>
                                    <p className="text-white/80 text-sm md:text-base mb-2">
                                        {datosProveedor?.nombre || "Categoría de Servicios"}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Chip size="sm" className="bg-white/20 backdrop-blur-sm text-white border border-white/30">
                                            ID: {datosProveedor?.id || "PROV-001"}
                                        </Chip>
                                        <Chip size="sm" className="bg-green-500/90 backdrop-blur-sm text-white">
                                            Activo
                                        </Chip>
                                    </div>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-2">
                                <Button
                                    size="md"
                                    className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-all"
                                    startContent={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    }
                                >
                                    Ver Perfil
                                </Button>
                                <Button
                                    size="md"
                                    className="bg-blue-600 hover:bg-blue-700 text-white transition-all"
                                    startContent={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    }
                                >
                                    Contactar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Card de información específica del documento */}
            {/*<Card className="shadow-lg border-0" radius="none">
                <CardHeader className={`${config.bgColor} ${config.borderColor} border-b-2 pb-6`}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${config.bgColor} ${config.color} shadow-sm`}>
                                {config.icono}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{config.titulo}</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Complete la información requerida para continuar
                                </p>
                            </div>
                        </div>

                        {/* Badge de estado *
                        <Chip
                            color="warning"
                            variant="flat"
                            startContent={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        >
                            En Proceso
                        </Chip>
                    </div>
                </CardHeader>

                <CardBody className="p-6">
                    <div className="space-y-6">
                        {/* Información del proveedor en resumen *
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 font-medium">RUC/NIT:</span>
                                    <p className="font-semibold text-gray-900">{datosProveedor?.ruc || "20123456789"}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-medium">Teléfono:</span>
                                    <p className="font-semibold text-gray-900">{datosProveedor?.telefono || "+51 999 888 777"}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-medium">Email:</span>
                                    <p className="font-semibold text-gray-900">{datosProveedor?.email || "contacto@proveedor.com"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Formulario dinámico según tipo *
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tipoDocumento === 'evaluacion' && (
                                <>
                                    <Input
                                        label="Período de Evaluación"
                                        placeholder="2024-Q1"
                                        isRequired
                                        description="Período que cubre esta evaluación"
                                        startContent={
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        }
                                    />
                                    <Input
                                        label="Fecha de Evaluación"
                                        type="date"
                                        isRequired
                                        description="Fecha en que se realiza la evaluación"
                                    />
                                    <Input
                                        label="Evaluador Responsable"
                                        isRequired
                                        placeholder="Nombre del evaluador"
                                        description="Persona responsable de la evaluación"
                                        startContent={
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        }
                                    />
                                </>
                            )}

                            {tipoDocumento === 'cotizacion' && (
                                <>
                                    <Input
                                        label="Número de Cotización"
                                        placeholder="COT-2024-001"
                                        isRequired
                                        description="Número único de identificación"
                                        startContent={
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                            </svg>
                                        }
                                    />
                                    <Input
                                        label="Fecha de Solicitud"
                                        type="date"
                                        isRequired
                                        description="Fecha de solicitud de cotización"
                                    />
                                    <Input
                                        label="Fecha de Vencimiento"
                                        type="date"
                                        isRequired
                                        description="Fecha límite de validez"
                                    />
                                    <Input
                                        label="Solicitante"
                                        isRequired
                                        placeholder="Nombre del solicitante"
                                        description="Persona que solicita la cotización"
                                        startContent={
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        }
                                    />
                                    <Select
                                        label="Moneda"
                                        isRequired
                                        placeholder="Seleccionar moneda"
                                        description="Moneda para la cotización"
                                    >
                                        <SelectItem key="pen" value="PEN">Soles (PEN)</SelectItem>
                                        <SelectItem key="usd" value="USD">Dólares (USD)</SelectItem>
                                        <SelectItem key="eur" value="EUR">Euros (EUR)</SelectItem>
                                    </Select>
                                    <Select
                                        label="Tipo de Servicio"
                                        isRequired
                                        placeholder="Seleccionar tipo"
                                        description="Categoría del servicio cotizado"
                                    >
                                        <SelectItem key="consultoria" value="consultoria">Consultoría</SelectItem>
                                        <SelectItem key="suministros" value="suministros">Suministros</SelectItem>
                                        <SelectItem key="servicios" value="servicios">Servicios</SelectItem>
                                    </Select>
                                </>
                            )}

                            {tipoDocumento === 'contrato' && (
                                <>
                                    <Input
                                        label="Número de Contrato"
                                        placeholder="CONT-2024-001"
                                        isRequired
                                        description="Número único del contrato"
                                        startContent={
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        }
                                    />
                                    <Input
                                        label="Fecha de Inicio"
                                        type="date"
                                        isRequired
                                        description="Fecha de inicio del contrato"
                                    />
                                    <Input
                                        label="Fecha de Fin"
                                        type="date"
                                        isRequired
                                        description="Fecha de finalización del contrato"
                                    />
                                    <Input
                                        label="Valor del Contrato"
                                        type="number"
                                        isRequired
                                        placeholder="0.00"
                                        description="Valor total del contrato"
                                        startContent={
                                            <span className="text-gray-400 text-sm">S/</span>
                                        }
                                    />
                                    <Select
                                        label="Estado del Contrato"
                                        isRequired
                                        placeholder="Seleccionar estado"
                                        description="Estado actual del contrato"
                                    >
                                        <SelectItem key="borrador" value="borrador">Borrador</SelectItem>
                                        <SelectItem key="revision" value="revision">En Revisión</SelectItem>
                                        <SelectItem key="activo" value="activo">Activo</SelectItem>
                                        <SelectItem key="finalizado" value="finalizado">Finalizado</SelectItem>
                                    </Select>
                                    <Input
                                        label="Responsable del Contrato"
                                        isRequired
                                        placeholder="Nombre del responsable"
                                        description="Persona responsable del seguimiento"
                                        startContent={
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        }
                                    />
                                </>
                            )}
                        </div>

                        {/* Botones de acción *
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button
                                color="default"
                                variant="bordered"
                                startContent={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                }
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="primary"
                                startContent={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                }
                            >
                                Guardar y Continuar
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>*/}
        </div>
    );
};

export default ProveedorInfo;

/*const ProveedorInfo: React.FC<ProveedorInfoProps> = ({datosProveedor}) => {
    return (
        <>
            <Card isFooterBlurred className="w-full border-none" radius="none">
                <Image
                    radius="none"
                    alt="Woman listing to music"
                    className="object-cover object-center"
                    width={1148}
                    height={200}
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"

                />

                <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                    <Button
                        className="text-tiny text-white bg-black/20"
                        color="default"
                        radius="lg"
                        size="sm"
                        variant="flat"
                    >
                        Ver Perfil
                    </Button>
                </CardFooter>
            </Card>
            <Card className="mb-6" radius="none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-6 h-6 text-green-500"/>
                        <h2 className="text-xl font-semibold">Datos de la Evaluación</h2>
                    </div>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input
                            label="Período"
                            placeholder="2024-Q1"
                            isRequired
                        />
                        <Input
                            label="Fecha de Evaluación"
                            type="date"
                            isRequired
                        />
                        <Input
                            label="Evaluador"
                            isRequired
                        />
                    </div>
                </CardBody>
            </Card>
        </>
    );
};

export default ProveedorInfo;*/

{/*<Card
            isBlurred
            className="border-none bg-background/60 dark:bg-default-100/50 max-w-[610px]"
            shadow="sm"
        >
            <CardHeader className="bg-blue-600 text-white p-6 rounded-t-lg flex items-center gap-3">
                <BuildingOfficeIcon className="w-7 h-7"/>
                <h2 className="text-2xl font-semibold">Información del Proveedor</h2>
            </CardHeader>

            <CardBody className="p-6 bg-white">
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

                    <div className="flex items-center gap-3">
                        <UserIcon className="w-6 h-6 text-blue-600 flex-shrink-0"/>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Nombre del Proveedor</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">{datosProveedor.nombre || "-"}</dd>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <IdentificationIcon className="w-6 h-6 text-blue-600 flex-shrink-0"/>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">RUC</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">{datosProveedor.ruc || "-"}</dd>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <UserIcon className="w-6 h-6 text-blue-600 flex-shrink-0"/>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Contacto Principal</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">{datosProveedor.contacto || "-"}</dd>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <EnvelopeIcon className="w-6 h-6 text-blue-600 flex-shrink-0"/>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                                {datosProveedor.email ? (
                                    <a href={`mailto:${datosProveedor.email}`}
                                       className="hover:underline text-blue-700">
                                        {datosProveedor.email}
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </dd>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <PhoneIcon className="w-6 h-6 text-blue-600 flex-shrink-0"/>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">{datosProveedor.telefono || "-"}</dd>
                        </div>
                    </div>
                </dl>
            </CardBody>
        </Card>*/}