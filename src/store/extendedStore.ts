// src/store/extendedStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    Supplier,
    PurchaseOrder,
    Invoice,
    Payment,
    User,
    SupplierEvaluation,
    SupplierHomologation,
    Notification,
    ConfigData,
    DashboardMetrics,
    OrderItem
} from './types';

// Re-export types for easier access
export type { 
    Supplier, 
    PurchaseOrder, 
    Invoice, 
    Payment, 
    User, 
    SupplierEvaluation, 
    SupplierHomologation, 
    Notification, 
    ConfigData, 
    DashboardMetrics, 
    OrderItem 
};

interface ExtendedAppStore {
    // Estados
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    invoices: Invoice[];
    payments: Payment[];
    users: User[];
    evaluations: SupplierEvaluation[];
    homologations: SupplierHomologation[];
    notifications: Notification[];
    currentUser: User | null;
    selectedSupplier: Supplier | null;
    selectedOrder: PurchaseOrder | null;
    selectedInvoice: Invoice | null;
    isLoading: boolean;
    config: ConfigData;
    metrics: DashboardMetrics;

    // Datos de configuración
    orderStatuses: { key: string; label: string; color: string }[];
    invoiceStatuses: { key: string; label: string; color: string }[];
    paymentMethods: { key: string; label: string }[];
    currencies: { key: string; label: string }[];
    departments: { key: string; label: string }[];
    priorities: { key: string; label: string; color: string }[];

    // Acciones para Proveedores
    addSupplier: (supplier: Omit<Supplier, 'docEntry'>) => void;
    updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
    deleteSupplier: (id: string) => void;
    getSupplierById: (id: string) => Supplier | undefined;
    setSelectedSupplier: (supplier: Supplier | null) => void;

    // Acciones para Órdenes de Compra
    addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => void;
    updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => void;
    deletePurchaseOrder: (id: string) => void;
    getPurchaseOrderById: (id: string) => PurchaseOrder | undefined;
    setSelectedOrder: (order: PurchaseOrder | null) => void;
    approvePurchaseOrder: (id: string, approvedBy: string) => void;

    // Acciones para Facturas
    addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
    updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
    deleteInvoice: (id: string) => void;
    getInvoiceById: (id: string) => Invoice | undefined;
    setSelectedInvoice: (invoice: Invoice | null) => void;
    approveInvoice: (id: string, approvedBy: string) => void;
    rejectInvoice: (id: string, reason: string) => void;

    // Acciones para Pagos
    addPayment: (payment: Omit<Payment, 'id'>) => void;
    updatePayment: (id: string, payment: Partial<Payment>) => void;
    processPayment: (id: string, processedBy: string) => void;
    completePayment: (id: string) => void;

    // Acciones para Usuarios
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (id: string, user: Partial<User>) => void;
    deleteUser: (id: string) => void;
    setCurrentUser: (user: User | null) => void;

    // Acciones para Evaluaciones
    addEvaluation: (evaluation: Omit<SupplierEvaluation, 'id'>) => void;
    updateEvaluation: (id: string, evaluation: Partial<SupplierEvaluation>) => void;

    // Acciones para Homologaciones
    addHomologation: (homologation: Omit<SupplierHomologation, 'id'>) => void;
    updateHomologation: (id: string, homologation: Partial<SupplierHomologation>) => void;

    // Acciones para Notificaciones
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    markNotificationAsRead: (id: string) => void;
    clearNotifications: () => void;

    // Acciones para Configuración
    updateConfig: (config: Partial<ConfigData>) => void;
    toggleDarkMode: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // Acciones para Métricas
    updateMetrics: () => void;

    // Utilidades
    setLoading: (loading: boolean) => void;
}

