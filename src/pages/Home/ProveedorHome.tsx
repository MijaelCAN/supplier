import {useEffect, useState} from 'react';
import {
    Button,
    Card,
    CardBody,
    Tabs,
    Tab,
    Chip,
    Switch,
    Alert,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Divider
} from "@heroui/react";
import {
    DocumentTextIcon,
    ShoppingCartIcon,
    BanknotesIcon,
    StarIcon,
    CalendarIcon,
    ArrowRightIcon,
    PencilIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    MapPinIcon,
    UserIcon,
    BuildingLibraryIcon,
    ExclamationTriangleIcon,
    EyeIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import {useAuth} from '@/store/authStore';
import {useSuppliers} from '@/store';
import {useNavigate} from 'react-router-dom';
import {fetchSupplierByCardCode, convertApiSupplierToStoreSupplier} from "@/services/providers/providersApi.ts";
import {LoadingSpinner} from "@/components/LoadingSpinner.tsx";
import {Avatar} from "@heroui/react";
import {PersonaTypeCode, DocumentTypeCode} from "@/pages/Proveedores/Profile/CardProfile.tsx";
import {getCondicionPagoDescripcion} from '@/services/maestros/condicionesPagoApi';

const ProveedorHome = () => {
    const {currentUser} = useAuth();
    const {selectedSupplier, setSelectedSupplier} = useSuppliers();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [apiSupplierData, setApiSupplierData] = useState<any>(null);
    const [condicionPagoDescripcion, setCondicionPagoDescripcion] = useState<string | null>(null);

    useEffect(() => {
        const loadSupplier = async () => {
            try {
                setIsLoading(true);
                if (currentUser?.userCode) {
                    const result = await fetchSupplierByCardCode(currentUser.userCode);
                    if (result?.supplier) {
                        // Guardar los datos raw de la API para mostrar toda la información
                        setApiSupplierData(result.record);
                        // Guardar el Supplier reducido en el store para compatibilidad
                        const storeSupplier = convertApiSupplierToStoreSupplier(result.supplier);
                        setSelectedSupplier(storeSupplier || null);
                    }
                }
            } catch (e) {
                console.error("Error en la peticion de Dashborad Proveedor", e);
            } finally {
                setIsLoading(false);
            }
        }

        if (currentUser?.userCode) {
            loadSupplier();
        } else {
            setIsLoading(false);
        }

    }, [currentUser?.userCode, setSelectedSupplier]);

    // Cargar descripción de condición de pago
    useEffect(() => {
        const loadCondicionPago = async () => {
            if (apiSupplierData?.CondicionPago && apiSupplierData.CondicionPago !== '-1') {
                try {
                    const descripcion = await getCondicionPagoDescripcion(apiSupplierData.CondicionPago);
                    setCondicionPagoDescripcion(descripcion || null);
                } catch (error) {
                    console.error('Error al cargar descripción de condición de pago:', error);
                    setCondicionPagoDescripcion(null);
                }
            } else {
                setCondicionPagoDescripcion(null);
            }
        };
        loadCondicionPago();
    }, [apiSupplierData?.CondicionPago]);

    // Funciones de conversión de códigos a valores legibles
    const getPersonTypeLabel = (code: string): string => {
        const personTypeMap: Record<string, string> = {
            [PersonaTypeCode.JURIDICA]: 'Persona Jurídica',
            [PersonaTypeCode.NATURAL]: 'Persona Natural',
            [PersonaTypeCode.NO_DOMICILIADO]: 'No Domiciliado',
            [PersonaTypeCode.ADQUIRIENTE_TICKET]: 'Adquiriente Ticket'
        };
        return personTypeMap[code] || code;
    };

    const getDocumentTypeLabel = (code: string): string => {
        const documentTypeMap: Record<string, string> = {
            [DocumentTypeCode.DNI]: 'DNI',
            [DocumentTypeCode.CARNET_EXTRANJERIA]: 'Carnet de Extranjería',
            [DocumentTypeCode.RUC]: 'RUC',
            [DocumentTypeCode.PASAPORTE]: 'Pasaporte',
            [DocumentTypeCode.CEDULA_DIPLOMATICA]: 'Cédula Diplomática',
            [DocumentTypeCode.DOC_IDENT_PAIS_RESIDENCIA]: 'Doc. Ident. País Residencia',
            [DocumentTypeCode.TAX_IDENTIFICATION_NUMBER]: 'Tax Identification Number',
            [DocumentTypeCode.IDENTIFICATION_NUMBER]: 'Identification Number',
            [DocumentTypeCode.TARJETA_ANDINA_MIGRACION]: 'Tarjeta Andina Migración',
            [DocumentTypeCode.PERMISO_TEMPORAL_PERMANENCIA]: 'Permiso Temporal Permanencia',
            [DocumentTypeCode.SALVOCONDUCTO]: 'Salvoconducto'
        };
        return documentTypeMap[code] || code;
    };

    if (isLoading) {
        return (
            <Dashboard>
                <LoadingSpinner message="Cargando datos del proveedor..."/>
            </Dashboard>
        );
    }

    if (!selectedSupplier) {
        return (
            <Dashboard>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <div
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gris/10 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-12 w-12 text-gris"/>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No se encontraron
                            datos</h2>
                        <p className="text-gray-600 dark:text-gray-400">Usuario: {currentUser?.userCode}</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const supplierData = selectedSupplier;
    const realStats = {
        totalOrders: supplierData?.totalOrders || 12,
        totalAmount: supplierData?.totalAmount || 0,
        rating: supplierData?.rating || 0,
        status: supplierData?.status || 'P',
    };


    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'A':
                return {
                    color: 'success' as const,
                    label: 'Activo',
                    bg: 'bg-green-500/20',
                    text: 'text-green-700 dark:text-green-400'
                };
            case 'P':
                return {
                    color: 'warning' as const,
                    label: 'Pendiente',
                    bg: 'bg-yellow-500/20',
                    text: 'text-yellow-700 dark:text-yellow-400'
                };
            case 'I':
                return {
                    color: 'danger' as const,
                    label: 'Inactivo',
                    bg: 'bg-red-500/20',
                    text: 'text-red-700 dark:text-red-400'
                };
            default:
                return {
                    color: 'default' as const,
                    label: 'Desconocido',
                    bg: 'bg-gray-500/20',
                    text: 'text-gray-700 dark:text-gray-400'
                };
        }
    };
    const isPagosEnabled = false;
    const isAgendaEnabled = false;

    const statusConfig = getStatusConfig(realStats.status);

    return (
        <Dashboard>
            <div className="relative min-h-screen pb-8">
                {/* Background con imagen de tanques - Efecto glassmorphism */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 dark:opacity-10"
                        style={{backgroundImage: 'url(/tanques.webp)'}}
                    ></div>
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900"></div>
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(214,0,28,0.05),transparent_50%)]"></div>
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Hero Section - Flotante y moderno */}
                    <div className="relative mt-6">
                        <div
                            className="absolute -inset-4 bg-gradient-to-r from-rojo/10 via-azul/10 to-gris/10 rounded-3xl blur-2xl opacity-50"></div>
                        <div className=" ">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                <div className="relative">
                                    <div
                                        className="absolute -inset-2 bg-gradient-to-br from-rojo/20 to-azul/20 rounded-full blur-lg"></div>
                                    <Avatar
                                        src={supplierData?.avatar}
                                        name={supplierData?.cardName || ''}
                                        className="w-28 h-28 md:w-32 md:h-32 relative z-10 border-4 border-white dark:border-gray-800 shadow-xl"
                                    />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-2">
                                            ¡Bienvenido!
                                        </h1>
                                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                            {supplierData?.cardName}
                                        </h2>
                                        <p className="text-lg text-gray-600 dark:text-gray-400">{/*supplierData?.businessType*/}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} font-semibold text-sm backdrop-blur-sm`}>
                                            <CheckCircleIcon className="h-4 w-4"/>
                                            {statusConfig.label}
                                        </span>
                                        {realStats.rating > 0 && (
                                            <span
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-semibold text-sm backdrop-blur-sm">
                                                <StarIcon className="h-5 w-5 fill-yellow-500 text-yellow-500"/>
                                                {realStats.rating.toFixed(1)} / 5.0
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-rojo to-rojo/80 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    startContent={<PencilIcon className="h-5 w-5"/>}
                                    onPress={() => navigate('/proveedor/perfil')}
                                >
                                    Editar Perfil
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Accesos Directos - Compactos y Centrados */}
                    <div className="mt-8 mb-32">
                        <div className="flex justify-center">
                            <div className="w-full max-w-[60%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Compras */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-azul/50 dark:hover:border-azul/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/orden-compra')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-azul to-azul/80">
                                        <ShoppingCartIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Compras</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-azul group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Facturas */}
                                <div
                                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-rojo/50 dark:hover:border-rojo/50 cursor-pointer hover:shadow-lg transition-all duration-300"
                                    onClick={() => navigate('/factura')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-rojo to-rojo/80">
                                        <DocumentTextIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Facturas</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-rojo group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Pagos */}
                                <div
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-gris/50 dark:hover:border-gris/50 cursor-pointer hover:shadow-lg transition-all duration-300
                                    ${isPagosEnabled
                                        ? 'cursor-pointer hover:shadow-lg hover:border-gris/50 dark:hover:border-gris/50'
                                        : 'cursor-not-allowed pointer-events-none opacity-50'
                                    }`}
                                    onClick={() => navigate('/pagos')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-gris to-gris/80">
                                        <BanknotesIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Pagos</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-gris group-hover:translate-x-1 transition-all"/>
                                </div>

                                {/* Agenda */}
                                <div
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-rojo/50 dark:hover:border-rojo/50 cursor-pointer hover:shadow-lg transition-all duration-300
                                    ${isAgendaEnabled
                                        ? 'cursor-pointer hover:shadow-lg hover:border-rojo/50 dark:hover:border-rojo/50'
                                        : 'cursor-not-allowed pointer-events-none opacity-50'
                                    }`}
                                    onClick={() => navigate('/agenda')}
                                >
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-rojo to-rojo/80">
                                        <CalendarIcon className="h-5 w-5 text-white"/>
                                    </div>
                                    <span
                                        className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Agenda</span>
                                    <ArrowRightIcon
                                        className="h-4 w-4 text-gray-400 group-hover:text-rojo group-hover:translate-x-1 transition-all"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información del Proveedor - Card Flotante con Tabs */}
                    <div className="relative">
                        
                        {apiSupplierData ? (
                                <div className="w-[85%] mx-auto bg-transparent border-0 shadow-transparent  mt-10">
                                    <div className="px-16 py-16">
                                    <Tabs 
                                        aria-label="Información del proveedor"
                                        className="w-full mb-8"
                                        classNames={{
                                            tabList: "w-full justify-center gap-4",  // Esto centra los tabs
                                            cursor: "w-full",
                                            tab: "max-w-fit",  // Importante para que no se estiren
                                        }}
                                    >
                                        {/* Tab General */}
                                        <Tab 
                                            key="general" 
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <BuildingOfficeIcon className="h-4 w-4" />
                                                    <span>General</span>
                                                </div>
                                            }
                                        >
                                            <div className="mt-6 space-y-6">
                                                {/* Información Básica */}
                                                <div>
                                                    <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                        Información Básica
                                                    </h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo de Persona</p>
                                                            <p className="text-base font-bold text-gray-900 dark:text-white">
                                                                {apiSupplierData.TipoPersona ? getPersonTypeLabel(apiSupplierData.TipoPersona) : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo de Documento</p>
                                                            <p className="text-base font-bold text-gray-900 dark:text-white">
                                                                {apiSupplierData.TipoDocumento ? getDocumentTypeLabel(apiSupplierData.TipoDocumento) : 'N/A'}
                                                            </p>
                                                        </div>
                                                        {apiSupplierData.Moneda && apiSupplierData.Moneda !== '##' && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Moneda</p>
                                                                <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.Moneda}</p>
                                                            </div>
                                                        )}
                                                        {apiSupplierData.CondicionPago && apiSupplierData.CondicionPago !== '-1' && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Condición de Pago</p>
                                                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                                                    {condicionPagoDescripcion || apiSupplierData.CondicionPago}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Divider />

                                                {/* Información de Contacto */}
                                                <div>
                                                    <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                        Información de Contacto
                                                    </h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {apiSupplierData.Correo && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                                                                <a href={`mailto:${apiSupplierData.Correo}`} className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all">
                                                                    {apiSupplierData.Correo}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {apiSupplierData.Telefono1 && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Teléfono Principal</p>
                                                                <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.Telefono1}</p>
                                                            </div>
                                                        )}
                                                        {apiSupplierData.Telefono2 && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Teléfono Secundario</p>
                                                                <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.Telefono2}</p>
                                                            </div>
                                                        )}
                                                        {apiSupplierData.TelefonoMovil && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Móvil</p>
                                                                <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.TelefonoMovil}</p>
                                                            </div>
                                                        )}
                                                        {apiSupplierData.website && (
                                                            <div className="space-y-1 md:col-span-2">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sitio Web</p>
                                                                <a href={apiSupplierData.website} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all">
                                                                    {apiSupplierData.website}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Divider />

                                                {/* Información Tributaria */}
                                                {(apiSupplierData.agenteRetencion || apiSupplierData.agentePercepcion || apiSupplierData.exoPercepcion || apiSupplierData.goodContributor || apiSupplierData.statusContributer || apiSupplierData.statusDomicilio) && (
                                                    <div>
                                                        <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                            Información Tributaria
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {apiSupplierData.statusContributer && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado Contribuyente</p>
                                                                    <Chip size="sm" variant="flat" color="default">
                                                                        {apiSupplierData.statusContributer}
                                                                    </Chip>
                                                                </div>
                                                            )}
                                                            {apiSupplierData.statusDomicilio && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado Domicilio</p>
                                                                    <Chip size="sm" variant="flat" color="default">
                                                                        {apiSupplierData.statusDomicilio}
                                                                    </Chip>
                                                                </div>
                                                            )}
                                                            {apiSupplierData.agenteRetencion && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agente Retención</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch 
                                                                            isSelected={apiSupplierData.agenteRetencion === 'Y'}
                                                                            isDisabled
                                                                            size="sm"
                                                                        />
                                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                            {apiSupplierData.agenteRetencion === 'Y' ? 'Sí' : 'No'}
                                                                        </span>
                                                                    </div>
                                                                    {apiSupplierData.ResolucionAgenteRetencion && (
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                            {apiSupplierData.ResolucionAgenteRetencion}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {apiSupplierData.agentePercepcion && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agente Percepción</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch 
                                                                            isSelected={apiSupplierData.agentePercepcion === 'Y'}
                                                                            isDisabled
                                                                            size="sm"
                                                                        />
                                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                            {apiSupplierData.agentePercepcion === 'Y' ? 'Sí' : 'No'}
                                                                        </span>
                                                                    </div>
                                                                    {apiSupplierData.ResolucionAgentePercepcion && (
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                            {apiSupplierData.ResolucionAgentePercepcion}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {apiSupplierData.exoPercepcion && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Exonerado Percepción</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch 
                                                                            isSelected={apiSupplierData.exoPercepcion === 'Y'}
                                                                            isDisabled
                                                                            size="sm"
                                                                        />
                                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                            {apiSupplierData.exoPercepcion === 'Y' ? 'Sí' : 'No'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {apiSupplierData.goodContributor && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Buen Contribuyente</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch 
                                                                            isSelected={apiSupplierData.goodContributor === 'Y'}
                                                                            isDisabled
                                                                            size="sm"
                                                                        />
                                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                            {apiSupplierData.goodContributor === 'Y' ? 'Sí' : 'No'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fechas */}
                                                {(apiSupplierData.createDate || apiSupplierData.updateDate || apiSupplierData.approvalDate) && (
                                                    <>
                                                        <Divider />
                                                        <div>
                                                            <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                <CalendarIcon className="h-5 w-5 text-primary" />
                                                                Fechas Importantes
                                                            </h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {apiSupplierData.createDate && (
                                                                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Fecha de Creación</p>
                                                                        <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.createDate}</p>
                                                                    </div>
                                                                )}
                                                                {apiSupplierData.updateDate && (
                                                                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Última Actualización</p>
                                                                        <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.updateDate}</p>
                                                                    </div>
                                                                )}
                                                                {apiSupplierData.approvalDate && (
                                                                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Fecha de Aprobación</p>
                                                                        <p className="text-base font-bold text-gray-900 dark:text-white">{apiSupplierData.approvalDate}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </Tab>

                                        {/* Tab Direcciones */}
                                        <Tab 
                                            key="direcciones" 
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="h-4 w-4" />
                                                    <span>Direcciones</span>
                                                </div>
                                            }
                                        >
                                            <div className="mt-6 space-y-6">
                                                {apiSupplierData.DireccionSUNAT && (
                                                    <Alert
                                                        color="primary"
                                                        variant="faded"
                                                        title="Dirección SUNAT"

                                                    >
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                                                            {apiSupplierData.DireccionSUNAT}
                                                        </p>
                                                        {apiSupplierData.Ubigeo && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                Ubigeo: {apiSupplierData.Ubigeo}
                                                            </p>
                                                        )}
                                                    </Alert>
                                                )}

                                                {apiSupplierData.Direcciones && apiSupplierData.Direcciones.length > 0 ? (
                                                    <div>
                                                        <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Direcciones Registradas</h5>
                                                        <Table 
                                                            aria-label="Tabla de direcciones"
                                                            removeWrapper
                                                            classNames={{
                                                                th: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold",
                                                                td: "text-gray-900 dark:text-white"
                                                            }}
                                                        >
                                                            <TableHeader>
                                                                <TableColumn>TIPO</TableColumn>
                                                                <TableColumn>DIRECCIÓN</TableColumn>
                                                                <TableColumn>UBICACIÓN</TableColumn>
                                                                <TableColumn>UBIGEO</TableColumn>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {apiSupplierData.Direcciones.map((dir: any, idx: number) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell>
                                                                            <Chip size="sm" variant="flat" color="primary">
                                                                                {dir.CodDireccion || `Dirección ${idx + 1}`}
                                                                            </Chip>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <p className="font-semibold">{dir.Direccion || 'N/A'}</p>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                                {[dir.Departamento, dir.Provincia, dir.Distrito].filter(Boolean).join(', ') || 'N/A'}
                                                                            </p>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                                                {dir.Ubigeo || 'N/A'}
                                                                            </code>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <Alert
                                                        color="default"
                                                        variant="flat"
                                                        title="No hay direcciones registradas"
                                                        startContent={<ExclamationTriangleIcon className="h-5 w-5" />}
                                                    />
                                                )}
                                            </div>
                                        </Tab>

                                        {/* Tab Contactos */}
                                        <Tab 
                                            key="contactos" 
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4" />
                                                    <span>Contactos</span>
                                                </div>
                                            }
                                        >
                                            <div className="mt-6">
                                                {apiSupplierData.Contactos && apiSupplierData.Contactos.length > 0 ? (
                                                    <Table 
                                                        aria-label="Tabla de contactos"
                                                        removeWrapper
                                                        classNames={{
                                                            th: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold",
                                                            td: "text-gray-900 dark:text-white"
                                                        }}
                                                    >
                                                        <TableHeader>
                                                            <TableColumn>NOMBRE</TableColumn>
                                                            <TableColumn>CARGO</TableColumn>
                                                            <TableColumn>EMAIL</TableColumn>
                                                            <TableColumn>TELÉFONO</TableColumn>
                                                            <TableColumn>ESTADO</TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {apiSupplierData.Contactos.map((contacto: any, idx: number) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                                                <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                            </div>
                                                                            <p className="font-semibold">{contacto.Name || 'N/A'}</p>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <p className="text-sm">{contacto.Profesion || '-'}</p>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {contacto.E_MailL ? (
                                                                            <a href={`mailto:${contacto.E_MailL}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                                                                                {contacto.E_MailL}
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-sm text-gray-400">-</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <p className="text-sm">{contacto.Telefono || '-'}</p>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Chip 
                                                                            size="sm" 
                                                                            variant="flat"
                                                                            color={contacto.Active === 'Y' ? 'success' : 'default'}
                                                                        >
                                                                            {contacto.Active === 'Y' ? 'Activo' : 'Inactivo'}
                                                                        </Chip>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <Alert
                                                        color="default"
                                                        variant="flat"
                                                        title="No hay contactos registrados"
                                                        startContent={<ExclamationTriangleIcon className="h-5 w-5" />}
                                                    />
                                                )}
                                            </div>
                                        </Tab>

                                        {/* Tab Bancos */}
                                        <Tab 
                                            key="bancos" 
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <BuildingLibraryIcon className="h-4 w-4" />
                                                    <span>Bancos</span>
                                                </div>
                                            }
                                        >
                                            <div className="mt-6">
                                                {apiSupplierData.Bancos && apiSupplierData.Bancos.length > 0 ? (
                                                    <Table 
                                                        aria-label="Tabla de bancos"
                                                        removeWrapper
                                                        classNames={{
                                                            th: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold",
                                                            td: "text-gray-900 dark:text-white"
                                                        }}
                                                    >
                                                        <TableHeader>
                                                            <TableColumn>BANCO</TableColumn>
                                                            <TableColumn>CUENTA</TableColumn>
                                                            <TableColumn>SECTORISTA</TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {apiSupplierData.Bancos.map((banco: any, idx: number) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                                                <BuildingLibraryIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                            </div>
                                                                            <p className="font-semibold">{banco.Banco || 'N/A'}</p>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                                                                            {banco.Cuenta || 'N/A'}
                                                                        </code>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <p className="text-sm">{banco.Sectorista || '-'}</p>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <Alert
                                                        color="default"
                                                        variant="flat"
                                                        title="No hay bancos registrados"
                                                        startContent={<ExclamationTriangleIcon className="h-5 w-5" />}
                                                    />
                                                )}
                                            </div>
                                        </Tab>

                                        {/* Tab Documentos */}
                                        <Tab 
                                            key="documentos" 
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    <span>Documentos</span>
                                                </div>
                                            }
                                        >
                                            <div className="mt-6 space-y-6">
                                                {apiSupplierData.DocumentoEvaluacion && apiSupplierData.DocumentoEvaluacion.length > 0 ? (
                                                    <>
                                                        <div>
                                                            <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Documentos de Evaluación</h5>
                                                            <Table 
                                                                aria-label="Tabla de documentos"
                                                                removeWrapper
                                                                classNames={{
                                                                    th: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold",
                                                                    td: "text-gray-900 dark:text-white"
                                                                }}
                                                            >
                                                                <TableHeader>
                                                                    <TableColumn>DOCUMENTO</TableColumn>
                                                                    <TableColumn>ESTADO</TableColumn>
                                                                    <TableColumn>TIPO</TableColumn>
                                                                    <TableColumn>ACCIÓN</TableColumn>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {apiSupplierData.DocumentoEvaluacion.map((doc: any, idx: number) => (
                                                                        <TableRow key={idx}>
                                                                            <TableCell>
                                                                                <div className="flex items-center gap-2">
                                                                                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                                                                    <div>
                                                                                        <p className="font-semibold">{doc.U_NombDocu || 'Sin nombre'}</p>
                                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                            {doc.U_DocumentoEvaluacion || 'N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Chip 
                                                                                    size="sm" 
                                                                                    variant="flat"
                                                                                    color={
                                                                                        doc.U_Status === 'Aprobado' ? 'success' : 
                                                                                        doc.U_Status === 'Pendiente' ? 'warning' : 
                                                                                        doc.U_Status === 'Observado' ? 'danger' : 'default'
                                                                                    }
                                                                                >
                                                                                    {doc.U_Status || 'Pendiente'}
                                                                                </Chip>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Chip size="sm" variant="flat" color="default">
                                                                                    {doc.U_typeArchiv || 'N/A'}
                                                                                </Chip>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {doc.U_LinkDocumento && (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="flat"
                                                                                        color="primary"
                                                                                        startContent={<EyeIcon className="h-4 w-4" />}
                                                                                        onPress={() => window.open(doc.U_LinkDocumento.trim(), '_blank')}
                                                                                    >
                                                                                        Ver
                                                                                    </Button>
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>

                                                        {apiSupplierData.ReferenciasComerciales && apiSupplierData.ReferenciasComerciales.length > 0 && (
                                                            <>
                                                                <Divider />
                                                                <div>
                                                                    <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Referencias Comerciales</h5>
                                                                    <Table 
                                                                        aria-label="Tabla de referencias comerciales"
                                                                        removeWrapper
                                                                        classNames={{
                                                                            th: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold",
                                                                            td: "text-gray-900 dark:text-white"
                                                                        }}
                                                                    >
                                                                        <TableHeader>
                                                                            <TableColumn>RAZÓN SOCIAL</TableColumn>
                                                                            <TableColumn>CONTACTO</TableColumn>
                                                                            <TableColumn>TELÉFONO</TableColumn>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {apiSupplierData.ReferenciasComerciales.map((ref: any, idx: number) => (
                                                                                <TableRow key={idx}>
                                                                                    <TableCell>
                                                                                        <p className="font-semibold">{ref.U_RazonSocial || 'N/A'}</p>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <p className="text-sm">{ref.U_Contacto || '-'}</p>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <p className="text-sm">{ref.U_Telefonos || '-'}</p>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Alert
                                                        color="default"
                                                        variant="flat"
                                                        title="No hay documentos registrados"
                                                        startContent={<ExclamationTriangleIcon className="h-5 w-5" />}
                                                    />
                                                )}
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </div>
                            </div>
                        ) : (
                            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl shadow-2xl border border-white/40 dark:border-gray-700/40">
                                <CardBody>
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando información...</p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>

                        {/* Desempeño - Card flotante */}
                        {/*<div className="lg:col-span-3 relative">
                            <div className="sticky top-16">
                                <div className="absolute -inset-1 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl blur opacity-50"></div>
                                <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/30 dark:border-gray-700/30">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                                            <StarIcon className="h-6 w-6 text-white fill-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Desempeño</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Calificación</span>
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {realStats.rating > 0 ? `${realStats.rating.toFixed(1)}/5.0` : 'N/A'}
                                                </span>
                                            </div>
                                            {realStats.rating > 0 ? (
                                                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                                                        style={{ width: `${(realStats.rating / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                            ) : (
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Órdenes</span>
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">{realStats.totalOrders}</span>
                                            </div>
                                            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                {realStats.totalOrders > 0 && (
                                                    <div 
                                                        className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                        style={{ width: '100%' }}
                                                    ></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Próximamente</p>
                                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                <p className="italic">Entregas a tiempo</p>
                                                <p className="italic">Calidad productos</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>*/}
                    </div>

                {/* Secciones de Actividad - Diseño fluido */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                </div>
            </div>
        </Dashboard>
    );
};

export default ProveedorHome;


