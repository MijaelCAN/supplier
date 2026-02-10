// src/store/types.ts
export interface Supplier {
    docEntry: string;
    RUC: string;
    cardCode: string; // general
    cardName: string; // general
    email: string; // general
    phone: string; // general
    cellPhone?: string; // general
    currency?: string; // general
    website?: string; // general
    address: string; // general
    taxPayerCategory?: string; // general
    businessType: string; // general
    personType: string; // general
    documentType?: string; // general
    agenteRetencion?: boolean; // general
    agentePercepcion?: boolean; // general
    exoneradoPercepcion?: boolean; // general
    goodContributor?: boolean; // general
    emisorFacElectronica?: boolean; // general
    estado?: string; // general
    condicion?: string; // general
    status: "Activo" | "Inactivo" | "Pendiente" | "Suspendido"| "Observado" | "Rechazado" | "EnProceso"; // general
    approvalDate: string; // general
    rejectionReason?: string[]; // general
    rating: number; // general
    totalOrders: number; // general
    totalAmount: number; // general
    paymentTerms: string; // general
    registrationDate?: string; // general
    lastOrderDate?: string;
    lastProfileUpdate?: string;
    coverImage?: string;
    avatar?: string;
    generalManager?: string;
    adminManager?: string;
    salesManager?: string;
    addresses?: Direction[]; // Direcciones
    contactPerson?: contactPerson[];
    contactEmail: string,
    contactPhone: string,
    listaContactos?: contactPerson[], // Personas de Contacto
    bankReferences?: ReferenciaBancaria[],
    commercialReferences?: ReferenciaComercial[],
    ServiciosOfrecidos?: ServiciosOfrecidos[]; // Servicios Ofrecidos
    Documentos?: Documentos; // Documentos
}
export interface Direction {
    address: string;
    type: string;
    departament: string;
    province: string;
    city: string;
    ubigeo: string;
}
export interface contactPerson {
    name: string;
    email?: string;
    phone?: string;
    active?: boolean;
    position?: string;
}

type DocumentValue = boolean | DocumentosDetalle | DocumentosDetalle[];

interface Documentos {
    certificaciones: DocumentValue,
    licenciaMunicipal: DocumentValue,
    referenciasComerciales: DocumentValue,
    referenciasBancarias: DocumentValue,
    historialPrecios: DocumentValue,
    condicionesPago: DocumentValue,
    vigenciaPoder: DocumentValue,
    fichaRuc: DocumentValue,
    matrizAmbiental: DocumentValue,
    matrizIperc: DocumentValue,
}
interface DocumentosDetalle {
    cargado: boolean;
    archivo?: File;
    uploadDate: string;
    state: 'pendiente' | 'aprobado' | 'observado';
    observation: string;
}
export interface ReferenciaBancaria {
    bankName: string,
    accountNumber: string,
    phoneNumber: string,
    sectorista: string,
    address: string,
    swiftCode: string,
    iban: string,
    accountType: string,
    currency: string,
    registrationDate?: string;
}

export interface ReferenciaComercial {
    DocEntry: string;
    U_CardCode: string;
    U_RazonSocial: string,
    U_Contacto: string,
    U_Telefonos: string,
    registrationDate?: string;
}
export interface ServiciosOfrecidos {
    principalActivity: string;
    serviceLine: string;
    paymentTerms: string;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplierName: string;
    items: OrderItem[];
    totalAmount: number;
    currency: string;
    status: 'Borrador' | 'Pendiente' | 'Aprobada' | 'En Proceso' | 'Completada' | 'Cancelada';
    priority: 'Baja' | 'Media' | 'Alta' | 'Urgente';
    createdDate: string;
    approvedDate?: string;
    deliveryDate: string;
    paymentTerms: string;
    notes?: string;
    createdBy: string;
    approvedBy?: string;
    department: string;
    requestedBy: string;
    avance: number
}

export interface OrderItem {
    id: string; // Docentry
    productCode: string; // item code
    productName: string; // description
    description: string; // description
    quantity: number;  // Quantity
    unitPrice: number; // unitPrice
    totalPrice: number; //LineTotal
    unit: string;
    category: string;
    qtyPend: number; //QtyPend
    state: string // EstadoLinea
}

