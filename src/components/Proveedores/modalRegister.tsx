import { FC, useMemo, useState, useEffect } from 'react'
import {useForm, Controller} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Divider,
    Chip
} from "@heroui/react"
import {useConfigData} from '@/store'
import { useSuppliers as useExtendedSuppliers } from '@/store/extendedStore'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/routes/menuTypes'
import { createSupplierProfile, fetchSunatSupplierData, fetchSuppliersListFromApi, type SupplierApiRecord } from '@/services/providers/providersApi';
import { getBlackListRecord, type BlackListRecord } from '@/services/providers/blackListApi';
import { fetchCondicionesPago, type CondicionPago } from '@/services/maestros/condicionesPagoApi';
import { sendSupplierCredentials } from '@/services/email/emailApi';
import { UbigeoSelector } from '@/components/UbigeoSelector';

// Schema de validación con Zod
const supplierRegisterSchema = z.object({
    docEntry: z.string().min(1, "El identificador de proveedor es requerido"),
    cardCode: z.string()
        .min(11, 'El RUC debe tener 11 dígitos')
        .max(11, 'El RUC debe tener 11 dígitos')
        .regex(/^\d{11}$/, 'El RUC debe contener solo números'),
    cardName: z.string().min(1, "La razón social es requerida"),
    email: z.string().email("Email inválido").min(1, "El email es requerido").optional(),
    phone: z.string().min(1, "El teléfono es requerido"),
    website: z.string().optional(),
    address: z.string().min(1, "La dirección es requerida"),
    ubigeo: z.string().min(1, "El ubigeo es requerido"),
    city: z.string().min(1, "La ciudad es requerida"),
    country: z.string().min(1, "El país es requerido"),
    contactPerson: z.string().min(1, "El nombre de contacto es requerido, xd"),
    contactEmail: z.string().email("Email de contacto inválido").min(1, "El email de contacto es requerido"),
    contactPhone: z.string().min(1, "El teléfono de contacto es requerido"),
    personType: z.string().optional(),
    businessType: z.string().min(1, "La actividad económica es requerida"),
    status: z.enum(["Activo", "Inactivo", "Pendiente", "Suspendido"], undefined),
    rating: z.number().min(0, "La calificación debe ser al menos 0"),
    totalOrders: z.number().int().min(0, "El número de órdenes debe ser 0 o mayor"),
    totalAmount: z.number().min(0, "El monto total debe ser 0 o mayor"),
    paymentTerms: z.string().min(1, "El término de pago es requerido"),
    certifications: z.array(z.string()).optional(),
    registrationDate: z.string().optional(),
    lastOrderDate: z.string().optional(),
    avatar: z.string().url("La URL del avatar debe ser válida"),
    generalManager: z.string().min(1, "generalManager es requerido"),
    adminManager: z.string().optional(),
    salesManager: z.string().min(1, "salesManager es requerido"),
});




type SupplierRegisterFormData = z.infer<typeof supplierRegisterSchema>

// Interface para los datos de SUNAT (nuevo formato apiperu.dev)
interface SunatData {
    ruc: string;
    nombre_o_razon_social: string;
    estado: string;
    condicion: string;
    direccion: string;
    direccion_completa: string;
    departamento: string;
    provincia: string;
    distrito: string;
    ubigeo_sunat: string;
    ubigeo: string[];
    actividades_economicas: string[];
    es_agente_de_retencion: string;
    es_agente_de_percepcion: string;
    es_agente_de_percepcion_combustible: string;
    es_buen_contribuyente: string;
}

interface ModalRegisterProps {
    isRegisterOpen: boolean
    onRegisterClose: () => void
    onRegistered?: () => Promise<void> | void
}