// Datos iniciales de prueba
const initialSuppliers: Supplier[] = [
    {
        docEntry: "1",
        cardCode: "20123456789",
        cardName: "TechCorp Solutions SAC",
        email: "contact@techcorp.com",
        phone: "+51 987 654 321",
        website: "www.techcorp.com",
        address: "Av. Javier Prado 1234",
        city: "Lima",
        country: "Peru",
        contactPerson: "Carlos Rodriguez",
        contactEmail: "carlos@techcorp.com",
        contactPhone: "+51 987 654 322",
        personType: "Persona Jurídica",
        businessType: "Tecnología",
        status: "A",
        rating: 4.8,
        totalOrders: 156,
        totalAmount: 2850000,
        paymentTerms: "30",
        certifications: ["ISO 9001", "ISO 27001"],
        registrationDate: "2023-01-15",
        lastOrderDate: "2024-06-15",
        avatar: "https://i.pravatar.cc/150?u=techcorp"
    },
    {
        docEntry: "2",
        cardCode: "20987654321",
        cardName: "Industrial Supplies SAC",
        email: "ventas@industrial.com",
        phone: "+51 956 789 123",
        address: "Jr. Industrial 567",
        city: "Lima",
        country: "Peru",
        contactPerson: "Ana Martinez",
        contactEmail: "ana@industrial.com",
        contactPhone: "+51 956 789 124",
        personType: "Persona Jurídica",
        businessType: "Industrial",
        status: "A",
        rating: 4.2,
        totalOrders: 89,
        totalAmount: 1250000,
        paymentTerms: "45",
        certifications: ["ISO 9001"],
        registrationDate: "2023-03-10",
        lastOrderDate: "2024-06-10",
        avatar: "https://i.pravatar.cc/150?u=industrial"
    },
    {
        docEntry: "3",
        cardCode: "20456789123",
        cardName: "Construcciones del Norte EIRL",
        email: "info@construcciones.com",
        phone: "+51 912 345 678",
        address: "Av. Construcción 890",
        city: "Trujillo",
        country: "Peru",
        contactPerson: "Miguel Santos",
        contactEmail: "miguel@construcciones.com",
        contactPhone: "+51 912 345 679",
        personType: "Persona Jurídica",
        businessType: "Construcción",
        status: "P",
        rating: 3.9,
        totalOrders: 45,
        totalAmount: 890000,
        paymentTerms: "30",
        certifications: ["ISO 9001", "OHSAS 18001"],
        registrationDate: "2023-05-20",
        lastOrderDate: "2024-05-28",
        avatar: "https://i.pravatar.cc/150?u=construcciones"
    }
];

