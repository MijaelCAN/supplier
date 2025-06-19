// src/store/index.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipos
export interface Supplier {
    docEntry: string; // Identificador de Proveedor
    cardCode: string; // Número de Documento
    cardName: string; // Razón Social
    email: string; // Correo proveedor
    phone: string; // Teléfono proveedor
    website?: string; // Página web
    address: string; // Dirección proveedor
    city: string; // Ciudad
    country: string; // Pais
    contactPerson: string; // Nombres de Contacto
    contactEmail: string; // Correo de contacto
    contactPhone: string; // Teléfono de contacto
    businessType: string; // Actividad Económica - Giro de Negocio
    personType: string; // Tipo de persona - Natural/Juridica
    status: "A" | "I" | "P" | "S"; // Estado
    rating: number; // Calificación final
    totalOrders: number; // Número de órdenes de Compra
    totalAmount: number; // Total monto de órdenes
    paymentTerms: string; // Termino de pago
    certifications: string[]; // Certificaciones
    registrationDate: string; // Fecha de registro
    lastOrderDate: string; // Fecha de última orden
    avatar?: string; // Url de Logo - imagen - Url imagen
    generalManager?: string;
    adminManager?: string;
    salesManager?: string;
}

// Datos de ejemplo
const initialSuppliers: Supplier[] = [
    {
        docEntry: "1",
        cardCode: "20123456789",
        cardName: "TechCorp Solutions",
        email: "contact@techcorp.com",
        phone: "+51 987 654 321",
        website: "www.techcorp.com",
        address: "Av. Javier Prado 1234",
        city: "Lima",
        country: "Peru",
        contactPerson: "Carlos Rodriguezs",
        contactEmail: "carlos@techcorp.com",
        contactPhone: "+51 987 654 322",
        personType: "Persona Natural",
        businessType: "Tecnología",
        status: "A",
        rating: 4.8,
        totalOrders: 156,
        totalAmount: 2850000,
        paymentTerms: "30 días",
        certifications: ["ISO 9001", "ISO 27001"],
        registrationDate: "2023-01-15",
        lastOrderDate: "2024-05-20",
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
        personType: "Persona Natural",
        businessType: "Industrial",
        status: "A",
        rating: 4.2,
        totalOrders: 89,
        totalAmount: 1250000,
        paymentTerms: "45 días",
        certifications: ["ISO 9001"],
        registrationDate: "2023-03-10",
        lastOrderDate: "2024-05-15",
        avatar: "https://i.pravatar.cc/150?u=industrial"
    },
    {
        docEntry: "3",
        cardCode: "20456789123",
        cardName: "Construcciones del Norte",
        email: "info@construcciones.com",
        phone: "+51 912 345 678",
        address: "Av. Construcción 890",
        city: "Trujillo",
        country: "Peru",
        contactPerson: "Miguel Santos",
        contactEmail: "miguel@construcciones.com",
        contactPhone: "+51 912 345 679",
        personType: "Persona Natural",
        businessType: "Construcción",
        status: "P",
        rating: 3.9,
        totalOrders: 23,
        totalAmount: 580000,
        paymentTerms: "60 días",
        certifications: ["OHSAS 18001"],
        registrationDate: "2024-01-20",
        lastOrderDate: "2024-04-10",
        avatar: "https://i.pravatar.cc/150?u=construcciones"
    },
    {
        docEntry: "4",
        cardCode: "20789123456",
        cardName: "Servicios Médicos Integrales",
        email: "contacto@medicos.com",
        phone: "+51 998 876 543",
        address: "Av. Salud 456",
        city: "Arequipa",
        country: "Peru",
        contactPerson: "Dra. Patricia Lopez",
        contactEmail: "patricia@medicos.com",
        contactPhone: "+51 998 876 544",
        personType: "Persona Natural",
        businessType: "Salud",
        status: "S",
        rating: 4.5,
        totalOrders: 67,
        totalAmount: 890000,
        paymentTerms: "15 días",
        certifications: ["ISO 13485", "FDA"],
        registrationDate: "2022-11-05",
        lastOrderDate: "2024-03-25",
        avatar: "https://i.pravatar.cc/150?u=medicos"
    },
];


interface User {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
}

interface AppConfig {
    darkMode: boolean
    primaryColor: string
    sidebarCollapsed: boolean
    language: 'es' | 'en'
}

// Store principal
interface AppStore {
    // Proveedores
    suppliers: Supplier[]
    selectedSupplier: Supplier | null
    addSupplier: (supplier: Omit<Supplier, 'id' | 'fechaRegistro'>) => void
    updateSupplier: (id: string, supplier: Partial<Supplier>) => void
    deleteSupplier: (id: string) => void
    getSupplierById: (id: string) => Supplier | undefined
    setSelectedSupplier: (supplier: Supplier | null) => void

    // Usuarios
    users: User[]
    currentUser: User | null
    setCurrentUser: (user: User | null) => void
    addUser: (user: Omit<User, 'id'>) => void

    // Configuración
    config: AppConfig
    updateConfig: (config: Partial<AppConfig>) => void
    toggleDarkMode: () => void
    setSidebarCollapsed: (collapsed: boolean) => void