const ModalRegister: FC<ModalRegisterProps> = ({
   isRegisterOpen,
   onRegisterClose,
   onRegistered
}) => {
    const { suppliers, setSuppliers } = useExtendedSuppliers();
    const supplierList = Array.isArray(suppliers) ? suppliers : [];
    const { terminosPago } = useConfigData()
    const createSupplierUser = useAuthStore((state) => state.createSupplierUser);
    const [isConsultingRuc, setIsConsultingRuc] = useState(false)
    const [sunatData, setSunatData] = useState<SunatData | null>(null)
    const [isRucValid, setIsRucValid] = useState(false)
    const [blackListRecord, setBlackListRecord] = useState<BlackListRecord | null>(null)
    const [condicionesPago, setCondicionesPago] = useState<CondicionPago[]>([])
    const [isLoadingCondicionesPago, setIsLoadingCondicionesPago] = useState(false)
    const [, setIsCheckingBlackList] = useState(false)

    // Cargar condiciones de pago cuando el modal se abre
    useEffect(() => {
        if (isRegisterOpen) {
            const loadCondicionesPago = async () => {
                setIsLoadingCondicionesPago(true)
                try {
                    const condiciones = await fetchCondicionesPago()
                    console.log("Condiciones de pago: ", condiciones)
                    setCondicionesPago(condiciones)
                } catch (error) {
                    console.error('Error al cargar condiciones de pago:', error)
                    // Mantener las condiciones por defecto en caso de error
                } finally {
                    setIsLoadingCondicionesPago(false)
                }
            }
            loadCondicionesPago()
        }
    }, [isRegisterOpen])
    
    const isSSCO = useMemo(() => {
        return blackListRecord !== null
    }, [blackListRecord])
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [emailSummary, setEmailSummary] = useState<{
        email: string;
        username: string;
        tempPassword: string;
        portalLink: string;
        userFullName: string;
        supplierName: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!errorMessage) return;
        const id = setTimeout(() => setErrorMessage(null), 5000);
        return () => clearTimeout(id);
    }, [errorMessage]);
    const portalLink = useMemo(() => (typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'), []);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<SupplierRegisterFormData>({
        resolver: zodResolver(supplierRegisterSchema),
        defaultValues: {
            docEntry:`${suppliers.length}`,
            cardCode: '',
            cardName: '',
            email: '',
            phone: '', // 963852741
            website: 'Sin pagina web', // https://www.miempresa.com.pe
            address: '',
            ubigeo: '',
            city: 'Lima',
            country: 'PERU',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            personType: '',
            businessType: '',
            status: 'Pendiente',
            rating: 0.0,
            totalOrders: 0,
            totalAmount: 0,
            paymentTerms: '',
            certifications: ["ISO 14000"],
            registrationDate: '',
            lastOrderDate: '',
            avatar: 'https://i.pravatar.cc/150?u=medicos',
        }
    });


    const watchedRuc = watch('cardCode')

    // Función helper para extraer solo "NO HABIDO" o "HABIDO" del texto completo
    const getCondicionShort = (condicion?: string): string => {
        if (!condicion) return ''
        if (condicion.includes('NO HABIDO')) return 'NO HABIDO'
        if (condicion.includes('HABIDO')) return 'HABIDO'
        // Si no contiene ninguna de las dos, tomar solo la primera palabra
        return condicion.split(' ')[0] || condicion
    }

    // Función para consultar RUC en SUNAT
    const consultarRUC = async () => {
        if (!watchedRuc || watchedRuc.length !== 11) {
            alert('Ingrese un RUC válido de 11 dígitos')
            return
        }

        setIsConsultingRuc(true)
        setIsCheckingBlackList(true)

        try {
            // Consultar SUNAT y BlackList en paralelo para mayor eficiencia
            const [sunatResponse, blackListData] = await Promise.all([
                fetchSunatSupplierData(watchedRuc),
                getBlackListRecord(watchedRuc)
            ])

            // Procesar respuesta de BlackList
            setBlackListRecord(blackListData)

            // Procesar respuesta de SUNAT
            if (!sunatResponse.success || !sunatResponse.data) {
                throw new Error('La consulta a SUNAT no devolvió información válida.')
            }

            const data = sunatResponse.data
            setSunatData({
                ruc: data.ruc,
                nombre_o_razon_social: data.nombre_o_razon_social,
                estado: data.estado,
                condicion: data.condicion,
                direccion: data.direccion,
                direccion_completa: data.direccion_completa,
                departamento: data.departamento,
                provincia: data.provincia,
                distrito: data.distrito,
                ubigeo_sunat: data.ubigeo_sunat,
                ubigeo: data.ubigeo,
                actividades_economicas: data.actividades_economicas || [],
                es_agente_de_retencion: data.es_agente_de_retencion || 'NO',
                es_agente_de_percepcion: data.es_agente_de_percepcion || 'NO',
                es_agente_de_percepcion_combustible: data.es_agente_de_percepcion_combustible || 'NO',
                es_buen_contribuyente: data.es_buen_contribuyente || 'NO'
            })

            // Validar estado y condición (la nueva API puede tener diferentes valores)
            const isValidStatus = data.estado && !data.estado.includes('BAJA') && !data.estado.includes('SUSPENSION') && data.condicion && data.condicion.includes('HABIDO')
            setIsRucValid(isValidStatus as boolean)

            if (isValidStatus) {
                setValue('cardName', data.nombre_o_razon_social ?? '')
                setValue('address', data.direccion ?? '')
                // Extraer la actividad económica principal (formato: "Principal - 1030 - DESCRIPCION")
                const actividadPrincipal = data.actividades_economicas?.find(act => act.includes('Principal')) || ''
                const actividadDescripcion = actividadPrincipal.split(' - ').slice(2).join(' - ') || actividadPrincipal
                setValue('businessType', actividadDescripcion || '')
                setValue('ubigeo', data.ubigeo_sunat || '')
                setValue('paymentTerms', '')
                // Determinar tipo de persona basado en el RUC (10 = natural, 20 = jurídica)
                const tipoPersona = data.ruc.startsWith('10') ? 'TPN' : 'TPJ'
                setValue('personType', tipoPersona)
            }
        } catch (error) {
            console.error('Error consultando RUC:', error)
            alert(error instanceof Error ? error.message : 'Error al consultar RUC')
        } finally {
            setIsConsultingRuc(false)
            setIsCheckingBlackList(false)
        }
    }

    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const onSubmit = async (data: SupplierRegisterFormData) => {
        setErrorMessage(null);

        // Validar estado y condición (la nueva API puede tener diferentes valores)
        const estadoValido = sunatData?.estado && !sunatData.estado.includes('BAJA') && !sunatData.estado.includes('SUSPENSION')
        const condicionValida = sunatData?.condicion && sunatData.condicion.includes('HABIDO')
        
        if (!estadoValido || !condicionValida) {
            alert('El RUC debe estar activo y habido para poder registrarse.')
            return
        }

        if (!isRucValid || !sunatData) {
            alert('Debe consultar y validar un RUC antes de registrar.')
            return
        }

        if (!data.email) {
            alert('El correo del proveedor es obligatorio.');
            return;
        }

        try {
            const nowIso = new Date().toISOString()
            const domicilioFiscal = sunatData.direccion ?? data.address
            const distrito = sunatData.distrito ?? ''
            const provincia = sunatData.provincia ?? ''
            const departamento = sunatData.departamento ?? ''
            // Extraer actividad económica principal
            //const actividadPrincipal = sunatData.actividades_economicas?.find(act => act.includes('Principal')) || ''
            //const economicActivity = actividadPrincipal.split(' - ').slice(2).join(' - ') || data.businessType ?? ''
            //const economicActivity = (actividadPrincipal.split(' - ').slice(2).join(' - ') || data.businessType) ?? '';

            const ubigeoValue = data.ubigeo || sunatData.ubigeo_sunat || ''
            const supplierId = `P${data.cardCode}`

            const payload: SupplierApiRecord = {
                codigo_sn: supplierId,
                nombre_sn: data.cardName,
                ruc: data.cardCode,
                tipo_persona: data.personType ?? 'TPJ',
                moneda: 'S/',
                telefono1: data.phone ?? '',
                telefono2: '',
                telefono_movil: data.contactPhone ?? '',
                correo: data.email ?? '',
                tipo_documento: '6',
                direccion: data.address,
                distrito: distrito,
                provincia: provincia,
                departamento: departamento,
                ubigeo: ubigeoValue,
                condicion_pago: data.paymentTerms ?? '',
                direccion_sunat: domicilioFiscal,
                resolucion_agente_retencion: '',
                resolucion_agente_percepcion: '',
                website: data.website ?? '',
                create_date: nowIso,
                update_date: nowIso,
                status_contributer: estadoValido ? '00' : '10',
                status_domicilio: condicionValida ? '00' : '12',
                agente_percepcion: sunatData.es_agente_de_percepcion === 'SI' ? 'Y' : 'N',
                exo_percepcion: 'N',
                agente_retencion: sunatData.es_agente_de_retencion === 'SI' ? 'Y' : 'N',
                good_contributor: sunatData.es_buen_contribuyente === 'SI' ? 'Y' : 'N',
                economi_activity_sunat: "007", // CAMBIAR AL CODIGO DE SAP de momento duro - 007
                status: data.status ?? (sunatData.estado === 'ACTIVO' ? 'Pendiente' : 'Pendiente'),
                approval_date: '',
                cover_image: '',
                avatar: '',
                general_manager: data.generalManager ?? '',
                admin_manager: data.adminManager ?? '',
                sales_manager: data.salesManager ?? '',
                contactos: [
                    {
                        doc_entry: '',
                        active: 'Y',
                        name: data.contactPerson,
                        nombre: '',
                        segundo_nombre: '',
                        apellido: '',
                        profesion: '',
                        telefono: data.contactPhone ?? '',
                        e_mail_l: data.contactEmail ?? '',
                    }
                ],
                bancos: [],
                direcciones: [
                    {
                        cod_direccion: '01',
                        departamento: departamento,
                        direccion: domicilioFiscal,
                        distrito: distrito,
                        provincia: provincia,
                        nro_linea: '0',
                        ubigeo: ubigeoValue
                    }
                ],
                documento_evaluacion: [],
                referencias_comerciales: [],
                ServiciosOfrecidos: [],
            }

            // PASO 1: Crear proveedor en SAP primero
            const result = await createSupplierProfile(payload)
            
            // Si llegamos aquí, SAP fue exitoso. Ahora crear en Firestore
            const docEntryCode = result.record.doc_entry?.toString() ?? `USR-${Math.floor(Math.random() * 1_000_000)
                .toString()
                .padStart(6, '0')}`
            const username = data.cardCode.trim()
            const isNaturalPerson = username.startsWith('10')
            const userFullName = (isNaturalPerson ? data.cardName : data.cardName || data.contactPerson).trim() || data.contactPerson
            const tempPassword = generateTempPassword()

            // PASO 2: Crear usuario en Firestore solo si SAP fue exitoso
            try {
                await createSupplierUser({
                    username,
                    email: data.email,
                    userCode: docEntryCode,
                    userName: userFullName,
                    supplierId,
                    tempPassword,
                    companyName: data.cardName,
                    phone: data.phone,
                    avatar: result.supplier.avatar,
                    useSupplierPortal: true,
                    accountStatus: 'active',
                    role: UserRole.PROVEEDOR,
                });
            } catch (firestoreError) {
                // Si falla Firestore, informar pero el proveedor ya está en SAP
                console.error('Error al crear usuario en Firestore:', firestoreError);
                throw new Error(`El proveedor se creó en SAP pero hubo un error al crear el usuario: ${firestoreError instanceof Error ? firestoreError.message : 'Error desconocido'}`);
            }

            // Actualizar la lista de proveedores
            const withoutCurrent = supplierList.filter((supplier) => supplier.docEntry !== result.supplier.docEntry);
            setSuppliers([...withoutCurrent, result.supplier]);

            if (onRegistered) {
                await onRegistered();
            } else {
                try {
                    const refreshed = await fetchSuppliersListFromApi();
                    setSuppliers(refreshed);
                } catch (refreshError) {
                    console.error('No se pudo refrescar la lista de proveedores después del registro.', refreshError);
                }
            }

            // Enviar correo con credenciales
            try {
                const emailResult = await sendSupplierCredentials({
                    to: data.email,
                    credentials: {
                        username,
                        password: tempPassword,
                        supplierName: data.cardName,
                        userFullName,
                        portalLink,
                    },
                });

                if (emailResult.success) {
                    console.log('✅ Correo con credenciales enviado exitosamente');
                } else {
                    console.warn('⚠️ No se pudo enviar el correo con credenciales:', emailResult.error);
                    // No lanzamos error, solo registramos la advertencia
                }
            } catch (emailError) {
                console.error('Error al enviar correo con credenciales:', emailError);
                // No lanzamos error, solo registramos el error
            }

            setEmailSummary({
                email: data.email,
                username,
                tempPassword,
                portalLink,
                userFullName,
                supplierName: data.cardName,
            });
            setIsSummaryOpen(true);
            handleClose()
        } catch (error) {
            console.error('Error al registrar el proveedor:', error)
            // Mostrar mensaje de error más descriptivo
            const errorMsg = error instanceof Error 
                ? error.message 
                : 'Error al registrar el proveedor';
            
            // Establecer el mensaje de error para mostrarlo en la UI
            setErrorMessage(errorMsg);
            
            // También mostrar alerta como respaldo
            //alert(`❌ Error al registrar el proveedor\n\n${errorMsg}\n\nEl proveedor NO se ha creado en el sistema.`)
        }
    }

    const handleClose = () => {
        reset()
        setSunatData(null)
        setIsRucValid(false)
        setBlackListRecord(null)
        setErrorMessage(null)
        onRegisterClose()
    }

    const closeSummary = () => {
        setIsSummaryOpen(false);
        setEmailSummary(null);
    };

    return (
        <>
            <Modal isOpen={isRegisterOpen} onClose={handleClose} size="5xl">
                <ModalContent>
                    {() => (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <ModalHeader>
                                <h3 className="text-xl font-bold">Registrar Nuevo Proveedor</h3>
                            </ModalHeader>
                            <ModalBody>
                                {errorMessage && (
                                    <div className="mb-4 rounded-md border border-danger-300 bg-danger-50 p-3">
                                        <p className="text-sm text-danger-800 font-semibold mb-1">❌ Error al registrar proveedor</p>
                                        <p className="text-xs text-danger-700">{errorMessage}</p>
                                        <p className="text-xs text-danger-600 mt-2">El proveedor NO se ha creado en el sistema.</p>
                                    </div>
                                )}
                                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="cardCode"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    label="RUC"
                                                    size="sm"
                                                    placeholder="20123456789"
                                                    isInvalid={!!errors.cardCode}
                                                    errorMessage={errors.cardCode?.message}
                                                />
                                            )}
                                        />
                                        <Button
                                            color="danger"
                                            size="lg"
                                            className="bg-gris text-white dark:bg-azul"
                                            onPress={consultarRUC}
                                            isLoading={isConsultingRuc}
                                            isDisabled={!watchedRuc || watchedRuc.length !== 11}
                                        >
                                            {isConsultingRuc ? 'Consultando...' : 'Consultar'}
                                        </Button>
                                    </div>

                                    {/*<Controller
                                        name="cardName"
                                        control={control}
                                        render={({field}) => (
                                            <Input
                                                {...field}
                                                label="Razón Social"
                                                placeholder="Se completará automáticamente"
                                                size="sm"
                                                isDisabled={!isRucValid}
                                                isInvalid={!!errors.cardName}
                                                errorMessage={errors.cardName?.message}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({field}) => (
                                            <Input
                                                {...field}
                                                label="Domicilio fiscal"
                                                placeholder="Se completará automáticamente"
                                                size="sm"
                                                isDisabled={!isRucValid}
                                                isInvalid={!!errors.address}
                                                errorMessage={errors.address?.message}
                                            />
                                        )}
                                    />*/}

                                    {/* Sección de Información SUNAT (compacta y completa) */}
                                    {sunatData && (
                                        <>
                                        <div className="rounded-md border border-primary-200 bg-primary-50/40 p-3 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-primary-800">Información SUNAT</h4>
                                                <div className="flex items-center gap-2">
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={sunatData.estado === 'ACTIVO' ? 'success' : 'danger'}
                                                    >
                                                        Estado: {sunatData.estado}
                                                    </Chip>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={sunatData.condicion?.includes('HABIDO') && !sunatData.condicion?.includes('NO HABIDO') ? 'success' : 'warning'}
                                                    >
                                                        Condición: {getCondicionShort(sunatData.condicion)}
                                                    </Chip>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={isSSCO ? 'danger' : 'default'}
                                                    >
                                                        Sujeto Sin Capacidad Operativa: {isSSCO ? 'SI' : 'NO'}
                                                    </Chip>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mb-2">
                                                Fuente: SUNAT • <a href="https://www.sunat.gob.pe/padronesnotificaciones/sujeSinCapacidadOperativa.html" target="_blank" rel="noreferrer" className="underline">Sujetos sin Capacidad Operativa</a>
                                            </p>
                                            {blackListRecord && (
                                                <div className="mt-3 mb-4 rounded border border-red-200 bg-red-50/70 p-3">
                                                    <p className="text-xs font-semibold text-red-800 mb-2">⚠️ Proveedor en Lista Negra (SSCO)</p>
                                                    <div className="grid grid-cols-1 gap-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Resolución:</span>
                                                            <span className="text-right font-medium">{blackListRecord.U_ResolucionAtribSSCO}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Fecha Emisión:</span>
                                                            <span className="text-right">{blackListRecord.U_FechaEmiResolAtrib}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Fecha Publicación:</span>
                                                            <span className="text-right">{blackListRecord.U_FechaPublicacion}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Motivo:</span>
                                                            <span className="text-right font-medium text-red-700">{blackListRecord.U_MotivoListaNegra}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">RUC</span>
                                                    <span className="font-medium text-right">{sunatData.ruc}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Razón Social</span>
                                                    <span className="font-medium text-right">{sunatData.nombre_o_razon_social}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Dirección Completa</span>
                                                    <span className="text-right text-sm">{sunatData.direccion_completa || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Ubigeo</span>
                                                    <span className="text-right">{sunatData.ubigeo_sunat || '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Buen Contribuyente</span>
                                                    <span className="text-right">{sunatData.es_buen_contribuyente || 'NO'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Agente Retención</span>
                                                    <span className="text-right">{sunatData.es_agente_de_retencion || 'NO'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Agente Percepción</span>
                                                    <span className="text-right">{sunatData.es_agente_de_percepcion || 'NO'}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                <div className="rounded border border-primary-100 bg-white/70 p-2">
                                                    <p className="text-xs text-gray-500 mb-1">Domicilio Fiscal</p>
                                                    <p className="text-sm">{sunatData.direccion}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {sunatData.distrito} • {sunatData.provincia} • {sunatData.departamento}
                                                    </p>
                                                </div>
                                                <div className="rounded border border-primary-100 bg-white/70 p-2">
                                                    <p className="text-xs text-gray-500 mb-1">Actividades Económicas</p>
                                                    {sunatData.actividades_economicas?.length ? (
                                                        <ul className="list-disc list-inside text-sm space-y-0.5">
                                                            {sunatData.actividades_economicas.map((act, idx) => (
                                                                <li key={idx}>{act}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm">No registradas</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Agente Retención</span>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={sunatData.es_agente_de_retencion === 'SI' ? 'warning' : 'default'}
                                                    >
                                                        {sunatData.es_agente_de_retencion === 'SI' ? 'SI' : 'NO'}
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Agente Percepción</span>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={sunatData.es_agente_de_percepcion === 'SI' ? 'warning' : 'default'}
                                                    >
                                                        {sunatData.es_agente_de_percepcion === 'SI' ? 'SI' : 'NO'}
                                                    </Chip>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mensaje adicional para NO HABIDO */}
                                        {sunatData && sunatData.condicion?.includes('NO HABIDO') && (
                                            <div className="mt-2 rounded-md border border-warning-300 bg-warning-50/70 p-3">
                                                <p className="text-xs text-warning-800 leading-relaxed">
                                                    <strong>⚠️ Condición NO HABIDO:</strong> {sunatData.condicion}
                                                </p>
                                            </div>
                                        )}
                                        </>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    label="Email Proveedor"
                                                    type="email"
                                                    placeholder="email@empresa.com"
                                                    size="sm"
                                                    isInvalid={!!errors.email}
                                                    errorMessage={errors.email?.message}
                                                />
                                            )}
                                        />

                                        <Controller
                                            name="phone"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    label="Telefono Proveedor"
                                                    type="text"
                                                    maxLength={9}
                                                    placeholder="958746932"
                                                    size="sm"
                                                    isInvalid={!!errors.phone}
                                                    errorMessage={errors.phone?.message}
                                                />
                                            )}
                                        />
                                    </div>

                                    <Controller
                                        name="ubigeo"
                                        control={control}
                                        render={({field}) => (
                                            <div>
                                                <UbigeoSelector
                                                    value={field.value}
                                                    onChange={(ubigeoCode) => {
                                                        field.onChange(ubigeoCode);
                                                    }}
                                                    size="sm"
                                                    isInvalid={!!errors.ubigeo}
                                                    errorMessage={errors.ubigeo?.message}
                                                />
                                            </div>
                                        )}
                                    />

                                    <Divider/>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold mb-4">Persona de Contacto</h4>
                                        <Controller
                                            name="contactPerson"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    label="Nombre Completo"
                                                    placeholder="Nombre del contacto principal"
                                                    size="sm"
                                                    isInvalid={!!errors.contactPerson}
                                                    errorMessage={errors.contactPerson?.message}
                                                />
                                            )}
                                        />
                                        {<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Controller
                                                name="contactEmail"
                                                control={control}
                                                render={({field}) => (
                                                    <Input
                                                        {...field}
                                                        size="sm"
                                                        label="Email"
                                                        placeholder="proveedor@nogasa.com.pe"
                                                        isInvalid={!!errors.contactEmail}
                                                        errorMessage={errors.contactEmail?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="contactPhone"
                                                control={control}
                                                rules={{
                                                    required: "El teléfono es requerido",
                                                    pattern: {
                                                        value: /^\d{9}$/,
                                                        message: "Debe ser exactamente 9 dígitos numéricos"
                                                    },
                                                    maxLength: {
                                                        value: 9,
                                                        message: "Máximo 9 dígitos"
                                                    }
                                                }}
                                                render={({field}) => (
                                                    <Input
                                                        {...field}
                                                        size="sm"
                                                        label="Teléfono de Contacto"
                                                        maxLength={9}
                                                        placeholder="999 999 999"
                                                        isInvalid={!!errors.contactPhone}
                                                        errorMessage={errors.contactPhone?.message}
                                                    />
                                                )}
                                            />
                                        </div>}
                                        {/*fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Controller
                                                name={`contactPerson.${index}.name`}
                                                control={control}
                                                render={({ field }) => (
                                                    <div>
                                                        <label className="block font-medium">Nombre Completo</label>
                                                        <input
                                                            {...field}
                                                            placeholder="Nombre del contacto"
                                                            className={`w-full border rounded px-2 py-1 ${
                                                                errors.contactPerson?.[index]?.name ? "border-red-500" : "border-gray-300"
                                                            }`}
                                                        />
                                                        {errors.contactPerson?.[index]?.name && (
                                                            <p className="text-red-600 text-sm mt-1">
                                                                {errors.contactPerson[index]?.name?.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            />

                                            <Controller
                                                name={`contactPerson.${index}.phone`}
                                                control={control}
                                                render={({ field }) => (
                                                    <div>
                                                        <label className="block font-medium">Teléfono de Contacto</label>
                                                        <input
                                                            {...field}
                                                            placeholder="+51 999 999 999"
                                                            className={`w-full border rounded px-2 py-1 ${
                                                                errors.contactPerson?.[index]?.phone ? "border-red-500" : "border-gray-300"
                                                            }`}
                                                        />
                                                        {errors.contactPerson?.[index]?.phone && (
                                                            <p className="text-red-600 text-sm mt-1">
                                                                {errors.contactPerson[index]?.phone?.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    ))*/}

                                    </div>

                                    <Divider/>

                                    <div>
                                        <h4 className="font-semibold mb-4">Otros</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Controller
                                                name="generalManager"
                                                control={control}
                                                render={({field}) => (
                                                    <Input
                                                        {...field}
                                                        size="sm"
                                                        label="Gerente general"
                                                        isInvalid={!!errors.generalManager}
                                                        errorMessage={errors.generalManager?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="salesManager"
                                                control={control}
                                                render={({field}) => (
                                                    <Input
                                                        {...field}
                                                        size="sm"
                                                        label="Gerente de ventas"
                                                        isInvalid={!!errors.salesManager}
                                                        errorMessage={errors.salesManager?.message}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Controller
                                                name="adminManager"
                                                control={control}
                                                render={({field}) => (
                                                    <Input
                                                        {...field}
                                                        size="sm"
                                                        label="Gerente administrativo"
                                                        isInvalid={!!errors.adminManager}
                                                        errorMessage={errors.adminManager?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="paymentTerms"
                                                control={control}
                                                render={({field}) => (
                                                    <Select
                                                        {...field}
                                                        label="Término de pago"
                                                        size="sm"
                                                        placeholder={isLoadingCondicionesPago ? "Cargando..." : "Seleccione un término"}
                                                        selectedKeys={field.value ? [field.value] : []}
                                                        onSelectionChange={(keys) => {
                                                            const selectedKey = Array.from(keys)[0] as string
                                                            field.onChange(selectedKey)
                                                        }}
                                                        isInvalid={!!errors.paymentTerms}
                                                        errorMessage={errors.paymentTerms?.message}
                                                        isDisabled={isLoadingCondicionesPago}
                                                    >
                                                        {condicionesPago.length > 0 
                                                            ? condicionesPago.map((condicion) => (
                                                                <SelectItem key={condicion.group_num}>
                                                                    {condicion.pymnt_group}
                                                                </SelectItem>
                                                            ))
                                                            : terminosPago.map((termino) => (
                                                                <SelectItem key={termino.key}>{termino.label}</SelectItem>
                                                            ))
                                                        }
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className={`p-3 rounded-lg ${isRucValid ? 'bg-green-50' : 'bg-blue-50'}`}>
                                        <p className={`text-xs ${isRucValid ? 'text-green-600' : 'text-blue-600'}`}>
                                            <strong>Nota:</strong> {
                                            isRucValid
                                                ? 'RUC válido. Los campos se han completado automáticamente.'
                                                : 'Consulte el RUC para completar automáticamente la información de la empresa. Solo se habilitarán los campos si el estado es ACTIVO y HABIDO.'
                                        }
                                        </p>
                                        {errors.docEntry?.message && <p>docEntry: {errors.docEntry.message}</p>}
                                        {errors.cardCode?.message && <p>cardCode: {errors.cardCode.message}</p>}
                                        {errors.cardName?.message && <p>cardName: {errors.cardName.message}</p>}
                                        {errors.email?.message && <p>email: {errors.email.message}</p>}
                                        {errors.phone?.message && <p>phone: {errors.phone.message}</p>}
                                        {errors.website?.message && <p>website: {errors.website.message}</p>}
                                        {errors.address?.message && <p>address: {errors.address.message}</p>}
                                        {errors.city?.message && <p>city: {errors.city.message}</p>}
                                        {errors.country?.message && <p>country: {errors.country.message}</p>}
                                        {errors.contactPerson?.message &&
                                            <p>contactPerson: {errors.contactPerson.message}</p>}
                                        {errors.contactEmail?.message &&
                                            <p>contactEmail: {errors.contactEmail.message}</p>}
                                        {errors.contactPhone?.message &&
                                            <p>contactPhone: {errors.contactPhone.message}</p>}
                                        {errors.personType?.message && <p>personType: {errors.personType.message}</p>}
                                        {errors.businessType?.message &&
                                            <p>businessType: {errors.businessType.message}</p>}
                                        {errors.status?.message && <p>status: {errors.status.message}</p>}
                                        {errors.rating?.message && <p>rating: {errors.rating.message}</p>}
                                        {errors.totalOrders?.message &&
                                            <p>totalOrders: {errors.totalOrders.message}</p>}
                                        {errors.totalAmount?.message &&
                                            <p>totalAmount: {errors.totalAmount.message}</p>}
                                        {errors.paymentTerms?.message &&
                                            <p>paymentTerms: {errors.paymentTerms.message}</p>}
                                        {errors.certifications?.message &&
                                            <p>certifications: {errors.certifications.message}</p>}
                                        {errors.registrationDate?.message &&
                                            <p>registrationDate: {errors.registrationDate.message}</p>}
                                        {errors.lastOrderDate?.message &&
                                            <p>lastOrderDate: {errors.lastOrderDate.message}</p>}
                                        {errors.avatar?.message && <p>avatar: {errors.avatar.message}</p>}
                                        {errors.adminManager?.message &&
                                            <p>adminManager: {errors.adminManager.message}</p>}
                                        {errors.salesManager?.message &&
                                            <p>salesManager: {errors.salesManager.message}</p>}


                                    </div>
                                </div>
                            </ModalBody>

                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={handleClose}
                                    isDisabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={!isRucValid}
                                >
                                    Registrar Proveedor
                                </Button>
                            </ModalFooter>
                        </form>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={isSummaryOpen} onClose={closeSummary} size="md">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-lg font-semibold">Resumen de credenciales enviadas</h3>
                            </ModalHeader>
                            <ModalBody>
                                {emailSummary ? (
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Proveedor:</strong> {emailSummary.supplierName}</p>
                                        <p><strong>Usuario (RUC):</strong> {emailSummary.username}</p>
                                        <p><strong>Nombre mostrado:</strong> {emailSummary.userFullName}</p>
                                        <p><strong>Correo de destino:</strong> {emailSummary.email}</p>
                                        <p><strong>Contraseña temporal:</strong> {emailSummary.tempPassword}</p>
                                        <p><strong>Portal:</strong> <a className="text-primary" href={emailSummary.portalLink} target="_blank" rel="noreferrer">{emailSummary.portalLink}</a></p>
                                        <p className="text-xs text-default-500">
                                            Comparte estas credenciales con el proveedor. Se recomienda solicitar el cambio de contraseña en el primer ingreso.
                                        </p>
                                    </div>
                                ) : (
                                    <p>No hay información disponible.</p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={() => { onClose(); closeSummary(); }}>
                                    Entendido
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}

export {ModalRegister}