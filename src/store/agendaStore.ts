// src/store/agendaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    DeliveryAppointment,
    PackingList,
    TransportData,
    DeliveryDocuments,
    DocumentFile
} from './types';
import { fetchAppointmentsFromApi, formatDateForAPI, createAppointmentInApi, updateAppointmentInApi } from '@/services/agenda/appointmentsApi';
import { fetchSupplierByCardCode } from '@/services/providers/providersApi';

interface AgendaState {
    appointments: DeliveryAppointment[];
    selectedAppointment: DeliveryAppointment | null;
    isLoadingAppointments: boolean;
    appointmentsError: string | null;
    
    // Actions
    addAppointment: (appointment: Omit<DeliveryAppointment, 'id' | 'appointmentNumber' | 'createdDate' | 'notificationSent' | 'scheduledDateTime' | 'scheduledDateTimeEnd'>) => DeliveryAppointment;
    updateAppointment: (id: string, updates: Partial<DeliveryAppointment>) => void;
    deleteAppointment: (id: string) => void;
    getAppointmentById: (id: string) => DeliveryAppointment | undefined;
    setSelectedAppointment: (appointment: DeliveryAppointment | null) => void;
    getAppointmentsBySupplier: (supplierId: string) => DeliveryAppointment[];
    getAppointmentsByDateRange: (startDate: string, endDate: string) => DeliveryAppointment[];
    
    // API Actions
    loadAppointmentsFromApi: (ruc?: string, fechaInicio?: Date | string, fechaFin?: Date | string) => Promise<void>;
    syncAppointmentsWithApi: (ruc?: string, fechaInicio?: Date | string, fechaFin?: Date | string) => Promise<void>;
    createAppointmentFromApi: (appointmentData: {
        supplierRUC: string;
        supplierName: string;
        deliveryDate: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
        description?: string;
        warehouse?: string;
        active?: 'Y' | 'N';
    }) => Promise<DeliveryAppointment>;
    updateAppointmentFromApi: (docEntry: string, appointmentData: {
        supplierRUC: string;
        supplierName: string;
        deliveryDate: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
        description?: string;
        warehouse?: string;
        active?: 'Y' | 'N';
        estado?: string;
    }) => Promise<void>;
    
    // PackingList actions
    addPackingList: (appointmentId: string, packingList: Omit<PackingList, 'id' | 'createdDate' | 'completed'>) => void;
    updatePackingList: (appointmentId: string, updates: Partial<PackingList>) => void;
    
    // Transport actions
    addTransportData: (appointmentId: string, transportData: Omit<TransportData, 'id' | 'completed'>) => void;
    updateTransportData: (appointmentId: string, updates: Partial<TransportData>) => void;
    
    // Documents actions
    addDocument: (appointmentId: string, documentType: string, document: DocumentFile) => void;
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
            isLoadingAppointments: false,
            appointmentsError: null,

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
                    status: 'REGISTRADA',
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