export interface InvoiceDetail {
    docEntry: string;
    description: string;
    itemCode: string;
    lineTotal: number;
    quantity: number;
}

export interface InvoicePayment {
    docDate: string;
    docEntry: string;
    sumApplied: number;
}

export interface ReceptionDetail {
    docEntry: string;
    description: string;
    itemCode: string;
    lineTotal: number;
    quantity: number;
}

export interface Reception {
    id: string;
    docEntry: string;
    supplierId: string;
    supplierName: string;
    addressDestination: string;
    addressBilling: string;
    docDate: string;
    currency: string;
    total: number;
    detalle?: ReceptionDetail[];
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    purchaseOrderId: string;
    supplierId: string;
    supplierName: string;
    amount: number;
    currency: string;
    status: 'Recibida' | 'En Revisión' | 'Aprobada' | 'Pagada' | 'Rechazada';
    receivedDate: string;
    dueDate: string;
    approvedDate?: string;
    paidDate?: string;
    rejectedDate?: string;
    paymentTerm?: string;
    taxAmount: number;
    subtotal: number;
    saldo: number;
    documentUrl?: string;
    notes?: string;
    reviewedBy?: string;
    approvedBy?: string;
    retention: number;
    detalle?: InvoiceDetail[];
    pagos?: InvoicePayment[] | null;
}

export interface Payment {
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    supplierId: string;
    supplierName: string;
    amount: number;
    currency: string;
    paymentDate: string;
    scheduledDate: string;
    paymentMethod: 'Transferencia' | 'Cheque' | 'Efectivo' | 'Tarjeta';
    reference: string;
    status: 'Programado' | 'Procesado' | 'Completado' | 'Fallido';
    bankAccount?: string;
    notes?: string;
    processedBy?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'proveedor' | 'compras' | 'finanzas';
    department: string;
    position: string;
    avatar?: string;
    isActive: boolean;
    lastLogin?: string;
    createdDate: string;
    permissions: string[];
    supplierId?: string; // Para usuarios proveedores
}

export interface SupplierEvaluation {
    id: string;
    supplierId: string;
    evaluatedBy: string;
    evaluationDate: string;
    period: string;
    criteria: EvaluationCriteria[];
    totalScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    comments: string;
    recommendations: string[];
    status: 'Borrador' | 'Completada' | 'Aprobada';
}

export interface EvaluationCriteria {
    category: string;
    criteriaName: string;
    score: number;
    maxScore: number;
    weight: number;
    comments?: string;
}

export interface SupplierHomologation {
    id: string;
    supplierId: string;
    requestDate: string;
    approvalDate?: string;
    status: 'Pendiente' | 'En Revisión' | 'Aprobada' | 'Rechazada';
    documents: HomologationDocument[];
    evaluations: HomologationEvaluation[];
    approvedBy?: string;
    validUntil?: string;
    category: string;
    type: 'Inicial' | 'Renovación' | 'Actualización';
}

export interface HomologationDocument {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
    status: 'Pendiente' | 'Revisado' | 'Aprobado' | 'Rechazado';
    reviewedBy?: string;
    comments?: string;
}

export interface HomologationEvaluation {
    aspect: string;
    score: number;
    maxScore: number;
    status: 'Cumple' | 'No Cumple' | 'Pendiente';
    comments?: string;
}

export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    createdDate: string;
    read: boolean;
    userId?: string;
    actionUrl?: string;
}

export interface ConfigData {
    darkMode: boolean;
    primaryColor: string;
    sidebarCollapsed: boolean;
    language: string;
    company: {
        name: string;
        logo: string;
        address: string;
        phone: string;
        email: string;
    };
    system: {
        autoApproveThreshold: number;
        defaultPaymentTerms: string;
        defaultCurrency: string;
        maintenanceMode: boolean;
    };
}

export interface DashboardMetrics {
    totalSuppliers: number;
    activeSuppliers: number;
    pendingOrders: number;
    totalOrderAmount: number;
    pendingInvoices: number;
    overduePayments: number;
    averageSupplierRating: number;
    monthlySpending: number;
    topSuppliers: TopSupplier[];
    recentActivity: Activity[];
    ordersByStatus: StatusCount[];
    invoicesByStatus: StatusCount[];
    paymentTrends: PaymentTrend[];
}

