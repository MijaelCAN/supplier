// src/store/types.ts
export interface Supplier {
    docEntry: string;
    cardCode: string;
    cardName: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    country: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    businessType: string;
    personType: string;
    status: "A" | "I" | "P" | "S";
    rating: number;
    totalOrders: number;
    totalAmount: number;
    paymentTerms: string;
    certifications: string[];
    registrationDate: string;
    lastOrderDate: string;
    avatar?: string;
    generalManager?: string;
    adminManager?: string;
    salesManager?: string;
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