const initialPurchaseOrders: PurchaseOrder[] = [
    {
        id: "po-001",
        orderNumber: "OC-2024-001",
        supplierId: "1",
        supplierName: "TechCorp Solutions SAC",
        totalAmount: 45890,
        currency: "PEN",
        status: "Completada",
        priority: "Alta",
        createdDate: "2024-06-01",
        approvedDate: "2024-06-02",
        deliveryDate: "2024-06-15",
        paymentTerms: "30",
        createdBy: "Juan Pérez",
        approvedBy: "Maria García",
        department: "TI",
        requestedBy: "Carlos López",
        notes: "Equipos urgentes para proyecto Q2",
        items: [
            {
                id: "item-001",
                productCode: "LAP-001",
                productName: "Laptop Dell Inspiron 15",
                description: "Laptop para desarrollo con 16GB RAM, SSD 512GB",
                quantity: 10,
                unitPrice: 3500,
                totalPrice: 35000,
                unit: "UND",
                category: "Equipos"
            },
            {
                id: "item-002",
                productCode: "MON-001",
                productName: "Monitor 24 pulgadas",
                description: "Monitor Full HD para workstation",
                quantity: 10,
                unitPrice: 890,
                totalPrice: 8900,
                unit: "UND",
                category: "Equipos"
            }
        ]
    },
    {
        id: "po-002",
        orderNumber: "OC-2024-002",
        supplierId: "2",
        supplierName: "Industrial Supplies SAC",
        totalAmount: 23450,
        currency: "PEN",
        status: "Aprobada",
        priority: "Media",
        createdDate: "2024-06-05",
        approvedDate: "2024-06-06",
        deliveryDate: "2024-06-20",
        paymentTerms: "45",
        createdBy: "Ana Torres",
        approvedBy: "Maria García",
        department: "Producción",
        requestedBy: "Roberto Silva",
        notes: "Material para mantenimiento preventivo",
        items: [
            {
                id: "item-003",
                productCode: "MAT-001",
                productName: "Tornillos acero inoxidable",
                description: "Tornillos M8x20 acero inoxidable",
                quantity: 1000,
                unitPrice: 2.5,
                totalPrice: 2500,
                unit: "UND",
                category: "Materiales"
            },
            {
                id: "item-004",
                productCode: "MAT-002",
                productName: "Tuercas hexagonales",
                description: "Tuercas M8 hexagonales acero",
                quantity: 1000,
                unitPrice: 1.8,
                totalPrice: 1800,
                unit: "UND",
                category: "Materiales"
            },
            {
                id: "item-005",
                productCode: "LUB-001",
                productName: "Lubricante industrial",
                description: "Aceite lubricante para maquinaria pesada",
                quantity: 50,
                unitPrice: 385,
                totalPrice: 19250,
                unit: "LTS",
                category: "Lubricantes"
            }
        ]
    },
    {
        id: "po-003",
        orderNumber: "OC-2024-003",
        supplierId: "3",
        supplierName: "Construcciones del Norte EIRL",
        totalAmount: 67200,
        currency: "PEN",
        status: "Pendiente",
        priority: "Urgente",
        createdDate: "2024-06-15",
        deliveryDate: "2024-07-01",
        paymentTerms: "30",
        createdBy: "Roberto Silva",
        department: "Obras",
        requestedBy: "Miguel Herrera",
        notes: "Materiales para obra emergente",
        items: [
            {
                id: "item-006",
                productCode: "CEM-001",
                productName: "Cemento Portland Tipo I",
                description: "Bolsas de cemento 42.5kg",
                quantity: 200,
                unitPrice: 28.5,
                totalPrice: 5700,
                unit: "BOL",
                category: "Construcción"
            },
            {
                id: "item-007",
                productCode: "FIE-001",
                productName: "Fierro corrugado 1/2",
                description: "Varillas de fierro corrugado 12mm x 9m",
                quantity: 500,
                unitPrice: 32.8,
                totalPrice: 16400,
                unit: "VAR",
                category: "Construcción"
            },
            {
                id: "item-008",
                productCode: "LAD-001",
                productName: "Ladrillo King Kong 18 huecos",
                description: "Ladrillos de arcilla para construcción",
                quantity: 5000,
                unitPrice: 0.9,
                totalPrice: 4500,
                unit: "UND",
                category: "Construcción"
            }
        ]
    },
    {
        id: "po-004",
        orderNumber: "OC-2024-004",
        supplierId: "1",
        supplierName: "TechCorp Solutions SAC",
        totalAmount: 89340,
        currency: "PEN",
        status: "En Proceso",
        priority: "Alta",
        createdDate: "2024-06-12",
        approvedDate: "2024-06-13",
        deliveryDate: "2024-06-28",
        paymentTerms: "30",
        createdBy: "Carlos López",
        approvedBy: "Maria García",
        department: "TI",
        requestedBy: "Ana Torres",
        notes: "Ampliación infraestructura TI",
        items: [
            {
                id: "item-009",
                productCode: "SER-001",
                productName: "Servidor Dell PowerEdge R740",
                description: "Servidor para datacenter con procesador Intel Xeon",
                quantity: 2,
                unitPrice: 35000,
                totalPrice: 70000,
                unit: "UND",
                category: "Servidores"
            },
            {
                id: "item-010",
                productCode: "STO-001",
                productName: "Disco SSD 2TB Enterprise",
                description: "Unidad SSD para servidor de alta velocidad",
                quantity: 8,
                unitPrice: 1200,
                totalPrice: 9600,
                unit: "UND",
                category: "Almacenamiento"
            }
        ]
    }
];