            loadAppointmentsFromApi: async (ruc, fechaInicio, fechaFin) => {
                set({ isLoadingAppointments: true, appointmentsError: null });
                
                try {
                    // Convertir fechas a formato YYYYMMDD si son Date o string
                    const fechaInicioStr = fechaInicio 
                        ? (fechaInicio instanceof Date ? formatDateForAPI(fechaInicio) : fechaInicio)
                        : undefined;
                    const fechaFinStr = fechaFin 
                        ? (fechaFin instanceof Date ? formatDateForAPI(fechaFin) : fechaFin)
                        : undefined;
                    
                    const apiAppointments = await fetchAppointmentsFromApi(ruc, fechaInicioStr, fechaFinStr);
                    
                    // Reemplazar todas las citas con las del API
                    set({ 
                        appointments: apiAppointments,
                        isLoadingAppointments: false,
                        appointmentsError: null
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error al cargar citas';
                    set({ 
                        isLoadingAppointments: false,
                        appointmentsError: errorMessage
                    });
                    console.error('Error al cargar citas desde API:', error);
                }
            },

            syncAppointmentsWithApi: async (ruc, fechaInicio, fechaFin) => {
                set({ isLoadingAppointments: true, appointmentsError: null });
                
                try {
                    // Convertir fechas a formato YYYYMMDD si son Date o string
                    const fechaInicioStr = fechaInicio 
                        ? (fechaInicio instanceof Date ? formatDateForAPI(fechaInicio) : fechaInicio)
                        : undefined;
                    const fechaFinStr = fechaFin 
                        ? (fechaFin instanceof Date ? formatDateForAPI(fechaFin) : fechaFin)
                        : undefined;
                    
                    const apiAppointments = await fetchAppointmentsFromApi(ruc, fechaInicioStr, fechaFinStr);
                    const currentAppointments = get().appointments;
                    
                    // Combinar citas del API con citas locales (evitar duplicados)
                    // Las citas del API tienen IDs que empiezan con "apt-api-"
                    const localAppointments = currentAppointments.filter(apt => !apt.id.startsWith('apt-api-'));
                    
                    // Combinar sin duplicados (por RUC, fecha y hora)
                    const combinedAppointments = [...localAppointments];
                    
                    apiAppointments.forEach(apiApt => {
                        const exists = combinedAppointments.some(apt => 
                            apt.supplierRUC === apiApt.supplierRUC &&
                            apt.deliveryDate === apiApt.deliveryDate &&
                            apt.deliveryTime === apiApt.deliveryTime
                        );
                        
                        if (!exists) {
                            combinedAppointments.push(apiApt);
                        }
                    });
                    
                    set({ 
                        appointments: combinedAppointments,
                        isLoadingAppointments: false,
                        appointmentsError: null
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error al sincronizar citas';
                    set({ 
                        isLoadingAppointments: false,
                        appointmentsError: errorMessage
                    });
                    console.error('Error al sincronizar citas con API:', error);
                }
            },

            createAppointmentFromApi: async (appointmentData) => {
                try {
                    // Crear la cita en el API
                    // Formatear la fecha a YYYYMMDD para evitar problemas de zona horaria
                    const appointmentId = await createAppointmentInApi({
                        u_ruc: appointmentData.supplierRUC,
                        u_razon_social: appointmentData.supplierName,
                        u_fecha: formatDateForAPI(appointmentData.deliveryDate),
                        u_hora_inicio: appointmentData.deliveryTime,
                        u_hora_fin: appointmentData.deliveryTimeEnd,
                        u_descripcion: appointmentData.description || '',
                        u_almacen: appointmentData.warehouse || '',
                        u_active: appointmentData.active || 'Y',
                        u_estado: 'REGISTRADA'
                    });

                    // Crear un objeto de cita temporal para retornar
                    // La recarga de citas se hará desde el componente padre según el rol del usuario
                    const deliveryDate = appointmentData.deliveryDate;
                    const scheduledDateTime = new Date(`${deliveryDate}T${appointmentData.deliveryTime}`).toISOString();
                    const scheduledDateTimeEnd = new Date(`${deliveryDate}T${appointmentData.deliveryTimeEnd}`).toISOString();
                    
                    const newAppointment: DeliveryAppointment = {
                        id: `apt-api-${appointmentData.supplierRUC}-${deliveryDate}-${Date.now()}`,
                        appointmentNumber: `CITA-${appointmentData.supplierRUC.substring(0, 4)}-${deliveryDate.replace(/-/g, '')}`,
                        docEntry: appointmentId, // Guardar el DocEntry retornado por el API
                        supplierId: appointmentData.supplierRUC,
                        supplierRUC: appointmentData.supplierRUC,
                        supplierName: appointmentData.supplierName,
                        supplierEmail: '',
                        supplierPhone: '',
                        deliveryDate,
                        deliveryTime: appointmentData.deliveryTime,
                        deliveryTimeEnd: appointmentData.deliveryTimeEnd,
                        scheduledDateTime,
                        scheduledDateTimeEnd,
                        status: 'REGISTRADA', // Estado inicial: cita registrada
                        createdBy: 'system',
                        createdDate: new Date().toISOString(),
                        notes: appointmentData.description || '',
                        warehouse: appointmentData.warehouse || '',
                        notificationSent: false,
                    };

                    return newAppointment;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error al crear la cita';
                    console.error('Error al crear cita en API:', error);
                    throw new Error(errorMessage);
                }
            },

            updateAppointmentFromApi: async (docEntry, appointmentData) => {
                try {
                    // Obtener el estado actual de la cita si no se proporciona
                    const appointments = get().appointments;
                    const currentAppointment = appointments.find(apt => apt.docEntry === docEntry);
                    const estadoToSend = appointmentData.estado || currentAppointment?.status || 'REGISTRADA';
                    
                    // Actualizar la cita en el API
                    await updateAppointmentInApi(docEntry, {
                        u_ruc: appointmentData.supplierRUC,
                        u_razon_social: appointmentData.supplierName,
                        u_fecha: formatDateForAPI(appointmentData.deliveryDate),
                        u_hora_inicio: appointmentData.deliveryTime,
                        u_hora_fin: appointmentData.deliveryTimeEnd,
                        u_descripcion: appointmentData.description || '',
                        u_almacen: appointmentData.warehouse || '',
                        u_active: appointmentData.active || 'Y',
                        u_estado: estadoToSend // Siempre enviar el estado actual
                    });

                    // Actualizar la cita en el store local
                    //const appointments = get().appointments;
                    const appointmentToUpdate = appointments.find(apt => apt.docEntry === docEntry);
                    
                    if (appointmentToUpdate) {
                        const deliveryDate = appointmentData.deliveryDate;
                        const scheduledDateTime = new Date(`${deliveryDate}T${appointmentData.deliveryTime}`).toISOString();
                        const scheduledDateTimeEnd = new Date(`${deliveryDate}T${appointmentData.deliveryTimeEnd}`).toISOString();
                        
                        set(state => ({
                            appointments: state.appointments.map(apt => 
                                apt.docEntry === docEntry 
                                    ? {
                                        ...apt,
                                        supplierRUC: appointmentData.supplierRUC,
                                        supplierName: appointmentData.supplierName,
                                        deliveryDate,
                                        deliveryTime: appointmentData.deliveryTime,
                                        deliveryTimeEnd: appointmentData.deliveryTimeEnd,
                                        scheduledDateTime,
                                        scheduledDateTimeEnd,
                                        notes: appointmentData.description || apt.notes,
                                        warehouse: appointmentData.warehouse || apt.warehouse,
                                        status: appointmentData.active === 'N' ? 'Cancelada' : apt.status
                                    }
                                    : apt
                            )
                        }));
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la cita';
                    console.error('Error al actualizar cita:', error);
                    throw new Error(errorMessage);
                }
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
                                status: apt.status === 'REGISTRADA' ? 'PROGRAMADA' : apt.status
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
                            
                            if (currentStatus === 'PROGRAMADA') {
                                newStatus = 'TRANSPORTE_COMPLETO';
                            } else if (currentStatus === 'REGISTRADA' && apt.packingList) {
                                newStatus = 'TRANSPORTE_COMPLETO';
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
                                newStatus = 'EN_ENTREGA';
                            } else if (updatedDocs.completed) {
                                newStatus = 'DOCUMENTOS_COMPLETOS';
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
                try {
                    // Validar que el RUC no esté vacío
                    if (!ruc || !ruc.trim()) {
                        return {
                            success: false,
                            message: 'El RUC no puede estar vacío'
                        };
                    }

                    // Consultar el proveedor en el servidor usando el endpoint
                    const result = await fetchSupplierByCardCode(ruc.trim());
                    
                    if (!result || !result.supplier) {
                        return {
                            success: false,
                            message: 'Proveedor no encontrado en el sistema'
                        };
                    }

                    const supplier = result.supplier;
                    
                    // Verificar que el proveedor esté activo
                    /*if (supplier.status !== 'Activo') {
                        return {
                            success: false,
                            message: `El proveedor existe pero está ${supplier.status.toLowerCase()}. Solo se pueden crear citas para proveedores activos.`
                        };
                    }*/

                    // Handle contactPerson which can be string or array
                    const contactPerson = Array.isArray(supplier.contactPerson) 
                        ? supplier.contactPerson[0]?.name || ''
                        : typeof supplier.contactPerson === 'string'
                        ? supplier.contactPerson
                        : '';

                    // Obtener el RUC correcto (puede venir de RUC o cardCode)
                    const supplierRUC = supplier.RUC || supplier.cardCode;
                    
                    return {
                        success: true,
                        data: {
                            supplierId: supplier.docEntry,
                            supplierName: supplier.cardName,
                            supplierEmail: supplier.email,
                            supplierPhone: supplier.phone || supplier.cellPhone || '',
                            supplierRUC: supplierRUC,
                            address: supplier.address,
                            contactPerson: contactPerson
                        }
                    };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error al consultar el proveedor';
                    console.error('Error al consultar proveedor por RUC:', error);
                    
                    return {
                        success: false,
                        message: errorMessage
                    };
                }
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

