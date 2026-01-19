// src/pages/Agenda/index.tsx
import React, {useState, useMemo, useEffect, useRef} from 'react';
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
    Checkbox,
    Divider
} from "@heroui/react";
import {
    PlusIcon,
    ArrowLeftIcon,
    ArrowRightIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAgendaStore } from "@/store/agendaStore";
import { useAuth } from "@/store/authStore";
import { UserRole } from "@/routes/menuTypes";
import { DeliveryAppointment, PackingListItem } from "@/store/types";
import AppointmentDetailModal from './AppointmentDetailModal';
import ScheduleAppointmentModal from './Scheduleappointmentmodal';
import { fetchPackingListFromApi, createPackingListInApi, PackingListApiRecord, fetchWarehousesFromApi, WarehouseApiRecord, fetchDocumentsFromApi, DocumentApiRecord, fetchDocumentDetailFromApi, uploadFileToPackingList } from "@/services/agenda/packingListApi";
import { formatDateForAPI } from "@/services/agenda/appointmentsApi";
import DocumentsModal from './DocumentsModal';

const Agenda: React.FC = () => {
    const { currentUser } = useAuth();
    const {
        appointments,
        selectedAppointment,
        isLoadingAppointments,
        appointmentsError,
        updateAppointment,
        setSelectedAppointment,
        lookupSupplierByRUC,
        addPackingList,
        addTransportData,
        addDocument,
        loadAppointmentsFromApi,
        createAppointmentFromApi,
        updateAppointmentFromApi
    } = useAgendaStore();

    console.log("SELECTED APPOINTMENT INDEX: ", selectedAppointment);

    // State
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [, setSelectedDate] = useState<string | null>(null);
    const [, setSelectedTimeSlot] = useState<string | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
    const [supplierData, setSupplierData] = useState<any>(null);
    const [packingListItems, setPackingListItems] = useState<PackingListItem[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [scrollbarWidth, setScrollbarWidth] = useState<number>(0);

    // Modals
    const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onOpenChange: onScheduleOpenChange } = useDisclosure();
    
    // Handle modal close - limpiar todo el estado
    const handleScheduleModalClose = () => {
        // Limpiar todos los estados relacionados con el modal
        setSupplierData(null);
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
        setIsLookingUp(false);
        setIsCreatingAppointment(false);
        onScheduleOpenChange();
    };
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
        number: '', // Número de PackingList (debe venir de orden de compra)
        inboundType: 'OCNAC', // Tipo de entrada
        ticket: '', // Ticket WMS
        items: [] as PackingListItem[]
    });
    const [packingListsFromApi, setPackingListsFromApi] = useState<PackingListApiRecord[]>([]);
    const [isLoadingPackingLists, setIsLoadingPackingLists] = useState(false);
    const [warehouses, setWarehouses] = useState<WarehouseApiRecord[]>([]);
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
    const [documents, setDocuments] = useState<DocumentApiRecord[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [selectedInboundType, setSelectedInboundType] = useState<'OCNAC' | 'OCINT' | ''>('');
    const [documentSearchFilter, setDocumentSearchFilter] = useState<string>('');
    const [isLoadingDocumentDetail, setIsLoadingDocumentDetail] = useState(false);
    const documentSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Filtros por columna
    const [docNumFilter, setDocNumFilter] = useState<string>('');
    const [cardCodeFilter, setCardCodeFilter] = useState<string>('');
    const [cardNameFilter, setCardNameFilter] = useState<string>('');
    const [taxDateFilter, setTaxDateFilter] = useState<string>('');
    const { isOpen: isDocumentsSelectOpen, onOpen: onDocumentsSelectOpen, onOpenChange: onDocumentsSelectOpenChange } = useDisclosure();

    // Función para convertir fecha de formato DD-MM-YYYY a Date para ordenamiento
    const parseDate = (dateStr: string): Date => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mes es 0-indexed
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return new Date(0);
    };

    // Ordenar y filtrar documentos
    const sortedAndFilteredDocuments = useMemo(() => {
        let filtered = [...documents];
        
        // Aplicar filtros
        if (docNumFilter.trim()) {
            filtered = filtered.filter(doc => 
                doc.DocNum.toLowerCase().includes(docNumFilter.toLowerCase())
            );
        }
        if (cardCodeFilter.trim()) {
            filtered = filtered.filter(doc => 
                doc.CardCode.toLowerCase().includes(cardCodeFilter.toLowerCase())
            );
        }
        if (cardNameFilter.trim()) {
            filtered = filtered.filter(doc => 
                doc.CardName.toLowerCase().includes(cardNameFilter.toLowerCase())
            );
        }
        if (taxDateFilter.trim()) {
            filtered = filtered.filter(doc => 
                doc.TaxDate.toLowerCase().includes(taxDateFilter.toLowerCase())
            );
        }
        
        // Ordenar por fecha (TaxDate) descendente (más reciente primero)
        filtered.sort((a, b) => {
            const dateA = parseDate(a.TaxDate);
            const dateB = parseDate(b.TaxDate);
            return dateB.getTime() - dateA.getTime();
        });
        
        return filtered;
    }, [documents, docNumFilter, cardCodeFilter, cardNameFilter, taxDateFilter]);

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

    // Calcular el ancho del scrollbar
    useEffect(() => {
        const calculateScrollbarWidth = () => {
            // Crear un elemento temporal para medir el scrollbar
            const outer = document.createElement('div');
            outer.style.visibility = 'hidden';
            outer.style.overflow = 'scroll';
            outer.style.width = '100px';
            outer.style.position = 'absolute';
            outer.style.top = '-9999px';
            document.body.appendChild(outer);

            const inner = document.createElement('div');
            inner.style.width = '100%';
            outer.appendChild(inner);

            const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
            document.body.removeChild(outer);

            setScrollbarWidth(scrollbarWidth);
        };

        calculateScrollbarWidth();
        window.addEventListener('resize', calculateScrollbarWidth);
        return () => window.removeEventListener('resize', calculateScrollbarWidth);
    }, []);

    // Load appointments from API when component mounts or week changes
    useEffect(() => {
        const loadAppointments = async () => {
            // Obtener RUC del usuario si es proveedor
            // El RUC está en username cuando el usuario es proveedor
            const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username 
                ? currentUser.username 
                : undefined;
            
            // Cargar citas para el rango de la semana actual
            // Si es proveedor, solo se cargarán sus citas (filtrado por RUC en el API)
            await loadAppointmentsFromApi(ruc, weekStart, weekEnd);
        };

        loadAppointments();
        // Dependencias: solo valores primitivos que realmente cambian
        // weekStart y weekEnd están memoizados basados en currentWeek, así que currentWeek.getTime() es suficiente
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWeek.getTime(), currentUser?.id, currentUser?.role, currentUser?.username]);

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

        // Nota: Para proveedores, el filtrado ya se hace en el API (por RUC)
        // Este filtro adicional es solo una medida de seguridad en el frontend
        if (currentUser?.role === UserRole.PROVEEDOR && currentUser.username) {
            filtered = filtered.filter(apt => apt.supplierRUC === currentUser.username);
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
    /*const getAppointmentsForSlot = (date: Date, time: string) => {
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
    };*/

    // Check if a time slot is available (no conflicts)
    const isTimeSlotAvailable = (date: Date, startTime: string, endTime: string, excludeAppointmentId?: string, excludeSupplierRUC?: string): boolean => {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (endMinutes <= startMinutes) return false;

        const conflictingAppointments = filteredAppointments.filter(apt => {
            // Skip the appointment being edited
            if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
            
            // Skip appointments from the same supplier (RUC) when editing
            if (excludeSupplierRUC && apt.supplierRUC === excludeSupplierRUC) return false;

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

    // Get conflicting appointments for a time slot
    const getConflictingAppointments = (date: Date, startTime: string, endTime: string, excludeAppointmentId?: string, excludeSupplierRUC?: string): Array<{
        supplierName: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
    }> => {
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (endMinutes <= startMinutes) return [];

        const conflicts = filteredAppointments.filter(apt => {
            // Skip the appointment being edited
            if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
            
            // Skip appointments from the same supplier (RUC) when editing
            if (excludeSupplierRUC && apt.supplierRUC === excludeSupplierRUC) return false;

            const aptDate = new Date(apt.deliveryDate);
            const isSameDay = aptDate.toDateString() === date.toDateString();
            
            if (!isSameDay || !apt.deliveryTime) return false;
            
            const aptStartMinutes = timeToMinutes(apt.deliveryTime);
            const aptEndMinutes = apt.deliveryTimeEnd ? timeToMinutes(apt.deliveryTimeEnd) : aptStartMinutes + 60;
            
            // Check for overlap: new appointment overlaps if it starts before existing ends and ends after existing starts
            return (startMinutes < aptEndMinutes && endMinutes > aptStartMinutes);
        });

        // Map to return only the needed fields
        return conflicts.map(apt => {
            let deliveryTimeEnd = apt.deliveryTimeEnd;
            if (!deliveryTimeEnd && apt.deliveryTime) {
                const [hours, minutes] = apt.deliveryTime.split(':').map(Number);
                const endHours = hours + 1;
                deliveryTimeEnd = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
            return {
                supplierName: apt.supplierName,
                deliveryTime: apt.deliveryTime,
                deliveryTimeEnd: deliveryTimeEnd || ''
            };
        });
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

    // Handle RUC lookup - Retorna la respuesta para que el modal la maneje
    const handleRUCLookup = async (ruc: string) => {
        if (!ruc.trim()) {
            return {
                success: false,
                message: 'El RUC no puede estar vacío'
            };
        }

        setIsLookingUp(true);
        try {
            const result = await lookupSupplierByRUC(`P${ruc.trim()}`);
            
            if (result.success && result.data) {
                // Actualizar el estado del padre para que el modal reciba el supplierData
                setSupplierData(result.data);
                setScheduleForm(prev => ({
                    ...prev,
                    supplierRUC: result.data!.supplierRUC,
                    supplierId: result.data!.supplierId,
                    supplierName: result.data!.supplierName,
                    supplierEmail: result.data!.supplierEmail,
                    supplierPhone: result.data!.supplierPhone
                }));
            }
            
            // Retornar el resultado para que el modal lo maneje
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al consultar proveedor';
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setIsLookingUp(false);
        }
    };

    // State para modo edición
    const [editingAppointment, setEditingAppointment] = useState<{
        docEntry: string;
        supplierRUC: string;
        supplierName: string;
        deliveryDate: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
        warehouse?: string;
        notes?: string;
    } | null>(null);

    // Handle schedule appointment (crear o actualizar)
    const handleScheduleAppointment = async (formData?: any) => {
        // Si no se pasa formData, usar scheduleForm (compatibilidad con código anterior)
        const data = formData || scheduleForm;
        if (!data.deliveryDate || !data.deliveryTime || !data.deliveryTimeEnd || (!data.supplierId && !editingAppointment)) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        const startMinutes = timeToMinutes(data.deliveryTime);
        const endMinutes = timeToMinutes(data.deliveryTimeEnd);
        
        if (endMinutes <= startMinutes) {
            alert('La hora de fin debe ser posterior a la hora de inicio');
            return;
        }

        // Check for time slot conflicts (excluir la cita actual si está en modo edición)
        const deliveryDate = new Date(data.deliveryDate);
        const excludeAppointmentId = editingAppointment ? selectedAppointment?.id : undefined;
        if (!isTimeSlotAvailable(deliveryDate, data.deliveryTime, data.deliveryTimeEnd, excludeAppointmentId)) {
            alert('El horario seleccionado ya está ocupado. Por favor seleccione otro horario.');
            return;
        }

        setIsCreatingAppointment(true);
        try {
            if (editingAppointment) {
                // Modo edición: actualizar la cita
                await updateAppointmentFromApi(editingAppointment.docEntry, {
                    supplierRUC: data.supplierRUC,
                    supplierName: data.supplierName,
                    deliveryDate: data.deliveryDate,
                    deliveryTime: data.deliveryTime,
                    deliveryTimeEnd: data.deliveryTimeEnd,
                    description: data.notes,
                    warehouse: data.warehouse,
                    active: 'Y'
                });

                alert('Cita actualizada exitosamente');
            } else {
                // Modo creación: crear nueva cita
                const newAppointment = await createAppointmentFromApi({
                    supplierRUC: data.supplierRUC,
                    supplierName: data.supplierName,
                    deliveryDate: data.deliveryDate,
                    deliveryTime: data.deliveryTime,
                    deliveryTimeEnd: data.deliveryTimeEnd,
                    description: data.notes,
                    warehouse: data.warehouse,
                    active: 'Y'
                });

                alert(`Cita programada exitosamente. Número de cita: ${newAppointment.appointmentNumber}`);
            }
            
            // Recargar citas del API según el rol del usuario
            const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username 
                ? currentUser.username 
                : undefined;
            
            await loadAppointmentsFromApi(ruc, weekStart, weekEnd);
            
            // Reset form y cerrar modal
            setEditingAppointment(null);
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
            handleScheduleModalClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : (editingAppointment ? 'Error al actualizar la cita' : 'Error al crear la cita');
            alert(errorMessage);
            console.error('Error:', error);
        } finally {
            setIsCreatingAppointment(false);
        }
    };

    // Handle edit appointment
    const handleEditAppointment = () => {
        if (!selectedAppointment || !selectedAppointment.docEntry) {
            alert('No se puede editar esta cita. Falta el DocEntry.');
            return;
        }

        // Configurar modo edición
        setEditingAppointment({
            docEntry: selectedAppointment.docEntry,
            supplierRUC: selectedAppointment.supplierRUC,
            supplierName: selectedAppointment.supplierName,
            deliveryDate: selectedAppointment.deliveryDate,
            deliveryTime: selectedAppointment.deliveryTime,
            deliveryTimeEnd: selectedAppointment.deliveryTimeEnd,
            warehouse: selectedAppointment.warehouse,
            notes: selectedAppointment.notes
        });

        // Configurar supplierData para el modal
        setSupplierData({
            supplierId: selectedAppointment.supplierId,
            supplierName: selectedAppointment.supplierName,
            supplierEmail: selectedAppointment.supplierEmail,
            supplierPhone: selectedAppointment.supplierPhone,
            supplierRUC: selectedAppointment.supplierRUC
        });

        // Abrir modal de programación
        onScheduleOpen();
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

    // Load PackingList from API when modal opens
    useEffect(() => {
        if (isPackingListOpen && selectedAppointment) {
            const loadPackingLists = async () => {
                setIsLoadingPackingLists(true);
                try {
                    // Usar las fechas de la semana actual o la fecha de la cita
                    const fechaInicio = formatDateForAPI(weekStart);
                    const fechaFin = formatDateForAPI(weekEnd);
                    
                    // Si hay docEntry, filtrar por CodCita
                    const codCita = selectedAppointment.docEntry;
                    const packingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, codCita);
                    
                    setPackingListsFromApi(packingLists);
                } catch (error) {
                    console.error('Error al cargar PackingList:', error);
                    alert('Error al cargar PackingList del API');
                } finally {
                    setIsLoadingPackingLists(false);
                }
            };
            
            loadPackingLists();
        } else {
            setPackingListsFromApi([]);
        }
    }, [isPackingListOpen, selectedAppointment, weekStart, weekEnd]);

    // Load warehouses from API when modal opens
    useEffect(() => {
        if (isPackingListOpen) {
            const loadWarehouses = async () => {
                setIsLoadingWarehouses(true);
                try {
                    const warehousesData = await fetchWarehousesFromApi();
                    setWarehouses(warehousesData);
                } catch (error) {
                    console.error('Error al cargar almacenes:', error);
                    alert('Error al cargar almacenes del API');
                } finally {
                    setIsLoadingWarehouses(false);
                }
            };
            
            loadWarehouses();
        }
    }, [isPackingListOpen]);

    // Pre-llenar campos del formulario cuando se abre el modal desde un appointment
    useEffect(() => {
        if (isPackingListOpen && selectedAppointment) {
            // Pre-llenar fecha con la fecha de la cita si está disponible
            if (selectedAppointment.deliveryDate && !packingListForm.date) {
                setPackingListForm(prev => ({
                    ...prev,
                    date: selectedAppointment.deliveryDate // Usar la fecha de la cita, no la de hoy
                }));
            }
        } else if (!isPackingListOpen) {
            // Resetear estados cuando se cierra el modal
            setSelectedInboundType('');
            setDocuments([]);
            setDocumentSearchFilter('');
        }
    }, [isPackingListOpen, selectedAppointment?.deliveryDate]);


    // Handle create packing list
    const handleCreatePackingList = async () => {
        if (!selectedAppointment || !selectedAppointment.docEntry || !packingListForm.warehouse || packingListItems.length === 0) {
            alert('Por favor complete todos los campos requeridos. Asegúrese de que la cita tenga DocEntry.');
            return;
        }

        // Validar que haya número de PackingList (debe venir de orden de compra)
        if (!packingListForm.number || !packingListForm.number.trim()) {
            alert('El número de PackingList es requerido. Debe venir de una orden de compra.');
            return;
        }
        
        // Obtener VendorId (cardCode del proveedor)
        // El VendorId puede venir en formato: P + RUC, PE + RUC, o solo cardCode
        // Por ahora, intentar usar el supplierId directamente o agregar prefijo P si es RUC
        let vendorId = selectedAppointment.supplierId || selectedAppointment.supplierRUC;
        // Si el supplierId no tiene prefijo P, agregarlo (formato común: P + RUC)
        if (vendorId && !vendorId.startsWith('P')) {
            vendorId = `P${vendorId}`;
        }
        
        try {
            const data = {
                vendorId: vendorId,
                whsCode: packingListForm.warehouse,
                number: packingListForm.number.trim(),
                inboundType: packingListForm.inboundType || 'OCNAC',
                comments: packingListForm.comment || '',
                dateExpected: packingListForm.date || new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
                ticket: "0", // Ticket WMS
                wmsResponse: packingListForm.commentWms || '',
                codCita: selectedAppointment.docEntry,
                _detallePackinList: packingListItems.map((item, index) => ({
                    document: (item as any).document || 0, // Número de documento de orden de compra (debe venir del item)
                    lineNumber: index + 1,
                    itemCode: item.productCode,
                    itemName: item.productName,
                    quantity: item.quantity
                }))};

                console.log("DATA: ", data);
            // Crear PackingList en el API
            await createPackingListInApi({
                vendorId: vendorId,
                whsCode: packingListForm.warehouse,
                number: packingListForm.number.trim(),
                inboundType: packingListForm.inboundType || 'OCNAC',
                comments: packingListForm.comment || '',
                dateExpected: packingListForm.date || new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
                ticket: packingListForm.ticket || '', // Ticket WMS
                wmsResponse: packingListForm.commentWms || '',
                codCita: selectedAppointment.docEntry,
                _detallePackinList: packingListItems.map((item, index) => ({
                    document: (item as any).document || 0, // Número de documento de orden de compra (debe venir del item)
                    lineNumber: index + 1,
                    itemCode: item.productCode,
                    itemName: item.productName,
                    quantity: item.quantity
                }))
            });

            // Actualizar estado local
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
            
            alert('PackingList creado exitosamente en el sistema.');

            // Recargar PackingList del API
            const fechaInicio = formatDateForAPI(weekStart);
            const fechaFin = formatDateForAPI(weekEnd);
            const codCita = selectedAppointment.docEntry;
            const packingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, codCita);
            setPackingListsFromApi(packingLists);

            // Reset and close
            setPackingListForm({
                date: '',
                warehouse: '',
                comment: '',
                commentWms: '',
                number: '',
                inboundType: 'OCNAC',
                ticket: '',
                items: [] as PackingListItem[]
            });
            setPackingListItems([]);
            onPackingListOpenChange();
            onDetailOpenChange();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear PackingList';
            alert(`Error al crear PackingList: ${errorMessage}`);
            console.error('Error al crear PackingList:', error);
        }
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
    const handleUploadDocument = async (type: string, file: File): Promise<void> => {
        if (!selectedAppointment) {
            throw new Error('No hay cita seleccionada');
        }

        if (!selectedAppointment.docEntry) {
            throw new Error('La cita no tiene código (DocEntry). No se puede subir el archivo.');
        }

        const documentType = type as 'invoice' | 'purchaseOrder' | 'deliveryGuide' | 'cdr' | 'xml';
        
        try {
            // Subir archivo al API
            const uploadResult = await uploadFileToPackingList(file, type, selectedAppointment.docEntry);
            
            // Guardar en el estado local también
            const document: any = {
                id: `doc-${Date.now()}`,
                name: uploadResult.nameFile,
                originalName: file.name,
                type: file.type,
                url: uploadResult.urlArchivo,
                uploadDate: new Date().toISOString(),
                uploadedBy: currentUser?.id || 'system'
            };

            addDocument(selectedAppointment.id, documentType, document);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir archivo';
            throw new Error(errorMessage);
        }
    };

    // Get status color
    /*const getStatusColor = (status: string) => {
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
    };*/

    // Get status icon
    /*const getStatusIcon = (status: string) => {
        if (status === 'ListaParaEntrega' || status === 'Completada') {
            return <CheckCircleIcon className="w-4 h-4" />;
        }
        if (status === 'Cancelada') {
            return <XCircleIcon className="w-4 h-4" />;
        }
        return <ClockIcon className="w-4 h-4" />;
    };*/

    // Check if user can create appointments
    const canCreateAppointment = currentUser?.role === UserRole.ADMIN || 
                                 currentUser?.role === UserRole.COMPRAS ||
                                 currentUser?.role === UserRole.ALMACEN;

    return (
        <Dashboard>
            <div className="relative min-h-screen pb-8">
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

                {/* Weekly Calendar - Modern Design */}
                <Card
                    className="shadow-lg border-r-0 rounded-none flex flex-col"
                    style={{
                        minHeight: 'calc(100vh - 100px)', // Ajusta '100px' si tu header/márgenes superiores ocupan más/menos
                        height: 'calc(100vh - 100px)',   // Opcional, asegura altura mínima y fija
                    }}
                >
                    <CardHeader className="border-b border-gray-200 bg-gray-50 py-2 px-4 rounded-none">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
                            {/* Left section: Navigation and Title */}
                            <div className="flex items-center gap-2 flex-shrink-0">
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
                                <span className="block min-w-[160px] px-2 text-center">
                                    <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap leading-none">
                                        {weekStart.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                                    </h2>
                                </span>
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
                            {/* Center section: Status Filter */}
                            <div className="flex items-center flex-1 min-w-[180px] justify-center">
                                <Select
                                    label="Estado"
                                    selectedKeys={[filterStatus]}
                                    onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                                    className="max-w-xs min-w-[170px]"
                                    size="sm"
                                >
                                    <SelectItem key="all" >Todos</SelectItem>
                                    <SelectItem key="Pendiente" >Pendiente</SelectItem>
                                    <SelectItem key="PackingListCompletado" >PackingList Completado</SelectItem>
                                    <SelectItem key="TransporteCompletado" >Transporte Completado</SelectItem>
                                    <SelectItem key="ListaParaEntrega" >Lista para Entrega</SelectItem>
                                    <SelectItem key="Completada" >Completada</SelectItem>
                                </Select>
                            </div>
                            {/* Right section: Info */}
                            <div className="flex items-center gap-2 flex-shrink-0 justify-end min-w-[150px]">
                                {isLoadingAppointments && (
                                    <Chip color="primary" variant="flat" size="sm">
                                        Cargando...
                                    </Chip>
                                )}
                                <Chip color="primary" variant="flat" size="lg">
                                    {filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'} esta semana
                                </Chip>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody
                        className="p-0 rounded-none flex-1 flex flex-col"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {appointmentsError && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-none">
                                <p className="font-semibold">Error al cargar citas</p>
                                <p className="text-sm">{appointmentsError}</p>
                            </div>
                        )}
                        {isLoadingAppointments && !appointmentsError && (
                            <div className="p-8 text-center rounded-none">
                                <p className="text-gray-500">Cargando citas...</p>
                            </div>
                        )}
                        {!isLoadingAppointments && (
                            <div className="overflow-x-auto rounded-none flex-1 flex flex-col min-h-0">
                                {/* Contenedor común para mantener el mismo ancho */}
                                <div className="min-w-full w-full flex-1 flex flex-col min-h-0" style={{ position: 'relative', minHeight: 0 }}>
                                    {/* Header with days - Fijo en la parte superior */}
                                    <div 
                                        className="grid border-b border-gray-200 bg-white sticky top-0 z-20 rounded-none"
                                        style={{ 
                                            gridTemplateColumns: '80px repeat(7, 1fr)',
                                            boxSizing: 'border-box',
                                            width: '100%',
                                            paddingRight: `${scrollbarWidth}px` // Compensar el scrollbar del body
                                        }}
                                    >
                                        <div className="p-2 text-xs font-semibold text-gray-500 border-r border-gray-200">
                                            Hora
                                        </div>
                                        {weekDays.map((day, index) => {
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            const dayName = day.toLocaleDateString('es-PE', { weekday: 'short' }).toUpperCase();
                                            const dayNumber = day.getDate();
                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-2 text-center border-r border-gray-200 last:border-r-0 ${
                                                        isToday ? 'bg-blue-50' : 'bg-white'
                                                    }`}
                                                >
                                                    <div className={`text-sm font-semibold ${
                                                        isToday 
                                                            ? 'text-blue-600' 
                                                            : 'text-gray-900'
                                                    }`}>
                                                        {dayName} {dayNumber}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Time slots - Contenedor con scroll vertical */}
                                    <div 
                                        className="relative overflow-y-auto overflow-x-hidden flex-1 min-h-0"
                                        style={{ 
                                            // El CardBody/Flex asegura que esto siempre llene todo el espacio vertical disponible
                                            height: '100%',
                                            width: '100%',
                                        }}
                                    >
                                        {timeSlots.map((time) => (
                                            <div 
                                                key={time} 
                                                className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                style={{ 
                                                    gridTemplateColumns: '80px repeat(7, 1fr)',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                {/* Time label - Columna estrecha y sticky */}
                                                <div className="p-2 text-xs font-medium text-gray-500 border-r border-gray-200 bg-gray-50 flex items-center justify-end pr-2 sticky left-0 z-10 shadow-sm">
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
                                                            className={`min-h-[60px] p-2 border-r border-gray-100 last:border-r-0 relative ${
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
                                                                            className={`absolute left-1 right-1 p-1.5 text-xs shadow-sm border-l-2 ${getStatusStyles()}`}
                                                                            style={{
                                                                                borderRadius: 0,
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
                <ScheduleAppointmentModal
                    isOpen={isScheduleOpen}
                    supplierData={supplierData}
                    onOpenChange={() => {
                        setEditingAppointment(null);
                        handleScheduleModalClose();
                    }}
                    onSchedule={handleScheduleAppointment}
                    onLookupRUC={handleRUCLookup}
                    timeSlots={timeSlots}
                    isCreating={isCreatingAppointment}
                    isLookingUp={isLookingUp}
                    isTimeSlotAvailable={isTimeSlotAvailable}
                    getConflictingAppointments={getConflictingAppointments}
                    prefilledDate={scheduleForm.deliveryDate}
                    prefilledTime={scheduleForm.deliveryTime}
                    editingAppointment={editingAppointment}
                />

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
                    onEdit={handleEditAppointment}
                />

                {/* PackingList Modal */}
                <Modal isOpen={isPackingListOpen} onOpenChange={onPackingListOpenChange} size="4xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <div className="flex items-center justify-between w-full">
                                        <span>PackingList</span>
                                        <div className="flex gap-2 px-6 items-center">
                                            <Select
                                                label="Tipo de Entrada"
                                                size='sm'
                                                variant="flat"
                                                placeholder="Seleccione el tipo"
                                                selectedKeys={selectedInboundType ? [selectedInboundType] : []}
                                                onSelectionChange={(keys) => {
                                                    const selected = Array.from(keys)[0] as 'OCNAC' | 'OCINT' | '';
                                                    setSelectedInboundType(selected);
                                                    setPackingListForm(prev => ({ ...prev, inboundType: selected || 'OCNAC' }));
                                                    // Limpiar datos del documento cuando cambia el tipo
                                                    setPackingListForm(prev => ({ ...prev, number: '' }));
                                                    setDocuments([]);
                                                }}
                                                className="min-w-[200px]"
                                            >
                                                <SelectItem key="OCNAC">Compras Nacionales</SelectItem>
                                                <SelectItem key="OCINT">Importaciones</SelectItem>
                                            </Select>
                                            {selectedInboundType && (
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    className="px-6"
                                                    onPress={async () => {
                                                        if (!selectedInboundType) {
                                                            alert('Por favor seleccione un tipo de entrada primero');
                                                            return;
                                                        }
                                                        
                                                        // Si ya hay documentos cargados para este tipo, solo abrir el modal
                                                        if (documents.length > 0 && packingListForm.inboundType === selectedInboundType) {
                                                            onDocumentsSelectOpen();
                                                            return;
                                                        }
                                                        
                                                        setIsLoadingDocuments(true);
                                                        try {
                                                            const docs = await fetchDocumentsFromApi(selectedInboundType, undefined, selectedAppointment?.supplierRUC);
                                                            setDocuments(docs);
                                                            if (docs.length === 0) {
                                                                alert('No se encontraron documentos para el tipo seleccionado');
                                                            } else {
                                                                onDocumentsSelectOpen();
                                                            }
                                                        } catch (error) {
                                                            console.error('Error al cargar documentos:', error);
                                                            alert('Error al cargar documentos del API');
                                                        } finally {
                                                            setIsLoadingDocuments(false);
                                                        }
                                                    }}
                                                    isLoading={isLoadingDocuments}
                                                >
                                                    {documents.length > 0 && packingListForm.inboundType === selectedInboundType 
                                                        ? 'Ver Documentos' 
                                                        : 'Buscar Documentos'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="space-y-6">
                                        {/* Listado de PackingList existentes - Se muestra en el Modal de Detalle de Cita */}

                                        {isLoadingPackingLists && (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-gray-500">Cargando PackingList...</p>
                                            </div>
                                        )}

                                        {!isLoadingPackingLists && packingListsFromApi.length === 0 && (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-gray-500">No se encontraron PackingList para el rango de fechas seleccionado.</p>
                                            </div>
                                        )}

                                        <Divider />

                                        {/* Formulario para crear nuevo PackingList */}
                                        <div className='py-2 flex flex-col gap-4'>
                                            <h4 className="text-md font-semibold mb-3">Crear Nuevo PackingList</h4>
                                            {selectedAppointment?.docEntry && (
                                                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                                    <strong>Código de Cita:</strong> {selectedAppointment.docEntry} (se usará automáticamente)
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    label="N° Orden de Compra"
                                                    size='sm'
                                                    value={packingListForm.number}
                                                    onValueChange={(value) => setPackingListForm(prev => ({ ...prev, date: value }))}
                                                    isRequired
                                                    isReadOnly
                                                />
                                                <Input
                                                    label="Número de PackingList"
                                                    placeholder="Ej: 251047379_1"
                                                    size='sm'
                                                    value={packingListForm.number}
                                                    onValueChange={(value) => setPackingListForm(prev => ({ ...prev, number: value }))}
                                                    isRequired
                                                    description="Número de PackingList (se completa al seleccionar un documento)"
                                                    isReadOnly
                                                    endContent={
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => {
                                                                if (!selectedInboundType) {
                                                                    alert('Por favor seleccione un tipo de entrada primero');
                                                                    return;
                                                                }
                                                                onDocumentsSelectOpen();
                                                            }}
                                                        >
                                                            Seleccionar
                                                        </Button>
                                                    }
                                                />
                                                <Input
                                                    label="Fecha Entrega"
                                                    type="date"
                                                    size='sm'
                                                    value={packingListForm.date}
                                                    onValueChange={(value) => setPackingListForm(prev => ({ ...prev, date: value }))}
                                                    isRequired
                                                />
                                                <Select
                                                    label="Almacén"
                                                    size="sm"
                                                    variant="flat"
                                                    placeholder={isLoadingWarehouses ? "Cargando almacenes..." : "Seleccione el almacén"}
                                                    selectedKeys={packingListForm.warehouse ? new Set([packingListForm.warehouse]) : new Set()}
                                                    onSelectionChange={(keys) => {
                                                        // keys viene como Set en HeroUI
                                                        const keysArray = Array.from(keys);
                                                        const value = keysArray.length > 0 ? keysArray[0] : '';
                                                        console.log("ALMACEN SELECCIONADO: ", value);
                                                        setPackingListForm(prev => ({ ...prev, warehouse: value as string }));
                                                    }}
                                                    className="min-w-[200px]"
                                                    isRequired
                                                    isDisabled={isLoadingWarehouses}
                                                    selectionMode="single"
                                                >
                                                    {warehouses.map((warehouse) => (
                                                        <SelectItem key={warehouse.Codigo} textValue={`${warehouse.Almacen} (${warehouse.Codigo})`}>
                                                            {warehouse.Almacen} ({warehouse.Codigo})
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                                {/*<Input
                                                    label="Ticket WMS (Opcional)"
                                                    placeholder="Ej: 1082989"
                                                    size='sm'
                                                    value={packingListForm.ticket}
                                                    onValueChange={(value) => setPackingListForm(prev => ({ ...prev, ticket: value }))}
                                                />*/}
                                            </div>

                                        {/* Items del documento seleccionado */}
                                        {packingListItems.length > 0 ? (
                                            <div>
                                                <p className="text-sm font-semibold mb-2">Items del Documento</p>
                                                <Table>
                                                    <TableHeader>
                                                        <TableColumn width={50}>Sel</TableColumn>
                                                        <TableColumn>Código</TableColumn>
                                                        <TableColumn>Producto</TableColumn>
                                                        <TableColumn>Cantidad OC</TableColumn>
                                                        <TableColumn>Pendiente</TableColumn>
                                                        <TableColumn>Cantidad</TableColumn>
                                                        
                                                    </TableHeader>
                                                    <TableBody>
                                                        {packingListItems.map((item) => {
                                                            return (
                                                                <TableRow key={item.id}>
                                                                    <TableCell>
                                                                        <Checkbox
                                                                            isSelected={item.marca ?? false}
                                                                            onValueChange={(checked) => {
                                                                                setPackingListItems(prev => prev.map(pi =>
                                                                                    pi.id === item.id ? { ...pi, marca: checked } : pi
                                                                                ));
                                                                                if (!checked) {
                                                                                    setPackingListItems(prev => prev.map(pi =>
                                                                                        pi.id === item.id ? { ...pi, quantity: 0 } : pi
                                                                                    ));
                                                                                }
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>{item.productCode}</TableCell>
                                                                    <TableCell>{item.productName}</TableCell>
                                                                    <TableCell>{item.cantidadOC ?? 0}</TableCell>
                                                                    <TableCell>{item.pendingQuantity}</TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="number"
                                                                            size="sm"
                                                                            value={item.quantity.toString()}
                                                                            disabled ={!item.marca}
                                                                            onValueChange={(value) => {
                                                                                const qty = parseInt(value) || 0;
                                                                                setPackingListItems(prev => prev.map(pi =>
                                                                                    pi.id === item.id ? { ...pi, quantity: qty } : pi
                                                                                ));
                                                                            }}
                                                                            min={0}
                                                                            max={item.pendingQuantity}
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : packingListForm.number ? (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <h3 className="text-sm font-medium text-yellow-800">
                                                            No hay detalles disponibles
                                                        </h3>
                                                        <div className="mt-2 text-sm text-yellow-700">
                                                            <p>El documento seleccionado no tiene items. No se puede crear el PackingList sin detalles.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}

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
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={handleCreatePackingList}
                                        isDisabled={
                                            !packingListForm.warehouse || 
                                            !packingListForm.number || 
                                            !packingListForm.date ||
                                            //packingListItems.some(item => item.quantity < item.pendingQuantity) ||
                                            packingListItems.length === 0
                                        }
                                    >
                                        Crear PackingList
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Document Selection Modal */}
                <Modal isOpen={isDocumentsSelectOpen} onOpenChange={onDocumentsSelectOpenChange} size="5xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => {
                            // Función para buscar documentos con debounce
                            const handleSearchChange = (value: string) => {
                                setDocumentSearchFilter(value);
                                // Limpiar timeout anterior
                                if (documentSearchTimeoutRef.current) {
                                    clearTimeout(documentSearchTimeoutRef.current);
                                }
                                
                                // Si no hay tipo seleccionado, no buscar
                                if (!selectedInboundType) {
                                    return;
                                }
                                
                                // Crear nuevo timeout para debounce (500ms)
                                documentSearchTimeoutRef.current = setTimeout(async () => {
                                    setIsLoadingDocuments(true);
                                    try {
                                        const docs = await fetchDocumentsFromApi(
                                            selectedInboundType, 
                                            value ? value.trim() : undefined,
                                            selectedAppointment?.supplierRUC
                                        );
                                        setDocuments(docs);
                                    } catch (error) {
                                        console.error('Error al buscar documentos:', error);
                                        alert('Error al buscar documentos');
                                    } finally {
                                        setIsLoadingDocuments(false);
                                    }
                                }, 500);
                            };

                            return (
                                <>
                                    <ModalHeader>
                                        <div className="flex flex-col gap-2 w-full">
                                            <span>Seleccionar Documento - {selectedInboundType === 'OCNAC' ? 'Compras Nacionales' : 'Importaciones'}</span>
                                            <Input
                                                size="sm"
                                                placeholder="Buscar por número de documento (DocNum)..."
                                                value={documentSearchFilter}
                                                onValueChange={handleSearchChange}
                                                classNames={{
                                                    input: "text-sm"
                                                }}
                                            />
                                        </div>
                                    </ModalHeader>
                                    <ModalBody>
                                        {isLoadingDocuments ? (
                                            <div className="text-center py-8">
                                                <p className="text-sm text-gray-500">Cargando documentos...</p>
                                            </div>
                                        ) : documents.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-sm text-gray-500">No se encontraron documentos. Ingrese un número de documento para buscar.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Table aria-label="Tabla de documentos">
                                                    <TableHeader>
                                                        <TableColumn width={150}>
                                                            <div className="flex flex-col gap-1">
                                                                <span>DOCNUM</span>
                                                                <Input
                                                                    size="sm"
                                                                    label="DOCNUM"
                                                                    placeholder="Filtrar..."
                                                                    value={docNumFilter}
                                                                    onValueChange={setDocNumFilter}
                                                                    classNames={{
                                                                        input: "h-8 text-xs"
                                                                    }}
                                                                    onClear={() => setDocNumFilter('')}
                                                                    isClearable
                                                                />
                                                            </div>
                                                        </TableColumn>
                                                        <TableColumn width={150}>
                                                            <div className="flex flex-col gap-1">
                                                                <span>CARDCODE</span>
                                                                <Input
                                                                    size="sm"
                                                                    placeholder="Filtrar..."
                                                                    value={cardCodeFilter}
                                                                    onValueChange={setCardCodeFilter}
                                                                    classNames={{
                                                                        input: "h-8 text-xs"
                                                                    }}
                                                                    onClear={() => setCardCodeFilter('')}
                                                                    isClearable
                                                                />
                                                            </div>
                                                        </TableColumn>
                                                        <TableColumn>
                                                            <div className="flex flex-col gap-1">
                                                                <span>CARDNAME</span>
                                                                <Input
                                                                    size="sm"
                                                                    placeholder="Filtrar..."
                                                                    value={cardNameFilter}
                                                                    onValueChange={setCardNameFilter}
                                                                    classNames={{
                                                                        input: "h-8 text-xs"
                                                                    }}
                                                                    onClear={() => setCardNameFilter('')}
                                                                    isClearable
                                                                />
                                                            </div>
                                                        </TableColumn>
                                                        <TableColumn width={120}>
                                                            <div className="flex flex-col gap-1">
                                                                <span>TAXDATE</span>
                                                                <Input
                                                                    size="sm"
                                                                    placeholder="Filtrar..."
                                                                    value={taxDateFilter}
                                                                    onValueChange={setTaxDateFilter}
                                                                    classNames={{
                                                                        input: "h-8 text-xs"
                                                                    }}
                                                                    onClear={() => setTaxDateFilter('')}
                                                                    isClearable
                                                                />
                                                            </div>
                                                        </TableColumn>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {sortedAndFilteredDocuments.map((doc) => (
                                                            <TableRow 
                                                                key={doc.DocEntry}
                                                                className="cursor-pointer hover:bg-gray-100 transition-colors"
                                                                onClick={async () => {
                                                                    if (!selectedInboundType) {
                                                                        alert('Tipo de entrada no seleccionado');
                                                                        return;
                                                                    }
                                                                    
                                                                    setIsLoadingDocumentDetail(true);
                                                                    try {
                                                                        // Obtener el detalle del documento
                                                                        const detailItems = await fetchDocumentDetailFromApi(doc.DocNum, selectedInboundType);
                                                                        
                                                                        // Validar si el detalle está vacío
                                                                        if (!detailItems || detailItems.length === 0) {
                                                                            alert('El documento seleccionado no tiene detalles. No se puede crear el PackingList sin items.');
                                                                            setIsLoadingDocumentDetail(false);
                                                                            return;
                                                                        }
                                                                        
                                                                        // Completar el formulario con los datos del documento
                                                                        setPackingListForm(prev => ({
                                                                            ...prev,
                                                                            number: doc.DocNum,
                                                                            inboundType: selectedInboundType || 'OCNAC'
                                                                        }));
                                                                        
                                                                        // Llenar la tabla de items
                                                                        const items: PackingListItem[] = detailItems.map((item, index: number) => {
                                                                            // Convertir Marca de string a boolean (puede ser "True", "False", "true", "false", etc.)
                                                                            const marca = item.Marca?.toLowerCase() === 'true' || item.Marca === '1';
                                                                            
                                                                            // Parsear Cantidad OC (puede venir como "Cantidad OC" o "CantidadOC")
                                                                            const cantidadOC = parseFloat(item["Cantidad OC"] || item.CantidadOC || "0");
                                                                            
                                                                            // Parsear Pendiente
                                                                            const pendiente = parseFloat(item.Pendiente || "0");
                                                                            
                                                                            return {
                                                                                id: `${doc.DocNum}-${item.Artículo}-${index}`,
                                                                                productCode: item.Artículo,
                                                                                productName: item.Descripción,
                                                                                quantity: 0,
                                                                                pendingQuantity: pendiente,
                                                                                cantidadOC: cantidadOC,
                                                                                marca: marca,
                                                                                unit: 'UN'
                                                                            };
                                                                        });
                                                                        setPackingListItems(items);
                                                                        
                                                                        onClose();
                                                                    } catch (error) {
                                                                        console.error('Error al obtener detalle del documento:', error);
                                                                        alert('Error al obtener detalle del documento');
                                                                    } finally {
                                                                        setIsLoadingDocumentDetail(false);
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell className="whitespace-nowrap">{doc.DocNum}</TableCell>
                                                                <TableCell className="whitespace-nowrap">{doc.CardCode}</TableCell>
                                                                <TableCell>
                                                                    <div className="max-w-[400px] truncate" title={doc.CardName}>
                                                                        {doc.CardName}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap">{doc.TaxDate}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button variant="light" onPress={onClose}>
                                            Cerrar
                                        </Button>
                                    </ModalFooter>
                                </>
                            );
                        }}
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
                <DocumentsModal
                    isOpen={isDocumentsOpen}
                    onOpenChange={onDocumentsOpenChange}
                    selectedAppointment={selectedAppointment}
                    handleUploadDocument={handleUploadDocument}
                />
            </div>
        </Dashboard>
    );
};

export default Agenda;