const initialInvoices: Invoice[] = [
    {
        id: "inv-001",
        invoiceNumber: "F001-00001",
        purchaseOrderId: "po-001",
        supplierId: "1",
        supplierName: "TechCorp Solutions SAC",
        amount: 45890,
        currency: "PEN",
        status: "Pagada",
        receivedDate: "2024-06-16",
        dueDate: "2024-07-16",
        approvedDate: "2024-06-17",
        paidDate: "2024-07-15",
        taxAmount: 7061.10,
        subtotal: 38828.90,
        reviewedBy: "Ana Torres",
        approvedBy: "Maria García",
        notes: "Factura conforme con orden de compra"
    },
    {
        id: "inv-002",
        invoiceNumber: "F001-00002",
        purchaseOrderId: "po-002",
        supplierId: "2",
        supplierName: "Industrial Supplies SAC",
        amount: 23450,
        currency: "PEN",
        status: "Aprobada",
        receivedDate: "2024-06-21",
        dueDate: "2024-08-05",
        approvedDate: "2024-06-22",
        taxAmount: 3609,
        subtotal: 19841,
        reviewedBy: "Luis Mendoza",
        approvedBy: "Maria García",
        notes: "Materiales recibidos conforme"
    },
    {
        id: "inv-003",
        invoiceNumber: "F001-00003",
        purchaseOrderId: "po-004",
        supplierId: "1",
        supplierName: "TechCorp Solutions SAC",
        amount: 89340,
        currency: "PEN",
        status: "En Revisión",
        receivedDate: "2024-06-29",
        dueDate: "2024-07-29",
        taxAmount: 13744.07,
        subtotal: 75595.93,
        reviewedBy: "Ana Torres",
        notes: "Pendiente verificación de especificaciones técnicas"
    }
];

const initialPayments: Payment[] = [
    {
        id: "pay-001",
        invoiceId: "inv-001",
        invoiceNumber: "F001-00001",
        supplierId: "1",
        supplierName: "TechCorp Solutions SAC",
        amount: 45890,
        currency: "PEN",
        paymentDate: "2024-07-15",
        scheduledDate: "2024-07-16",
        paymentMethod: "Transferencia",
        reference: "TRF-2024-001",
        status: "Completado",
        bankAccount: "BCP - 194-12345678-0-12",
        processedBy: "Luis Mendoza",
        notes: "Pago realizado dentro del plazo acordado"
    },
    {
        id: "pay-002",
        invoiceId: "inv-002",
        invoiceNumber: "F001-00002",
        supplierId: "2",
        supplierName: "Industrial Supplies SAC",
        amount: 23450,
        currency: "PEN",
        paymentDate: "",
        scheduledDate: "2024-08-05",
        paymentMethod: "Transferencia",
        reference: "TRF-2024-002",
        status: "Programado",
        bankAccount: "BBVA - 0011-0123-456789012",
        notes: "Pago programado según términos de factura"
    },
    {
        id: "pay-003",
        invoiceId: "inv-001",
        invoiceNumber: "F001-00001",
        supplierId: "1",
        supplierName: "TechCorp Solutions SAC",
        amount: 15000,
        currency: "PEN",
        paymentDate: "",
        scheduledDate: "2024-06-30",
        paymentMethod: "Transferencia",
        reference: "TRF-2024-003",
        status: "Procesado",
        bankAccount: "BCP - 194-12345678-0-12",
        processedBy: "Luis Mendoza",
        notes: "Pago adelantado parcial por nuevo pedido"
    }
];