export interface TopSupplier {
    id: string;
    name: string;
    totalAmount: number;
    orderCount: number;
    rating: number;
}

export interface Activity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId: string;
    userName: string;
}

export interface StatusCount {
    status: string;
    count: number;
    amount?: number;
}

export interface PaymentTrend {
    month: string;
    amount: number;
    count: number;
}

interface File{
    name: string;
    type: string;
    base64: string
}

// Agenda Module Types
export interface DeliveryAppointment {
    id: string;
    appointmentNumber: string;
    docEntry?: string; // DocEntry del sistema (ID de la cita en SAP)
    supplierId: string;
    supplierRUC: string;
    supplierName: string;
    supplierEmail: string;
    supplierPhone: string;
    deliveryDate: string; // ISO date string
    deliveryTime: string; // Time string (HH:MM) - Hora de inicio
    deliveryTimeEnd: string; // Time string (HH:MM) - Hora de fin
    scheduledDateTime: string; // Combined ISO datetime
    scheduledDateTimeEnd: string; // Combined ISO datetime - Fecha/hora de fin
    status: AppointmentStatus;
    createdBy: string;
    createdDate: string;
    notes?: string;
    warehouse?: string; // Almacén destino
    packingList?: PackingList;
    transportData?: TransportData;
    documents?: DeliveryDocuments;
    notificationSent: boolean;
    evaluation?: DeliveryEvaluation; // Calificación de la entrega
}

export interface PackingList {
    id: string;
    appointmentId: string;
    supplierId: string;
    date: string;
    warehouse: string;
    items: PackingListItem[];
    comment?: string;
    commentWms?: string;
    createdBy: string;
    createdDate: string;
    completed: boolean;
}

export interface PackingListItem {
    id: string;
    productCode: string;
    productName: string;
    quantity: number;
    pendingQuantity: number;
    unit: string;
    category?: string;
    marca?: boolean; // Campo Marca del API para el checkbox
    cantidadOC?: number; // Cantidad total de la Orden de Compra
}

export interface TransportData {
    id: string;
    appointmentId: string;
    transportCompany?: string;
    driverName: string;
    driverLicense?: string;
    vehiclePlate: string;
    vehicleType?: string;
    contactPhone: string;
    estimatedArrival?: string;
    notes?: string;
    completed: boolean;
    completedDate?: string;
}

export interface DeliveryDocuments {
    id: string;
    appointmentId: string;
    invoice?: DocumentFile;
    purchaseOrder?: DocumentFile;
    deliveryGuide?: DocumentFile;
    cdr?: DocumentFile;
    xml?: DocumentFile;
    otherDocuments?: DocumentFile[];
    completed: boolean;
    completedDate?: string;
}

export interface DocumentFile {
    id: string;
    name: string;
    type: string;
    url?: string;
    file?: File;
    uploadDate: string;
    uploadedBy: string;
}

// Estados del flujo completo de entrega
export type AppointmentStatus = 
    // Fase 1: Registro inicial
    | 'REGISTRADA'
    // Fase 2: Programación
    | 'PROGRAMADA'
    | 'REPROGRAMADA'
    // Fase 3: Preparación del proveedor
    | 'TRANSPORTE_COMPLETO'
    | 'DOCUMENTOS_COMPLETOS'
    // Fase 4: Recepción física
    | 'EN_EXPLANADA'
    | 'EN_ENTREGA'
    // Fase 5: Control de Calidad
    | 'CALIDAD_ACEPTADO'
    | 'CALIDAD_OBSERVADO'
    | 'CALIDAD_RECHAZADO'
    // Fase 6: Almacén
    | 'ALMACEN_ACEPTADO'
    | 'ALMACEN_OBSERVADO'
    | 'ALMACEN_RECHAZADO'
    // Fase 7: Cierre
    | 'PARTE_DE_INGRESO_GENERADO'
    | 'ENTREGADO'
    // Estados de cancelación/error
    | 'Cancelada';

export type statusConfig = {
    key: string;
    color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    label: string;
}

