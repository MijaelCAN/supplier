// src/store/types.ts
export interface Supplier {
    docEntry: string;
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
    registradoMype?: boolean; // general
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
    addresses?: Direccion[]; // Direcciones
    contactPerson?: contactPerson[];
    contactEmail: string,
    contactPhone: string,
    listaContactos?: contactPerson[], // Personas de Contacto
    bankReferences?: ReferenciaBancaria[],
    commercialReferences?: ReferenciaComercial[],
    ServiciosOfrecidos?: ServiciosOfrecidos[]; // Servicios Ofrecidos
    Documentos?: Documentos; // Documentos
}
interface Direccion {
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

interface Documentos {
    certificacionISO: DocumentosDetalle[],
    licenciaMuni: DocumentosDetalle[],
    referenciasComerciales: DocumentosDetalle[],
    referenciasBancarias: DocumentosDetalle[],
    historicoPrecios: DocumentosDetalle,
    condicionesPago: DocumentosDetalle,
    vigenciaPoder: DocumentosDetalle,
    fichaRuc: DocumentosDetalle,
    matrizAAmbientales: DocumentosDetalle,
    matrizIPERC: DocumentosDetalle,

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

interface ReferenciaComercial {
    name: string,
    contact: string,
    phone: string,
    registrationDate?: string;
}
interface ServiciosOfrecidos {
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
}

export interface OrderItem {
    id: string;
    productCode: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
    category: string;
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
    rejectionReason?: string;
    taxAmount: number;
    subtotal: number;
    documentUrl?: string;
    notes?: string;
    reviewedBy?: string;
    approvedBy?: string;
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
    status: 'Pendiente' | 'PackingListCompletado' | 'TransporteCompletado' | 'DocumentosCompletados' | 'ListaParaEntrega' | 'Completada' | 'Cancelada';
    createdBy: string;
    createdDate: string;
    notes?: string;
    warehouse?: string; // Almacén destino
    packingList?: PackingList;
    transportData?: TransportData;
    documents?: DeliveryDocuments;
    notificationSent: boolean;
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