const initialUsers: User[] = [
    {
        id: "user-001",
        username: "admin",
        email: "admin@empresa.com",
        firstName: "Administrador",
        lastName: "Sistema",
        role: "admin",
        department: "TI",
        position: "Administrador de Sistema",
        isActive: true,
        createdDate: "2024-01-01",
        permissions: ["*"],
        avatar: "https://i.pravatar.cc/150?u=admin"
    },
    {
        id: "user-002",
        username: "compras01",
        email: "compras@empresa.com",
        firstName: "María",
        lastName: "García",
        role: "compras",
        department: "Compras",
        position: "Jefe de Compras",
        isActive: true,
        createdDate: "2024-01-01",
        permissions: ["orders", "suppliers", "evaluations"],
        avatar: "https://i.pravatar.cc/150?u=compras"
    },
    {
        id: "user-003",
        username: "finanzas01",
        email: "finanzas@empresa.com",
        firstName: "Luis",
        lastName: "Mendoza",
        role: "finanzas",
        department: "Finanzas",
        position: "Contador General",
        isActive: true,
        createdDate: "2024-01-01",
        permissions: ["invoices", "payments", "reports"],
        avatar: "https://i.pravatar.cc/150?u=finanzas"
    },
    {
        id: "user-004",
        username: "proveedor01",
        email: "carlos@techcorp.com",
        firstName: "Carlos",
        lastName: "Rodriguez",
        role: "proveedor",
        department: "Ventas",
        position: "Gerente Comercial",
        isActive: true,
        createdDate: "2024-01-15",
        permissions: ["profile", "orders", "invoices"],
        supplierId: "1",
        avatar: "https://i.pravatar.cc/150?u=proveedor"
    },
    {
        id: "user-005",
        username: "proveedor02",
        email: "ana@industrial.com",
        firstName: "Ana",
        lastName: "Martinez",
        role: "proveedor",
        department: "Ventas",
        position: "Representante Comercial",
        isActive: true,
        createdDate: "2024-03-10",
        permissions: ["profile", "orders", "invoices"],
        supplierId: "2",
        avatar: "https://i.pravatar.cc/150?u=proveedor2"
    },
    {
        id: "user-006",
        username: "proveedor03",
        email: "miguel@construcciones.com",
        firstName: "Miguel",
        lastName: "Santos",
        role: "proveedor",
        department: "Proyectos",
        position: "Gerente de Proyectos",
        isActive: true,
        createdDate: "2024-05-20",
        permissions: ["profile", "orders", "invoices"],
        supplierId: "3",
        avatar: "https://i.pravatar.cc/150?u=proveedor3"
    }
];