    // Datos de configuración
    terminosPago: Array<{key: string, label: string}>
    estadosSupplier: Array<{key: string, label: string}>
    estadosRegister: Array<{key: string, label: string}>
    roles: Array<{key: string, label: string}>
    tipoPersona: Array<{key: string, label: string}>

    // Utilidades
    isLoading: boolean
    setLoading: (loading: boolean) => void
    notifications: Array<{id: string, message: string, type: 'success' | 'error' | 'warning'}>
    addNotification: (notification: Omit<any, 'id'>) => void
    removeNotification: (id: string) => void
}

// Implementación del store
export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            suppliers: initialSuppliers,
            selectedSupplier: null,
            users: [],
            currentUser: null,
            isLoading: false,
            notifications: [],

            // Configuración inicial
            config: {
                darkMode: false,
                primaryColor: '#006FEE',
                sidebarCollapsed: false,
                language: 'es'
            },

            // Datos de configuración
            terminosPago: [
                { key: '15', label: '15 días' },
                { key: '30', label: '30 días' },
                { key: '45', label: '45 días' },
                { key: '60', label: '60 días' },
                { key: 'contado', label: 'Al contado' }
            ],

            estadosSupplier: [
                { key: 'A', label: 'Activo' },
                { key: 'P', label: 'Pendiente' },
                { key: 'S', label: 'Suspendido' },
                { key: 'I', label: 'Inactivo' }
            ],

            estadosRegister: [
                { key: 'P', label: 'Pendiente de Aprobación' },
                { key: 'A', label: 'Activo' }
            ],
            tipoPersona: [
                { key: 'TPN', label: 'Persona Natural' },
                { key: 'TPJ', label: 'Persona Jurídica' },
            ],
            roles: [
                { key: 'admin', label: 'Administrador' },
                { key: 'manager', label: 'Gerente' },
                { key: 'user', label: 'Usuario' },
                { key: 'viewer', label: 'Solo Lectura' }
            ],

            // Acciones para Proveedores
            addSupplier: (supplierData) => set((state) => ({
                suppliers: [...state.suppliers, {
                    ...supplierData,
                    id: crypto.randomUUID(),
                    fechaRegistro: new Date()
                }]
            })),

            updateSupplier: (id, supplierData) => set((state) => ({
                suppliers: state.suppliers.map(supplier =>
                    supplier.docEntry === id ? { ...supplier, ...supplierData } : supplier
                )
            })),

            deleteSupplier: (id) => set((state) => ({
                suppliers: state.suppliers.filter(supplier => supplier.docEntry !== id)
            })),

            getSupplierById: (id) => {
                const state = get()
                return state.suppliers.find(supplier => supplier.docEntry === id)
            },

            setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),

            // Acciones para Usuarios
            setCurrentUser: (user) => set({ currentUser: user }),

            addUser: (userData) => set((state) => ({
                users: [...state.users, {
                    ...userData,
                    id: crypto.randomUUID()
                }]
            })),

            // Acciones para Configuración
            updateConfig: (configData) => set((state) => ({
                config: { ...state.config, ...configData }
            })),

            toggleDarkMode: () => set((state) => ({
                config: { ...state.config, darkMode: !state.config.darkMode }
            })),

            setSidebarCollapsed: (collapsed) => set((state) => ({
                config: { ...state.config, sidebarCollapsed: collapsed }
            })),

            // Utilidades
            setLoading: (loading) => set({ isLoading: loading }),

            addNotification: (notification) => set((state) => ({
                notifications: [...state.notifications, {
                    ...notification,
                    id: crypto.randomUUID()
                }]
            })),

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(notif => notif.id !== id)
            }))
        }),
        {
            name: 'app-storage', // Nombre en localStorage
            partialize: (state) => ({
                suppliers: state.suppliers,
                users: state.users,
                currentUser: state.currentUser,
                config: state.config
            }) // Solo persistir datos importantes
        }
    )
)

// Hooks personalizados para facilitar el uso
export const useSuppliers = () => {
    const suppliers = useAppStore(state => state.suppliers)
    const addSupplier = useAppStore(state => state.addSupplier)
    const updateSupplier = useAppStore(state => state.updateSupplier)
    const deleteSupplier = useAppStore(state => state.deleteSupplier)
    const getSupplierById = useAppStore(state => state.getSupplierById)
    const selectedSupplier = useAppStore(state => state.selectedSupplier)
    const setSelectedSupplier = useAppStore(state => state.setSelectedSupplier)

    return {
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplierById,
        selectedSupplier,
        setSelectedSupplier
    }
}

export const useConfig = () => {
    const config = useAppStore(state => state.config)
    const updateConfig = useAppStore(state => state.updateConfig)
    const toggleDarkMode = useAppStore(state => state.toggleDarkMode)
    const setSidebarCollapsed = useAppStore(state => state.setSidebarCollapsed)

    return {
        config,
        updateConfig,
        toggleDarkMode,
        setSidebarCollapsed
    }
}

export const useConfigData = () => {
    const terminosPago = useAppStore(state => state.terminosPago)
    const estadosSupplier = useAppStore(state => state.estadosSupplier)
    const estadosRegister = useAppStore(state => state.estadosRegister)
    const roles = useAppStore(state => state.roles)
    const tipoPersona = useAppStore(state => state.tipoPersona)

    return {
        terminosPago,
        estadosSupplier,
        estadosRegister,
        roles,
        tipoPersona
    }
}