// Calificación de Entrega (Cita)
export interface DeliveryEvaluation {
    id?: string;
    codCita: string; // DocEntry de la cita
    // Evaluaciones por sección (1-5)
    puntualidad?: EvaluationScore; // Seguridad
    documentacion?: EvaluationScore; // Seguridad
    estadoMercaderia?: EvaluationScore; // Calidad
    cantidadCorrecta?: EvaluationScore; // Almacén
    // Puntaje total calculado
    puntajeTotal?: number;
    // Badge según puntaje
    badge?: 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente';
    // Estado de la evaluación
    estado?: 'BORRADOR' | 'COMPLETADO' | 'CERRADO';
    // Evaluador y fecha
    evaluador?: string;
    fechaEvaluacion?: string;
    // Comentario general
    comentario?: string;
    // Archivos adjuntos (solo Calidad y Almacén)
    archivos?: EvaluationFile[];
    // Metadatos
    createdBy?: string;
    createdDate?: string;
    updatedBy?: string;
    updatedDate?: string;
}

export interface EvaluationScore {
    // Para puntualidad y documentación: 0 = No, 1 = Sí (binario)
    // Para estadoMercaderia y cantidadCorrecta: 1-5 (escala)
    puntaje: number; 
    comentario?: string;
    evaluadoPor?: string; // Rol que evaluó
    fechaEvaluacion?: string;
    peso?: number; // Peso de esta sección en el cálculo total
    // Campos específicos para estadoMercaderia y cantidadCorrecta
    estado?: 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO'; // Para estadoMercaderia y cantidadCorrecta
    // Nota: comentario se usa como motivo cuando estado es OBSERVADO o RECHAZADO
}

export interface EvaluationFile {
    id?: string;
    nombre: string;
    url: string;
    tipo: string; // 'calidad' | 'almacen'
    uploadedBy?: string;
    uploadDate?: string;
}

// Pesos de cada sección
export const EVALUATION_WEIGHTS = {
    puntualidad: 0.25,      // 25%
    documentacion: 0.25,    // 25%
    estadoMercaderia: 0.30, // 30%
    cantidadCorrecta: 0.20, // 20%
};

// Rangos de calificación para badges (escala 1-10)
export const EVALUATION_RANGES = {
    Excelente: { min: 9.0, max: 10.0 },
    Bueno: { min: 7.0, max: 8.99 },
    Regular: { min: 5.0, max: 6.99 },
    Deficiente: { min: 1.0, max: 4.99 },
};

// Reclamo a Proveedor
export interface SupplierClaim {
    id?: string;
    codCita: string; // DocEntry de la cita
    numeroReclamo: string; // Número único del reclamo
    fechaReclamo: string; // Fecha de creación del reclamo
    areaEmite: string; // Área que emite el reclamo (ej: Calidad)
    responsable: string; // Responsable que emite el reclamo
    // Datos de la cabecera
    nLote?: string;
    cantidad?: string;
    proveedor: string; // Nombre del proveedor
    ordenCompra?: string;
    factura?: string;
    insumoMaterial?: string;
    fechaArribo?: string;
    // Sección 1: Datos del registro de inspección o análisis
    datosRegistroInspeccion?: string;
    // Sección 2: Motivo del reclamo e impacto
    motivoReclamo: string; // Requerido
    impacto?: string;
    // Sección 3: Respuesta inmediata del proveedor
    respuestaInmediata?: {
        fechaRespuesta?: string;
        responsable?: string;
        respuesta?: string;
    };
    // Sección 4: Evaluación del reclamo (por el proveedor)
    evaluacionReclamo?: {
        fechaEvaluacion?: string;
        evaluadoPor?: string;
        reclamoProcede?: 'SI' | 'NO';
        descripcion?: string;
    };
    // Sección 5: Plan de acciones
    planAcciones?: ClaimAction[];
    // Sección 6: Cierre del reclamo
    cierreReclamo?: {
        accionesEfectivas?: 'SI' | 'NO';
        fechaCierre?: string;
        responsableCierre?: string;
        observacion?: string;
    };
    // Metadatos
    createdBy?: string;
    createdDate?: string;
    updatedBy?: string;
    updatedDate?: string;
    status?: 'Abierto' | 'En Respuesta' | 'Cerrado';
}

export interface ClaimAction {
    id?: string;
    accion: string;
    fecha: string;
    estado?: 'Abierto' | 'Cerrado'; // Para verificación
    verificadoPor?: string;
    fechaVerificacion?: string;
}