export const useExtendedStore = create<ExtendedAppStore>()(
    persist(
        (set, get) => ({
            // Estados iniciales
            suppliers: initialSuppliers,
            purchaseOrders: initialPurchaseOrders,
            invoices: initialInvoices,
            payments: initialPayments,
            users: initialUsers,
            evaluations: [],
            homologations: [],
            notifications: [],
            currentUser: null,
            selectedSupplier: null,
            selectedOrder: null,
            selectedInvoice: null,
            isLoading: false,
            
            config: {
                darkMode: false,
                primaryColor: '#006FEE',
                sidebarCollapsed: false,
                language: 'es',
                company: {
                    name: 'Portal de Proveedores',
                    logo: '/logo.png',
                    address: 'Av. Principal 123, Lima, Perú',
                    phone: '+51 1 234 5678',
                    email: 'contacto@empresa.com'
                },
                system: {
                    autoApproveThreshold: 10000,
                    defaultPaymentTerms: '30',
                    defaultCurrency: 'PEN',
                    maintenanceMode: false
                }
            },

            metrics: {
                totalSuppliers: 3,
                activeSuppliers: 2,
                pendingOrders: 1,
                totalOrderAmount: 69340,
                pendingInvoices: 0,
                overduePayments: 0,
                averageSupplierRating: 4.3,
                monthlySpending: 45890,
                topSuppliers: [],
                recentActivity: [],
                ordersByStatus: [],
                invoicesByStatus: [],
                paymentTrends: []
            },

            // Datos de configuración
            orderStatuses: [
                { key: 'Borrador', label: 'Borrador', color: 'default' },
                { key: 'Pendiente', label: 'Pendiente', color: 'warning' },
                { key: 'Aprobada', label: 'Aprobada', color: 'success' },
                { key: 'En Proceso', label: 'En Proceso', color: 'primary' },
                { key: 'Completada', label: 'Completada', color: 'success' },
                { key: 'Cancelada', label: 'Cancelada', color: 'danger' }
            ],

            invoiceStatuses: [
                { key: 'Recibida', label: 'Recibida', color: 'primary' },
                { key: 'En Revisión', label: 'En Revisión', color: 'warning' },
                { key: 'Aprobada', label: 'Aprobada', color: 'success' },
                { key: 'Pagada', label: 'Pagada', color: 'success' },
                { key: 'Rechazada', label: 'Rechazada', color: 'danger' }
            ],

            paymentMethods: [
                { key: 'Transferencia', label: 'Transferencia Bancaria' },
                { key: 'Cheque', label: 'Cheque' },
                { key: 'Efectivo', label: 'Efectivo' },
                { key: 'Tarjeta', label: 'Tarjeta de Crédito' }
            ],

            currencies: [
                { key: 'PEN', label: 'Soles (PEN)' },
                { key: 'USD', label: 'Dólares (USD)' },
                { key: 'EUR', label: 'Euros (EUR)' }
            ],

            departments: [
                { key: 'TI', label: 'Tecnología de la Información' },
                { key: 'Compras', label: 'Compras' },
                { key: 'Finanzas', label: 'Finanzas' },
                { key: 'Producción', label: 'Producción' },
                { key: 'RRHH', label: 'Recursos Humanos' },
                { key: 'Comercial', label: 'Comercial' }
            ],

            priorities: [
                { key: 'Baja', label: 'Baja', color: 'default' },
                { key: 'Media', label: 'Media', color: 'warning' },
                { key: 'Alta', label: 'Alta', color: 'danger' },
                { key: 'Urgente', label: 'Urgente', color: 'danger' }
            ],

            // Implementación de acciones
            addSupplier: (supplierData) => set((state) => {
                const newSupplier = {
                    ...supplierData,
                    docEntry: (state.suppliers.length + 1).toString()
                };
                return { suppliers: [...state.suppliers, newSupplier] };
            }),

            updateSupplier: (id, supplierData) => set((state) => ({
                suppliers: state.suppliers.map(supplier =>
                    supplier.docEntry === id ? { ...supplier, ...supplierData } : supplier
                )
            })),

            deleteSupplier: (id) => set((state) => ({
                suppliers: state.suppliers.filter(supplier => supplier.docEntry !== id)
            })),

            getSupplierById: (id) => {
                const state = get();
                return state.suppliers.find(supplier => supplier.docEntry === id);
            },

            setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),

            addPurchaseOrder: (orderData) => set((state) => {
                const newOrder = {
                    ...orderData,
                    id: `po-${String(state.purchaseOrders.length + 1).padStart(3, '0')}`
                };
                return { purchaseOrders: [...state.purchaseOrders, newOrder] };
            }),

            updatePurchaseOrder: (id, orderData) => set((state) => ({
                purchaseOrders: state.purchaseOrders.map(order =>
                    order.id === id ? { ...order, ...orderData } : order
                )
            })),

            deletePurchaseOrder: (id) => set((state) => ({
                purchaseOrders: state.purchaseOrders.filter(order => order.id !== id)
            })),

            getPurchaseOrderById: (id) => {
                const state = get();
                return state.purchaseOrders.find(order => order.id === id);
            },

            setSelectedOrder: (order) => set({ selectedOrder: order }),

            approvePurchaseOrder: (id, approvedBy) => set((state) => ({
                purchaseOrders: state.purchaseOrders.map(order =>
                    order.id === id ? {
                        ...order,
                        status: 'Aprobada',
                        approvedBy,
                        approvedDate: new Date().toISOString().split('T')[0]
                    } : order
                )
            })),

            addInvoice: (invoiceData) => set((state) => {
                const newInvoice = {
                    ...invoiceData,
                    id: `inv-${String(state.invoices.length + 1).padStart(3, '0')}`
                };
                return { invoices: [...state.invoices, newInvoice] };
            }),

            updateInvoice: (id, invoiceData) => set((state) => ({
                invoices: state.invoices.map(invoice =>
                    invoice.id === id ? { ...invoice, ...invoiceData } : invoice
                )
            })),

            deleteInvoice: (id) => set((state) => ({
                invoices: state.invoices.filter(invoice => invoice.id !== id)
            })),

            getInvoiceById: (id) => {
                const state = get();
                return state.invoices.find(invoice => invoice.id === id);
            },

            setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),

            approveInvoice: (id, approvedBy) => set((state) => ({
                invoices: state.invoices.map(invoice =>
                    invoice.id === id ? {
                        ...invoice,
                        status: 'Aprobada',
                        approvedBy,
                        approvedDate: new Date().toISOString().split('T')[0]
                    } : invoice
                )
            })),

            rejectInvoice: (id, reason) => set((state) => ({
                invoices: state.invoices.map(invoice =>
                    invoice.id === id ? {
                        ...invoice,
                        status: 'Rechazada',
                        rejectedDate: new Date().toISOString().split('T')[0],
                        rejectionReason: reason
                    } : invoice
                )
            })),

            addPayment: (paymentData) => set((state) => {
                const newPayment = {
                    ...paymentData,
                    id: `pay-${String(state.payments.length + 1).padStart(3, '0')}`
                };
                return { payments: [...state.payments, newPayment] };
            }),

            updatePayment: (id, paymentData) => set((state) => ({
                payments: state.payments.map(payment =>
                    payment.id === id ? { ...payment, ...paymentData } : payment
                )
            })),

            processPayment: (id, processedBy) => set((state) => ({
                payments: state.payments.map(payment =>
                    payment.id === id ? {
                        ...payment,
                        status: 'Procesado',
                        processedBy
                    } : payment
                )
            })),

            completePayment: (id) => set((state) => ({
                payments: state.payments.map(payment =>
                    payment.id === id ? {
                        ...payment,
                        status: 'Completado',
                        paymentDate: new Date().toISOString().split('T')[0]
                    } : payment
                )
            })),

            addUser: (userData) => set((state) => {
                const newUser = {
                    ...userData,
                    id: `user-${String(state.users.length + 1).padStart(3, '0')}`
                };
                return { users: [...state.users, newUser] };
            }),

            updateUser: (id, userData) => set((state) => ({
                users: state.users.map(user =>
                    user.id === id ? { ...user, ...userData } : user
                )
            })),

            deleteUser: (id) => set((state) => ({
                users: state.users.filter(user => user.id !== id)
            })),

            setCurrentUser: (user) => set({ currentUser: user }),

            addEvaluation: (evaluationData) => set((state) => {
                const newEvaluation = {
                    ...evaluationData,
                    id: `eval-${String(state.evaluations.length + 1).padStart(3, '0')}`
                };
                return { evaluations: [...state.evaluations, newEvaluation] };
            }),

            updateEvaluation: (id, evaluationData) => set((state) => ({
                evaluations: state.evaluations.map(evaluation =>
                    evaluation.id === id ? { ...evaluation, ...evaluationData } : evaluation
                )
            })),

            addHomologation: (homologationData) => set((state) => {
                const newHomologation = {
                    ...homologationData,
                    id: `homo-${String(state.homologations.length + 1).padStart(3, '0')}`
                };
                return { homologations: [...state.homologations, newHomologation] };
            }),

            updateHomologation: (id, homologationData) => set((state) => ({
                homologations: state.homologations.map(homologation =>
                    homologation.id === id ? { ...homologation, ...homologationData } : homologation
                )
            })),

            addNotification: (notificationData) => set((state) => {
                const newNotification = {
                    ...notificationData,
                    id: `notif-${String(state.notifications.length + 1).padStart(3, '0')}`,
                    createdDate: new Date().toISOString(),
                    read: false
                };
                return { notifications: [...state.notifications, newNotification] };
            }),

            markNotificationAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(notif =>
                    notif.id === id ? { ...notif, read: true } : notif
                )
            })),

            clearNotifications: () => set({ notifications: [] }),

            updateConfig: (configData) => set((state) => ({
                config: { ...state.config, ...configData }
            })),

            toggleDarkMode: () => set((state) => ({
                config: { ...state.config, darkMode: !state.config.darkMode }
            })),

            setSidebarCollapsed: (collapsed) => set((state) => ({
                config: { ...state.config, sidebarCollapsed: collapsed }
            })),

            updateMetrics: () => set((state) => {
                const metrics = {
                    totalSuppliers: state.suppliers.length,
                    activeSuppliers: state.suppliers.filter(s => s.status === 'A').length,
                    pendingOrders: state.purchaseOrders.filter(o => o.status === 'Pendiente').length,
                    totalOrderAmount: state.purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0),
                    pendingInvoices: state.invoices.filter(i => i.status === 'En Revisión').length,
                    overduePayments: state.payments.filter(p => 
                        p.status === 'Programado' && new Date(p.scheduledDate) < new Date()
                    ).length,
                    averageSupplierRating: state.suppliers.reduce((sum, s) => sum + s.rating, 0) / state.suppliers.length,
                    monthlySpending: state.payments
                        .filter(p => p.status === 'Completado')
                        .reduce((sum, p) => sum + p.amount, 0),
                    topSuppliers: [],
                    recentActivity: [],
                    ordersByStatus: [],
                    invoicesByStatus: [],
                    paymentTrends: []
                };
                return { metrics };
            }),

            setLoading: (loading) => set({ isLoading: loading })
        }),
        {
            name: 'extended-app-storage',
            partialize: (state) => ({
                suppliers: state.suppliers,
                purchaseOrders: state.purchaseOrders,
                invoices: state.invoices,
                payments: state.payments,
                users: state.users,
                evaluations: state.evaluations,
                homologations: state.homologations,
                currentUser: state.currentUser,
                config: state.config
            })
        }
    )
);

