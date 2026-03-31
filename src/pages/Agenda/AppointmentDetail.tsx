// src/pages/Agenda/AppointmentDetail.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    ModalFooter,
    Input,
    Textarea,
    Select,
    SelectItem,
    Checkbox,
    Divider,
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
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    StarIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAgendaStore } from "@/store/agendaStore";
import { useAuth } from "@/store/authStore";
import { UserRole } from "@/routes/menuTypes";
import { fetchPackingListFromApi, PackingListApiRecord, uploadFileToPackingList, createPackingListInApi, fetchWarehousesFromApi, WarehouseApiRecord, fetchDocumentsFromApi, DocumentApiRecord, fetchDocumentDetailFromApi } from "@/services/agenda/packingListApi";
import { formatDateForAPI, fetchAppointmentsFromApi, AppointmentDocument } from "@/services/agenda/appointmentsApi";
import { createChoferInApi } from "@/services/agenda/choferesApi";
import { fetchEvaluationByCodCita } from "@/services/agenda/evaluationsApi";
import { getPCPValidations, PCPValidationRecord } from "@/services/agenda/pcpApi";
import { STATUS_CONFIG } from "@/services/agenda/appointmentStatus";
import { DeliveryAppointment, PackingListItem, DeliveryEvaluation } from "@/store/types";
import DocumentsModal from './DocumentsModal';
import EvaluationModal from './EvaluationModal';
import ClaimModal from './ClaimModal';
import PCPValidationModal from './PCPValidationModal';
import { SupplierClaim } from '@/store/types';
import { generateClaimPDF, openClaimPDFInNewTab } from '@/utils/pdfGenerator';

// Función para convertir fecha de formato DD-MM-YYYY a Date para ordenamiento
const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    return new Date(0);
};

