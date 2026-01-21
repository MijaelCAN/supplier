// src/pages/Agenda/AppointmentDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Chip,
    Card,
    CardBody,
    Avatar,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure
} from "@heroui/react";
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    TruckIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAgendaStore } from "@/store/agendaStore";
import { useAuth } from "@/store/authStore";
import { UserRole } from "@/routes/menuTypes";
import { fetchPackingListFromApi, PackingListApiRecord } from "@/services/agenda/packingListApi";
import { formatDateForAPI, fetchAppointmentsFromApi, AppointmentDocument } from "@/services/agenda/appointmentsApi";
import { DeliveryAppointment } from "@/store/types";

const AppointmentDetail: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const isProvider = currentUser?.role === UserRole.PROVEEDOR;
    const { setSelectedAppointment } = useAgendaStore(); // Solo usamos setSelectedAppointment, no el store local de appointments
    const [appointment, setAppointment] = useState<DeliveryAppointment | null>(null);
    const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
    const [appointmentDocuments, setAppointmentDocuments] = useState<AppointmentDocument[]>([]);

    // Cargar appointment SIEMPRE desde el API (no usar localStorage/store)
    useEffect(() => {
        const loadAppointmentFromApi = async () => {
            setIsLoadingAppointment(true);
            try {
                // Cargar appointments del API directamente (sin filtros para buscar por docEntry)
                const apiAppointments = await fetchAppointmentsFromApi();
                const foundApiAppointment = apiAppointments.find(
                    (apt) => apt.docEntry === appointmentId || apt.appointmentNumber === appointmentId
                );

                if (foundApiAppointment) {
                    setAppointment(foundApiAppointment);
                } else {
                    setAppointment(null);
                }
            } catch (error) {
                console.error('Error al cargar appointment desde API:', error);
                setAppointment(null);
            } finally {
                setIsLoadingAppointment(false);
            }
        };

        if (appointmentId) {
            loadAppointmentFromApi();
        }
    }, [appointmentId]);
    
    // Cargar documentos directamente del API (sin usar store)
    useEffect(() => {
        if (appointment?.docEntry) {
            const loadDocumentsFromApi = async () => {
                try {
                    const apiAppointments = await fetchAppointmentsFromApi();
                    const foundApiAppointment = apiAppointments.find(
                        (apt) => apt.docEntry === appointment.docEntry
                    );
                    if (foundApiAppointment && (foundApiAppointment as any).Documents) {
                        setAppointmentDocuments((foundApiAppointment as any).Documents || []);
                    } else {
                        // Si no se encuentra en el API, limpiar documentos
                        setAppointmentDocuments([]);
                    }
                } catch (error) {
                    console.error('Error al cargar documentos desde API:', error);
                    setAppointmentDocuments([]);
                }
            };
            loadDocumentsFromApi();
        } else {
            // Si no hay appointment, limpiar documentos
            setAppointmentDocuments([]);
        }
    }, [appointment?.docEntry]);

    // Estado para PackingList del API
    const [packingListsFromApi, setPackingListsFromApi] = useState<PackingListApiRecord[]>([]);
    const [isLoadingPackingLists, setIsLoadingPackingLists] = useState(false);
    const [selectedPackingList, setSelectedPackingList] = useState<PackingListApiRecord | null>(null);
    const { isOpen: isPackingListDetailOpen, onOpen: onPackingListDetailOpen, onClose: onPackingListDetailClose } = useDisclosure();
    
    // Estado para visualizar documentos
    const [selectedDocument, setSelectedDocument] = useState<{ name: string; url: string; type: string } | null>(null);
    const { isOpen: isDocumentViewerOpen, onOpen: onDocumentViewerOpen, onClose: onDocumentViewerClose } = useDisclosure();
    
    // Obtener todos los documentos disponibles (priorizar documentos del API, luego los mapeados)
    const getAllDocuments = (): Array<{ name: string; url: string; type: string }> => {
        // Si hay documentos del API, usarlos directamente
        if (appointmentDocuments.length > 0) {
            return appointmentDocuments.map(doc => ({
                name: doc.U_nameFile,
                url: doc.U_LinkDocumento,
                type: doc.U_nameFile.split('.').pop()?.toLowerCase() || 'unknown'
            }));
        }
        
        // Si no, usar los documentos mapeados
        if (!appointment?.documents) return [];
        const docs: Array<{ name: string; url: string; type: string }> = [];
        
        if (appointment.documents.invoice?.url) {
            docs.push({
                name: appointment.documents.invoice.name,
                url: appointment.documents.invoice.url,
                type: appointment.documents.invoice.type
            });
        }
        if (appointment.documents.purchaseOrder?.url) {
            docs.push({
                name: appointment.documents.purchaseOrder.name,
                url: appointment.documents.purchaseOrder.url,
                type: appointment.documents.purchaseOrder.type
            });
        }
        if (appointment.documents.deliveryGuide?.url) {
            docs.push({
                name: appointment.documents.deliveryGuide.name,
                url: appointment.documents.deliveryGuide.url,
                type: appointment.documents.deliveryGuide.type
            });
        }
        if (appointment.documents.cdr?.url) {
            docs.push({
                name: appointment.documents.cdr.name,
                url: appointment.documents.cdr.url,
                type: appointment.documents.cdr.type
            });
        }
        if (appointment.documents.xml?.url) {
            docs.push({
                name: appointment.documents.xml.name,
                url: appointment.documents.xml.url,
                type: appointment.documents.xml.type
            });
        }
        if (appointment.documents.otherDocuments) {
            appointment.documents.otherDocuments.forEach(doc => {
                if (doc.url) {
                    docs.push({
                        name: doc.name,
                        url: doc.url,
                        type: doc.type
                    });
                }
            });
        }
        return docs;
    };
    
    const handleDocumentClick = (doc: { name: string; url: string; type: string }) => {
        setSelectedDocument(doc);
        onDocumentViewerOpen();
    };

    // Cargar PackingList cuando se monta el componente
    useEffect(() => {
        if (appointment?.docEntry) {
            const loadPackingLists = async () => {
                setIsLoadingPackingLists(true);
                try {
                    // Obtener rango de fechas (últimos 30 días y próximos 30 días)
                    const today = new Date();
                    const startDate = new Date(today);
                    startDate.setDate(startDate.getDate() - 30);
                    const endDate = new Date(today);
                    endDate.setDate(endDate.getDate() + 30);
                    
                    const fechaInicio = formatDateForAPI(startDate);
                    const fechaFin = formatDateForAPI(endDate);
                    
                    // Cargar PackingList filtrados por CodCita
                    const packingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, appointment.docEntry);
                    setPackingListsFromApi(packingLists);
                } catch (error) {
                    console.error('Error al cargar PackingList:', error);
                    setPackingListsFromApi([]);
                } finally {
                    setIsLoadingPackingLists(false);
                }
            };
            
            loadPackingLists();
        } else {
            setPackingListsFromApi([]);
        }
    }, [appointment?.docEntry]);

    // Redirigir si no se encuentra el appointment después de cargar
    useEffect(() => {
        if (!isLoadingAppointment && !appointment) {
            const timer = setTimeout(() => {
                navigate('/agenda');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [appointment, isLoadingAppointment, navigate]);

    if (isLoadingAppointment || !appointment) {
        return (
            <Dashboard>
                <div className="p-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            {isLoadingAppointment ? 'Cargando información de la cita...' : 'No se encontró la cita solicitada'}
                        </p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    // Estados del proceso - basados en datos reales del API
    const processSteps = [
        {
            label: 'PackingList',
            icon: ClipboardDocumentListIcon,
            completed: packingListsFromApi.length > 0,
            active: packingListsFromApi.length === 0 && appointment.status === 'Pendiente',
        },
        {
            label: 'Transporte',
            icon: TruckIcon,
            completed: !!appointment.transportData, // Viene del API directamente
            active: packingListsFromApi.length > 0 && !appointment.transportData,
        },
        {
            label: 'Documentos',
            icon: DocumentTextIcon,
            completed: appointmentDocuments.length > 0 || appointment.documents?.completed, // Usar datos del API
            active: !!appointment.transportData && appointmentDocuments.length === 0 && !appointment.documents?.completed,
        },
    ];

    // Obtener color y estilo según el estado
    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: 'default' | 'primary' | 'success' | 'warning' | 'danger', bg: string, text: string }> = {
            'Pendiente': { 
                color: 'warning', 
                bg: 'bg-amber-50', 
                text: 'text-amber-700' 
            },
            'PackingListCompletado': { 
                color: 'primary', 
                bg: 'bg-blue-50', 
                text: 'text-blue-700' 
            },
            'TransporteCompletado': { 
                color: 'primary', 
                bg: 'bg-blue-50', 
                text: 'text-blue-700' 
            },
            'DocumentosCompletados': { 
                color: 'primary', 
                bg: 'bg-blue-50', 
                text: 'text-blue-700' 
            },
            'ListaParaEntrega': { 
                color: 'success', 
                bg: 'bg-emerald-50', 
                text: 'text-emerald-700' 
            },
            'Completada': { 
                color: 'success', 
                bg: 'bg-emerald-50', 
                text: 'text-emerald-700' 
            },
            'Cancelada': { 
                color: 'danger', 
                bg: 'bg-red-50', 
                text: 'text-red-700' 
            }
        };
        return configs[status] || { color: 'default' as const, bg: 'bg-gray-50', text: 'text-gray-700' };
    };

    const statusConfig = getStatusConfig(appointment.status);

    // Verificar permisos según rol
    const canManagePackingList = [UserRole.ADMIN, UserRole.COMPRAS, UserRole.ALMACEN].includes(currentUser?.role || UserRole.ADMIN);
    const canManageTransport = currentUser?.role === UserRole.PROVEEDOR;
    const canManageDocuments = currentUser?.role === UserRole.PROVEEDOR;

    const handleOpenPackingList = () => {
        setSelectedAppointment(appointment);
        navigate('/agenda', { state: { openPackingList: true } });
    };

    const handleOpenTransport = () => {
        setSelectedAppointment(appointment);
        navigate('/agenda', { state: { openTransport: true } });
    };

    const handleOpenDocuments = () => {
        setSelectedAppointment(appointment);
        navigate('/agenda', { state: { openDocuments: true } });
    };

    const handleEdit = () => {
        setSelectedAppointment(appointment);
        navigate('/agenda', { state: { openEdit: true } });
    };

    return (
        <Dashboard>
            <div className="py-6">
                {/* Header con botón de regreso */}
                <div className="mb-6">
                    <Button
                        variant="light"
                        startContent={<ArrowLeftIcon className="w-5 h-5" />}
                        onPress={() => navigate('/agenda')}
                        className="mb-4"
                    >
                        Volver a Agenda
                    </Button>

                    {/* Header Rediseñado */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        {/* Título y Estado con información compacta */}
                        <div className="flex items-start justify-between w-full gap-6">
                            {/* Columna Izquierda: Título e Información de Entrega */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <Avatar
                                        icon={<BuildingOfficeIcon className="w-6 h-6" />}
                                        classNames={{
                                            base: "bg-blue-100",
                                            icon: "text-blue-600"
                                        }}
                                        size="lg"
                                    />
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            {appointment.docEntry ? `Cita #${appointment.docEntry}` : `Cita #${appointment.appointmentNumber}`}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {appointment.supplierName}
                                        </p>
                                        {appointment.appointmentNumber && appointment.docEntry && (
                                            <p className="text-xs text-gray-400 my-1">
                                                Referencia: {appointment.appointmentNumber}
                                            </p>
                                        )}
                                        {/* Información de Entrega Compacta */}
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                            <div>
                                                <span className="text-xs text-gray-500">Fecha: </span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(appointment.deliveryDate).toLocaleDateString('es-PE', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Hora: </span>
                                                <span className="font-medium text-gray-900">
                                                    {appointment.deliveryTime}
                                                    {appointment.deliveryTimeEnd && ` - ${appointment.deliveryTimeEnd}`}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Almacén: </span>
                                                <span className="font-medium text-gray-900">
                                                    {appointment.warehouse || 'No especificado'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">RUC: </span>
                                                <span className="font-medium text-gray-900">{appointment.supplierRUC}</span>
                                            </div>
                                            {appointment.supplierEmail && (
                                                <div className="col-span-2">
                                                    <span className="text-xs text-gray-500">Contacto: </span>
                                                    <span className="font-medium text-gray-900">{appointment.supplierEmail}</span>
                                                    {appointment.supplierPhone && (
                                                        <span className="text-gray-600 ml-2">| {appointment.supplierPhone}</span>
                                                    )}
                                                </div>
                                            )}
                                            {appointment.notes && (
                                                <div className="col-span-2 pt-2 border-t border-gray-100">
                                                    <span className="text-xs text-gray-500">Notas: </span>
                                                    <span className="text-sm text-gray-700">{appointment.notes}</span>
                                                </div>
                                            )}
                                        </div> 
                                    </div>
                                </div>
                                
                                
                            </div>

                            {/* Columna Derecha: Estado y Datos del Transportista */}
                            <div className="flex-1">
                                <div className="flex justify-end mb-3">
                                    <Chip
                                        color={statusConfig.color}
                                        variant="flat"
                                        size="lg"
                                        startContent={
                                            appointment.status === 'Completada' ? (
                                                <CheckCircleIcon className="w-4 h-4" />
                                            ) : appointment.status === 'Cancelada' ? (
                                                <XCircleIcon className="w-4 h-4" />
                                            ) : (
                                                <ClockIcon className="w-4 h-4" />
                                            )
                                        }
                                        classNames={{
                                            base: "px-4 py-2",
                                            content: "font-semibold"
                                        }}
                                    >
                                        {appointment.status}
                                    </Chip>
                                </div>

                                {/* Datos del Transportista Compactos */}
                                {(() => {
                                    // Usar datos de transporte directamente del appointment (vienen del API de citas)
                                    const transporte = appointment.transportData;

                                    // Convertir hora de llegada de formato "1000" o "1240" a "10:00" o "12:40"
                                    const formatHoraLlegada = (hora: string | undefined): string => {
                                        if (!hora) return '-';
                                        const horaStr = hora.padStart(4, '0');
                                        return `${horaStr.slice(0, 2)}:${horaStr.slice(2)}`;
                                    };

                                    if (!transporte) {
                                        return (
                                            <div className="text-center py-4">
                                                <p className="text-xs text-gray-500 mb-2">Sin datos de transporte</p>
                                                {canManageTransport && (
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        variant="flat"
                                                        startContent={<TruckIcon className="w-4 h-4" />}
                                                        onPress={handleOpenTransport}
                                                    >
                                                        Completar
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-1.5 text-sm">
                                            <div>
                                                <span className="text-xs text-gray-500">Transportista: </span>
                                                <span className="font-medium text-gray-900">
                                                    {transporte.transportCompany || 'No especificado'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Conductor: </span>
                                                <span className="font-medium text-gray-900">
                                                    {transporte.driverName || 'No especificado'}
                                                </span>
                                                {transporte.driverLicense && (
                                                    <span className="text-gray-600 ml-2">(Lic: {transporte.driverLicense})</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Vehículo: </span>
                                                <span className="font-medium text-gray-900">
                                                    {transporte.vehiclePlate || 'No especificado'}
                                                </span>
                                                {transporte.vehicleType && (
                                                    <span className="text-gray-600 ml-2">({transporte.vehicleType})</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Contacto: </span>
                                                <span className="font-medium text-gray-900">
                                                    {transporte.contactPhone || 'No especificado'}
                                                </span>
                                                {transporte.estimatedArrival && (
                                                    <span className="text-gray-600 ml-2">| Llegada: {formatHoraLlegada(transporte.estimatedArrival)}</span>
                                                )}
                                            </div>
                                            {transporte.notes && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <span className="text-xs text-gray-500">Notas: </span>
                                                    <span className="text-sm text-gray-700">{transporte.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Stepper Horizontal */}
                        <div className="flex items-center justify-between w-full mt-6 pt-6 border-t border-gray-200">
                            {processSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <React.Fragment key={step.label}>
                                        <div className="flex flex-col items-center gap-2 flex-1">
                                            <div
                                                className={`
                                                    w-12 h-12 rounded-full flex items-center justify-center transition-all
                                                    ${step.completed 
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                                                        : step.active 
                                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 animate-pulse' 
                                                            : 'bg-gray-200 text-gray-400'
                                                    }
                                                `}
                                            >
                                                {step.completed ? (
                                                    <CheckCircleIcon className="w-6 h-6" />
                                                ) : (
                                                    <Icon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <span
                                                className={`
                                                    text-xs font-medium text-center
                                                    ${step.completed || step.active ? 'text-gray-900' : 'text-gray-400'}
                                                `}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                        {index < processSteps.length - 1 && (
                                            <div
                                                className={`
                                                    h-0.5 flex-1 transition-all mx-2
                                                    ${step.completed ? 'bg-emerald-500' : 'bg-gray-200'}
                                                `}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* PackingList Section */}
                    <Card className={`border-2 transition-all ${
                        packingListsFromApi.length > 0 
                            ? 'border-emerald-200 bg-emerald-50/30' 
                            : 'border-gray-200 hover:border-blue-300'
                    }`}>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ClipboardDocumentListIcon className={`w-5 h-5 ${
                                        packingListsFromApi.length > 0 ? 'text-emerald-600' : 'text-gray-400'
                                    }`} />
                                    PackingList
                                </h4>
                                {packingListsFromApi.length > 0 ? (
                                    <Chip color="success" variant="flat" startContent={<CheckCircleIcon className="w-4 h-4" />}>
                                        Completado
                                    </Chip>
                                ) : (
                                    <Chip color="warning" variant="flat" startContent={<ExclamationTriangleIcon className="w-4 h-4" />}>
                                        Pendiente
                                    </Chip>
                                )}
                            </div>

                            {/* Listado de PackingList del API */}
                            {isLoadingPackingLists ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-gray-500">Cargando PackingList...</p>
                                </div>
                            ) : packingListsFromApi.length > 0 ? (
                                <div className="mb-4 max-h-96 overflow-y-auto">
                                    <Table aria-label="Tabla de PackingList existentes">
                                        <TableHeader>
                                            <TableColumn width={120}>NÚMERO</TableColumn>
                                            <TableColumn width={100}>ALMACÉN</TableColumn>
                                            <TableColumn width={120}>TICKET</TableColumn>
                                            <TableColumn width={120}>FECHA ESPERADA</TableColumn>
                                            <TableColumn width={120}>FECHA EMISIÓN</TableColumn>
                                            <TableColumn width={100}>TIPO</TableColumn>
                                            <TableColumn width={80}>ITEMS</TableColumn>
                                            <TableColumn>COMENTARIO</TableColumn>
                                            <TableColumn>RESP. WMS</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {packingListsFromApi.map((pl) => {
                                                // Obtener el detalle (puede venir en cualquiera de los dos campos)
                                                const detalle = pl.DetallePackinList || pl._detallePackinList || [];
                                                
                                                return (
                                                    <TableRow 
                                                        key={pl.Id}
                                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                        onClick={() => {
                                                            setSelectedPackingList(pl);
                                                            onPackingListDetailOpen();
                                                        }}
                                                    >
                                                        <TableCell className="whitespace-nowrap font-medium">
                                                            <div className="flex items-center gap-2">
                                                                {pl.Number}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{pl.WhsCode}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{pl.Ticket || '-'}</TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {typeof pl.DateExpected === 'string' 
                                                                ? pl.DateExpected.split('T')[0].split(' ')[0] 
                                                                : pl.DateExpected
                                                            }
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {pl.EmissionDate 
                                                                ? (typeof pl.EmissionDate === 'string' 
                                                                    ? pl.EmissionDate.split('T')[0].split(' ')[0] 
                                                                    : pl.EmissionDate
                                                                )
                                                                : '-'
                                                            }
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {pl.InboundType ? (
                                                                <Chip size="sm" variant="flat" color={pl.InboundType === 'OCNAC' ? 'primary' : 'secondary'}>
                                                                    {pl.InboundType}
                                                                </Chip>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap text-center">
                                                            {detalle.length}
                                                        </TableCell>
                                                            <TableCell>
                                                                <div className="max-w-[200px] truncate" title={pl.Comments || ''}>
                                                                    {pl.Comments || '-'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {pl.WmsResponse ? (
                                                                    <Chip 
                                                                        size="sm" 
                                                                        color={pl.WmsResponse.includes('Procesado') || pl.WmsResponse.includes('Transferido') ? 'success' : 'warning'}
                                                                        variant="flat"
                                                                    >
                                                                        <div className="max-w-[150px] truncate" title={pl.WmsResponse}>
                                                                            {pl.WmsResponse}
                                                                        </div>
                                                                    </Chip>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-6 mb-4">
                                    <p className="text-sm text-gray-500">
                                        No se encontraron PackingList para esta cita
                                    </p>
                                </div>
                            )}

                            {/* Botón para crear PackingList - siempre visible si tiene permisos */}
                            {canManagePackingList && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        startContent={<ClipboardDocumentListIcon className="w-5 h-5" />}
                                        onPress={handleOpenPackingList}
                                        className="w-full shadow-lg"
                                    >
                                        Crear PackingList
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Modal de Detalle del PackingList */}
                    <Modal 
                        isOpen={isPackingListDetailOpen} 
                        onClose={onPackingListDetailClose}
                        size="4xl"
                        scrollBehavior="inside"
                    >
                        <ModalContent>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold">Items del PackingList</h3>
                                </div>
                            </ModalHeader>
                            <ModalBody className="pb-6">
                                {selectedPackingList && (() => {
                                    const detalle = selectedPackingList.DetallePackinList || selectedPackingList._detallePackinList || [];
                                    
                                    return (
                                        <>
                                            {detalle.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <Table aria-label="Tabla de items del PackingList" removeWrapper>
                                                        <TableHeader>
                                                            <TableColumn width={80}>LÍNEA</TableColumn>
                                                            <TableColumn width={150}>CÓDIGO</TableColumn>
                                                            <TableColumn>DESCRIPCIÓN</TableColumn>
                                                            <TableColumn width={120} className="text-right">CANTIDAD</TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {detalle.map((item: any, index: number) => {
                                                                const lineNumber = item.LineNumber || item.lineNumber || index + 1;
                                                                const itemCode = item.ItemCode || item.itemCode || '';
                                                                const itemName = item.ItemName || item.itemName || '';
                                                                const quantity = item.Quantity || item.quantity || 0;
                                                                return (
                                                                    <TableRow key={index}>
                                                                        <TableCell className="whitespace-nowrap text-center">
                                                                            {lineNumber}
                                                                        </TableCell>
                                                                        <TableCell className="whitespace-nowrap font-medium">
                                                                            {itemCode}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="max-w-[400px]">
                                                                                {itemName}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-right whitespace-nowrap font-semibold">
                                                                            {quantity.toLocaleString()}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>No hay items en este PackingList</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Modal para visualizar documentos */}
                    <Modal 
                        isOpen={isDocumentViewerOpen} 
                        onClose={onDocumentViewerClose}
                        size="5xl"
                        scrollBehavior="inside"
                    >
                        <ModalContent>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold">
                                        {selectedDocument?.name || 'Documento'}
                                    </h3>
                                </div>
                            </ModalHeader>
                            <ModalBody className="pb-6">
                                {selectedDocument && (() => {
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(selectedDocument.type.toLowerCase());
                                    const isPdf = selectedDocument.type.toLowerCase() === 'pdf';
                                    
                                    return (
                                        <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg">
                                            {isImage ? (
                                                <img 
                                                    src={selectedDocument.url} 
                                                    alt={selectedDocument.name}
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError al cargar imagen%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                            ) : isPdf ? (
                                                <iframe
                                                    src={selectedDocument.url}
                                                    className="w-full h-full border-0 rounded-lg"
                                                    title={selectedDocument.name}
                                                />
                                            ) : (
                                                <div className="text-center p-8">
                                                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                                    <p className="text-gray-600 mb-4">
                                                        Tipo de archivo: {selectedDocument.type.toUpperCase()}
                                                    </p>
                                                    <Button
                                                        color="primary"
                                                        variant="flat"
                                                        onPress={() => window.open(selectedDocument.url, '_blank')}
                                                        startContent={<DocumentTextIcon className="w-5 h-5" />}
                                                    >
                                                        Abrir en nueva ventana
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Documents Section */}
                    <Card className={`border-2 transition-all ${
                        appointmentDocuments.length > 0 || appointment.documents?.completed
                            ? 'border-emerald-200 bg-emerald-50/30' 
                            : 'border-gray-200 hover:border-blue-300'
                    }`}>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <DocumentTextIcon className={`w-5 h-5 ${
                                        appointmentDocuments.length > 0 || appointment.documents?.completed ? 'text-emerald-600' : 'text-gray-400'
                                    }`} />
                                    Documentos
                                </h4>
                                {appointmentDocuments.length > 0 || appointment.documents?.completed ? (
                                    <Chip color="success" variant="flat" startContent={<CheckCircleIcon className="w-4 h-4" />}>
                                        Completado
                                    </Chip>
                                ) : (
                                    <Chip color="warning" variant="flat" startContent={<ExclamationTriangleIcon className="w-4 h-4" />}>
                                        Pendiente
                                    </Chip>
                                )}
                            </div>

                            {appointmentDocuments.length > 0 || appointment.documents ? (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    {(() => {
                                        const allDocuments = getAllDocuments();
                                        return allDocuments.length > 0 ? (
                                            <div className="space-y-2">
                                                {allDocuments.map((doc, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                                        onClick={() => handleDocumentClick(doc)}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <DocumentTextIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                                                                {doc.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="text-xs text-gray-500 uppercase">{doc.type}</span>
                                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Factura */}
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                        <span className="text-sm font-medium text-gray-900">Factura</span>
                                                    </div>
                                                    {appointment.documents?.invoice ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>

                                                {/* Orden de Compra */}
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                        <span className="text-sm font-medium text-gray-900">O. Compra</span>
                                                    </div>
                                                    {appointment.documents?.purchaseOrder ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>

                                                {/* Guía de Remisión */}
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                        <span className="text-sm font-medium text-gray-900">Guía Remisión</span>
                                                    </div>
                                                    {appointment.documents?.deliveryGuide ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>

                                                {/* CDR */}
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                        <span className="text-sm font-medium text-gray-900">CDR</span>
                                                    </div>
                                                    {appointment.documents?.cdr ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>

                                                {/* XML */}
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 col-span-2">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                        <span className="text-sm font-medium text-gray-900">XML</span>
                                                    </div>
                                                    {appointment.documents?.xml ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {(appointmentDocuments.length === 0 && !appointment.documents?.completed) && canManageDocuments && (
                                        <div className="mt-4">
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                fullWidth
                                                startContent={<DocumentTextIcon className="w-5 h-5" />}
                                                onPress={handleOpenDocuments}
                                            >
                                                Cargar Documentos Faltantes
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                                        <DocumentTextIcon className="w-8 h-8 text-amber-600" />
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        Los documentos aún no han sido cargados
                                    </p>
                                    {canManageDocuments && (
                                        <Button
                                            color="primary"
                                            size="lg"
                                            startContent={<DocumentTextIcon className="w-5 h-5" />}
                                            onPress={handleOpenDocuments}
                                            className="shadow-lg"
                                        >
                                            Cargar Documentos
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Footer con botones de acción */}
                <div className="mt-6 flex justify-end gap-3">
                    <Button 
                        variant="light" 
                        onPress={() => navigate('/agenda')}
                        size="lg"
                        className="font-medium"
                    >
                        Cerrar
                    </Button>
                    {!isProvider && (
                        <Button 
                            color="primary" 
                            onPress={handleEdit}
                            size="lg"
                            className="font-medium"
                            startContent={<CalendarIcon className="w-5 h-5" />}
                        >
                            Editar Cita
                        </Button>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default AppointmentDetail;