// Hooks personalizados
export const useSuppliers = () => {
    const suppliers = useExtendedStore(state => state.suppliers);
    const addSupplier = useExtendedStore(state => state.addSupplier);
    const updateSupplier = useExtendedStore(state => state.updateSupplier);
    const deleteSupplier = useExtendedStore(state => state.deleteSupplier);
    const getSupplierById = useExtendedStore(state => state.getSupplierById);
    const selectedSupplier = useExtendedStore(state => state.selectedSupplier);
    const setSelectedSupplier = useExtendedStore(state => state.setSelectedSupplier);

    return {
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplierById,
        selectedSupplier,
        setSelectedSupplier
    };
};

export const usePurchaseOrders = () => {
    const purchaseOrders = useExtendedStore(state => state.purchaseOrders);
    const addPurchaseOrder = useExtendedStore(state => state.addPurchaseOrder);
    const updatePurchaseOrder = useExtendedStore(state => state.updatePurchaseOrder);
    const deletePurchaseOrder = useExtendedStore(state => state.deletePurchaseOrder);
    const getPurchaseOrderById = useExtendedStore(state => state.getPurchaseOrderById);
    const selectedOrder = useExtendedStore(state => state.selectedOrder);
    const setSelectedOrder = useExtendedStore(state => state.setSelectedOrder);
    const approvePurchaseOrder = useExtendedStore(state => state.approvePurchaseOrder);

    return {
        purchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        getPurchaseOrderById,
        selectedOrder,
        setSelectedOrder,
        approvePurchaseOrder
    };
};