const AppointmentDetail: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const isProvider = currentUser?.role === UserRole.PROVEEDOR;
    const isSecurity = currentUser?.role === UserRole.SEGURIDAD;
    const { setSelectedAppointment } = useAgendaStore(); // Solo usamos setSelectedAppointment, no el store local de appointments
    const [appointment, setAppointment] = useState<DeliveryAppointment | null>(null);
    const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
    const [appointmentDocuments, setAppointmentDocuments] = useState<AppointmentDocument[]>([]);
    const [evaluation, setEvaluation] = useState<DeliveryEvaluation | null>(null);
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
    const [evaluationModalType, setEvaluationModalType] = useState<'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta'>('puntualidad');
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

    // Función helper para recargar el appointment desde el API
    const reloadAppointmentFromApi = async () => {
        if (!appointmentId) return;
        
        try {
            const apiAppointments = await fetchAppointmentsFromApi();
            const foundApiAppointment = apiAppointments.find(
                (apt) => apt.docEntry === appointmentId || apt.appointmentNumber === appointmentId
            );

            if (foundApiAppointment) {
                setAppointment(foundApiAppointment);
                
                // Cargar evaluación si existe docEntry
                if (foundApiAppointment.docEntry) {
                    try {
                        const evalData = await fetchEvaluationByCodCita(foundApiAppointment.docEntry);
                        if (evalData) {
                            setEvaluation(evalData);
                        }
                    } catch (error) {
                        console.error('Error al cargar evaluación:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error al recargar appointment desde API:', error);
        }
    };

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
                    
                    // Cargar evaluación si existe docEntry
                    if (foundApiAppointment.docEntry) {
                        try {
                            const evalData = await fetchEvaluationByCodCita(foundApiAppointment.docEntry);
                            if (evalData) {
                                setEvaluation(evalData);
                            }
                        } catch (error) {
                            console.error('Error al cargar evaluación:', error);
                        }
                    }
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
    const [pcpValidations, setPcpValidations] = useState<PCPValidationRecord[]>([]);
    const [, setIsLoadingPCPValidations] = useState(false);
    
    // Estado para visualizar documentos
    const [selectedDocument, setSelectedDocument] = useState<{ name: string; url: string; type: string } | null>(null);
    const { isOpen: isDocumentViewerOpen, onOpen: onDocumentViewerOpen, onClose: onDocumentViewerClose } = useDisclosure();
    
    // Estados para modales de gestión
    const { isOpen: isPackingListOpen, onOpen: onPackingListOpen, onClose: onPackingListClose } = useDisclosure();
    const { isOpen: isTransportOpen, onOpen: onTransportOpen, onClose: onTransportClose } = useDisclosure();
    const { isOpen: isDocumentsOpen, onOpen: onDocumentsOpen, onClose: onDocumentsClose } = useDisclosure();
    const { isOpen: isDocumentsSelectOpen, onOpen: onDocumentsSelectOpen, onClose: onDocumentsSelectClose } = useDisclosure();
    const { isOpen: isPCPValidationOpen, onOpen: onPCPValidationOpen, onClose: onPCPValidationClose } = useDisclosure();
    const [selectedPackingListForPCP, setSelectedPackingListForPCP] = useState<PackingListApiRecord | null>(null);
    
    // Estado para formulario de transporte
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

    // Estados para PackingList
    const [packingListForm, setPackingListForm] = useState({
        date: '',
        warehouse: '',
        comment: '',
        commentWms: '',
        number: '',
        orderNumber: '',
        inboundType: 'OCNAC' as 'OCNAC' | 'OCINT',
        ticket: '',
        items: [] as PackingListItem[]
    });
    const [packingListItems, setPackingListItems] = useState<PackingListItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseApiRecord[]>([]);
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
    const [documents, setDocuments] = useState<DocumentApiRecord[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [selectedInboundType, setSelectedInboundType] = useState<'OCNAC' | 'OCINT' | ''>('');
    const [documentSearchFilter, setDocumentSearchFilter] = useState<string>('');
    const documentSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Verificar si todos los documentos requeridos están completos
    const areAllDocumentsComplete = (): boolean => {
        // Documentos requeridos principales: Factura, Orden de Compra, Guia de Remisión
        // Los formatos (CDR, XML) ahora son parte de los documentos, no documentos separados
        const REQUIRED_DOCUMENTS_COUNT = 3;
        
        // Prioridad 1: Si hay documentos del API, verificar que haya al menos los documentos requeridos
        if (appointmentDocuments.length > 0) {
            // Debe haber al menos los documentos requeridos del API para considerarse completo
            return appointmentDocuments.length >= REQUIRED_DOCUMENTS_COUNT;
        }
        
        // Prioridad 2: Si no hay documentos del API, verificar documentos mapeados
        // Los documentos principales deben estar presentes
        if (appointment?.documents) {
            const hasInvoice = !!appointment.documents.invoice?.url;
            const hasPurchaseOrder = !!appointment.documents.purchaseOrder?.url;
            const hasDeliveryGuide = !!appointment.documents.deliveryGuide?.url;
            
            // Verificar documentos principales (CDR y XML ahora son formatos, no documentos separados)
            return hasInvoice && hasPurchaseOrder && hasDeliveryGuide;
        }
        
        return false;
    };

    // Obtener todos los documentos disponibles (priorizar documentos del API, luego los mapeados)
    const getAllDocuments = (): Array<{ name: string; url: string; type: string }> => {
        // Si hay documentos del API, usarlos directamente
        if (appointmentDocuments.length > 0) {
            return appointmentDocuments.map(doc => ({
                name: doc.u_name_file,
                url: doc.u_link_documento,
                type: doc.u_name_file.split('.').pop()?.toLowerCase() || 'unknown'
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

    // Ordenar y filtrar documentos - DEBE estar antes del return condicional
    const sortedAndFilteredDocuments = useMemo(() => {
        let filtered = [...documents];
        
        // Ordenar por fecha (TaxDate) descendente (más reciente primero)
        filtered.sort((a, b) => {
            const dateA = parseDate(a.TaxDate);
            const dateB = parseDate(b.TaxDate);
            return dateB.getTime() - dateA.getTime();
        });
        
        return filtered;
    }, [documents]);

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

    // Cargar validaciones PCP cuando se abre el modal de detalle del PackingList
    useEffect(() => {
        if (isPackingListDetailOpen && selectedPackingList && appointment?.docEntry) {
            const loadPCPValidations = async () => {
                setIsLoadingPCPValidations(true);
                try {
                    const validations = await getPCPValidations(appointment.docEntry ?? "", selectedPackingList.number ?? "");
                    setPcpValidations(validations);
                } catch (error) {
                    console.error('Error al cargar validaciones PCP:', error);
                    setPcpValidations([]);
                } finally {
                    setIsLoadingPCPValidations(false);
                }
            };
            
            loadPCPValidations();
        } else {
            setPcpValidations([]);
        }
    }, [isPackingListDetailOpen, selectedPackingList, appointment?.docEntry]);

    // Cargar almacenes cuando se abre el modal de PackingList
    useEffect(() => {
        if (isPackingListOpen) {
            const loadWarehouses = async () => {
                setIsLoadingWarehouses(true);
                try {
                    const warehousesData = await fetchWarehousesFromApi();
                    setWarehouses(warehousesData);
                } catch (error) {
                    console.error('Error al cargar almacenes:', error);
                } finally {
                    setIsLoadingWarehouses(false);
                }
            };
            loadWarehouses();
        } else {
            // Limpiar estados cuando se cierra el modal
            setSelectedInboundType('');
            setDocuments([]);
            setDocumentSearchFilter('');
            setPackingListItems([]);
        }
    }, [isPackingListOpen]);

    // Redirigir si no se encuentra el appointment después de cargar
    useEffect(() => {
        if (!isLoadingAppointment && !appointment) {
            const timer = setTimeout(() => {
                navigate('/agenda');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [appointment, isLoadingAppointment, navigate]);

    // Cargar evaluación cuando se carga el appointment
    useEffect(() => {
        if (appointment?.docEntry) {
            fetchEvaluationByCodCita(appointment.docEntry).then(setEvaluation).catch(console.error);
        }
    }, [appointment?.docEntry]);

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
            active: packingListsFromApi.length === 0 && appointment.status === 'REGISTRADA',
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
            completed: areAllDocumentsComplete(), // Verificar que todos los documentos requeridos estén presentes
            active: !!appointment.transportData && !areAllDocumentsComplete(),
        },
    ];

    // Obtener color y estilo según el estado usando STATUS_CONFIG
    const getStatusConfig = (status: string) => {
        // Usar STATUS_CONFIG si el estado existe, sino usar valores por defecto
        const statusKey = status as keyof typeof STATUS_CONFIG;
        if (statusKey && STATUS_CONFIG[statusKey]) {
            const config = STATUS_CONFIG[statusKey];
            // Mapear colores de STATUS_CONFIG a clases de Tailwind
            const colorMap: Record<string, { bg: string, text: string }> = {
                'default': { bg: 'bg-gray-50', text: 'text-gray-700' },
                'primary': { bg: 'bg-blue-50', text: 'text-blue-700' },
                'success': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
                'warning': { bg: 'bg-amber-50', text: 'text-amber-700' },
                'danger': { bg: 'bg-red-50', text: 'text-red-700' }
            };
            const colorClasses = colorMap[config.color] || colorMap['default'];
            return {
                color: config.color,
                bg: colorClasses.bg,
                text: colorClasses.text,
                label: config.label,
                description: config.description
            };
        }
        // Fallback para estados antiguos o no reconocidos
        return { 
            color: 'default' as const, 
            bg: 'bg-gray-50', 
            text: 'text-gray-700',
            label: status,
            description: ''
        };
    };

    const statusConfig = getStatusConfig(appointment.status);
    type EvaluationModalType = 'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta';

    // Verificar permisos según rol
    const canManagePackingList = [UserRole.ADMIN, UserRole.COMPRAS, UserRole.ALMACEN].includes(currentUser?.role || UserRole.ADMIN);
    const canManageTransport = currentUser?.role === UserRole.PROVEEDOR;
    const canManageDocuments = currentUser?.role === UserRole.PROVEEDOR;
    const canEvaluateSecurity = [UserRole.SEGURIDAD, UserRole.ADMIN].includes(currentUser?.role || UserRole.ADMIN);
    const canEvaluateQuality = [UserRole.CALIDAD, UserRole.ADMIN].includes(currentUser?.role || UserRole.ADMIN);
    const canEvaluateWarehouse = [UserRole.ALMACEN, UserRole.ADMIN].includes(currentUser?.role || UserRole.ADMIN);
    const canValidatePCP = [UserRole.PLANEAMIENTO, UserRole.ADMIN].includes(currentUser?.role || UserRole.ADMIN);
    const canViewEvaluation = [UserRole.ADMIN, UserRole.COMPRAS, UserRole.PROVEEDOR, UserRole.ALMACEN, UserRole.CALIDAD, UserRole.SEGURIDAD, UserRole.PLANEAMIENTO].includes(currentUser?.role || UserRole.ADMIN);

    const isCriterionEvaluated = (type: EvaluationModalType): boolean => {
        if (!evaluation) return false;

        switch (type) {
            case 'puntualidad':
                return evaluation.puntualidad?.puntaje !== undefined;
            case 'documentacion':
                return evaluation.documentacion?.puntaje !== undefined;
            case 'estadoMercaderia':
                return evaluation.estadoMercaderia?.puntaje !== undefined;
            case 'cantidadCorrecta':
                return evaluation.cantidadCorrecta?.puntaje !== undefined;
            default:
                return false;
        }
    };

    // Validaciones para abrir modales de evaluación
    const canEvaluateDocumentacion = (): boolean => {
        // Debe haber al menos un documento
        const allDocs = getAllDocuments();
        return allDocs.length > 0;
    };

    const canEvaluatePuntualidad = (): boolean => {
        // Debe haber llegado la fecha y hora de la cita
        if (!appointment?.deliveryDate || !appointment?.deliveryTime) {
            return false;
        }
        
        // Construir fecha/hora de la cita
        const appointmentDateTime = new Date(`${appointment.deliveryDate}T${appointment.deliveryTime}`);
        const now = new Date();
        
        // La fecha/hora de la cita debe haber pasado
        return appointmentDateTime <= now;
    };

    const canEvaluateCalidadYCantidad = (): boolean => {
        // Debe haberse calificado puntualidad primero
        return isCriterionEvaluated('puntualidad');
    };

    const canOpenEvaluationModal = (type: EvaluationModalType): boolean => {
        // Primero verificar que no esté ya evaluado
        if (isCriterionEvaluated(type)) {
            return false;
        }

        // Validaciones específicas por tipo
        switch (type) {
            case 'documentacion':
                return canEvaluateDocumentacion();
            case 'puntualidad':
                return canEvaluatePuntualidad();
            case 'estadoMercaderia':
            case 'cantidadCorrecta':
                return canEvaluateCalidadYCantidad();
            default:
                return true;
        }
    };

    const getEvaluationErrorMessage = (type: EvaluationModalType): string => {
        switch (type) {
            case 'documentacion':
                return 'No se puede calificar Documentación: aún no hay documentos cargados.';
            case 'puntualidad':
                return 'No se puede calificar Puntualidad: la fecha y hora de la cita aún no han llegado.';
            case 'estadoMercaderia':
            case 'cantidadCorrecta':
                return 'No se puede calificar: primero debe calificarse la Puntualidad (asistencia).';
            default:
                return 'No se puede evaluar en este momento.';
        }
    };

    const handleOpenPackingList = () => {
        setSelectedAppointment(appointment);
        // Pre-llenar fecha con la fecha de la cita si está disponible
        if (appointment.deliveryDate && !packingListForm.date) {
            setPackingListForm(prev => ({
                ...prev,
                date: appointment.deliveryDate
            }));
        }
        onPackingListOpen();
    };

    // Generar siguiente número de PackingList
    const generateNextPackingListNumber = async (docNum: string, codCita: string): Promise<string> => {
        try {
            if (!codCita) {
                return `${docNum}_1`;
            }
            
            const now = new Date();
            const startDate = new Date(now.getFullYear() - 2, 0, 1);
            const endDate = new Date(now.getFullYear() + 2, 11, 31);
            
            const fechaInicio = formatDateForAPI(startDate);
            const fechaFin = formatDateForAPI(endDate);
            
            const allPackingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, codCita);
            
            const matchingPackingLists = allPackingLists.filter(pl => {
                if (!pl.number) return false;
                const numberStr = String(pl.number).trim();
                return numberStr.startsWith(`${docNum}_`);
            });
            
            let maxCorrelative = 0;
            matchingPackingLists.forEach(pl => {
                if (pl.number) {
                    const numberStr = String(pl.number).trim();
                    const parts = numberStr.split('_');
                    if (parts.length >= 2) {
                        const correlativeStr = parts[parts.length - 1];
                        const correlative = parseInt(correlativeStr, 10);
                        if (!isNaN(correlative) && correlative > maxCorrelative) {
                            maxCorrelative = correlative;
                        }
                    }
                }
            });
            
            const nextCorrelative = maxCorrelative + 1;
            return `${docNum}_${nextCorrelative}`;
        } catch (error) {
            console.error('Error al generar número de PackingList:', error);
            return `${docNum}_1`;
        }
    };

    // Handle create packing list
    const handleCreatePackingList = async () => {
        if (!appointment || !appointment.docEntry || !packingListForm.warehouse || packingListItems.length === 0) {
            alert('Por favor complete todos los campos requeridos. Asegúrese de que la cita tenga DocEntry.');
            return;
        }

        if (!packingListForm.number || !packingListForm.number.trim()) {
            alert('El número de PackingList es requerido. Debe venir de una orden de compra.');
            return;
        }
        
        let vendorId = appointment.supplierId || appointment.supplierRUC;
        if (vendorId && !vendorId.startsWith('P')) {
            vendorId = `P${vendorId}`;
        }
        
        try {
            const selectedItems = packingListItems.filter(item => 
                item.marca === true && item.quantity > 0
            );
            
            if (selectedItems.length === 0) {
                alert('Debe seleccionar al menos un item con cantidad mayor a 0');
                return;
            }
            
            await createPackingListInApi({
                vendor_id: vendorId,
                whs_code: packingListForm.warehouse,
                number: packingListForm.number.trim(),
                inbound_type: packingListForm.inboundType || 'OCNAC',
                comments: packingListForm.comment || '',
                date_expected: packingListForm.date || new Date().toISOString().split('T')[0],
                ticket: "0",
                wms_response: packingListForm.commentWms || '',
                cod_cita: appointment.docEntry,
                _detalle_packin_list: selectedItems.map((item, index) => ({
                    document: (item as any).document || 0,
                    line_number: index + 1,
                    item_code: item.productCode,
                    item_name: item.productName,
                    quantity: item.quantity
                }))
            });

            // Actualizar estado de la cita a PROGRAMADA cuando se crea el packing list
            if (appointment.docEntry && currentUser) {
                const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                await updateAppointmentStatus(appointment.docEntry, 'PROGRAMADA', userId);
                // Recargar appointment para obtener el estado actualizado
                await reloadAppointmentFromApi();
            }

            alert('PackingList creado exitosamente. Estado actualizado a PROGRAMADA.');
            
            // Limpiar formulario
            setPackingListForm({
                date: appointment.deliveryDate || '',
                warehouse: '',
                comment: '',
                commentWms: '',
                number: '',
                orderNumber: '',
                inboundType: 'OCNAC',
                ticket: '',
                items: []
            });
            setPackingListItems([]);
            setSelectedInboundType('');
            setDocuments([]);
            
            // Recargar PackingList
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 30);
            
            const fechaInicio = formatDateForAPI(startDate);
            const fechaFin = formatDateForAPI(endDate);
            
            const packingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, appointment.docEntry);
            setPackingListsFromApi(packingLists);
            
            onPackingListClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            alert(`Error al crear PackingList: ${errorMessage}`);
            console.error('Error al crear PackingList:', error);
        }
    };

    const handleOpenTransport = () => {
        setSelectedAppointment(appointment);
        // Pre-llenar formulario si hay datos de transporte existentes
        if (appointment.transportData) {
            setTransportForm({
                transportCompany: appointment.transportData.transportCompany || '',
                driverName: appointment.transportData.driverName || '',
                driverLicense: appointment.transportData.driverLicense || '',
                vehiclePlate: appointment.transportData.vehiclePlate || '',
                vehicleType: appointment.transportData.vehicleType || '',
                contactPhone: appointment.transportData.contactPhone || '',
                estimatedArrival: appointment.transportData.estimatedArrival || '',
                notes: appointment.transportData.notes || ''
            });
        }
        onTransportOpen();
    };

    const handleOpenDocuments = () => {
        setSelectedAppointment(appointment);
        onDocumentsOpen();
    };

    const handleEdit = () => {
        setSelectedAppointment(appointment);
        navigate('/agenda', { state: { openEdit: true } });
    };

    const handleOpenEvaluation = () => {
        if (appointment?.docEntry) {
            navigate(`/agenda/evaluation/${appointment.docEntry}`);
        }
    };

    const handleOpenEvaluationModal = (type: EvaluationModalType) => {
        if (!canOpenEvaluationModal(type)) {
            // Mostrar mensaje de error específico
            const errorMessage = getEvaluationErrorMessage(type);
            alert(errorMessage);
            return;
        }
        setEvaluationModalType(type);
        setIsEvaluationModalOpen(true);
    };

    const handleEvaluationSaved = async (updatedEvaluation: DeliveryEvaluation) => {
        setEvaluation(updatedEvaluation);
        
        // Actualizar estado de la cita según el tipo de evaluación
        if (!appointment?.docEntry) return;
        
        const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
        
        // Si se evaluó estado de mercadería, actualizar estado de calidad
        if (updatedEvaluation.estadoMercaderia?.estado) {
            const calidadEstado = updatedEvaluation.estadoMercaderia.estado;
            let newStatus: 'CALIDAD_ACEPTADO' | 'CALIDAD_OBSERVADO' | 'CALIDAD_RECHAZADO';
            
            if (calidadEstado === 'ACEPTADO') {
                newStatus = 'CALIDAD_ACEPTADO';
            } else if (calidadEstado === 'OBSERVADO') {
                newStatus = 'CALIDAD_OBSERVADO';
            } else {
                newStatus = 'CALIDAD_RECHAZADO';
            }
            
            const userId = currentUser?.userCode || currentUser?.id || currentUser?.username || 'system';
            await updateAppointmentStatus(appointment.docEntry, newStatus, userId);
            // Recargar appointment para obtener el estado actualizado
            await reloadAppointmentFromApi();
        }
        
        // Si se evaluó cantidad correcta, actualizar estado de almacén
        if (updatedEvaluation.cantidadCorrecta && appointment.docEntry && currentUser) {
            // Determinar estado basado en el puntaje o estado explícito
            let almacenEstado: 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO';
            
            if (updatedEvaluation.cantidadCorrecta.estado) {
                almacenEstado = updatedEvaluation.cantidadCorrecta.estado;
            } else {
                // Si no hay estado explícito, determinarlo por puntaje (escala 1-10)
                const puntaje = updatedEvaluation.cantidadCorrecta.puntaje || 0;
                if (puntaje >= 9) {
                    almacenEstado = 'ACEPTADO';
                } else if (puntaje >= 5) {
                    almacenEstado = 'OBSERVADO';
                } else {
                    almacenEstado = 'RECHAZADO';
                }
            }
            
            let newStatus: 'ALMACEN_ACEPTADO' | 'ALMACEN_OBSERVADO' | 'ALMACEN_RECHAZADO';
            
            if (almacenEstado === 'ACEPTADO') {
                newStatus = 'ALMACEN_ACEPTADO';
            } else if (almacenEstado === 'OBSERVADO') {
                newStatus = 'ALMACEN_OBSERVADO';
            } else {
                newStatus = 'ALMACEN_RECHAZADO';
            }
            
            const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
            await updateAppointmentStatus(appointment.docEntry, newStatus, userId);
            // Recargar appointment para obtener el estado actualizado
            await reloadAppointmentFromApi();
        }
    };

    const handleRejectEvaluation = () => {
        // Abrir modal de reclamo cuando se rechaza
        console.log('handleRejectEvaluation llamado, abriendo modal de reclamo...');
        setIsClaimModalOpen(true);
    };

    // Handler para marcar proveedor como llegado (EN_EXPLANADA)
    const handleMarkArrived = async () => {
        if (!appointment?.docEntry || !currentUser) {
            alert('La cita no tiene código (DocEntry) o no hay usuario autenticado');
            return;
        }

        try {
            const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
            const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
            await updateAppointmentStatus(appointment.docEntry, 'EN_EXPLANADA', userId);
            // Recargar appointment para obtener el estado actualizado
            await reloadAppointmentFromApi();
            alert('Proveedor marcado como llegado. Estado actualizado a EN_EXPLANADA.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar estado';
            alert(`Error: ${errorMessage}`);
            console.error('Error al marcar como llegado:', error);
        }
    };

    // Handler para generar Parte de Ingreso
    const handleGenerateParteIngreso = async () => {
        if (!appointment?.docEntry || !currentUser) {
            alert('La cita no tiene código (DocEntry) o no hay usuario autenticado');
            return;
        }

        const confirm = window.confirm('¿Confirma que desea generar el Parte de Ingreso? Esta acción actualizará el estado de la cita.');
        if (!confirm) return;

        try {
            const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
            const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
            await updateAppointmentStatus(appointment.docEntry, 'PARTE_DE_INGRESO_GENERADO', userId);
            // Recargar appointment para obtener el estado actualizado
            await reloadAppointmentFromApi();
            alert('Parte de Ingreso generado exitosamente. Estado actualizado.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al generar Parte de Ingreso';
            alert(`Error: ${errorMessage}`);
            console.error('Error al generar Parte de Ingreso:', error);
        }
    };

    // Handler para marcar como entregado
    const handleMarkDelivered = async () => {
        if (!appointment?.docEntry || !currentUser) {
            alert('La cita no tiene código (DocEntry) o no hay usuario autenticado');
            return;
        }

        const confirm = window.confirm('¿Confirma que la entrega está completa y desea marcar como ENTREGADO? Esta acción cerrará el proceso.');
        if (!confirm) return;

        try {
            const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
            const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
            await updateAppointmentStatus(appointment.docEntry, 'ENTREGADO', userId);
            // Recargar appointment para obtener el estado actualizado
            await reloadAppointmentFromApi();
            alert('Entrega marcada como completada. Estado actualizado a ENTREGADO.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al marcar como entregado';
            alert(`Error: ${errorMessage}`);
            console.error('Error al marcar como entregado:', error);
        }
    };

    const handleGenerateClaim = async (claimData: Partial<SupplierClaim>) => {
        try {
            const claim: SupplierClaim = {
                ...claimData,
                codCita: appointment?.docEntry || appointment?.id || '',
                numeroReclamo: claimData.numeroReclamo || `REC-${appointment?.docEntry || appointment?.id}-${Date.now()}`,
                fechaReclamo: claimData.fechaReclamo || new Date().toISOString().split('T')[0],
                proveedor: appointment?.supplierName || '',
                status: 'Abierto',
            } as SupplierClaim;

            // Generar y descargar el PDF
            await generateClaimPDF(claim);
            
            // También abrir en nueva pestaña para visualización
            await openClaimPDFInNewTab(claim);
            
            alert('Reclamo generado exitosamente. El PDF se ha descargado y abierto en una nueva pestaña.');
        } catch (error) {
            console.error('Error al generar reclamo:', error);
            alert(`Error al generar el reclamo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    // Handler para guardar datos de transporte
    const handleSaveTransportData = async () => {
        if (!appointment || !transportForm.driverName || !transportForm.vehiclePlate) {
            alert('Por favor complete los campos requeridos');
            return;
        }

        if (!appointment.docEntry) {
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
                u_cod_cita: appointment.docEntry
            };

            // Llamar al API para crear el chofer
            await createChoferInApi(choferData);

            // Actualizar estado de la cita a TRANSPORTE_COMPLETO
            if (appointment.docEntry && currentUser) {
                const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                await updateAppointmentStatus(appointment.docEntry, 'TRANSPORTE_COMPLETO', userId);
                // Recargar appointment para obtener el estado actualizado
                await reloadAppointmentFromApi();
            }

            alert('Datos de transporte guardados exitosamente. Estado actualizado a TRANSPORTE_COMPLETO.');
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
            onTransportClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar datos de transporte';
            alert(`Error al guardar datos de transporte: ${errorMessage}`);
            console.error('Error al guardar datos de transporte:', error);
        }
    };

    // Handler para subir documentos
    const handleUploadDocument = async (type: string, file: File): Promise<void> => {
        if (!appointment) {
            throw new Error('No hay cita seleccionada');
        }

        if (!appointment.docEntry) {
            throw new Error('La cita no tiene código (DocEntry). No se puede subir el archivo.');
        }

        try {
            // Subir archivo al API
            await uploadFileToPackingList(file, type, appointment.docEntry);
            
            // Recargar documentos del appointment
            const apiAppointments = await fetchAppointmentsFromApi();
            const foundApiAppointment = apiAppointments.find(
                (apt) => apt.docEntry === appointment.docEntry
            );
            if (foundApiAppointment && (foundApiAppointment as any).Documents) {
                setAppointmentDocuments((foundApiAppointment as any).Documents || []);
                
                // Verificar si todos los documentos están completos y actualizar estado
                const documents = (foundApiAppointment as any).Documents || [];
                if (documents.length >= 5 && appointment.status !== 'DOCUMENTOS_COMPLETOS' && appointment.docEntry && currentUser) {
                    const { updateAppointmentStatus } = await import('@/services/agenda/appointmentStatus');
                    const userId = currentUser.userCode || currentUser.id || currentUser.username || 'system';
                    await updateAppointmentStatus(appointment.docEntry, 'DOCUMENTOS_COMPLETOS', userId);
                    // Recargar appointment para obtener el estado actualizado
                    await reloadAppointmentFromApi();
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir archivo';
            throw new Error(errorMessage);
        }
    };

    return (
        <Dashboard>
            <div className="py-6">
                {/* Header con botón de regreso y acciones */}
                <div className="mb-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <Button
                            variant="light"
                            startContent={<ArrowLeftIcon className="w-5 h-5" />}
                            onPress={() => navigate('/agenda')}
                        >
                            Volver a Agenda
                        </Button>
                        
                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {!isProvider && (
                                <>
                                    {!isSecurity && (
                                        <Button 
                                        color="primary" 
                                        onPress={handleEdit}
                                        size="md"
                                        className="font-medium"
                                        startContent={<CalendarIcon className="w-4 h-4" />}
                                    >
                                        Editar Cita
                                    </Button>
                                    )}
                                    {canViewEvaluation && (
                                        <Button
                                            color="secondary"
                                            variant="flat"
                                            onPress={handleOpenEvaluation}
                                            size="md"
                                            className="font-medium"
                                            startContent={<StarIcon className="w-4 h-4" />}
                                        >
                                            Ver Calificación
                                        </Button>
                                    )}
                                    {canEvaluateSecurity && appointment?.docEntry && (
                                        <>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                onPress={() => handleOpenEvaluationModal('puntualidad')}
                                                size="md"
                                                startContent={<ClockIcon className="w-4 h-4" />}
                                                isDisabled={!canOpenEvaluationModal('puntualidad')}
                                            >
                                                Evaluar Puntualidad
                                            </Button>
                                        </>
                                    )}
                                    {canEvaluateSecurity && appointment?.docEntry && (
                                        <>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                onPress={() => handleOpenEvaluationModal('documentacion')}
                                                size="md"
                                                startContent={<DocumentTextIcon className="w-4 h-4" />}
                                                isDisabled={!canOpenEvaluationModal('documentacion')}
                                            >
                                                Evaluar Documentación
                                            </Button>
                                        </>
                                    )}
                                    {canEvaluateQuality && appointment?.docEntry && (
                                        <Button
                                            color="success"
                                            variant="flat"
                                            onPress={() => handleOpenEvaluationModal('estadoMercaderia')}
                                            size="sm"
                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                            isDisabled={!canOpenEvaluationModal('estadoMercaderia')}
                                        >
                                            Evaluar Estado Mercadería
                                        </Button>
                                    )}
                                    {canEvaluateWarehouse && appointment?.docEntry && (
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            onPress={() => handleOpenEvaluationModal('cantidadCorrecta')}
                                            size="sm"
                                            isDisabled={!canOpenEvaluationModal('cantidadCorrecta')}
                                            startContent={<BuildingOfficeIcon className="w-4 h-4" />}
                                        >
                                            Evaluar Cantidad
                                        </Button>
                                    )}
                                    {canEvaluateSecurity && appointment?.docEntry && 
                                     (appointment.status === 'DOCUMENTOS_COMPLETOS' || appointment.status === 'EN_EXPLANADA' || appointment.status === 'EN_ENTREGA') && (
                                        <Button
                                            color="warning"
                                            variant="solid"
                                            onPress={handleMarkArrived}
                                            size="md"
                                            className="font-medium"
                                            startContent={<TruckIcon className="w-4 h-4" />}
                                        >
                                            Proveedor Llegó
                                        </Button>
                                    )}
                                    {canEvaluateWarehouse && appointment?.docEntry && 
                                     (appointment.status === 'ALMACEN_ACEPTADO' || appointment.status === 'ALMACEN_OBSERVADO') && (
                                        <Button
                                            color="success"
                                            variant="solid"
                                            onPress={handleGenerateParteIngreso}
                                            size="md"
                                            className="font-medium"
                                            startContent={<DocumentTextIcon className="w-4 h-4" />}
                                        >
                                            Generar Parte Ingreso
                                        </Button>
                                    )}
                                    {canEvaluateWarehouse && appointment?.docEntry && 
                                     appointment.status === 'PARTE_DE_INGRESO_GENERADO' && (
                                        <Button
                                            color="success"
                                            variant="solid"
                                            onPress={handleMarkDelivered}
                                            size="md"
                                            className="font-medium"
                                            startContent={<CheckCircleIcon className="w-4 h-4" />}
                                        >
                                            Marcar como Entregado
                                        </Button>
                                    )}
                                    {[UserRole.ADMIN, UserRole.COMPRAS].includes(currentUser?.role || UserRole.ADMIN) && (
                                        <Button
                                            color="primary"
                                            variant="solid"
                                            onPress={handleOpenEvaluation}
                                            size="md"
                                            className="font-medium"
                                            startContent={<StarIcon className="w-4 h-4" />}
                                        >
                                            Calificar
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

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
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {appointment.docEntry ? `Cita #${appointment.docEntry}` : `Cita #${appointment.appointmentNumber}`}
                                            </h3>
                                            {evaluation && evaluation.puntajeTotal && evaluation.puntajeTotal > 0 && (
                                                <Chip
                                                    color={
                                                        evaluation.badge === 'Excelente' ? 'success' :
                                                        evaluation.badge === 'Bueno' ? 'primary' :
                                                        evaluation.badge === 'Regular' ? 'warning' : 'danger'
                                                    }
                                                    variant="flat"
                                                    size="lg"
                                                    classNames={{
                                                        base: "font-bold shadow-md"
                                                    }}
                                                >
                                                    {evaluation.badge} ({evaluation.puntajeTotal.toFixed(1)}/10)
                                                </Chip>
                                            )}
                                        </div>
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
                                            appointment.status === 'ENTREGADO' ? (
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
                                        {statusConfig.label || appointment.status}
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
                                                <p className="text-md text-gray-500 mb-2">Sin datos de transporte</p>
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
                                            <TableColumn width={150}>ACCIONES</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {packingListsFromApi.map((pl) => {
                                                // Obtener el detalle (puede venir en cualquiera de los dos campos)
                                                const detalle = pl.detalle_packin_list || pl.DetallePackinList || [];
                                                
                                                return (
                                                    <TableRow 
                                                        key={pl.id}
                                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                        onClick={(e) => {
                                                            // No abrir el modal de detalle si se hace clic en la celda de acciones
                                                            const target = e.target as HTMLElement;
                                                            if (target.closest('button') || target.closest('[data-action-cell]')) {
                                                                return;
                                                            }
                                                            setSelectedPackingList(pl);
                                                            onPackingListDetailOpen();
                                                        }}
                                                    >
                                                        <TableCell className="whitespace-nowrap font-medium">
                                                            <div className="flex items-center gap-2">
                                                                {pl.number}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{pl.whs_code}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{pl.ticket || '-'}</TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {typeof pl.date_expected === 'string'
                                                                ? pl.date_expected.split('T')[0].split(' ')[0]
                                                                : pl.date_expected
                                                            }
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {pl.emission_date
                                                                ? (typeof pl.emission_date === 'string'
                                                                    ? pl.emission_date.split('T')[0].split(' ')[0]
                                                                    : pl.emission_date
                                                                )
                                                                : '-'
                                                            }
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            {pl.inbound_type ? (
                                                                <Chip size="sm" variant="flat" color={pl.inbound_type === 'OCNAC' ? 'primary' : 'secondary'}>
                                                                    {pl.inbound_type}
                                                                </Chip>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap text-center">
                                                            {detalle.length}
                                                        </TableCell>
                                                            <TableCell>
                                                                <div className="max-w-[200px] truncate" title={pl.comments || ''}>
                                                                    {pl.comments || '-'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {pl.wms_response ? (
                                                                    <Chip 
                                                                        size="sm" 
                                                                        color={pl.wms_response.includes('Procesado') || pl.wms_response.includes('Transferido') ? 'success' : 'warning'}
                                                                        variant="flat"
                                                                    >
                                                                        <div className="max-w-[150px] truncate" title={pl.wms_response}>
                                                                            {pl.wms_response}
                                                                        </div>
                                                                    </Chip>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </TableCell>
                                                            <TableCell data-action-cell onClick={(e) => e.stopPropagation()}>
                                                                {canValidatePCP ? (
                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                        <Button
                                                                            size="sm"
                                                                            color="secondary"
                                                                            variant="flat"
                                                                            startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                                                                            onPress={() => {
                                                                                setSelectedPackingListForPCP(pl);
                                                                                onPCPValidationOpen();
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedPackingListForPCP(pl);
                                                                                onPCPValidationOpen();
                                                                            }}
                                                                        >
                                                                            Validar PCP
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 text-sm">-</span>
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
                        size="full"
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
                                    const detalle = selectedPackingList.detalle_packin_list || selectedPackingList.DetallePackinList || [];
                                    
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
                                                            <TableColumn width={120}>CONFIRMACIÓN PCP</TableColumn>
                                                            <TableColumn width={120}>COBERTURA ACTUAL</TableColumn>
                                                            <TableColumn width={150}>COBERTURA CON INGRESOS</TableColumn>
                                                            <TableColumn>COMENTARIO PCP</TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {detalle.map((item: any, index: number) => {
                                                                const lineNumber = item.LineNumber || item.line_number || index + 1;
                                                                const itemCode = item.ItemCode || item.item_code || '';
                                                                const itemName = item.ItemName || item.item_name || '';
                                                                const quantity = item.Quantity || item.quantity || 0;
                                                                
                                                                // Buscar validación PCP para este item
                                                                const pcpValidation = pcpValidations.find(
                                                                    v => v.item_code === itemCode && v.line_number === lineNumber
                                                                );
                                                                
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
                                                                        <TableCell className="text-center whitespace-nowrap font-semibold">
                                                                            {quantity.toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {pcpValidation?.confirmacion_pcp ? (
                                                                                <Chip 
                                                                                    size="sm" 
                                                                                    color={pcpValidation.confirmacion_pcp === 'CONFORME' ? 'success' : 'danger'}
                                                                                    variant="flat"
                                                                                >
                                                                                    {pcpValidation.confirmacion_pcp}
                                                                                </Chip>
                                                                            ) : (
                                                                                <span className="text-gray-400 text-sm">-</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {pcpValidation?.cobertura_actual !== undefined && pcpValidation.cobertura_actual !== null ? (
                                                                                <span className="text-sm font-medium">{pcpValidation.cobertura_actual.toFixed(2)}</span>
                                                                            ) : (
                                                                                <span className="text-gray-400 text-sm">-</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {pcpValidation?.cobertura_con_ingresos !== undefined && pcpValidation.cobertura_con_ingresos !== null ? (
                                                                                <span className="text-sm font-medium">{pcpValidation.cobertura_con_ingresos.toFixed(2)}</span>
                                                                            ) : (
                                                                                <span className="text-gray-400 text-sm">-</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {pcpValidation?.comentario ? (
                                                                                <div className="max-w-[200px] truncate" title={pcpValidation.comentario}>
                                                                                    <span className="text-sm">{pcpValidation.comentario}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-gray-400 text-sm">-</span>
                                                                            )}
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
                        areAllDocumentsComplete()
                            ? 'border-emerald-200 bg-emerald-50/30' 
                            : 'border-gray-200 hover:border-blue-300'
                    }`}>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <DocumentTextIcon className={`w-5 h-5 ${
                                        areAllDocumentsComplete() ? 'text-emerald-600' : 'text-gray-400'
                                    }`} />
                                    Documentos
                                </h4>
                                {areAllDocumentsComplete() ? (
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

                                                {/* Nota: CDR y XML son formatos, no documentos separados.
                                                    Los documentos pueden cargarse en formato CDR/XML según el tipo de documento */}
                                            </div>
                                        );
                                    })()}

                                    {!areAllDocumentsComplete() && canManageDocuments && (
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

                {/* Modal de PackingList */}
                <Modal isOpen={isPackingListOpen} onClose={onPackingListClose} size="4xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <div className="flex items-center justify-between w-full">
                                        {appointment?.docEntry && (
                                            <div className="mb-3 py-2 px-8 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                                                <strong>Código de Cita:</strong> {appointment.docEntry} (se usará automáticamente)
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
                                                        
                                                        if (documents.length > 0 && packingListForm.inboundType === selectedInboundType) {
                                                            onDocumentsSelectOpen();
                                                            return;
                                                        }
                                                        
                                                        setIsLoadingDocuments(true);
                                                        try {
                                                            const docs = await fetchDocumentsFromApi(selectedInboundType, undefined, appointment?.supplierRUC);
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
                                                        const keysArray = Array.from(keys);
                                                        const value = keysArray.length > 0 ? keysArray[0] : '';
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
                                            </div>

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
                                                            {packingListItems.map((item) => (
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
                                                                            disabled={!item.marca}
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
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : packingListForm.number ? (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <div className="flex items-start">
                                                        <div className="flex-shrink-0">
                                                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
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
                                            packingListItems.filter(item => item.marca === true && item.quantity > 0).length === 0 ||
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

                {/* Modal de Selección de Documentos */}
                <Modal isOpen={isDocumentsSelectOpen} onClose={onDocumentsSelectClose} size="5xl" scrollBehavior="inside">
                    <ModalContent>
                        {(onClose) => {
                            const handleSearchChange = (value: string) => {
                                setDocumentSearchFilter(value);
                                if (documentSearchTimeoutRef.current) {
                                    clearTimeout(documentSearchTimeoutRef.current);
                                }
                                
                                if (!selectedInboundType) {
                                    return;
                                }
                                
                                documentSearchTimeoutRef.current = setTimeout(async () => {
                                    setIsLoadingDocuments(true);
                                    try {
                                        const docs = await fetchDocumentsFromApi(
                                            selectedInboundType, 
                                            value ? value.trim() : undefined,
                                            appointment?.supplierRUC
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
                                                        <TableColumn width={150}>N° Orden</TableColumn>
                                                        <TableColumn width={150}>CÓDIGO</TableColumn>
                                                        <TableColumn>PROVEEDOR</TableColumn>
                                                        <TableColumn width={120}>FECHA</TableColumn>
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
                                                                    
                                                                    try {
                                                                        const detailItems = await fetchDocumentDetailFromApi(doc.DocNum, selectedInboundType);
                                                                        
                                                                        if (!detailItems || detailItems.length === 0) {
                                                                            alert('El documento seleccionado no tiene detalles. No se puede crear el PackingList sin items.');
                                                                            return;
                                                                        }
                                                                        
                                                                        if (!appointment?.docEntry) {
                                                                            alert('La cita no tiene código (DocEntry). No se puede generar el número de PackingList.');
                                                                            return;
                                                                        }
                                                                        const nextPackingListNumber = await generateNextPackingListNumber(doc.DocNum, appointment.docEntry);
                                                                        
                                                                        setPackingListForm(prev => ({
                                                                            ...prev,
                                                                            orderNumber: doc.DocNum,
                                                                            number: nextPackingListNumber,
                                                                            inboundType: selectedInboundType || 'OCNAC'
                                                                        }));
                                                                        
                                                                        const items: PackingListItem[] = detailItems.map((item, index: number) => {
                                                                            const marca = item.marca?.toLowerCase() === 'true' || item.marca === '1';
                                                                            const cantidadOC = parseFloat(item["cantidad oc"] || item.cantidad_oc || "0");
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

                {/* Modal de Transporte */}
                <Modal isOpen={isTransportOpen} onClose={onTransportClose} size="2xl" scrollBehavior="inside">
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

                {/* Modal de Documentos */}
                <DocumentsModal
                    isOpen={isDocumentsOpen}
                    onOpenChange={async (open) => {
                        if (!open) {
                            onDocumentsClose();
                            // Recargar documentos del appointment cuando se cierra el modal
                            if (appointment?.docEntry) {
                                try {
                                    const apiAppointments = await fetchAppointmentsFromApi();
                                    const foundApiAppointment = apiAppointments.find(
                                        (apt) => apt.docEntry === appointment.docEntry
                                    );
                                    if (foundApiAppointment && (foundApiAppointment as any).Documents) {
                                        setAppointmentDocuments((foundApiAppointment as any).Documents || []);
                                    }
                                } catch (error) {
                                    console.error('Error al recargar documentos:', error);
                                }
                            }
                        }
                    }}
                    selectedAppointment={appointment}
                    handleUploadDocument={handleUploadDocument}
                    loadedDocuments={getAllDocuments()}
                />

                {/* Modal de Evaluación */}
                {appointment?.docEntry && (
                    <>
                        <EvaluationModal
                            isOpen={isEvaluationModalOpen}
                            onOpenChange={setIsEvaluationModalOpen}
                            codCita={appointment.docEntry}
                            userRole={currentUser?.role || UserRole.ADMIN}
                            evaluationType={evaluationModalType}
                            currentEvaluation={evaluation || undefined}
                            onEvaluationSaved={handleEvaluationSaved}
                            appointment={appointment}
                            onReject={handleRejectEvaluation}
                        />
                        <ClaimModal
                            isOpen={isClaimModalOpen}
                            onOpenChange={setIsClaimModalOpen}
                            appointment={appointment}
                            onGenerateClaim={handleGenerateClaim}
                        />
                    </>
                )}

                {/* Modal de Validación PCP */}
                {appointment?.docEntry && canValidatePCP && (
                    <PCPValidationModal
                        isOpen={isPCPValidationOpen}
                        onOpenChange={onPCPValidationClose}
                        codCita={appointment.docEntry}
                        packingList={selectedPackingListForPCP}
                        onValidationSaved={async () => {
                            // Recargar PackingList después de guardar validación
                            if (appointment.docEntry) {
                                try {
                                    const today = new Date();
                                    const startDate = new Date(today);
                                    startDate.setDate(startDate.getDate() - 30);
                                    const endDate = new Date(today);
                                    endDate.setDate(endDate.getDate() + 30);
                                    
                                    const fechaInicio = formatDateForAPI(startDate);
                                    const fechaFin = formatDateForAPI(endDate);
                                    
                                    const packingLists = await fetchPackingListFromApi(fechaInicio, fechaFin, appointment.docEntry);
                                    setPackingListsFromApi(packingLists);
                                } catch (error) {
                                    console.error('Error al recargar PackingList:', error);
                                }
                            }
                        }}
                    />
                )}
            </div>
        </Dashboard>
    );
};

export default AppointmentDetail;
