// src/pages/Agenda/index.tsx
import React, {useState, useMemo, useEffect} from 'react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Select,
    SelectItem,
    Textarea,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Checkbox
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowLeftIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAgendaStore } from "@/store/agendaStore";
import { useAuth } from "@/store/authStore";
import { UserRole } from "@/routes/menuTypes";
import { DeliveryAppointment, PackingListItem } from "@/store/types";
import AppointmentDetailModal from './AppointmentDetailModal';

const Agenda: React.FC = () => {
    const { currentUser } = useAuth();
    const {
        appointments,
        selectedAppointment,
        isLoadingAppointments,
        appointmentsError,
        addAppointment,
        updateAppointment,
        setSelectedAppointment,
        lookupSupplierByRUC,
        addPackingList,
        addTransportData,
        addDocument,
        loadAppointmentsFromApi,
        createAppointmentFromApi
    } = useAgendaStore();

    // State
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [, setSelectedDate] = useState<string | null>(null);
    const [, setSelectedTimeSlot] = useState<string | null>(null);
    const [rucSearch, setRucSearch] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
    const [supplierData, setSupplierData] = useState<any>(null);
    const [packingListItems, setPackingListItems] = useState<PackingListItem[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Modals
    const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onOpenChange: onScheduleOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isPackingListOpen, onOpen: onPackingListOpen, onOpenChange: onPackingListOpenChange } = useDisclosure();
    const { isOpen: isTransportOpen, onOpen: onTransportOpen, onOpenChange: onTransportOpenChange } = useDisclosure();
    const { isOpen: isDocumentsOpen, onOpen: onDocumentsOpen, onOpenChange: onDocumentsOpenChange } = useDisclosure();

    // Form state
    const [scheduleForm, setScheduleForm] = useState({
        supplierRUC: '',
        supplierId: '',
        supplierName: '',
        supplierEmail: '',
        supplierPhone: '',
        deliveryDate: '',
        deliveryTime: '',
        deliveryTimeEnd: '',
        warehouse: '',
        notes: ''
    });

    const [packingListForm, setPackingListForm] = useState({
        date: '',
        warehouse: '',
        comment: '',
        commentWms: '',
        items: [] as PackingListItem[]
    });

    const [transportForm, setTransportForm] = useState({
        transportCompany: '',
        driverName: '',
        driverLicense: '',
        vehiclePlate: '',
        vehicleType: '',
        contactPhone: '',
        estimatedArrival: '',
        notes: ''
    });

    // Get week start and end dates
    const getWeekDates = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 59);

        return { start, end };
    };

    // Memoize week dates to prevent infinite loops
    const { start: weekStart, end: weekEnd } = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

    // Load appointments from API when component mounts or week changes
    useEffect(() => {
        const loadAppointments = async () => {
            // Obtener RUC del usuario si es proveedor
            const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.supplierId 
                ? currentUser.supplierId 
                : undefined;
            
            // Cargar citas para el rango de la semana actual
            await loadAppointmentsFromApi(ruc, weekStart, weekEnd);
        };

        loadAppointments();
        // Dependencias: solo valores primitivos que realmente cambian
        // weekStart y weekEnd están memoizados basados en currentWeek, así que currentWeek.getTime() es suficiente
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWeek.getTime(), currentUser?.id, currentUser?.role, currentUser?.supplierId]);

    // Get days of the week
    const weekDays = useMemo(() => {
        const days = [];
        const start = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    }, [weekStart]);

    // Time slots - expandido para cubrir 24 horas
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            slots.push(`${String(hour).padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    // Filter appointments based on user role
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;

        // Filter by role
        if (currentUser?.role === UserRole.PROVEEDOR && currentUser.supplierId) {
            filtered = filtered.filter(apt => apt.supplierId === currentUser.supplierId);
        }

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(apt => apt.status === filterStatus);
        }

        // Filtrar por semana: comparar solo el día sin hora para evitar problemas de zona horaria
        filtered = filtered.filter(apt => {
            // Parsear fecha directamente desde string YYYY-MM-DD sin conversión de zona horaria
            const [year, month, day] = apt.deliveryDate.split('-').map(Number);
            const aptDate = new Date(year, month - 1, day);
            
            // Comparar solo fechas (sin horas)
            const weekStartDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
            const weekEndDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
            
            return aptDate >= weekStartDate && aptDate <= weekEndDate;
        });

        // Debug: Log filtered appointments
        if (filtered.length > 0) {
            console.log('Citas filtradas:', filtered.map(apt => ({
                id: apt.id,
                fecha: apt.deliveryDate,
                horaInicio: apt.deliveryTime,
                horaFin: apt.deliveryTimeEnd,
                proveedor: apt.supplierName
            })));
        }

        return filtered;
    }, [appointments, currentUser, filterStatus, weekStart, weekEnd]);

    // Convierte hora en formato HH:MM a minutos desde medianoche
    // Ejemplo: "10:47" -> 647 minutos
    const timeToMinutes = (timeStr: string | undefined): number => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Get appointments for a specific day and time slot
    const getAppointmentsForSlot = (date: Date, time: string) => {
        return filteredAppointments.filter(apt => {
            const aptDate = new Date(apt.deliveryDate);
            const isSameDay = aptDate.toDateString() === date.toDateString();
            
            if (!isSameDay) return false;
            
            // Check if appointment has required time fields
            if (!apt.deliveryTime) return false;
            
            const slotMinutes = timeToMinutes(time);
            const aptStartMinutes = timeToMinutes(apt.deliveryTime);
            
            // If no end time, treat as single slot appointment
            if (!apt.deliveryTimeEnd) {
                return slotMinutes === aptStartMinutes;
            }
            
            const aptEndMinutes = timeToMinutes(apt.deliveryTimeEnd);
            
            // Check if slot time is within appointment range
            return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
        });
    };

    // Check if a time slot is available (no conflicts)
    const isTimeSlotAvailable = (date: Date, startTime: string, endTime: string, excludeAppointmentId?: string): boolean => {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (endMinutes <= startMinutes) return false;

        const conflictingAppointments = filteredAppointments.filter(apt => {
            // Skip the appointment being edited
            if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;

            const aptDate = new Date(apt.deliveryDate);
            const isSameDay = aptDate.toDateString() === date.toDateString();
            
            if (!isSameDay || !apt.deliveryTime) return false;
            
            const aptStartMinutes = timeToMinutes(apt.deliveryTime);
            const aptEndMinutes = apt.deliveryTimeEnd ? timeToMinutes(apt.deliveryTimeEnd) : aptStartMinutes + 60;
            
            // Check for overlap: new appointment overlaps if it starts before existing ends and ends after existing starts
            return (startMinutes < aptEndMinutes && endMinutes > aptStartMinutes);
        });

        return conflictingAppointments.length === 0;
    };

    // Navigate weeks
    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeek(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeek(newDate);
    };

    const goToToday = () => {
        setCurrentWeek(new Date());
    };

    // Handle RUC lookup
    const handleRUCLookup = async () => {
        if (!rucSearch.trim()) return;

        setIsLookingUp(true);
        try {
            const result = await lookupSupplierByRUC(`P${rucSearch}`);
            if (result.success && result.data) {
                setSupplierData(result.data);
                setScheduleForm(prev => ({
                    ...prev,
                    supplierRUC: result.data!.supplierRUC,
                    supplierId: result.data!.supplierId,
                    supplierName: result.data!.supplierName,
                    supplierEmail: result.data!.supplierEmail,
                    supplierPhone: result.data!.supplierPhone
                }));
            } else {
                alert(result.message || 'Error al consultar proveedor');
            }
        } catch (error) {
            alert('Error al consultar proveedor');
        } finally {
            setIsLookingUp(false);
        }
    };

    // Handle schedule appointment
    const handleScheduleAppointment = async () => {
        if (!scheduleForm.deliveryDate || !scheduleForm.deliveryTime || !scheduleForm.deliveryTimeEnd || !scheduleForm.supplierId) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        const startMinutes = timeToMinutes(scheduleForm.deliveryTime);
        const endMinutes = timeToMinutes(scheduleForm.deliveryTimeEnd);
        
        if (endMinutes <= startMinutes) {
            alert('La hora de fin debe ser posterior a la hora de inicio');
            return;
        }

        // Check for time slot conflicts
        const deliveryDate = new Date(scheduleForm.deliveryDate);
        if (!isTimeSlotAvailable(deliveryDate, scheduleForm.deliveryTime, scheduleForm.deliveryTimeEnd)) {
            alert('El horario seleccionado ya está ocupado. Por favor seleccione otro horario.');
            return;
        }

        setIsCreatingAppointment(true);
        try {
            // Crear la cita en el API
            const newAppointment = await createAppointmentFromApi({
                supplierRUC: scheduleForm.supplierRUC,
                supplierName: scheduleForm.supplierName,
                deliveryDate: scheduleForm.deliveryDate,
                deliveryTime: scheduleForm.deliveryTime,
                deliveryTimeEnd: scheduleForm.deliveryTimeEnd,
                description: scheduleForm.notes,
                warehouse: scheduleForm.warehouse,
                active: 'Y'
            });

            // Mostrar mensaje de éxito
            alert(`Cita programada exitosamente. Número de cita: ${newAppointment.appointmentNumber}`);
            
            // Reset form
            setScheduleForm({
                supplierRUC: '',
                supplierId: '',
                supplierName: '',
                supplierEmail: '',
                supplierPhone: '',
                deliveryDate: '',
                deliveryTime: '',
                deliveryTimeEnd: '',
                warehouse: '',
                notes: ''
            });
            setSupplierData(null);
            setRucSearch('');
            onScheduleOpenChange();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear la cita';
            alert(`Error al crear la cita: ${errorMessage}`);
            console.error('Error al crear cita:', error);
        } finally {
            setIsCreatingAppointment(false);
        }
    };

    // Handle select time slot - opens modal with pre-filled date and start time
    const handleSelectTimeSlot = (date: Date, time: string) => {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setSelectedTimeSlot(time);
        
        // Set default end time to 1 hour after start time
        const [hours, minutes] = time.split(':').map(Number);
        const endHours = hours + 1;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        setScheduleForm(prev => ({
            ...prev,
            deliveryDate: dateStr,
            deliveryTime: time,
            deliveryTimeEnd: endTime
        }));
        onScheduleOpen();
    };

    // Handle view appointment
    const handleViewAppointment = (appointment: DeliveryAppointment) => {
        setSelectedAppointment(appointment);
        onDetailOpen();
    };

    // Handle create packing list
    const handleCreatePackingList = () => {
        if (!selectedAppointment || !packingListForm.warehouse || packingListItems.length === 0) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        addPackingList(selectedAppointment.id, {
            appointmentId: selectedAppointment.id,
            supplierId: selectedAppointment.supplierId,
            date: packingListForm.date || new Date().toISOString().split('T')[0],
            warehouse: packingListForm.warehouse,
            items: packingListItems,
            comment: packingListForm.comment,
            commentWms: packingListForm.commentWms,
            createdBy: currentUser?.id || 'system'
        });

        // Update appointment status
        updateAppointment(selectedAppointment.id, { status: 'PackingListCompletado' });
        
        // Simulate notification
        alert('PackingList completado. El proveedor ha sido notificado.');

        // Reset and close
        setPackingListForm({
            date: '',
            warehouse: '',
            comment: '',
            commentWms: '',
            items: []
        });
        setPackingListItems([]);
        onPackingListOpenChange();
        onDetailOpenChange();
    };

    // Handle save transport data
    const handleSaveTransportData = () => {
        if (!selectedAppointment || !transportForm.driverName || !transportForm.vehiclePlate) {
            alert('Por favor complete los campos requeridos');
            return;
        }

        addTransportData(selectedAppointment.id, {
            appointmentId: selectedAppointment.id,
            ...transportForm
        });

        alert('Datos de transporte guardados exitosamente');
        setTransportForm({
            transportCompany: '',
            driverName: '',
            driverLicense: '',
            vehiclePlate: '',
            vehicleType: '',
            contactPhone: '',
            estimatedArrival: '',
            notes: ''
        });
        onTransportOpenChange();
    };

    // Handle upload document
    const handleUploadDocument = (type: 'invoice' | 'purchaseOrder' | 'deliveryGuide' | 'cdr' | 'xml', file: File) => {
        if (!selectedAppointment) return;

        const document: any = {
            id: `doc-${Date.now()}`,
            name: file.name,
            type: file.type,
            file: file,
            uploadDate: new Date().toISOString(),
            uploadedBy: currentUser?.id || 'system'
        };

        addDocument(selectedAppointment.id, type, document);
        alert(`Documento ${type} cargado exitosamente`);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
            'Pendiente': 'warning',
            'PackingListCompletado': 'primary',
            'TransporteCompletado': 'primary',
            'DocumentosCompletados': 'primary',
            'ListaParaEntrega': 'success',
            'Completada': 'success',
            'Cancelada': 'danger'
        };
        return colors[status] || 'default';
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        if (status === 'ListaParaEntrega' || status === 'Completada') {
            return <CheckCircleIcon className="w-4 h-4" />;
        }
        if (status === 'Cancelada') {
            return <XCircleIcon className="w-4 h-4" />;
        }
        return <ClockIcon className="w-4 h-4" />;
    };

    // Check if user can create appointments
    const canCreateAppointment = currentUser?.role === UserRole.ADMIN || 
                                 currentUser?.role === UserRole.COMPRAS ||
                                 currentUser?.role === UserRole.ALMACEN;

    return (
        <Dashboard>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Agenda de Entregas</h1>
                        <p className="text-gray-600 mt-1">Gestiona las entregas programadas de proveedores</p>
                    </div>
                    {canCreateAppointment && (
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="w-5 h-5" />}
                            onPress={onScheduleOpen}
                        >
                            Programar Entrega
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardBody className="flex flex-row gap-4 items-center">
                        <Select
                            label="Filtrar por estado"
                            selectedKeys={[filterStatus]}
                            onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                            className="max-w-xs"
                        >
                            <SelectItem key="all" >Todos</SelectItem>
                            <SelectItem key="Pendiente" >Pendiente</SelectItem>
                            <SelectItem key="PackingListCompletado" >PackingList Completado</SelectItem>
                            <SelectItem key="TransporteCompletado" >Transporte Completado</SelectItem>
                            <SelectItem key="ListaParaEntrega" >Lista para Entrega</SelectItem>
                            <SelectItem key="Completada" >Completada</SelectItem>
                        </Select>
                    </CardBody>
                </Card>

                {/* Weekly Calendar - Modern Design */}
                <Card className="shadow-lg">
                    <CardHeader className="flex justify-between items-center border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-4">
                            <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={goToPreviousWeek}
                                className="hover:bg-gray-200"
                                isDisabled={isLoadingAppointments}
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Button>
                            <h2 className="text-xl font-bold text-gray-900">
                                {weekStart.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                            </h2>
                            <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={goToNextWeek}
                                className="hover:bg-gray-200"
                                isDisabled={isLoadingAppointments}
                            >
                                <ArrowRightIcon className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="light"
                                size="sm"
                                onPress={goToToday}
                                className="ml-2"
                                isDisabled={isLoadingAppointments}
                            >
                                Hoy
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLoadingAppointments && (
                                <Chip color="primary" variant="flat" size="sm">
                                    Cargando...
                                </Chip>
                            )}
                            <Chip color="primary" variant="flat" size="lg">
                                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'} esta semana
                            </Chip>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {appointmentsError && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                                <p className="font-semibold">Error al cargar citas</p>
                                <p className="text-sm">{appointmentsError}</p>
                            </div>
                        )}
                        {isLoadingAppointments && !appointmentsError && (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">Cargando citas...</p>
                            </div>
                        )}
                        {!isLoadingAppointments && (
                            <div className="overflow-x-auto">
                            <div className="min-w-full">
                                {/* Header with days */}
                                <div className="grid grid-cols-8 border-b border-gray-200 bg-white sticky top-0 z-10">
                                    <div className="p-3 text-sm font-semibold text-gray-500 border-r border-gray-200">
                                        Hora
                                    </div>
                                    {weekDays.map((day, index) => {
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        return (
                                            <div
                                                key={index}
                                                className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                                                    isToday ? 'bg-blue-50' : 'bg-white'
                                                }`}
                                            >
                                                <div className="text-xs font-medium text-gray-500 uppercase">
                                                    {day.toLocaleDateString('es-PE', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-lg font-bold mt-1 ${
                                                    isToday 
                                                        ? 'text-blue-600' 
                                                        : 'text-gray-900'
                                                }`}>
                                                    {day.getDate()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Time slots */}
                                <div className="relative">
                                    {timeSlots.map((time, timeIndex) => (
                                        <div key={time} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {/* Time label */}
                                            <div className="p-2 text-xs font-medium text-gray-500 border-r border-gray-200 bg-gray-50 flex items-center justify-end pr-3">
                                                {time}
                                            </div>

                                            {/* Columnas de días */}
                                            {weekDays.map((day, dayIndex) => {
                                                const isToday = day.toDateString() === new Date().toDateString();
                                                
                                                // Obtener citas para este día específico
                                                const dayAppointments = filteredAppointments.filter(apt => {
                                                    if (!apt.deliveryTime) return false;
                                                    
                                                    // Comparar fecha parseando directamente desde string YYYY-MM-DD
                                                    const [aptYear, aptMonth, aptDay] = apt.deliveryDate.split('-').map(Number);
                                                    const aptDate = new Date(aptYear, aptMonth - 1, aptDay);
                                                    
                                                    const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                                                    
                                                    return aptDate.getTime() === dayDate.getTime();
                                                });

                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className={`min-h-[60px] p-1 border-r border-gray-100 last:border-r-0 relative ${
                                                            isToday ? 'bg-blue-50/40' : 'bg-white'
                                                        } ${canCreateAppointment ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                                        onClick={() => canCreateAppointment && handleSelectTimeSlot(day, time)}
                                                    >
                                                        {/* Mostrar citas que comienzan en este slot de tiempo */}
                                                        {dayAppointments
                                                            .filter(apt => {
                                                                if (!apt.deliveryTime) return false;
                                                                
                                                                // Convertir hora de inicio de la cita a minutos
                                                                const aptStartMinutes = timeToMinutes(apt.deliveryTime);
                                                                // Convertir hora del slot actual a minutos
                                                                const slotStartMinutes = timeToMinutes(time);
                                                                const slotEndMinutes = slotStartMinutes + 60;
                                                                
                                                                // La cita se muestra en el slot donde comienza
                                                                // Si la hora de inicio está dentro de este slot (entre inicio y fin del slot)
                                                                return aptStartMinutes >= slotStartMinutes && aptStartMinutes < slotEndMinutes;
                                                            })
                                                            .map(apt => {
                                                                // Calcular duración de la cita en minutos
                                                                const startMinutes = timeToMinutes(apt.deliveryTime);
                                                                const endMinutes = apt.deliveryTimeEnd 
                                                                    ? timeToMinutes(apt.deliveryTimeEnd) 
                                                                    : startMinutes + 60;
                                                                const durationMinutes = endMinutes - startMinutes;
                                                                
                                                                // Calcular cuántos slots ocupa (cada slot es 60 minutos)
                                                                const slotsToSpan = Math.ceil(durationMinutes / 60);
                                                                
                                                                // Calcular posición vertical dentro del slot
                                                                // Si la cita empieza a las 10:47 y el slot es de 10:00, empieza 47 minutos después
                                                                // Cada minuto = 1px (ya que cada slot de 60 minutos tiene 60px de altura)
                                                                const slotStartMinutes = timeToMinutes(time);
                                                                const offsetFromSlotStart = startMinutes - slotStartMinutes;
                                                                const topOffset = offsetFromSlotStart; // 1px por minuto
                                                                
                                                                // Altura en píxeles: 1px por minuto de duración
                                                                const heightPixels = durationMinutes;
                                                                
                                                                // Estilos según el estado de la cita
                                                                const getStatusStyles = () => {
                                                                    switch(apt.status) {
                                                                        case 'ListaParaEntrega':
                                                                            return 'bg-green-500 text-white border-green-600';
                                                                        case 'Pendiente':
                                                                            return 'bg-yellow-200 text-yellow-900 border-yellow-500';
                                                                        case 'Completada':
                                                                            return 'bg-gray-400 text-white border-gray-500';
                                                                        case 'Cancelada':
                                                                            return 'bg-red-400 text-white border-red-500';
                                                                        default:
                                                                            return 'bg-blue-300 text-white border-blue-500';
                                                                    }
                                                                };

                                                                return (
                                                                    <div
                                                                        key={apt.id}
                                                                        className={`absolute left-1 right-1 rounded-md p-1.5 text-xs shadow-sm border-l-2 ${getStatusStyles()}`}
                                                                        style={{
                                                                            top: `${topOffset + 2}px`,
                                                                            height: `${heightPixels - 4}px`,
                                                                            zIndex: 10
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleViewAppointment(apt);
                                                                        }}
                                                                    >
                                                                        <div className="font-semibold truncate text-[10px] leading-tight">
                                                                            {apt.supplierName}
                                                                        </div>
                                                                        <div className="text-[9px] opacity-90 mt-0.5">
                                                                            {apt.deliveryTime} {apt.deliveryTimeEnd ? `- ${apt.deliveryTimeEnd}` : ''}
                                                                        </div>
                                                                        {slotsToSpan > 1 && (
                                                                            <div className="text-[9px] opacity-75 mt-0.5 truncate">
                                                                                {apt.appointmentNumber}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}
                    </CardBody>
                </Card>

                {/* Schedule Appointment Modal */}
                <Modal isOpen={isScheduleOpen} onOpenChange={onScheduleOpenChange} size="2xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>Programar Entrega</ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        {/* RUC Lookup */}
                                        <div className="flex gap-2">
                                            <Input
                                                label="RUC del Proveedor"
                                                placeholder="Ingrese el RUC"
                                                value={rucSearch}
                                                onValueChange={(value) => setRucSearch(value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                color="primary"
                                                onPress={handleRUCLookup}
                                                isLoading={isLookingUp}
                                                startContent={<MagnifyingGlassIcon className="w-5 h-5" />}
                                                className="mt-6"
                                            >
                                                Consultar
                                            </Button>
                                        </div>

                                        {/* Supplier Data (auto-filled after lookup) */}
                                        {supplierData && (
                                            <Card className="bg-blue-50">
                                                <CardBody>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Razón Social</p>
                                                            <p className="font-semibold">{supplierData.supplierName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Email</p>
                                                            <p className="font-semibold">{supplierData.supplierEmail}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Teléfono</p>
                                                            <p className="font-semibold">{supplierData.supplierPhone}</p>
                                                        </div>
                                                        {supplierData.address && (
                                                            <div>
                                                                <p className="text-sm text-gray-600">Dirección</p>
                                                                <p className="font-semibold">{supplierData.address}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        )}

                                        {/* Delivery Date and Time Range */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <Input
                                                label="Fecha de Entrega"
                                                type="date"
                                                value={scheduleForm.deliveryDate}
                                                onValueChange={(value) => setScheduleForm(prev => ({ ...prev, deliveryDate: value }))}
                                                isRequired
                                            />
                                            <Select
                                                label="Hora de Inicio"
                                                selectedKeys={scheduleForm.deliveryTime ? [scheduleForm.deliveryTime] : []}
                                                onSelectionChange={(keys) => {
                                                    const startTime = Array.from(keys)[0] as string;
                                                    // Auto-set end time to 1 hour after start if not set
                                                    if (startTime && !scheduleForm.deliveryTimeEnd) {
                                                        const [hours, minutes] = startTime.split(':').map(Number);
                                                        const endHours = hours + 1;
                                                        const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                                        setScheduleForm(prev => ({ ...prev, deliveryTime: startTime, deliveryTimeEnd: endTime }));
                                                    } else {
                                                        setScheduleForm(prev => ({ ...prev, deliveryTime: startTime }));
                                                    }
                                                }}
                                                isRequired
                                            >
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                            <Select
                                                label="Hora de Fin"
                                                selectedKeys={scheduleForm.deliveryTimeEnd ? [scheduleForm.deliveryTimeEnd] : []}
                                                onSelectionChange={(keys) => setScheduleForm(prev => ({ ...prev, deliveryTimeEnd: Array.from(keys)[0] as string }))}
                                                isRequired
                                            >
                                                {timeSlots.filter((time) => {
                                                    // Only show times after the start time
                                                    if (scheduleForm.deliveryTime) {
                                                        const timeToMinutes = (timeStr: string) => {
                                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                                            return hours * 60 + minutes;
                                                        };
                                                        const startMinutes = timeToMinutes(scheduleForm.deliveryTime);
                                                        const timeMinutes = timeToMinutes(time);
                                                        return timeMinutes > startMinutes;
                                                    }
                                                    return true;
                                                }).map((time) => (
                                                    <SelectItem key={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        {/* Warehouse */}
                                        <Select
                                            label="Almacén"
                                            placeholder="Seleccione el almacén"
                                            selectedKeys={scheduleForm.warehouse ? [scheduleForm.warehouse] : []}
                                            onSelectionChange={(keys) => setScheduleForm(prev => ({ ...prev, warehouse: Array.from(keys)[0] as string }))}
                                        >
                                            <SelectItem key="ALM001" >Almacén Principal</SelectItem>
                                            <SelectItem key="ALM002" >Almacén Secundario</SelectItem>
                                            <SelectItem key="ALM003" >Almacén Lima Norte</SelectItem>
                                        </Select>

                                        {/* Notes */}
                                        <Textarea
                                            label="Notas"
                                            placeholder="Notas adicionales sobre la entrega"
                                            value={scheduleForm.notes}
                                            onValueChange={(value) => setScheduleForm(prev => ({ ...prev, notes: value }))}
                                        />
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={handleScheduleAppointment}
                                        isLoading={isCreatingAppointment}
                                        isDisabled={!supplierData || !scheduleForm.deliveryDate || !scheduleForm.deliveryTime || !scheduleForm.deliveryTimeEnd || isCreatingAppointment}
                                    >
                                        {isCreatingAppointment ? 'Creando...' : 'Programar Entrega'}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Appointment Detail Modal */}
                

                <AppointmentDetailModal
                    isOpen={isDetailOpen}
                    onOpenChange={onDetailOpenChange}
                    appointment={selectedAppointment}
                    currentUserRole={currentUser?.role || UserRole.ADMIN}
                    onOpenPackingList={() => {
                        onDetailOpenChange();
                        onPackingListOpen();
                    }}
                    onOpenTransport={() => {
                        onDetailOpenChange();
                        onTransportOpen();
                    }}
                    onOpenDocuments={() => {
                        onDetailOpenChange();
                        onDocumentsOpen();
                    }}
                />

                {/* PackingList Modal */}
                <Modal isOpen={isPackingListOpen} onOpenChange={onPackingListOpenChange} size="4xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>Crear PackingList</ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Fecha"
                                                type="date"
                                                value={packingListForm.date}
                                                onValueChange={(value) => setPackingListForm(prev => ({ ...prev, date: value }))}
                                            />
                                            <Select
                                                label="Almacén"
                                                placeholder="Seleccione el almacén"
                                                selectedKeys={packingListForm.warehouse ? [packingListForm.warehouse] : []}
                                                onSelectionChange={(keys) => setPackingListForm(prev => ({ ...prev, warehouse: Array.from(keys)[0] as string }))}
                                            >
                                                <SelectItem key="ALM001" >Almacén Principal</SelectItem>
                                                <SelectItem key="ALM002" >Almacén Secundario</SelectItem>
                                                <SelectItem key="ALM003" >Almacén Lima Norte</SelectItem>
                                            </Select>
                                        </div>

                                        {/* Mock items - In real app, these would come from purchase orders */}
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Items del Proveedor (Filtrar por fecha)</p>
                                            <Table>
                                                <TableHeader>
                                                    <TableColumn>Seleccionar</TableColumn>
                                                    <TableColumn>Código</TableColumn>
                                                    <TableColumn>Producto</TableColumn>
                                                    <TableColumn>Pendiente</TableColumn>
                                                    <TableColumn>Cantidad</TableColumn>
                                                    <TableColumn>Unidad</TableColumn>
                                                </TableHeader>
                                                <TableBody>
                                                    {/* Mock data - replace with real data from purchase orders */}
                                                    {[
                                                        { id: '1', productCode: 'PROD001', productName: 'Producto 1', pendingQuantity: 100, unit: 'UN' },
                                                        { id: '2', productCode: 'PROD002', productName: 'Producto 2', pendingQuantity: 50, unit: 'KG' },
                                                        { id: '3', productCode: 'PROD003', productName: 'Producto 3', pendingQuantity: 200, unit: 'UN' }
                                                    ].map((item) => {
                                                        const packingItem = packingListItems.find(pi => pi.id === item.id);
                                                        return (
                                                            <TableRow key={item.id}>
                                                                <TableCell>
                                                                    <Checkbox
                                                                        isSelected={!!packingItem}
                                                                        onValueChange={(checked) => {
                                                                            if (checked) {
                                                                                setPackingListItems(prev => [...prev, {
                                                                                    id: item.id,
                                                                                    productCode: item.productCode,
                                                                                    productName: item.productName,
                                                                                    quantity: 0,
                                                                                    pendingQuantity: item.pendingQuantity,
                                                                                    unit: item.unit
                                                                                }]);
                                                                            } else {
                                                                                setPackingListItems(prev => prev.filter(pi => pi.id !== item.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{item.productCode}</TableCell>
                                                                <TableCell>{item.productName}</TableCell>
                                                                <TableCell>{item.pendingQuantity}</TableCell>
                                                                <TableCell>
                                                                    {packingItem && (
                                                                        <Input
                                                                            type="number"
                                                                            size="sm"
                                                                            value={packingItem.quantity.toString()}
                                                                            onValueChange={(value) => {
                                                                                const qty = parseInt(value) || 0;
                                                                                setPackingListItems(prev => prev.map(pi =>
                                                                                    pi.id === item.id ? { ...pi, quantity: qty } : pi
                                                                                ));
                                                                            }}
                                                                            min={0}
                                                                            max={item.pendingQuantity}
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>{item.unit}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <Textarea
                                            label="Comentario"
                                            placeholder="Comentario adicional"
                                            value={packingListForm.comment}
                                            onValueChange={(value) => setPackingListForm(prev => ({ ...prev, comment: value }))}
                                        />
                                        <Textarea
                                            label="Comentario WMS"
                                            placeholder="Comentario para WMS"
                                            value={packingListForm.commentWms}
                                            onValueChange={(value) => setPackingListForm(prev => ({ ...prev, commentWms: value }))}
                                        />
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={handleCreatePackingList}
                                        isDisabled={!packingListForm.warehouse || packingListItems.length === 0}
                                    >
                                        Crear PackingList
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Transport Data Modal */}
                <Modal isOpen={isTransportOpen} onOpenChange={onTransportOpenChange} size="2xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>Datos de Transportista</ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        <Input
                                            label="Empresa de Transporte (Opcional)"
                                            placeholder="Nombre de la empresa"
                                            value={transportForm.transportCompany}
                                            onValueChange={(value) => setTransportForm(prev => ({ ...prev, transportCompany: value }))}
                                        />
                                        <Input
                                            label="Nombre del Conductor"
                                            placeholder="Nombre completo"
                                            value={transportForm.driverName}
                                            onValueChange={(value) => setTransportForm(prev => ({ ...prev, driverName: value }))}
                                            isRequired
                                        />
                                        <Input
                                            label="Licencia de Conducir"
                                            placeholder="Número de licencia"
                                            value={transportForm.driverLicense}
                                            onValueChange={(value) => setTransportForm(prev => ({ ...prev, driverLicense: value }))}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Placa del Vehículo"
                                                placeholder="ABC-123"
                                                value={transportForm.vehiclePlate}
                                                onValueChange={(value) => setTransportForm(prev => ({ ...prev, vehiclePlate: value }))}
                                                isRequired
                                            />
                                            <Input
                                                label="Tipo de Vehículo"
                                                placeholder="Camión, Furgón, etc."
                                                value={transportForm.vehicleType}
                                                onValueChange={(value) => setTransportForm(prev => ({ ...prev, vehicleType: value }))}
                                            />
                                        </div>
                                        <Input
                                            label="Teléfono de Contacto"
                                            placeholder="+51 999 999 999"
                                            value={transportForm.contactPhone}
                                            onValueChange={(value) => setTransportForm(prev => ({ ...prev, contactPhone: value }))}
                                            isRequired
                                        />
                                        <Input
                                            label="Hora Estimada de Llegada"
                                            type="time"
                                            value={transportForm.estimatedArrival}
                                            onValueChange={(value) => setTransportForm(prev => ({ ...prev, estimatedArrival: value }))}
                                        />
                                        <Textarea
                                            label="Notas"
                                            placeholder="Notas adicionales"
                                            value={transportForm.notes}
                                            onValueChange={(value) => setTransportForm(prev => ({ ...prev, notes: value }))}
                                        />
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={handleSaveTransportData}
                                        isDisabled={!transportForm.driverName || !transportForm.vehiclePlate}
                                    >
                                        Guardar
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Documents Modal */}
                <Modal isOpen={isDocumentsOpen} onOpenChange={onDocumentsOpenChange} size="2xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>Cargar Documentos</ModalHeader>
                                <ModalBody>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Factura</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && selectedAppointment) {
                                                        handleUploadDocument('invoice', file);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Orden de Compra</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && selectedAppointment) {
                                                        handleUploadDocument('purchaseOrder', file);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold mb-2">Guía de Remisión</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && selectedAppointment) {
                                                        handleUploadDocument('deliveryGuide', file);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold mb-2">CDR</p>
                                            <input
                                                type="file"
                                                accept=".pdf,.xml"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && selectedAppointment) {
                                                        handleUploadDocument('cdr', file);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold mb-2">XML</p>
                                            <input
                                                type="file"
                                                accept=".xml"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && selectedAppointment) {
                                                        handleUploadDocument('xml', file);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose}>
                                        Cerrar
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </Dashboard>
    );
};

export default Agenda;

