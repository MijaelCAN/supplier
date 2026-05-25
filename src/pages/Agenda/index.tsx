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
    ArrowRightIcon,
    CalendarDaysIcon,
    Squares2X2Icon,
    ListBulletIcon,
    ArrowDownTrayIcon,
    PrinterIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAgendaStore } from "@/store/agendaStore";
import { useAuth } from "@/store/authStore";
import { UserRole } from "@/routes/menuTypes";
import { DeliveryAppointment, PackingListItem } from "@/store/types";
import { useNavigate, useLocation } from 'react-router-dom';
import ScheduleAppointmentModal from './Scheduleappointmentmodal';
import { fetchPackingListFromApi, createPackingListInApi, fetchWarehousesFromApi, WarehouseApiRecord, fetchDocumentsFromApi, DocumentApiRecord, fetchDocumentDetailFromApi, uploadFileToPackingList, fetchProductsFromApi, ProductApiRecord } from "@/services/agenda/packingListApi";
import { formatDateForAPI } from "@/services/agenda/appointmentsApi";

import { createChoferInApi } from "@/services/agenda/choferesApi";
import DocumentsModal from './DocumentsModal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { STATUS_CONFIG } from '@/services/agenda/appointmentStatus';

const Agenda: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const {
        appointments,
        selectedAppointment,
        isLoadingAppointments,
        appointmentsError,
        setSelectedAppointment,
        lookupSupplierByRUC,
        addPackingList,
        addDocument,
        loadAppointmentsFromApi,
        createAppointmentFromApi,
        updateAppointmentFromApi
    } = useAgendaStore();


    // State — restaurar semana si se vuelve desde el detalle de una cita
    const restoredWeek = (location.state as { weekDate?: string } | null)?.weekDate;
    const [currentWeek, setCurrentWeek] = useState(() =>
        restoredWeek ? new Date(restoredWeek) : new Date()
    );
    const [, setSelectedDate] = useState<string | null>(null);
    const [, setSelectedTimeSlot] = useState<string | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
    const [supplierData, setSupplierData] = useState<any>(null);
    const [packingListItems, setPackingListItems] = useState<PackingListItem[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [scrollbarWidth, setScrollbarWidth] = useState<number>(0);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar'); // Toggle entre calendario y lista
    
    // Estado para vista ampliada
    const [extendedViewAppointments, setExtendedViewAppointments] = useState<DeliveryAppointment[]>([]);
    const [isLoadingExtendedView, setIsLoadingExtendedView] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        // Mes actual en formato YYYY-MM
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    
    // Estado para datos de lista (productos)
    const [listViewData, setListViewData] = useState<ProductApiRecord[]>([]);
    const [isLoadingListView, setIsLoadingListView] = useState(false);
    
    // Estados para filtros de búsqueda por columna
    const [filterFecha, setFilterFecha] = useState<string>('');
    const [filterNumber, setFilterNumber] = useState<string>('');
    const [filterItemCode, setFilterItemCode] = useState<string>('');
    const [filterItemName, setFilterItemName] = useState<string>('');
    const [filterRazonSocial, setFilterRazonSocial] = useState<string>('');
    const [filterQuantity, setFilterQuantity] = useState<string>('');
    const [filterHorario, setFilterHorario] = useState<string>('');

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
    const { isOpen: isPackingListOpen, onOpen: onPackingListOpen, onOpenChange: onPackingListOpenChange } = useDisclosure();
    const { isOpen: isTransportOpen, onOpen: onTransportOpen, onOpenChange: onTransportOpenChange } = useDisclosure();
    const { isOpen: isDocumentsOpen, onOpen: onDocumentsOpen, onOpenChange: onDocumentsOpenChange } = useDisclosure();
    const { isOpen: isExtendedViewOpen, onOpen: onExtendedViewOpen, onOpenChange: onExtendedViewOpenChange } = useDisclosure();

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
        number: '', // Número de PackingList generado (ej: 251047379_1)
        orderNumber: '', // Número de orden de compra (ej: 251047379)
        inboundType: 'OCNAC', // Tipo de entrada
        ticket: '', // Ticket WMS
        items: [] as PackingListItem[]
    });
    //const [packingListsFromApi, setPackingListsFromApi] = useState<PackingListApiRecord[]>([]);
    //const [isLoadingPackingLists, setIsLoadingPackingLists] = useState(false);
    const [warehouses, setWarehouses] = useState<WarehouseApiRecord[]>([]);
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
    const [documents, setDocuments] = useState<DocumentApiRecord[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [selectedInboundType, setSelectedInboundType] = useState<'OCNAC' | 'OCINT' | ''>('');
    const [documentSearchFilter, setDocumentSearchFilter] = useState<string>('');
    //const [isLoadingDocumentDetail, setIsLoadingDocumentDetail] = useState(false);
    const documentSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Filtros por columna
    const [docNumFilter, ] = useState<string>('');
    const [cardCodeFilter, ] = useState<string>('');
    const [cardNameFilter, ] = useState<string>('');
    const [taxDateFilter, ] = useState<string>('');
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

    // Cargar datos para vista de lista (fusionar citas y packing lists)
    useEffect(() => {
        const loadListViewData = async () => {
            if (viewMode !== 'list') return;
            
            setIsLoadingListView(true);
            try {
                const fechaInicio = formatDateForAPI(weekStart);
                const fechaFin = formatDateForAPI(weekEnd);
                
                // Llamar al nuevo endpoint de productos
                const products = await fetchProductsFromApi(fechaInicio, fechaFin);
                
                // Debug: Verificar datos PCP
                console.log('Productos cargados desde API:', products);
                if (products.length > 0) {
                    console.log('Primer producto con datos PCP:', {
                        item_code: products[0].item_code,
                        pcp_confirmacion: products[0].confirmacion_pcp,
                        pcp_cobertura_actual: products[0].cobertura_actual,
                        pcp_cobertura_con_ingresos: products[0].cobertura_ingreso,
                        pcp_comentario: products[0].comentario
                    });
                }
                
                setListViewData(products);
            } catch (error) {
                console.error('Error al cargar datos de lista:', error);
                setListViewData([]);
            } finally {
                setIsLoadingListView(false);
            }
        };
        
        loadListViewData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, weekStart, weekEnd]);

    // Función para formatear fecha desde formato "19/01/2026 00:00:00" a formato legible
    const formatDateFromAPI = (dateStr: string): string => {
        try {
            // Formato: "19/01/2026 00:00:00"
            const datePart = dateStr.split(' ')[0]; // "19/01/2026"
            const [day, month, year] = datePart.split('/');
            if (day && month && year) {
                return `${day}/${month}/${year}`;
            }
        } catch (error) {
            console.error('Error al formatear fecha:', error);
        }
        return dateStr;
    };

    // Función para formatear horario desde formato "1100 - 1200" o "800 - 1100" a formato legible "11:00 - 12:00" o "08:00 - 11:00"
    const formatHorario = (horario: string): string => {
        try {
            if (!horario) return '-';
            // Formato: "1100 - 1200" o "800 - 1100"
            const parts = horario.split(' - ');
            if (parts.length === 2) {
                const formatTime = (time: string) => {
                    // Limpiar espacios
                    const cleanTime = time.trim();
                    // Si tiene 3 caracteres, agregar un cero al inicio (ej: "800" -> "0800")
                    let paddedTime = cleanTime;
                    if (cleanTime.length === 3) {
                        paddedTime = `0${cleanTime}`;
                    }
                    // Si tiene 4 caracteres, formatear como HH:MM
                    if (paddedTime.length === 4) {
                        return `${paddedTime.substring(0, 2)}:${paddedTime.substring(2, 4)}`;
                    }
                    // Si tiene otro formato, devolverlo tal cual
                    return cleanTime;
                };
                return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
            }
        } catch (error) {
            console.error('Error al formatear horario:', error);
        }
        return horario;
    };

    // Filtrar datos según los filtros de búsqueda
    const filteredListViewData = useMemo(() => {
        return listViewData.filter(product => {
            // Filtrar por fecha
            if (filterFecha && !formatDateFromAPI(product.u_fecha).toLowerCase().includes(filterFecha.toLowerCase())) {
                return false;
            }
            // Filtrar por Number
            if (filterNumber && !product.number.toLowerCase().includes(filterNumber.toLowerCase())) {
                return false;
            }
            // Filtrar por ItemCode
            if (filterItemCode && !product.item_code.toLowerCase().includes(filterItemCode.toLowerCase())) {
                return false;
            }
            // Filtrar por ItemName
            if (filterItemName && !product.item_name.toLowerCase().includes(filterItemName.toLowerCase())) {
                return false;
            }
            // Filtrar por U_RazonSocial
            if (filterRazonSocial && !product.u_razon_social.toLowerCase().includes(filterRazonSocial.toLowerCase())) {
                return false;
            }
            // Filtrar por Quantity
            if (filterQuantity && !product.quantity.toLowerCase().includes(filterQuantity.toLowerCase())) {
                return false;
            }
            // Filtrar por Horario
            if (filterHorario && !formatHorario(product.horario).toLowerCase().includes(filterHorario.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [listViewData, filterFecha, filterNumber, filterItemCode, filterItemName, filterRazonSocial, filterQuantity, filterHorario]);

    // Función para exportar a Excel
    const handleExportToExcel = () => {
        try {
            // Preparar los datos para exportar
            const dataToExport = filteredListViewData.map(product => ({
                'Fecha': formatDateFromAPI(product.u_fecha),
                'Número': product.number,
                'Código': product.item_code,
                'Descripción': product.item_name,
                'Proveedor': product.u_razon_social,
                'Cantidad': product.quantity,
                'Horario': formatHorario(product.horario),
                'Confirmación PCP': product.confirmacion_pcp || '-',
                'Cobertura Actual (meses)': product.cobertura_actual !== undefined && product.cobertura_actual !== null ? product.cobertura_actual.toFixed(2) : '-',
                'Cobertura con Ingresos (meses)': product.cobertura_ingreso !== undefined && product.cobertura_ingreso !== null ? product.cobertura_ingreso.toFixed(2) : '-',
                'Comentario PCP': product.comentario || '-'
            }));

            // Crear un libro de trabajo
            const wb = XLSX.utils.book_new();
            
            // Crear una hoja de trabajo con los datos
            const ws = XLSX.utils.json_to_sheet(dataToExport);

            // Ajustar el ancho de las columnas
            const colWidths = [
                { wch: 12 }, // Fecha
                { wch: 15 }, // Número
                { wch: 15 }, // Código
                { wch: 50 }, // Descripción
                { wch: 40 }, // Proveedor
                { wch: 12 }, // Cantidad
                { wch: 15 }, // Horario
                { wch: 18 }, // Confirmación PCP
                { wch: 22 }, // Cobertura Actual
                { wch: 28 }, // Cobertura con Ingresos
                { wch: 30 }  // Comentario PCP
            ];
            ws['!cols'] = colWidths;

            // Agregar la hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, 'Productos');

            // Generar el nombre del archivo con fecha
            const fechaInicio = formatDateForAPI(weekStart);
            const fechaFin = formatDateForAPI(weekEnd);
            const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const fileName = `Productos_${fechaInicio}_${fechaFin}_${fechaActual}.xlsx`;

            // Escribir el archivo y descargarlo
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, fileName);
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('Error al exportar a Excel. Por favor, intente nuevamente.');
        }
    };

    // Función para imprimir la tabla
    const handlePrint = () => {
        try {
            // Crear una ventana nueva para imprimir
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Por favor, permita ventanas emergentes para imprimir.');
                return;
            }

            // Obtener el rango de fechas formateado
            const fechaInicioFormatted = weekStart.toLocaleDateString('es-PE', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            const fechaFinFormatted = weekEnd.toLocaleDateString('es-PE', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });

            // Crear el contenido HTML para imprimir
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lista de Productos - ${fechaInicioFormatted} a ${fechaFinFormatted}</title>
                    <style>
                        @media print {
                            @page {
                                margin: 1cm;
                                size: A4 landscape;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                            }
                        }
                        body {
                            font-family: Arial, sans-serif;
                            font-size: 10pt;
                            margin: 20px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #000;
                            padding-bottom: 10px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 18pt;
                            font-weight: bold;
                        }
                        .header p {
                            margin: 5px 0;
                            font-size: 12pt;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th {
                            background-color: #f0f0f0;
                            border: 1px solid #000;
                            padding: 8px;
                            text-align: left;
                            font-weight: bold;
                            font-size: 9pt;
                        }
                        td {
                            border: 1px solid #000;
                            padding: 6px;
                            font-size: 9pt;
                        }
                        .footer {
                            margin-top: 20px;
                            text-align: center;
                            font-size: 8pt;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Lista de Productos</h1>
                        <p>Período: ${fechaInicioFormatted} a ${fechaFinFormatted}</p>
                        <p>Total de registros: ${filteredListViewData.length}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Número</th>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Proveedor</th>
                                <th>Cantidad</th>
                                <th>Horario</th>
                                <th>Confirmación PCP</th>
                                <th>Cobertura Actual</th>
                                <th>Cobertura con Ingresos</th>
                                <th>Comentario PCP</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredListViewData.map(product => `
                                <tr>
                                    <td>${formatDateFromAPI(product.u_fecha)}</td>
                                    <td>${product.number}</td>
                                    <td>${product.item_code}</td>
                                    <td>${product.item_name}</td>
                                    <td>${product.u_razon_social}</td>
                                    <td>${product.quantity}</td>
                                    <td>${formatHorario(product.horario)}</td>
                                    <td>${product.confirmacion_pcp || '-'}</td>
                                    <td>${product.cobertura_actual !== undefined && product.cobertura_actual !== null ? product.cobertura_actual.toFixed(2) + ' meses' : '-'}</td>
                                    <td>${product.cobertura_ingreso !== undefined && product.cobertura_ingreso !== null ? product.cobertura_ingreso.toFixed(2) + ' meses' : '-'}</td>
                                    <td>${product.comentario || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Generado el ${new Date().toLocaleDateString('es-PE', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                </body>
                </html>
            `;

            // Escribir el contenido y abrir el diálogo de impresión
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Esperar a que se cargue el contenido antes de imprimir
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    // Cerrar la ventana después de imprimir (opcional)
                    // printWindow.close();
                }, 250);
            };
            } catch (error) {
            console.error('Error al imprimir:', error);
            alert('Error al imprimir. Por favor, intente nuevamente.');
        }
    };

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


        return filtered;
    }, [appointments, currentUser, filterStatus, weekStart, weekEnd]);

    // Convierte hora en formato HH:MM a minutos desde medianoche
    // Ejemplo: "10:47" -> 647 minutos
    const timeToMinutes = (timeStr: string | undefined): number => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    /**
     * Calcula el posicionamiento horizontal de citas solapadas
     * Retorna un mapa con el índice de columna y el ancho para cada cita
     */
    const calculateOverlappingAppointmentsLayout = (
        appointments: typeof filteredAppointments
    ): Map<string, { column: number; width: number; totalColumns: number }> => {
        const layout = new Map<string, { column: number; width: number; totalColumns: number }>();
        
        if (appointments.length === 0) return layout;

        // Agrupar citas por día
        const appointmentsByDay = new Map<string, typeof appointments>();
        appointments.forEach(apt => {
            const dayKey = apt.deliveryDate;
            if (!appointmentsByDay.has(dayKey)) {
                appointmentsByDay.set(dayKey, []);
            }
            appointmentsByDay.get(dayKey)!.push(apt);
        });

        // Para cada día, calcular el layout de citas solapadas
        appointmentsByDay.forEach((dayAppointments) => {
            // Ordenar citas por hora de inicio
            const sortedAppointments = [...dayAppointments].sort((a, b) => {
                const aStart = timeToMinutes(a.deliveryTime || '00:00');
                const bStart = timeToMinutes(b.deliveryTime || '00:00');
                return aStart - bStart;
            });

            // Crear grupos de citas solapadas
            const groups: typeof appointments[] = [];
            
            sortedAppointments.forEach(apt => {
                const aptStart = timeToMinutes(apt.deliveryTime || '00:00');
                const aptEnd = timeToMinutes(apt.deliveryTimeEnd || apt.deliveryTime || '00:00') || aptStart + 60;
                
                // Buscar un grupo donde esta cita se solape
                let addedToGroup = false;
                for (const group of groups) {
                    // Verificar si se solapa con alguna cita del grupo
                    const overlaps = group.some(groupApt => {
                        const groupStart = timeToMinutes(groupApt.deliveryTime || '00:00');
                        const groupEnd = timeToMinutes(groupApt.deliveryTimeEnd || groupApt.deliveryTime || '00:00') || groupStart + 60;
                        return aptStart < groupEnd && aptEnd > groupStart;
                    });
                    
                    if (overlaps) {
                        group.push(apt);
                        addedToGroup = true;
                        break;
                    }
                }
                
                if (!addedToGroup) {
                    groups.push([apt]);
                }
            });

            // Para cada grupo, calcular columnas
            groups.forEach(group => {
                if (group.length === 1) {
                    // Una sola cita, ocupa todo el ancho
                    layout.set(group[0].id, { column: 0, width: 1, totalColumns: 1 });
                } else {
                    // Múltiples citas solapadas - necesitamos calcular columnas
                    // Usar un algoritmo simple: asignar columnas secuencialmente
                    // y calcular el número máximo de columnas necesarias
                    
                    // Ordenar por hora de inicio
                    const sortedGroup = [...group].sort((a, b) => {
                        const aStart = timeToMinutes(a.deliveryTime || '00:00');
                        const bStart = timeToMinutes(b.deliveryTime || '00:00');
                        return aStart - bStart;
                    });

                    // Calcular el número máximo de columnas necesarias
                    // Esto requiere verificar cuántas citas se solapan simultáneamente en cada punto
                    let maxColumns = 1;
                    const timePoints = new Set<number>();
                    
                    sortedGroup.forEach(apt => {
                        const start = timeToMinutes(apt.deliveryTime || '00:00');
                        const end = timeToMinutes(apt.deliveryTimeEnd || apt.deliveryTime || '00:00') || start + 60;
                        timePoints.add(start);
                        timePoints.add(end);
                    });

                    // Para cada punto de tiempo, contar cuántas citas están activas
                    Array.from(timePoints).sort((a, b) => a - b).forEach(timePoint => {
                        const activeCount = sortedGroup.filter(apt => {
                            const start = timeToMinutes(apt.deliveryTime || '00:00');
                            const end = timeToMinutes(apt.deliveryTimeEnd || apt.deliveryTime || '00:00') || start + 60;
                            return timePoint >= start && timePoint < end;
                        }).length;
                        maxColumns = Math.max(maxColumns, activeCount);
                    });

                    // Asignar columnas usando un algoritmo greedy
                    const columns: number[] = new Array(sortedGroup.length).fill(-1);
                    
                    sortedGroup.forEach((apt, index) => {
                        const aptStart = timeToMinutes(apt.deliveryTime || '00:00');
                        const aptEnd = timeToMinutes(apt.deliveryTimeEnd || apt.deliveryTime || '00:00') || aptStart + 60;
                        
                        // Encontrar la primera columna disponible que no esté ocupada por citas que se solapan
                        for (let col = 0; col < maxColumns; col++) {
                            let canUseColumn = true;
                            
                            // Verificar si esta columna está ocupada por otra cita que se solapa
                            for (let i = 0; i < index; i++) {
                                if (columns[i] === col) {
                                    const otherStart = timeToMinutes(sortedGroup[i].deliveryTime || '00:00');
                                    const otherEnd = timeToMinutes(sortedGroup[i].deliveryTimeEnd || sortedGroup[i].deliveryTime || '00:00') || otherStart + 60;
                                    
                                    if (aptStart < otherEnd && aptEnd > otherStart) {
                                        canUseColumn = false;
                                        break;
                                    }
                                }
                            }
                            
                            if (canUseColumn) {
                                columns[index] = col;
                                break;
                            }
                        }
                    });

                    // Asignar layout a cada cita
                    sortedGroup.forEach((apt, index) => {
                        layout.set(apt.id, {
                            column: columns[index],
                            width: 1,
                            totalColumns: maxColumns
                        });
                    });
                }
            });
        });

        return layout;
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

        // Ya no validamos horarios ocupados - se permiten citas solapadas
        setIsCreatingAppointment(true);
        try {
            if (editingAppointment) {
                // Modo edición: actualizar la cita
                // Obtener el estado actual de la cita que se está editando
                const currentAppointment = appointments.find(apt => apt.docEntry === editingAppointment.docEntry);
                const currentStatus = currentAppointment?.status || 'REGISTRADA';
                
                // Determinar el nuevo estado basado en los cambios
                let newStatus: string = currentStatus;
                let needsStatusUpdate = false;
                
                // Verificar si hubo cambios que requieran cambiar a REPROGRAMADA
                const oldDate = editingAppointment.deliveryDate || '';
                const oldTime = editingAppointment.deliveryTime || '';
                const oldTimeEnd = editingAppointment.deliveryTimeEnd || '';
                const oldWarehouse = editingAppointment.warehouse || '';
                
                const dateChanged = oldDate !== data.deliveryDate;
                const timeChanged = oldTime !== data.deliveryTime || oldTimeEnd !== data.deliveryTimeEnd;
                const warehouseChanged = oldWarehouse !== data.warehouse;
                
                // Si cambió fecha u hora → REPROGRAMADA
                if (dateChanged || timeChanged) {
                    if (currentStatus !== 'REPROGRAMADA' && currentStatus !== 'Cancelada' && currentStatus !== 'ENTREGADO') {
                        newStatus = 'REPROGRAMADA';
                        needsStatusUpdate = true;
                    }
                }
                // Si cambió almacén
                else if (warehouseChanged) {
                    // Si el almacén anterior estaba vacío y ahora se llena → mantener PROGRAMADA
                    if (!oldWarehouse && data.warehouse) {
                        // Mantener el estado actual (PROGRAMADA)
                        newStatus = currentStatus;
                    }
                    // Si el almacén ya existía y se cambió → REPROGRAMADA
                    else if (oldWarehouse && data.warehouse && oldWarehouse !== data.warehouse) {
                        if (currentStatus !== 'REPROGRAMADA' && currentStatus !== 'Cancelada' && currentStatus !== 'ENTREGADO') {
                            newStatus = 'REPROGRAMADA';
                            needsStatusUpdate = true;
                        }
                    }
                }
                
                await updateAppointmentFromApi(editingAppointment.docEntry, {
                    supplierRUC: data.supplierRUC,
                    supplierName: data.supplierName,
                    deliveryDate: data.deliveryDate,
                    deliveryTime: data.deliveryTime,
                    deliveryTimeEnd: data.deliveryTimeEnd,
                    description: data.notes,
                    warehouse: data.warehouse,
                    active: 'Y',
                    estado: newStatus.toUpperCase() // Usar el estado determinado en mayúsculas
                });
                
                // Si se necesita actualizar el estado, usar el endpoint de actualización de estado
                if (needsStatusUpdate && editingAppointment.docEntry && currentUser) {
                    const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                    const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                    // Asegurar que el estado esté en mayúsculas
                    const statusToUpdate = newStatus.toUpperCase() as any;
                    await updateAppointmentStatus(editingAppointment.docEntry, statusToUpdate, userId);
                }

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

    // Handle view appointment - navegar a la página de detalle
    const handleViewAppointment = (appointment: DeliveryAppointment) => {
        setSelectedAppointment(appointment);
        // Navegar a la página de detalle usando docEntry o appointmentNumber
        const appointmentId = appointment.docEntry || appointment.appointmentNumber;
        navigate(`/agenda/detail/${appointmentId}`, { state: { weekDate: currentWeek.toISOString() } });
    };

    // Función para buscar cita relacionada con un producto y navegar al detalle
    const handleProductRowClick = (product: ProductApiRecord) => {
        try {
            // Convertir fecha del producto a formato YYYY-MM-DD para comparar
            const parseProductDate = (dateStr: string): string | null => {
                try {
                    const datePart = dateStr.split(' ')[0]; // "19/01/2026"
                    const [day, month, year] = datePart.split('/');
                    if (day && month && year) {
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                } catch (error) {
                    console.error('Error al parsear fecha:', error);
                }
                return null;
            };

            const productDate = parseProductDate(product.u_fecha);
            if (!productDate) {
                console.warn('No se pudo parsear la fecha del producto');
                return;
            }

            // Buscar cita que coincida con:
            // 1. Fecha de entrega
            // 2. Nombre del proveedor (U_RazonSocial)
            // 3. Horario (comparar el horario formateado)
            const matchingAppointment = appointments.find(apt => {
                // Comparar fecha
                if (apt.deliveryDate !== productDate) {
                    return false;
                }

                // Comparar proveedor (normalizar para comparación)
                const aptSupplierName = apt.supplierName?.toLowerCase().trim() || '';
                const productSupplierName = product.u_razon_social?.toLowerCase().trim() || '';
                if (aptSupplierName && productSupplierName && !aptSupplierName.includes(productSupplierName) && !productSupplierName.includes(aptSupplierName)) {
                    return false;
                }

                // Comparar horario (extraer hora inicial del rango)
                if (product.horario && apt.deliveryTime) {
                    const productHorarioParts = product.horario.split(' - ');
                    if (productHorarioParts.length > 0) {
                        const productHoraInicio = productHorarioParts[0].trim();
                        // Normalizar hora (agregar cero si tiene 3 dígitos)
                        const normalizedHora = productHoraInicio.length === 3 ? `0${productHoraInicio}` : productHoraInicio;
                        const horaFormateada = normalizedHora.length === 4 
                            ? `${normalizedHora.substring(0, 2)}:${normalizedHora.substring(2, 4)}`
                            : productHoraInicio;
                        
                        // Comparar con el horario de la cita (formato HH:MM)
                        if (apt.deliveryTime && !apt.deliveryTime.includes(horaFormateada.substring(0, 2))) {
                            return false;
                        }
                    }
                }

                return true;
            });

            if (matchingAppointment) {
                handleViewAppointment(matchingAppointment);
            } else {
                // Si no se encuentra una cita exacta, intentar buscar solo por fecha y proveedor
                const fallbackAppointment = appointments.find(apt => {
                    if (apt.deliveryDate !== productDate) return false;
                    const aptSupplierName = apt.supplierName?.toLowerCase().trim() || '';
                    const productSupplierName = product.u_razon_social?.toLowerCase().trim() || '';
                    return aptSupplierName && productSupplierName && 
                           (aptSupplierName.includes(productSupplierName) || productSupplierName.includes(aptSupplierName));
                });

                if (fallbackAppointment) {
                    handleViewAppointment(fallbackAppointment);
                } else {
                    console.warn('No se encontró una cita relacionada para el producto:', product);
                    alert('No se encontró una cita relacionada con este producto.');
                }
            }
        } catch (error) {
            console.error('Error al buscar cita relacionada:', error);
            alert('Error al buscar la cita relacionada. Por favor, intente nuevamente.');
        }
    };

    // Detectar navegación desde la página de detalle para abrir modales
    useEffect(() => {
        const state = location.state as { openPackingList?: boolean; openTransport?: boolean; openDocuments?: boolean; openEdit?: boolean } | null;
        if (state) {
            if (state.openPackingList && selectedAppointment) {
                onPackingListOpen();
            } else if (state.openTransport && selectedAppointment) {
                onTransportOpen();
            } else if (state.openDocuments && selectedAppointment) {
                onDocumentsOpen();
            } else if (state.openEdit && selectedAppointment) {
                handleEditAppointment();
            }
            // Limpiar el estado después de procesarlo
            window.history.replaceState({}, document.title);
        }
    }, [location.state, selectedAppointment]);

    // Load PackingList from API when modal opens
    /*useEffect(() => {
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
    }, [isPackingListOpen, selectedAppointment, weekStart, weekEnd]);*/

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


    /**
     * Genera el siguiente número de PackingList basándose en los existentes
     * Formato: {DocNum}_{correlativo}
     * Ejemplo: Si hay 251047379_1, 251047379_2, 251047379_3, genera 251047379_4
     * @param docNum - Número de orden de compra
     * @param codCita - Código de la cita (DocEntry) - requerido para buscar PackingList
     */
    const generateNextPackingListNumber = async (docNum: string, codCita: string): Promise<string> => {
        try {
            if (!codCita) {
                console.warn('⚠️ No se proporcionó CodCita, retornando número por defecto');
                return `${docNum}_1`;
            }
            
            // Buscar todos los PackingList existentes para esta cita
            // Usar un rango amplio de fechas para asegurar que encontremos todos los PackingList
            const now = new Date();
            const startDate = new Date(now.getFullYear() - 2, 0, 1); // 2 años atrás para asegurar que encontremos todos
            const endDate = new Date(now.getFullYear() + 2, 11, 31); // 2 años adelante
            
            const fechaInicio = formatDateForAPI(startDate);
            const fechaFin = formatDateForAPI(endDate);
            
            console.log('🔍 Buscando PackingList existentes para:', docNum);
            console.log('📋 CodCita:', codCita);
            console.log('📅 Rango de fechas:', fechaInicio, 'a', fechaFin);
            
            // Buscar PackingList usando CodCita (requerido por el API)
            const allPackingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, codCita);
            
            console.log('📦 Total de PackingList encontrados:', allPackingLists.length);
            if (allPackingLists.length > 0) {
                console.log('📦 Primeros 10 PackingList encontrados:', allPackingLists.slice(0, 10).map(pl => pl.number));
            }
            
            // Filtrar PackingList que empiecen con el número de orden
            // El número puede venir como string o number, normalizarlo
            const matchingPackingLists = allPackingLists.filter(pl => {
                if (!pl.number) return false;
                // Normalizar el número a string
                const numberStr = String(pl.number).trim();
                // El número de PackingList tiene formato: {DocNum}_{correlativo}
                const matches = numberStr.startsWith(`${docNum}_`);
                if (matches) {
                    console.log('✅ PackingList que coincide:', numberStr);
                }
                return matches;
            });
            
            console.log('🎯 PackingList que coinciden con', docNum, ':', matchingPackingLists.length);
            if (matchingPackingLists.length > 0) {
                console.log('🎯 Números encontrados:', matchingPackingLists.map(pl => String(pl.number)));
            }
            
            // Extraer correlativos y encontrar el máximo
            let maxCorrelative = 0;
            matchingPackingLists.forEach(pl => {
                if (pl.number) {
                    // Normalizar el número a string
                    const numberStr = String(pl.number).trim();
                    // Extraer el correlativo después del guion bajo
                    const parts = numberStr.split('_');
                    if (parts.length >= 2) {
                        // Tomar la última parte como correlativo (por si hay múltiples guiones bajos)
                        const correlativeStr = parts[parts.length - 1];
                        const correlative = parseInt(correlativeStr, 10);
                        if (!isNaN(correlative) && correlative > maxCorrelative) {
                            maxCorrelative = correlative;
                            console.log('📊 Nuevo máximo correlativo encontrado:', maxCorrelative, 'de', numberStr);
                        }
                    }
                }
            });
            
            // Generar el siguiente número
            const nextCorrelative = maxCorrelative + 1;
            const nextNumber = `${docNum}_${nextCorrelative}`;
            console.log('✨ Siguiente número generado:', nextNumber, '(correlativo máximo encontrado:', maxCorrelative, ')');
            
            return nextNumber;
        } catch (error) {
            console.error('❌ Error al generar número de PackingList:', error);
            // Si hay error, retornar el número base con correlativo 1
            console.log('⚠️ Retornando número por defecto:', `${docNum}_1`);
            return `${docNum}_1`;
        }
    };

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
            // Filtrar solo los items seleccionados (marca = true) y con cantidad > 0
            const selectedItems = packingListItems.filter(item => 
                item.marca === true && item.quantity > 0
            );
            
            // Validar que haya al menos un item seleccionado
            if (selectedItems.length === 0) {
                alert('Debe seleccionar al menos un item con cantidad mayor a 0');
                return;
            }
            
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
                _detallePackinList: selectedItems.map((item, index) => ({
                    document: (item as any).document || 0, // Número de documento de orden de compra (debe venir del item)
                    lineNumber: index + 1, // LineNumber secuencial desde 1 para los items seleccionados
                    itemCode: item.productCode,
                    itemName: item.productName,
                    quantity: item.quantity
                }))};

                console.log("DATA: ", data);
            // Crear PackingList en el API
            await createPackingListInApi({
                vendor_id: vendorId,
                whs_code: packingListForm.warehouse,
                number: packingListForm.number.trim(),
                inbound_type: packingListForm.inboundType || 'OCNAC',
                comments: packingListForm.comment || '',
                date_expected: packingListForm.date || new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
                ticket: "0", // Ticket WMS
                wms_response: packingListForm.commentWms || '',
                cod_cita: selectedAppointment.docEntry,
                _detalle_packin_list: selectedItems.map((item, index) => ({
                    document: (item as any).document || 0, // Número de documento de orden de compra (debe venir del item)
                    line_number: index + 1, // LineNumber secuencial desde 1 para los items seleccionados
                    item_code: item.productCode,
                    item_name: item.productName,
                    quantity: item.quantity
                }))
            });

            // Actualizar estado local (solo con los items seleccionados)
            addPackingList(selectedAppointment.id, {
                appointmentId: selectedAppointment.id,
                supplierId: selectedAppointment.supplierId,
                date: packingListForm.date || new Date().toISOString().split('T')[0],
                warehouse: packingListForm.warehouse,
                items: selectedItems, // Solo los items seleccionados
                comment: packingListForm.comment,
                commentWms: packingListForm.commentWms,
                createdBy: currentUser?.id || 'system'
            });

            // Actualizar estado de la cita a PROGRAMADA cuando se crea el packing list
            if (selectedAppointment.docEntry && currentUser) {
                const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                await updateAppointmentStatus(selectedAppointment.docEntry, 'PROGRAMADA', userId);
                
                // Recargar appointments del API para obtener el estado actualizado
                const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username 
                    ? currentUser.username 
                    : undefined;
                await loadAppointmentsFromApi(ruc, weekStart, weekEnd);
            }
            
            alert('PackingList creado exitosamente. Estado actualizado a PROGRAMADA.');

            // Recargar PackingList del API
            /*const fechaInicio = formatDateForAPI(weekStart);
            const fechaFin = formatDateForAPI(weekEnd);
            const codCita = selectedAppointment.docEntry;
            const packingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, codCita);
            setPackingListsFromApi(packingLists);*/

            // Reset and close
            setPackingListForm({
                date: '',
                warehouse: '',
                comment: '',
                commentWms: '',
                number: '',
                orderNumber: '',
                inboundType: 'OCNAC',
                ticket: '',
                items: [] as PackingListItem[]
            });
            setPackingListItems([]);
            onPackingListOpenChange();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear PackingList';
            alert(`Error al crear PackingList: ${errorMessage}`);
            console.error('Error al crear PackingList:', error);
        }
    };

    // Handle save transport data
    const handleSaveTransportData = async () => {
        if (!selectedAppointment || !transportForm.driverName || !transportForm.vehiclePlate) {
            alert('Por favor complete los campos requeridos');
            return;
        }

        if (!selectedAppointment.docEntry) {
            alert('La cita no tiene código (DocEntry). No se puede guardar el chofer.');
            return;
        }

        try {
            // Preparar los datos para el API
            const choferData = {
                u_empresa_transporte: transportForm.transportCompany || '',
                u_nombre_conductor: transportForm.driverName || '',
                u_licencia_conducir: transportForm.driverLicense || '',
                u_placa_vehiculo: transportForm.vehiclePlate || '',
                u_tipo_vehiculo: transportForm.vehicleType || '',
                u_telefono_contacto: transportForm.contactPhone || '',
                u_hora_llegada: transportForm.estimatedArrival || '',
                u_notas: transportForm.notes || '',
                u_cod_cita: selectedAppointment.docEntry
            };

            // Llamar al API para crear el chofer
            await createChoferInApi(choferData);

            // Actualizar estado de la cita a TRANSPORTE_COMPLETO
            if (selectedAppointment.docEntry && currentUser) {
                const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                await updateAppointmentStatus(selectedAppointment.docEntry, 'TRANSPORTE_COMPLETO', userId);
                
                // Recargar appointments del API para obtener el estado actualizado
                const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username 
                    ? currentUser.username 
                    : undefined;
                await loadAppointmentsFromApi(ruc, weekStart, weekEnd);
            }

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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar datos de transporte';
            alert(`Error al guardar datos de transporte: ${errorMessage}`);
            console.error('Error al guardar datos de transporte:', error);
        }
    };

    // Handle upload document
    const handleUploadDocument = async (type: string, file: File): Promise<void> => {
        if (!selectedAppointment) {
            throw new Error('No hay cita seleccionada');
        }

        if (!selectedAppointment.docEntry) {
            throw new Error('La cita no tiene código (DocEntry). No se puede subir el archivo.');
        }

        // El tipo de documento ahora es dinámico, puede ser cualquier string
        const documentType = type;
        
        try {
            // Subir archivo al API
            const uploadResult = await uploadFileToPackingList(file, type, selectedAppointment.docEntry);
            
            // Guardar en el estado local también
            const document: any = {
                id: `doc-${Date.now()}`,
                name: uploadResult.name_file,
                originalName: file.name,
                type: file.type,
                url: uploadResult.url_archivo,
                uploadDate: new Date().toISOString(),
                uploadedBy: currentUser?.id || 'system'
            };

            addDocument(selectedAppointment.id, documentType, document);
            
            // Verificar si todos los documentos están completos y actualizar estado
            // Recargar appointment para verificar documentos completos
            const { loadAppointmentsFromApi } = useAgendaStore.getState();
            const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username ? currentUser.username : undefined;
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            const fechaInicio = formatDateForAPI(weekStart);
            const fechaFin = formatDateForAPI(weekEnd);
            await loadAppointmentsFromApi(ruc, fechaInicio, fechaFin);
            
            // Verificar si todos los documentos están completos
            const updatedAppointment = useAgendaStore.getState().appointments.find(
                apt => apt.docEntry === selectedAppointment.docEntry
            );
            
            if (updatedAppointment) {
                // Verificar documentos principales (CDR y XML son formatos, no documentos separados)
                const hasAllDocs = updatedAppointment.documents?.invoice && 
                                  updatedAppointment.documents?.purchaseOrder && 
                                  updatedAppointment.documents?.deliveryGuide;
                
                if (hasAllDocs && updatedAppointment.status !== 'DOCUMENTOS_COMPLETOS' && updatedAppointment.docEntry && currentUser) {
                    const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                    const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                    await updateAppointmentStatus(updatedAppointment.docEntry, 'DOCUMENTOS_COMPLETOS', userId);
                    
                    // Recargar appointments del API para obtener el estado actualizado
                    const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username 
                        ? currentUser.username 
                        : undefined;
                    await loadAppointmentsFromApi(ruc, weekStart, weekEnd);
                }
            }
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

    // Load extended view appointments
    const loadExtendedViewAppointments = async (month: string) => {
        setIsLoadingExtendedView(true);
        try {
            // Parsear mes (YYYY-MM)
            const [year, monthNum] = month.split('-').map(Number);
            
            // Calcular inicio y fin del mes
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0, 23, 59, 59);
            
            // Obtener RUC del usuario si es proveedor
            const ruc = currentUser?.role === UserRole.PROVEEDOR && currentUser.username 
                ? currentUser.username 
                : undefined;
            
            // Cargar citas del mes directamente desde el API
            await loadAppointmentsFromApi(ruc, startDate, endDate);
            
            // Filtrar citas del mes seleccionado desde el store actualizado
            const monthAppointments = appointments.filter(apt => {
                const [aptYear, aptMonth] = apt.deliveryDate.split('-').map(Number);
                return aptYear === year && aptMonth === monthNum;
            });
            
            setExtendedViewAppointments(monthAppointments);
        } catch (error) {
            console.error('Error al cargar citas del mes:', error);
            alert('Error al cargar citas del mes seleccionado');
            setExtendedViewAppointments([]);
        } finally {
            setIsLoadingExtendedView(false);
        }
    };

    // Cargar citas cuando se abre el modal o cambia el mes
    useEffect(() => {
        if (isExtendedViewOpen) {
            loadExtendedViewAppointments(selectedMonth);
        }
    }, [isExtendedViewOpen, selectedMonth, currentUser?.id, currentUser?.role, currentUser?.username]);
    
    // Actualizar citas de vista ampliada cuando cambian las citas del store
    useEffect(() => {
        if (isExtendedViewOpen && !isLoadingExtendedView) {
            const [year, monthNum] = selectedMonth.split('-').map(Number);
            const monthAppointments = appointments.filter(apt => {
                const [aptYear, aptMonth] = apt.deliveryDate.split('-').map(Number);
                return aptYear === year && aptMonth === monthNum;
            });
            setExtendedViewAppointments(monthAppointments);
        }
    }, [appointments, isExtendedViewOpen, selectedMonth, isLoadingExtendedView]);

    // Generar opciones de meses (3 meses antes, mes actual, 3 meses después)
    const getMonthOptions = () => {
        const options: string[] = [];
        const now = new Date();
        
        for (let i = -3; i <= 3; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;
            options.push(monthKey);
        }
        
        return options;
    };

    // Agrupar citas por día
    const groupAppointmentsByDay = (appointments: DeliveryAppointment[]) => {
        const grouped = new Map<string, DeliveryAppointment[]>();
        
        appointments.forEach(apt => {
            const dayKey = apt.deliveryDate;
            if (!grouped.has(dayKey)) {
                grouped.set(dayKey, []);
            }
            grouped.get(dayKey)!.push(apt);
        });
        
        // Ordenar por fecha
        return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    };

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
                    <div className="flex items-center gap-2">
                        {/* Toggle entre vista calendario y lista */}
                        <Button
                            isIconOnly
                            variant="flat"
                            color="primary"
                            onPress={() => setViewMode(prev => prev === 'calendar' ? 'list' : 'calendar')}
                            title={viewMode === 'calendar' ? 'Ver como Lista' : 'Ver como Calendario'}
                        >
                            {viewMode === 'calendar' ? (
                                <ListBulletIcon className="w-5 h-5" />
                            ) : (
                                <Squares2X2Icon className="w-5 h-5" />
                            )}
                        </Button>
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
                </div>

                {/* Vista de Lista o Calendario */}
                {viewMode === 'list' ? (
                    <>
                        {/* Controles de navegación y filtros - Fuera del Card */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    onPress={goToPreviousWeek}
                                    className="hover:bg-gray-200"
                                    isDisabled={isLoadingListView}
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
                                    isDisabled={isLoadingListView}
                                >
                                    <ArrowRightIcon className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onPress={goToToday}
                                    className="ml-2"
                                    isDisabled={isLoadingListView}
                                >
                                    Hoy
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 justify-end min-w-[150px]">
                                {isLoadingListView && (
                                    <Chip color="primary" variant="flat" size="sm">
                                        Cargando...
                                    </Chip>
                                )}
                                <Chip color="primary" variant="flat" size="md">
                                    {filteredListViewData.length} {filteredListViewData.length === 1 ? 'producto' : 'productos'}
                                </Chip>
                                <Button
                                    color="default"
                                    variant="flat"
                                    size="sm"
                                    startContent={<PrinterIcon className="w-4 h-4" />}
                                    onPress={handlePrint}
                                    isDisabled={isLoadingListView || filteredListViewData.length === 0}
                                >
                                    Imprimir
                                </Button>
                                <Button
                                    color="success"
                                    variant="flat"
                                    size="sm"
                                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                    onPress={handleExportToExcel}
                                    isDisabled={isLoadingListView || filteredListViewData.length === 0}
                                >
                                    Exportar Excel
                                </Button>
                            </div>
                        </div>

                        {/* Card de Lista - Filtros y tabla */}
                        <Card className="shadow-lg border-r-0 rounded-none flex flex-col" style={{ minHeight: 'calc(100vh - 200px)', height: 'calc(100vh - 200px)' }}>
                            <CardBody className="p-4 rounded-none flex-1 flex flex-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                {/* Filtros de búsqueda fuera de la tabla */}
                                <div className="flex-shrink-0 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                                        <Input
                                            size="sm"
                                            label="Fecha"
                                            placeholder="Buscar fecha..."
                                            value={filterFecha}
                                            onValueChange={setFilterFecha}
                                            classNames={{ base: "w-full" }}
                                        />
                                        <Input
                                            size="sm"
                                            label="Número"
                                            placeholder="Buscar número..."
                                            value={filterNumber}
                                            onValueChange={setFilterNumber}
                                            classNames={{ base: "w-full" }}
                                        />
                                        <Input
                                            size="sm"
                                            label="Código"
                                            placeholder="Buscar código..."
                                            value={filterItemCode}
                                            onValueChange={setFilterItemCode}
                                            classNames={{ base: "w-full" }}
                                        />
                                        <Input
                                            size="sm"
                                            label="Descripción"
                                            placeholder="Buscar descripción..."
                                            value={filterItemName}
                                            onValueChange={setFilterItemName}
                                            classNames={{ base: "w-full" }}
                                        />
                                        <Input
                                            size="sm"
                                            label="Proveedor"
                                            placeholder="Buscar proveedor..."
                                            value={filterRazonSocial}
                                            onValueChange={setFilterRazonSocial}
                                            classNames={{ base: "w-full" }}
                                        />
                                        <Input
                                            size="sm"
                                            label="Cantidad"
                                            placeholder="Buscar cantidad..."
                                            value={filterQuantity}
                                            onValueChange={setFilterQuantity}
                                            classNames={{ base: "w-full" }}
                                        />
                                        <Input
                                            size="sm"
                                            label="Horario"
                                            placeholder="Buscar horario..."
                                            value={filterHorario}
                                            onValueChange={setFilterHorario}
                                            classNames={{ base: "w-full" }}
                                        />
                                    </div>
                                </div>

                                {/* Tabla */}
                            {isLoadingListView ? (
                                    <div className="p-8 text-center rounded-none flex-1 flex items-center justify-center">
                                    <p className="text-gray-500">Cargando datos...</p>
                                </div>
                                ) : filteredListViewData.length === 0 ? (
                                    <div className="p-8 text-center rounded-none flex-1 flex items-center justify-center">
                                    <p className="text-gray-500">No hay datos para mostrar</p>
                                </div>
                            ) : (
                                <div className="overflow-auto flex-1">
                                        <Table aria-label="Tabla de productos" classNames={{
                                            wrapper: "min-h-[222px]",
                                        }}>
                                        <TableHeader>
                                                <TableColumn className="w-[100px] min-w-[100px]">FECHA</TableColumn>
                                                <TableColumn className="w-[120px] min-w-[120px]">NÚMERO</TableColumn>
                                                <TableColumn className="w-[120px] min-w-[120px]">CÓDIGO</TableColumn>
                                                <TableColumn>DESCRIPCIÓN</TableColumn>
                                            <TableColumn>PROVEEDOR</TableColumn>
                                                <TableColumn className="w-[100px] min-w-[100px]">CANTIDAD</TableColumn>
                                                <TableColumn className="w-[120px] min-w-[120px]">HORARIO</TableColumn>
                                                <TableColumn className="w-[120px] min-w-[120px]">CONFIRMACIÓN PCP</TableColumn>
                                                <TableColumn className="w-[120px] min-w-[120px]">COBERTURA ACTUAL</TableColumn>
                                                <TableColumn className="w-[150px] min-w-[150px]">COBERTURA CON INGRESOS</TableColumn>
                                                <TableColumn>COMENTARIO PCP</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                                {filteredListViewData.map((row, index) => (
                                                <TableRow 
                                                        key={`${row.number}-${row.item_code}-${index}`}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => handleProductRowClick(row)}
                                                    >
                                                        <TableCell className="whitespace-nowrap">
                                                            {formatDateFromAPI(row.u_fecha)}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{row.number}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{row.item_code}</TableCell>
                                                    <TableCell>
                                                            <div className="truncate max-w-full" title={row.item_name}>
                                                                {row.item_name}
                                                            </div>
                                                    </TableCell>
                                                    <TableCell>
                                                            <div className="truncate max-w-full" title={row.u_razon_social}>
                                                                {row.u_razon_social}
                                                        </div>
                                                    </TableCell>
                                                        <TableCell className="whitespace-nowrap">{row.quantity}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{formatHorario(row.horario)}</TableCell>
                                                        <TableCell>
                                                            {row.confirmacion_pcp ? (
                                                                <Chip 
                                                                    size="sm" 
                                                                    color={row.confirmacion_pcp === 'CONFORME' ? 'success' : 'danger'}
                                                                    variant="flat"
                                                                >
                                                                    {row.confirmacion_pcp}
                                                                </Chip>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            {row.cobertura_actual !== undefined && row.cobertura_actual !== null ? (
                                                                <span className="text-sm font-medium">{row.cobertura_actual}</span>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            {row.cobertura_ingreso !== undefined && row.cobertura_ingreso !== null ? (
                                                                <span className="text-sm font-medium">{row.cobertura_ingreso}</span>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.comentario ? (
                                                                <div className="truncate max-w-[200px]" title={row.comentario}>
                                                                    <span className="text-sm">{row.comentario}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                    </>
                ) : (
                    /* Vista de Calendario */
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
                            <div className="flex items-center flex-1 min-w-[180px] justify-center gap-2">
                                <Select
                                    label="Estado"
                                    selectedKeys={[filterStatus]}
                                    onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                                    className="max-w-xs min-w-[170px]"
                                    size="sm"
                                >
                                    <SelectItem key="all">Todos</SelectItem>
                                    <SelectItem key="REGISTRADA">Registrada</SelectItem>
                                    <SelectItem key="PROGRAMADA">Programada</SelectItem>
                                    <SelectItem key="REPROGRAMADA">Reprogramada</SelectItem>
                                    <SelectItem key="TRANSPORTE_COMPLETO">Transporte Completo</SelectItem>
                                    <SelectItem key="DOCUMENTOS_COMPLETOS">Documentos Completos</SelectItem>
                                    <SelectItem key="EN_EXPLANADA">En Explanada</SelectItem>
                                    <SelectItem key="CALIDAD_ACEPTADO">Calidad Aceptado</SelectItem>
                                    <SelectItem key="CALIDAD_OBSERVADO">Calidad Observado</SelectItem>
                                    <SelectItem key="ALMACEN_ACEPTADO">Almacén Aceptado</SelectItem>
                                    <SelectItem key="ALMACEN_OBSERVADO">Almacén Observado</SelectItem>
                                    <SelectItem key="PARTE_DE_INGRESO_GENERADO">Parte de Ingreso Generado</SelectItem>
                                    <SelectItem key="ENTREGADO">Entregado</SelectItem>
                                    <SelectItem key="Cancelada">Cancelada</SelectItem>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    startContent={<CalendarDaysIcon className="w-4 h-4" />}
                                    onPress={onExtendedViewOpen}
                                    className="min-w-[140px]"
                                >
                                    Ver Todas las Citas
                                </Button>
                            </div>
                            {/* Right section: Info */}
                            <div className="flex items-center gap-2 flex-shrink-0 justify-end min-w-[150px]">
                                {isLoadingAppointments && (
                                    <Chip color="primary" variant="flat" size="sm">
                                        Cargando...
                                    </Chip>
                                )}
                                <Chip color="primary" variant="flat" size="md">
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

                                                        //console.log("APT1: ", apt);
                                                        //console.log("DELIVERY DATE1: ", apt.deliveryDate);
                                                        //console.log("DELIVERY TIME1: ", apt.deliveryTime);
                                                        //console.log("DELIVERY TIME END1: ", apt.deliveryTimeEnd);
                                                        
                                                        // Comparar fecha parseando directamente desde string YYYY-MM-DD
                                                        const [aptYear, aptMonth, aptDay] = apt.deliveryDate.split('-').map(Number);
                                                        const aptDate = new Date(aptYear, aptMonth - 1, aptDay);
                                                        
                                                        const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                                                        
                                                        return aptDate.getTime() === dayDate.getTime();
                                                    });

                                                    // Calcular layout de citas solapadas para este día
                                                    const dayLayout = calculateOverlappingAppointmentsLayout(dayAppointments);

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
                                                                    
                                                                    // Obtener layout para esta cita (si hay solapamiento)
                                                                    const layout = dayLayout.get(apt.id);
                                                                    const column = layout?.column ?? 0;
                                                                    const totalColumns = layout?.totalColumns ?? 1;
                                                                    const widthPercent = layout ? (100 / totalColumns) : 100;
                                                                    const leftPercent = layout ? (column * (100 / totalColumns)) : 0;
                                                                    
                                                                    // Estilos según el estado de la cita
                                                                    const getStatusStyles = () => {
                                                                        const statusConfig = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG];
                                                                        if (statusConfig) {
                                                                            const colorMap: Record<string, string> = {
                                                                                'default': 'bg-gray-200 text-gray-900 border-gray-500',
                                                                                'primary': 'bg-blue-200 text-blue-900 border-blue-500',
                                                                                'success': 'bg-green-200 text-green-900 border-green-500',
                                                                                'warning': 'bg-yellow-200 text-yellow-900 border-yellow-500',
                                                                                'danger': 'bg-red-200 text-red-900 border-red-500'
                                                                            };
                                                                            return colorMap[statusConfig.color] || 'bg-blue-300 text-white border-blue-500';
                                                                        }
                                                                        return 'bg-blue-300 text-white border-blue-500';
                                                                    };

                                                                    return (
                                                                        <div
                                                                            key={apt.id}
                                                                            className={`absolute p-1.5 text-xs shadow-sm border-l-2 ${getStatusStyles()}`}
                                                                            style={{
                                                                                borderRadius: 0,
                                                                                top: `${topOffset + 2}px`,
                                                                                height: `${heightPixels - 4}px`,
                                                                                left: `${leftPercent + 0.5}%`,
                                                                                width: `${widthPercent - 1}%`,
                                                                                zIndex: 10 + column, // Citas más a la derecha tienen mayor z-index
                                                                                marginLeft: column === 0 ? '2px' : '0',
                                                                                marginRight: column === totalColumns - 1 ? '2px' : '0'
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
                                                                                    {apt.docEntry}
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
                )}

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
                    isCreating={isCreatingAppointment}
                    isLookingUp={isLookingUp}
                    getConflictingAppointments={getConflictingAppointments}
                    prefilledDate={scheduleForm.deliveryDate}
                    prefilledTime={scheduleForm.deliveryTime}
                    editingAppointment={editingAppointment}
                    currentUserRole={currentUser?.role}
                />


                {/* PackingList Modal */}
                <Modal isOpen={isPackingListOpen} onOpenChange={onPackingListOpenChange} size="4xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <div className="flex items-center justify-between w-full">
                                        {selectedAppointment?.docEntry && (
                                                <div className="mb-3 py-2 px-8 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                                                    <strong>Código de Cita:</strong> {selectedAppointment.docEntry} (se usará automáticamente)
                                                </div>
                                            )}
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
                                        
                                        <Divider />

                                        {/* Formulario para crear nuevo PackingList */}
                                        <div className='py-2 flex flex-col gap-4'>
                                            <h4 className="text-lg font-semibold mb-3">Crear Nuevo PackingList</h4>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    label="N° Orden de Compra"
                                                    size='sm'
                                                    value={packingListForm.orderNumber}
                                                    onValueChange={(value) => setPackingListForm(prev => ({ ...prev, orderNumber: value }))}
                                                    isRequired
                                                    description="Número de orden de compra"
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
                                                    label="Número de PackingList"
                                                    placeholder="Ej: 251047379_1"
                                                    size='sm'
                                                    value={packingListForm.number}
                                                    onValueChange={(value) => setPackingListForm(prev => ({ ...prev, number: value }))}
                                                    isRequired
                                                    description="Número de PackingList (se genera automáticamente al seleccionar un documento)"
                                                    isReadOnly
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
                                                        <SelectItem key={warehouse.codigo} textValue={`${warehouse.almacen} (${warehouse.codigo})`}>
                                                            {warehouse.almacen} ({warehouse.codigo})
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
                                            packingListItems.length === 0 ||
                                            // Si ningún item está seleccionado (marca = true) y con cantidad > 0, desactivar el botón
                                            packingListItems.filter(item => item.marca === true && item.quantity > 0).length === 0 ||
                                            // Si algún item seleccionado tiene cantidad inválida (mayor a pendiente), desactivar
                                            packingListItems.some(
                                                item =>
                                                    item.marca === true &&
                                                    item.quantity > 0 &&
                                                    item.quantity > item.pendingQuantity
                                            )
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
                                                placeholder="Buscar por número de orden..."
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
                                                                <span>N° Orden</span>
                                                            </div>
                                                        </TableColumn>
                                                        <TableColumn width={150}>
                                                            <div className="flex flex-col gap-1">
                                                                <span>CÓDIGO</span>
                                                            </div>
                                                        </TableColumn>
                                                        <TableColumn>
                                                            <div className="flex flex-col gap-1">
                                                                <span>PROVEEDOR</span>
                                                            </div>
                                                        </TableColumn>
                                                        <TableColumn width={120}>
                                                            <div className="flex flex-col gap-1">
                                                                <span>FECHA</span>
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
                                                                    
                                                                    //setIsLoadingDocumentDetail(true);
                                                                    try {
                                                                        // Obtener el detalle del documento
                                                                        const detailItems = await fetchDocumentDetailFromApi(doc.DocNum, selectedInboundType);
                                                                        
                                                                        // Validar si el detalle está vacío
                                                                        if (!detailItems || detailItems.length === 0) {
                                                                            alert('El documento seleccionado no tiene detalles. No se puede crear el PackingList sin items.');
                                                                            //setIsLoadingDocumentDetail(false);
                                                                            return;
                                                                        }
                                                                        
                                                                        // Generar el siguiente número de PackingList basado en el número de orden
                                                                        // Necesitamos el CodCita de la cita seleccionada
                                                                        if (!selectedAppointment?.docEntry) {
                                                                            alert('La cita no tiene código (DocEntry). No se puede generar el número de PackingList.');
                                                                            return;
                                                                        }
                                                                        const nextPackingListNumber = await generateNextPackingListNumber(doc.DocNum, selectedAppointment.docEntry);
                                                                        
                                                                        // Completar el formulario con los datos del documento
                                                                        setPackingListForm(prev => ({
                                                                            ...prev,
                                                                            orderNumber: doc.DocNum, // Mantener el número de orden
                                                                            number: nextPackingListNumber, // Asignar el número de PackingList generado
                                                                            inboundType: selectedInboundType || 'OCNAC'
                                                                        }));
                                                                        
                                                                        // Llenar la tabla de items
                                                                        const items: PackingListItem[] = detailItems.map((item, index: number) => {
                                                                            // Convertir Marca de string a boolean (puede ser "True", "False", "true", "false", etc.)
                                                                            const marca = item.marca?.toLowerCase() === 'true' || item.marca === '1';
                                                                            
                                                                            // Parsear Cantidad OC (puede venir como "Cantidad OC" o "CantidadOC")
                                                                            const cantidadOC = parseFloat(item["cantidad oc"] || item.cantidad_oc || "0");
                                                                            
                                                                            // Parsear Pendiente
                                                                            const pendiente = parseFloat(item.pendiente || "0");
                                                                            
                                                                            return {
                                                                                id: `${doc.DocNum}-${item.artículo}-${index}`,
                                                                                productCode: item.artículo,
                                                                                productName: item.descripción,
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
                                                                        //setIsLoadingDocumentDetail(false);
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
                                            isRequired
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
                                            isRequired
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
                                        isDisabled={
                                            !transportForm.driverName ||
                                             !transportForm.vehiclePlate ||
                                             !transportForm.driverLicense ||
                                             !transportForm.contactPhone ||
                                             !transportForm.estimatedArrival
                                            }
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

                {/* Extended View Modal - Vista ampliada de citas */}
                <Modal 
                    isOpen={isExtendedViewOpen} 
                    onOpenChange={onExtendedViewOpenChange} 
                    size="5xl" 
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-4">
                                    <div className="flex items-center justify-left gap-2 w-full">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {currentUser?.role === UserRole.PROVEEDOR
                                                ? 'Todas mis Citas'
                                                : 'Listado total de Citas'}
                                        </h2>
                                        <Chip color="primary" variant="flat" size="sm">
                                            {extendedViewAppointments.length} {extendedViewAppointments.length === 1 ? 'cita' : 'citas'}
                                        </Chip>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Select
                                            label="Seleccionar Mes"
                                            selectedKeys={[selectedMonth]}
                                            onSelectionChange={(keys) => {
                                                const month = Array.from(keys)[0] as string;
                                                if (month) setSelectedMonth(month);
                                            }}
                                            className="min-w-[250px]"
                                            size="sm"
                                        >
                                            {getMonthOptions().map(monthKey => {
                                                const [year, monthNum] = monthKey.split('-').map(Number);
                                                const date = new Date(year, monthNum - 1, 1);
                                                const label = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
                                                return (
                                                    <SelectItem 
                                                        key={monthKey} 
                                                        textValue={label}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                );
                                            })}
                                        </Select>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            onPress={() => {
                                                const now = new Date();
                                                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                                                setSelectedMonth(currentMonth);
                                            }}
                                        >
                                            Mes Actual
                                        </Button>
                                    </div>
                                </ModalHeader>
                                <ModalBody>
                                    {isLoadingExtendedView ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-gray-500">Cargando citas...</p>
                                        </div>
                                    ) : extendedViewAppointments.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-gray-500">No hay citas programadas para el mes seleccionado.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {groupAppointmentsByDay(extendedViewAppointments).map(([dayKey, dayAppointments]) => {
                                                const [,,day] = dayKey.split('-').map(Number);
                                                const isToday = dayKey === new Date().toISOString().split('T')[0];
                                                

                                                return (
                                                    <div key={dayKey} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        
                                                        <div className="divide-y divide-gray-200">
                                                            {dayAppointments.map(apt => {
                                                                
                                                                return (
                                                                    <div
                                                                        key={apt.id}
                                                                        className={`p-1 hover:bg-gray-50 cursor-pointer transition-colors`}
                                                                        onClick={() => {
                                                                            handleViewAppointment(apt);
                                                                            onClose();
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            {/* Date Number */}
                                                                            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg ${
                                                                                isToday ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                                                                            }`}>
                                                                                {day}
                                                                            </div>
                                                
                                                                            {/* Supplier Name */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <span className="font-light text-sm text-gray-500 truncate block">
                                                                                    {apt.supplierName}
                                                                                </span>
                                                                            </div>
                                                
                                                                            {/* Turno (Mañana/Tarde) */}
                                                                            {(() => {
                                                                                // Determinar turno (mañana o tarde) en base a deliveryTime
                                                                                let turno = '';
                                                                                if (apt.deliveryTime) {
                                                                                    const [hourStr] = apt.deliveryTime.split(':');
                                                                                    const hour = parseInt(hourStr, 10);
                                                                                    if (!isNaN(hour)) {
                                                                                        turno = hour < 12 ? 'Mañana' : 'Tarde';
                                                                                    }
                                                                                }
                                                                                if (turno) {
                                                                                    return (
                                                                                        <span className={`inline-block px-2 py-0.5 mr-2 rounded-full text-xs font-medium ${turno === 'Mañana' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                            {turno}
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            })()}
                                                                            {/* Time */}
                                                                            <div className="flex-shrink-0 text-sm text-gray-600">
                                                                                {apt.deliveryTime ? `${apt.deliveryTime}am` : '-'} - {apt.deliveryTimeEnd ? `${apt.deliveryTimeEnd}pm` : 'N/A'}
                                                                            </div>
                                                
                                                                            {/* Appointment Number */}
                                                                            {apt.docEntry && (
                                                                                <div className="flex-shrink-0 text-sm font-semibold text-gray-700 pr-2">
                                                                                    #{apt.docEntry}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );

                                            })}
                                        </div>
                                    )}
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

