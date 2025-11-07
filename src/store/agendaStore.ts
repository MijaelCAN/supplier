// src/store/agendaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    DeliveryAppointment,
    PackingList,
    TransportData,
    DeliveryDocuments,
    PackingListItem,
    DocumentFile
} from './types';

interface AgendaState {
    appointments: DeliveryAppointment[];
    selectedAppointment: DeliveryAppointment | null;
    
    // Actions
    addAppointment: (appointment: Omit<DeliveryAppointment, 'id' | 'appointmentNumber' | 'createdDate' | 'notificationSent' | 'scheduledDateTime' | 'scheduledDateTimeEnd'>) => DeliveryAppointment;
    updateAppointment: (id: string, updates: Partial<DeliveryAppointment>) => void;
    deleteAppointment: (id: string) => void;
    getAppointmentById: (id: string) => DeliveryAppointment | undefined;
    setSelectedAppointment: (appointment: DeliveryAppointment | null) => void;
    getAppointmentsBySupplier: (supplierId: string) => DeliveryAppointment[];
    getAppointmentsByDateRange: (startDate: string, endDate: string) => DeliveryAppointment[];
    
    // PackingList actions
    addPackingList: (appointmentId: string, packingList: Omit<PackingList, 'id' | 'createdDate' | 'completed'>) => void;
    updatePackingList: (appointmentId: string, updates: Partial<PackingList>) => void;
    
    // Transport actions
    addTransportData: (appointmentId: string, transportData: Omit<TransportData, 'id' | 'completed'>) => void;
    updateTransportData: (appointmentId: string, updates: Partial<TransportData>) => void;
    
    // Documents actions
    addDocument: (appointmentId: string, documentType: 'invoice' | 'purchaseOrder' | 'deliveryGuide' | 'cdr' | 'xml', document: DocumentFile) => void;
    updateDocument: (appointmentId: string, documentType: string, documentId: string, updates: Partial<DocumentFile>) => void;
    
    // Simulate SAP RUC lookup
    lookupSupplierByRUC: (ruc: string) => Promise<{
        success: boolean;
        data?: {
            supplierId: string;
            supplierName: string;
            supplierEmail: string;
            supplierPhone: string;
            supplierRUC: string;
            address?: string;
            contactPerson?: string;
        };
        message?: string;
    }>;
}

// Generate appointment number
const generateAppointmentNumber = (index: number): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(index + 1).padStart(4, '0');
    return `AG-${year}${month}-${sequence}`;
};

