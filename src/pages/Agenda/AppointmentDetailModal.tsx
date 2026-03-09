// src/components/AppointmentDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    Card,
    CardBody,
    Progress,
    Divider,
    Avatar,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell
} from "@heroui/react";
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    TruckIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    PhoneIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { DeliveryAppointment } from "@/store/types";
import { UserRole } from "@/routes/menuTypes";
import { fetchPackingListFromApi, PackingListApiRecord } from "@/services/agenda/packingListApi";
import { formatDateForAPI } from "@/services/agenda/appointmentsApi";

interface AppointmentDetailModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    appointment: DeliveryAppointment | null;
    currentUserRole: UserRole;
    onOpenPackingList: () => void;
    onOpenTransport: () => void;
    onOpenDocuments: () => void;
    onEdit?: () => void; // Callback para abrir el modal de edición
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
    isOpen,
    onOpenChange,
    appointment,
    currentUserRole,
    onOpenPackingList,
    onOpenTransport,
    onOpenDocuments,
    onEdit,
}) => {
    if (!appointment) return null;

    console.log("APPOINTMENT: ", appointment);

    // Estado para PackingList del API
    const [packingListsFromApi, setPackingListsFromApi] = useState<PackingListApiRecord[]>([]);
    const [isLoadingPackingLists, setIsLoadingPackingLists] = useState(false);
    const [expandedPackingListId, setExpandedPackingListId] = useState<string | null>(null);

    // Cargar PackingList cuando se abre el modal y hay un appointment con docEntry
    useEffect(() => {
        if (isOpen && appointment?.docEntry) {
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
    }, [isOpen, appointment?.docEntry]);

    // Calcular progreso del proceso (0-100%)
    const calculateProgress = (): number => {
        let progress = 0;
        if (appointment.status === 'Pendiente') progress = 0;
        if (appointment.packingList) progress = 33;
        if (appointment.transportData) progress = 66;
        if (appointment.documents?.completed) progress = 100;
        return progress;
    };

    // Estados del proceso
    const processSteps = [
        {
            label: 'PackingList',
            icon: ClipboardDocumentListIcon,
            completed: !!appointment.packingList,
            active: !appointment.packingList && appointment.status === 'Pendiente',
        },
        {
            label: 'Transporte',
            icon: TruckIcon,
            completed: !!appointment.transportData,
            active: !!appointment.packingList && !appointment.transportData,
        },
        {
            label: 'Documentos',
            icon: DocumentTextIcon,
            completed: !!appointment.documents?.completed,
            active: !!appointment.transportData && !appointment.documents?.completed,
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
    const progress = calculateProgress();

    // Verificar permisos según rol
    const canManagePackingList = [UserRole.ADMIN, UserRole.COMPRAS, UserRole.ALMACEN].includes(currentUserRole);
    const canManageTransport = currentUserRole === UserRole.PROVEEDOR;
    const canManageDocuments = currentUserRole === UserRole.PROVEEDOR;

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange} 
            size="4xl" 
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                header: "border-b border-gray-200 pb-4",
                body: "py-6",
                footer: "border-t border-gray-100 pt-4"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {/* Header Rediseñado */}
                        <ModalHeader className="flex-col gap-3 px-6">
                            {/* Título y Estado */}
                            <div className="flex items-start justify-between w-full pr-6">
                                <div className="flex items-center gap-3">
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
                                            Cita #{appointment.appointmentNumber}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {appointment.supplierName}
                                        </p>
                                    </div>
                                </div>
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

                            {/* Barra de Progreso */}
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Progreso de la Entrega
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {progress}%
                                    </span>
                                </div>
                                <Progress
                                    value={progress}
                                    color={progress === 100 ? "success" : "primary"}
                                    size="md"
                                    classNames={{
                                        indicator: "bg-gradient-to-r from-blue-500 to-blue-600"
                                    }}
                                />
                            </div>

                            {/* Stepper Horizontal */}
                            <div className="flex items-center justify-between w-full mt-2">
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
                        </ModalHeader>

                        <ModalBody className="px-6">
                            <div className="space-y-6">
                                {/* Información General - Card con Grid */}
                                <Card className="border border-gray-200 shadow-sm">
                                    <CardBody className="p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                                            Información de la Entrega
                                        </h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Fecha y Hora */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                        Fecha y Hora
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 mt-1">
                                                        {new Date(appointment.deliveryDate).toLocaleDateString('es-PE', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        {appointment.deliveryTime} 
                                                        {appointment.deliveryTimeEnd && ` - ${appointment.deliveryTimeEnd}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Almacén */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                                    <MapPinIcon className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                        Almacén
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 mt-1">
                                                        {appointment.warehouse || 'No especificado'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Proveedor */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                    <BuildingOfficeIcon className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                        Proveedor
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-900 mt-1">
                                                        {appointment.supplierName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        RUC: {appointment.supplierRUC}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Contacto (si existe) */}
                                            {appointment.supplierEmail && (
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                        <PhoneIcon className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                            Contacto
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                                            {appointment.supplierEmail}
                                                        </p>
                                                        {appointment.supplierPhone && (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {appointment.supplierPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notas */}
                                        {appointment.notes && (
                                            <>
                                                <Divider className="my-4" />
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                            Notas Adicionales
                                                        </p>
                                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                                            {appointment.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* PackingList Section */}
                                <Card className={`border-2 transition-all ${
                                    appointment.packingList 
                                        ? 'border-emerald-200 bg-emerald-50/30' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}>
                                    <CardBody className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <ClipboardDocumentListIcon className={`w-5 h-5 ${
                                                    appointment.packingList ? 'text-emerald-600' : 'text-gray-400'
                                                }`} />
                                                PackingList
                                            </h4>
                                            {appointment.packingList ? (
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
                                                        <TableColumn width={120}>FECHA</TableColumn>
                                                        <TableColumn width={100}>TIPO</TableColumn>
                                                        <TableColumn width={80}>ITEMS</TableColumn>
                                                        <TableColumn>COMENTARIO</TableColumn>
                                                        <TableColumn>RESP. WMS</TableColumn>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {packingListsFromApi.map((pl) => {
                                                            // Obtener el detalle (puede venir en cualquiera de los dos campos)
                                                            const detalle = pl.DetallePackinList || pl._detallePackinList || [];
                                                            const isExpanded = expandedPackingListId === pl.Id;
                                                            
                                                            return (
                                                                <React.Fragment key={pl.Id}>
                                                                    <TableRow 
                                                                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}
                                                                        onClick={() => {
                                                                            setExpandedPackingListId(isExpanded ? null : pl.Id.toString());
                                                                        }}
                                                                    >
                                                                        <TableCell className="whitespace-nowrap font-medium">
                                                                            <div className="flex items-center gap-2">
                                                                                {detalle.length > 0 && (
                                                                                    isExpanded ? (
                                                                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                                                                    ) : (
                                                                                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                                                    )
                                                                                )}
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
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                                
                                                {/* Detalle expandido fuera de la tabla */}
                                                {packingListsFromApi.map((pl) => {
                                                    const detalle = pl.DetallePackinList || pl._detallePackinList || [];
                                                    const isExpanded = expandedPackingListId === pl.Id;
                                                    
                                                    if (!isExpanded || detalle.length === 0) return null;
                                                    
                                                    return (
                                                        <div key={`detail-${pl.Id}`} className="mt-2 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                            <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                                <DocumentTextIcon className="w-4 h-4" />
                                                                Detalle del PackingList {pl.Number} ({detalle.length} {detalle.length === 1 ? 'item' : 'items'})
                                                            </h5>
                                                            <div className="overflow-x-auto">
                                                                <Table aria-label="Tabla de detalles" removeWrapper>
                                                                    <TableHeader>
                                                                        <TableColumn width={80}>LÍNEA</TableColumn>
                                                                        <TableColumn width={120}>CÓDIGO</TableColumn>
                                                                        <TableColumn>DESCRIPCIÓN</TableColumn>
                                                                        <TableColumn width={100} className="text-right">CANTIDAD</TableColumn>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {detalle.map((item, index) => {
                                                                            const lineNumber = item.LineNumber || item.lineNumber || index + 1;
                                                                            const itemCode = item.ItemCode || item.itemCode || '';
                                                                            const itemName = item.ItemName || item.itemName || '';
                                                                            const quantity = item.Quantity || item.quantity || 0;
                                                                            
                                                                            return (
                                                                                <TableRow key={`${pl.Id}-${lineNumber}-${index}`}>
                                                                                    <TableCell className="whitespace-nowrap font-medium">{lineNumber}</TableCell>
                                                                                    <TableCell className="whitespace-nowrap font-mono text-sm">{itemCode}</TableCell>
                                                                                    <TableCell>{itemName}</TableCell>
                                                                                    <TableCell className="text-right font-semibold">
                                                                                        {quantity > 0 ? (
                                                                                            <Chip size="sm" color="primary" variant="flat">
                                                                                                {quantity}
                                                                                            </Chip>
                                                                                        ) : (
                                                                                            <span className="text-gray-400">0</span>
                                                                                        )}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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
                                                    onPress={() => {
                                                        onClose();
                                                        onOpenPackingList();
                                                    }}
                                                    className="w-full shadow-lg"
                                                >
                                                    Crear PackingList
                                                </Button>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* Transport Section */}
                                <Card className={`border-2 transition-all ${
                                    appointment.transportData 
                                        ? 'border-emerald-200 bg-emerald-50/30' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}>
                                    <CardBody className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <TruckIcon className={`w-5 h-5 ${
                                                    appointment.transportData ? 'text-emerald-600' : 'text-gray-400'
                                                }`} />
                                                Datos de Transporte
                                            </h4>
                                            {appointment.transportData ? (
                                                <Chip color="success" variant="flat" startContent={<CheckCircleIcon className="w-4 h-4" />}>
                                                    Completado
                                                </Chip>
                                            ) : (
                                                <Chip color="warning" variant="flat" startContent={<ExclamationTriangleIcon className="w-4 h-4" />}>
                                                    Pendiente
                                                </Chip>
                                            )}
                                        </div>

                                        {appointment.transportData ? (
                                            <div className="bg-white rounded-lg p-4 border border-emerald-100">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Transportista</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {appointment.transportData.transportCompany || 'No especificado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                            <UserIcon className="w-5 h-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Conductor</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {appointment.transportData.driverName}
                                                            </p>
                                                            {appointment.transportData.driverLicense && (
                                                                <p className="text-xs text-gray-500">
                                                                    Lic: {appointment.transportData.driverLicense}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                                            <TruckIcon className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Vehículo</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {appointment.transportData.vehiclePlate}
                                                            </p>
                                                            {appointment.transportData.vehicleType && (
                                                                <p className="text-xs text-gray-500">
                                                                    {appointment.transportData.vehicleType}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                                            <PhoneIcon className="w-5 h-5 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Contacto</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {appointment.transportData.contactPhone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {appointment.transportData.notes && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <p className="text-xs text-gray-500 mb-1">Notas</p>
                                                        <p className="text-sm text-gray-700">{appointment.transportData.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                                                    <TruckIcon className="w-8 h-8 text-amber-600" />
                                                </div>
                                                <p className="text-gray-600 mb-4">
                                                    Los datos de transporte aún no han sido completados
                                                </p>
                                                {canManageTransport && (
                                                    <Button
                                                        color="primary"
                                                        size="lg"
                                                        startContent={<TruckIcon className="w-5 h-5" />}
                                                        onPress={() => {
                                                            onClose();
                                                            onOpenTransport();
                                                        }}
                                                        className="shadow-lg"
                                                    >
                                                        Completar Datos de Transporte
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* Documents Section */}
                                <Card className={`border-2 transition-all ${
                                    appointment.documents?.completed 
                                        ? 'border-emerald-200 bg-emerald-50/30' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}>
                                    <CardBody className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <DocumentTextIcon className={`w-5 h-5 ${
                                                    appointment.documents?.completed ? 'text-emerald-600' : 'text-gray-400'
                                                }`} />
                                                Documentos
                                            </h4>
                                            {appointment.documents?.completed ? (
                                                <Chip color="success" variant="flat" startContent={<CheckCircleIcon className="w-4 h-4" />}>
                                                    Completado
                                                </Chip>
                                            ) : (
                                                <Chip color="warning" variant="flat" startContent={<ExclamationTriangleIcon className="w-4 h-4" />}>
                                                    Pendiente
                                                </Chip>
                                            )}
                                        </div>

                                        {appointment.documents ? (
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Factura */}
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                                            <span className="text-sm font-medium text-gray-900">Factura</span>
                                                        </div>
                                                        {appointment.documents.invoice ? (
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
                                                        {appointment.documents.purchaseOrder ? (
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
                                                        {appointment.documents.deliveryGuide ? (
                                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <XCircleIcon className="w-5 h-5 text-amber-500" />
                                                        )}
                                                    </div>

                                                    {/* Nota: CDR y XML son formatos, no documentos separados.
                                                        Los documentos pueden cargarse en formato CDR/XML según el tipo de documento */}
                                                </div>

                                                {!appointment.documents.completed && canManageDocuments && (
                                                    <div className="mt-4">
                                                        <Button
                                                            color="primary"
                                                            variant="flat"
                                                            fullWidth
                                                            startContent={<DocumentTextIcon className="w-5 h-5" />}
                                                            onPress={() => {
                                                                onClose();
                                                                onOpenDocuments();
                                                            }}
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
                                                        onPress={() => {
                                                            onClose();
                                                            onOpenDocuments();
                                                        }}
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
                        </ModalBody>

                        <ModalFooter className="px-6">
                            <Button 
                                variant="light" 
                                onPress={onClose}
                                size="lg"
                                className="font-medium"
                            >
                                Cerrar
                            </Button>
                            {onEdit && appointment?.docEntry && (
                                <Button 
                                    color="primary" 
                                    onPress={() => {
                                        onClose();
                                        onEdit();
                                    }}
                                    size="lg"
                                    className="font-medium"
                                    startContent={<CalendarIcon className="w-5 h-5" />}
                                >
                                    Editar Cita
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default AppointmentDetailModal;