export const useInvoices = () => {
    const invoices = useExtendedStore(state => state.invoices);
    const addInvoice = useExtendedStore(state => state.addInvoice);
    const updateInvoice = useExtendedStore(state => state.updateInvoice);
    const deleteInvoice = useExtendedStore(state => state.deleteInvoice);
    const getInvoiceById = useExtendedStore(state => state.getInvoiceById);
    const selectedInvoice = useExtendedStore(state => state.selectedInvoice);
    const setSelectedInvoice = useExtendedStore(state => state.setSelectedInvoice);
    const approveInvoice = useExtendedStore(state => state.approveInvoice);
    const rejectInvoice = useExtendedStore(state => state.rejectInvoice);

    return {
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoiceById,
        selectedInvoice,
        setSelectedInvoice,
        approveInvoice,
        rejectInvoice
    };
};

export const usePayments = () => {
    const payments = useExtendedStore(state => state.payments);
    const addPayment = useExtendedStore(state => state.addPayment);
    const updatePayment = useExtendedStore(state => state.updatePayment);
    const processPayment = useExtendedStore(state => state.processPayment);
    const completePayment = useExtendedStore(state => state.completePayment);

    return {
        payments,
        addPayment,
        updatePayment,
        processPayment,
        completePayment
    };
};

export const useAuth = () => {
    const currentUser = useExtendedStore(state => state.currentUser);
    const setCurrentUser = useExtendedStore(state => state.setCurrentUser);
    const users = useExtendedStore(state => state.users);

    return {
        currentUser,
        setCurrentUser,
        users
    };
};

export const useConfig = () => {
    const config = useExtendedStore(state => state.config);
    const updateConfig = useExtendedStore(state => state.updateConfig);
    const toggleDarkMode = useExtendedStore(state => state.toggleDarkMode);
    const setSidebarCollapsed = useExtendedStore(state => state.setSidebarCollapsed);

    return {
        config,
        updateConfig,
        toggleDarkMode,
        setSidebarCollapsed
    };
};