export const useAgendaStore = create<AgendaState>()(
    persist(
        (set, get) => ({
            appointments: [],
            selectedAppointment: null,

            addAppointment: (appointmentData) => {
                const appointments = get().appointments;
                
                // Calculate scheduled datetimes
                const scheduledDateTime = new Date(`${appointmentData.deliveryDate}T${appointmentData.deliveryTime}`).toISOString();
                const scheduledDateTimeEnd = new Date(`${appointmentData.deliveryDate}T${appointmentData.deliveryTimeEnd}`).toISOString();
                
                const newAppointment: DeliveryAppointment = {
                    ...appointmentData,
                    id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    appointmentNumber: generateAppointmentNumber(appointments.length),
                    createdDate: new Date().toISOString(),
                    notificationSent: false,
                    status: 'Pendiente',
                    scheduledDateTime,
                    scheduledDateTimeEnd
                };
                
                set(state => ({
                    appointments: [...state.appointments, newAppointment]
                }));
                
                return newAppointment;
            },

            updateAppointment: (id, updates) => {
                set(state => ({
                    appointments: state.appointments.map(apt =>
                        apt.id === id ? { ...apt, ...updates } : apt
                    ),
                    selectedAppointment: state.selectedAppointment?.id === id
                        ? { ...state.selectedAppointment, ...updates }
                        : state.selectedAppointment
                }));
            },

            deleteAppointment: (id) => {
                set(state => ({
                    appointments: state.appointments.filter(apt => apt.id !== id),
                    selectedAppointment: state.selectedAppointment?.id === id ? null : state.selectedAppointment
                }));
            },

            getAppointmentById: (id) => {
                return get().appointments.find(apt => apt.id === id);
            },

            setSelectedAppointment: (appointment) => {
                set({ selectedAppointment: appointment });
            },

            getAppointmentsBySupplier: (supplierId) => {
                return get().appointments.filter(apt => apt.supplierId === supplierId);
            },

            getAppointmentsByDateRange: (startDate, endDate) => {
                return get().appointments.filter(apt => {
                    const aptDate = new Date(apt.deliveryDate);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    return aptDate >= start && aptDate <= end;
                });
            },

            addPackingList: (appointmentId, packingListData) => {
                const newPackingList: PackingList = {
                    ...packingListData,
                    id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdDate: new Date().toISOString(),
                    completed: true
                };

                set(state => ({
                    appointments: state.appointments.map(apt => {
                        if (apt.id === appointmentId) {
                            return {
                                ...apt,
                                packingList: newPackingList,
                                status: apt.status === 'Pendiente' ? 'PackingListCompletado' : apt.status
                            };
                        }
                        return apt;
                    })
                }));
            },

            updatePackingList: (appointmentId, updates) => {
                set(state => ({
                    appointments: state.appointments.map(apt => {
                        if (apt.id === appointmentId && apt.packingList) {
                            return {
                                ...apt,
                                packingList: { ...apt.packingList, ...updates }
                            };
                        }
                        return apt;
                    })
                }));
            },

            addTransportData: (appointmentId, transportData) => {
                const newTransportData: TransportData = {
                    ...transportData,
                    id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    completed: true,
                    completedDate: new Date().toISOString()
                };

                set(state => ({
                    appointments: state.appointments.map(apt => {
                        if (apt.id === appointmentId) {
                            const currentStatus = apt.status;
                            let newStatus = currentStatus;
                            
                            if (currentStatus === 'PackingListCompletado') {
                                newStatus = 'TransporteCompletado';
                            } else if (currentStatus === 'Pendiente' && apt.packingList) {
                                newStatus = 'TransporteCompletado';
                            }
                            
                            return {
                                ...apt,
                                transportData: newTransportData,
                                status: newStatus
                            };
                        }
                        return apt;
                    })
                }));
            },

            updateTransportData: (appointmentId, updates) => {
                set(state => ({
                    appointments: state.appointments.map(apt => {
                        if (apt.id === appointmentId && apt.transportData) {
                            return {
                                ...apt,
                                transportData: { ...apt.transportData, ...updates }
                            };
                        }
                        return apt;
                    })
                }));
            },

            addDocument: (appointmentId, documentType, document) => {
                set(state => ({
                    appointments: state.appointments.map(apt => {
                        if (apt.id === appointmentId) {
                            const existingDocs = apt.documents || {
                                id: `docs-${Date.now()}`,
                                appointmentId,
                                completed: false
                            };

                            const updatedDocs: DeliveryDocuments = {
                                ...existingDocs,
                                [documentType]: document,
                                completed: !!(document &&
                                    (existingDocs.invoice || documentType === 'invoice') &&
                                    (existingDocs.purchaseOrder || documentType === 'purchaseOrder') &&
                                    (existingDocs.deliveryGuide || documentType === 'deliveryGuide') &&
                                    (existingDocs.cdr || documentType === 'cdr') &&
                                    (existingDocs.xml || documentType === 'xml'))
                            };

                            if (updatedDocs.completed) {
                                updatedDocs.completedDate = new Date().toISOString();
                            }

                            let newStatus = apt.status;
                            if (updatedDocs.completed && apt.transportData) {
                                newStatus = 'ListaParaEntrega';
                            } else if (updatedDocs.completed) {
                                newStatus = 'DocumentosCompletados';
                            }

                            return {
                                ...apt,
                                documents: updatedDocs,
                                status: newStatus
                            };
                        }
                        return apt;
                    })
                }));
            },

            updateDocument: (appointmentId, documentType, documentId, updates) => {
                set(state => ({
                    appointments: state.appointments.map(apt => {
                        if (apt.id === appointmentId && apt.documents) {
                            const doc = apt.documents[documentType as keyof DeliveryDocuments] as DocumentFile | undefined;
                            if (doc && doc.id === documentId) {
                                const updatedDoc = { ...doc, ...updates };
                                return {
                                    ...apt,
                                    documents: {
                                        ...apt.documents,
                                        [documentType]: updatedDoc
                                    }
                                };
                            }
                        }
                        return apt;
                    })
                }));
            },

            lookupSupplierByRUC: async (ruc) => {
                // Simulate SAP API call delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Import suppliers store to lookup
                const { useExtendedStore } = await import('./extendedStore');
                const suppliers = useExtendedStore.getState().suppliers;
                
                const supplier = suppliers.find(s => s.cardCode === ruc);
                
                if (supplier && supplier.status === 'Activo') {
                    // Handle contactPerson which can be string or array
                    const contactPerson = Array.isArray(supplier.contactPerson) 
                        ? supplier.contactPerson[0]?.name || ''
                        : supplier.contactPerson || '';
                    
                    return {
                        success: true,
                        data: {
                            supplierId: supplier.docEntry,
                            supplierName: supplier.cardName,
                            supplierEmail: supplier.email,
                            supplierPhone: supplier.phone,
                            supplierRUC: supplier.cardCode,
                            address: supplier.address,
                            contactPerson: contactPerson
                        }
                    };
                }

                return {
                    success: false,
                    message: 'Proveedor no encontrado o inactivo en SAP'
                };
            }
        }),
        {
            name: 'agenda-storage',
            partialize: (state) => ({
                appointments: state.appointments
            })
        }
    )
);

