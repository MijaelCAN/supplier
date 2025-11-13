/*import {
    Button,
    Divider,
    Input, Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem
} from "@heroui/react";
import {FC} from "react";
import {useConfigData} from "@/store";

interface ModalRegisterProps {
    isRegisterOpen: boolean;
    onRegisterClose: () => void;
    addSupplier: () => void;
}

const ModalRegister: FC<ModalRegisterProps> = ({isRegisterOpen,onRegisterClose, addSupplier}) => {
    const { terminosPago, estadosRegister, tipoPersona } = useConfigData()
    return (
        <Modal isOpen={isRegisterOpen} onClose={onRegisterClose} size="3xl">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <h3 className="text-xl font-bold">Registrar Nuevo Proveedor</h3>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="RUC"
                                        size="sm"
                                        isRequired
                                        className="flex-1"
                                    />
                                    <Button
                                        color="danger"
                                        size="lg"
                                        className="bg-gris text-white dark:bg-azul"
                                        onPress={() => {console.log('Consultando RUC en SUNAT...');}}
                                    >
                                        Consultar
                                    </Button>
                                </div>

                                <Input
                                    label="Razón Social"
                                    placeholder="Se completará automáticamente"
                                    size="sm"
                                    //isDisabled
                                />

                                <Input
                                    label="Domicilio fiscal"
                                    placeholder="Se completará automáticamente"
                                    size="sm"
                                    //isDisabled
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Email Proveedor"
                                        type="email"
                                        placeholder="email@empresa.com"
                                        size="sm"
                                        isRequired
                                    />

                                    <Select label="Tipo de persona" size="sm"
                                            placeholder="Seleccione un estado">
                                        {tipoPersona.map((estado) => (
                                            <SelectItem key={estado.key}>{estado.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Input
                                    label="Gerente General"
                                    placeholder="Se completará automáticamente"
                                    size="sm"
                                    isDisabled
                                    className="hidden" // Mostrar solo si existe
                                />

                                <Input
                                    label="Gerente Administrativo"
                                    placeholder="Se completará automáticamente"
                                    size="sm"
                                    isDisabled
                                    className="hidden" // Mostrar solo si existe
                                />

                                <Input
                                    label="Gerente de Ventas"
                                    placeholder="Se completará automáticamente"
                                    size="sm"
                                    isDisabled
                                    className="hidden" // Mostrar solo si existe
                                />

                                <Divider/>


                                <div>
                                    <h4 className="font-semibold mb-4">Persona de Contacto</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            size="sm"
                                            label="Nombre Completo"
                                            placeholder="Nombre del contacto principal"
                                            isRequired
                                        />
                                        <Input
                                            size="sm"
                                            label="Teléfono de Contacto"
                                            placeholder="+51 999 999 999"
                                        />
                                    </div>
                                </div>
                                <Divider/>

                                <div>
                                    <h4 className="font-semibold mb-4">Otros</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="Término de pago" size="sm"
                                                placeholder="Seleccione un término">
                                            {terminosPago.map((termino) => (
                                                <SelectItem key={termino.key}>{termino.label}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select label="Estado inicial" size="sm"
                                                placeholder="Seleccione un estado">
                                            {estadosRegister.map((estado) => (
                                                <SelectItem key={estado.key}>{estado.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                </div>


                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-blue-600">
                                        <strong>Nota:</strong> Consulte el RUC para completar
                                        automáticamente
                                        la información de la empresa. Solo se habilitarán los campos si el
                                        estado es ACTIVO y HABIDO.
                                    </p>
                                </div>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={() => {
                                addSupplier()
                                onClose();
                            }}>
                                Registrar Proveedor
                            </Button>
                        </ModalFooter>
                    </>
                )}

            </ModalContent>
        </Modal>
    )
}
export {ModalRegister}*/
import { FC, useMemo, useState } from 'react'
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
    Divider
} from "@heroui/react"
import {useConfigData} from '@/store'
import { useSuppliers as useExtendedSuppliers } from '@/store/extendedStore'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/routes/menuTypes'
import { createSupplierProfile, fetchSunatSupplierData, fetchSuppliersListFromApi, type SupplierApiRecord } from '@/services/providers/providersApi';

// Schema de validación con Zod
/*const supplierRegisterSchema2 = z.object({
    ruc: z.string()
        .min(11, 'El RUC debe tener 11 dígitos')
        .max(11, 'El RUC debe tener 11 dígitos')
        .regex(/^\d{11}$/, 'El RUC debe contener solo números'),
    razonSocial: z.string().min(1, 'La razón social es requerida'),
    domicilioFiscal: z.string().min(1, 'El domicilio fiscal es requerido'),
    email: z.string().email('Email inválido').min(1, 'El email es requerido'),
    tipoPersona: z.string().min(1, 'El tipo de persona es requerido'), // NO ESTA
    gerenteGeneral: z.string().optional(), // NO ESTA
    gerenteAdministrativo: z.string().optional(), // NO ESTA
    gerenteVentas: z.string().optional(), // NO ESTA
    contactoNombre: z.string().min(1, 'El nombre del contacto es requerido'),
    contactoTelefono: z.string().optional(),
    terminoPago: z.string().min(1, 'El término de pago es requerido'),
    estadoInicial: z.string().min(1, 'El estado inicial es requerido')
})*/

const supplierRegisterSchema = z.object({
    docEntry: z.string().min(1, "El identificador de proveedor es requerido"),
    cardCode: z.string()
        .min(11, 'El RUC debe tener 11 dígitos')
        .max(11, 'El RUC debe tener 11 dígitos')
        .regex(/^\d{11}$/, 'El RUC debe contener solo números'),
    cardName: z.string().min(1, "La razón social es requerida"),
    email: z.string().email("Email inválido").min(1, "El email es requerido").optional(),
    phone: z.string().min(1, "El teléfono es requerido"),
    website: z.string().url("La página web debe ser una URL válida").optional(),
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
    registrationDate: z.string().min(1, "La fecha de registro es requerida"),
    lastOrderDate: z.string().min(1, "La fecha de última orden es requerida"),
    avatar: z.string().url("La URL del avatar debe ser válida"),
    generalManager: z.string().min(1, "generalManager es requerido"),
    adminManager: z.string().optional(),
    salesManager: z.string().min(1, "salesManager es requerido"),
});




type SupplierRegisterFormData = z.infer<typeof supplierRegisterSchema>

// Interface para los datos de SUNAT
interface SunatData {
    ruc: string;
    razon_social: string;
    tipo_contribuyente: string;
    nombre_comercial: string;
    fecha_inscripcion: string;
    fecha_inicio_actividades: string;
    estado: string;
    condicion: string;
    domicilio_fiscal: {
        direccion: string;
        distrito: string;
        provincia: string;
        departamento: string;
    };
    actividades_economicas?: string[];
    agente_retencion?: string;
    agente_percepcion?: string;
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
    const { terminosPago, tipoPersona } = useConfigData()
    const createSupplierUser = useAuthStore((state) => state.createSupplierUser);
    const [isConsultingRuc, setIsConsultingRuc] = useState(false)
    const [sunatData, setSunatData] = useState<SunatData | null>(null)
    const [isRucValid, setIsRucValid] = useState(false)
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [emailSummary, setEmailSummary] = useState<{
        email: string;
        username: string;
        tempPassword: string;
        portalLink: string;
        userFullName: string;
        supplierName: string;
    } | null>(null);
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
            contactPerson: 'Mijael Cano Rojas',
            contactEmail: 'contacto@gmail.com',
            contactPhone: '',
            personType: 'TPJ',
            businessType: 'SALUD',
            status: 'Pendiente',
            rating: 0.0,
            totalOrders: 0,
            totalAmount: 0,
            paymentTerms: '',
            certifications: ["ISO 14000"],
            registrationDate: 'asd',
            lastOrderDate: 'asdas',
            avatar: 'https://i.pravatar.cc/150?u=medicos',
        }
    });

    //const { fields, append, remove} = useFieldArray({control, name: "contactPerson"});

    const watchedRuc = watch('cardCode')

    // Función para consultar RUC en SUNAT
    const consultarRUC = async () => {
        if (!watchedRuc || watchedRuc.length !== 11) {
            alert('Ingrese un RUC válido de 11 dígitos')
            return
        }

        setIsConsultingRuc(true)

        try {
            const response = await fetchSunatSupplierData(watchedRuc)

            if (!response.success || !response.datos) {
                throw new Error('La consulta a SUNAT no devolvió información válida.')
            }

            const data = response.datos
            setSunatData(data)

            const isValidStatus = data.estado === 'ACTIVO' && data.condicion === 'HABIDO'
            setIsRucValid(isValidStatus)

            if (isValidStatus) {
                setValue('cardName', data.razon_social ?? '')
                setValue('address', data.domicilio_fiscal?.direccion ?? '')
                setValue('businessType', data.actividades_economicas?.[0] ?? '')
                setValue('ubigeo', '')
                setValue('paymentTerms', '')
                setValue('personType', data.tipo_contribuyente?.includes('NATURAL') ? 'TPN' : 'TPJ')
            } else {
                alert(`RUC no válido: Estado ${data.estado}, Condición ${data.condicion}`)
            }
        } catch (error) {
            console.error('Error consultando RUC:', error)
            alert(error instanceof Error ? error.message : 'Error al consultar RUC')
        } finally {
            setIsConsultingRuc(false)
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
            const domicilioFiscal = sunatData.domicilio_fiscal?.direccion ?? data.address
            const distrito = sunatData.domicilio_fiscal?.distrito ?? ''
            const provincia = sunatData.domicilio_fiscal?.provincia ?? ''
            const departamento = sunatData.domicilio_fiscal?.departamento ?? ''
            const economicActivity = sunatData.actividades_economicas?.[0] ?? data.businessType ?? ''
            const ubigeoValue = data.ubigeo ?? ''
            const supplierId = `P${data.cardCode}`

            const payload: SupplierApiRecord = {
                CodigoSN: supplierId,
                NombreSN: data.cardName,
                RUC: data.cardCode,
                TipoPersona: data.personType ?? 'TPJ',
                Moneda: 'S/',
                Telefono1: data.phone ?? '',
                Telefono2: '',
                TelefonoMovil: data.contactPhone ?? '',
                Correo: data.email ?? '',
                TipoDocumento: '6',
                Direccion: data.address,
                Distrito: distrito,
                Provincia: provincia,
                Departamento: departamento,
                Ubigeo: ubigeoValue,
                CondicionPago: data.paymentTerms ?? '',
                DireccionSUNAT: domicilioFiscal,
                ResolucionAgenteRetencion: '',
                ResolucionAgentePercepcion: '',
                website: data.website ?? '',
                createDate: nowIso,
                updateDate: nowIso,
                statusContributer: sunatData.estado === "ACTIVO" ? '00' :'10',
                statusDomicilio: sunatData.condicion === "HABIDO" ? '00' :'12',
                agentePercepcion: sunatData.agente_percepcion === 'SI' ? 'Y' : 'N',
                exoPercepcion: 'N',
                agenteRetencion: sunatData.agente_retencion === 'SI' ? 'Y' : 'N',
                goodContributor: 'N',
                economiActivitySunat: "007", // CAMBIAR AL CODIGO DE SAP de momento duro - 007
                status: data.status ?? (sunatData.estado === 'ACTIVO' ? 'Pendiente' : 'Pendiente'),
                approvalDate: '',
                coverImage: '',
                Avatar: '',
                generalManager: data.generalManager ?? '',
                adminManager: data.adminManager ?? '',
                salesManager: data.salesManager ?? '',
                Contactos: [
                    {
                        Active: 'Y',
                        Name: data.contactPerson,
                        Profesion: '',
                        Telefono: data.contactPhone ?? '',
                        E_MailL: data.contactEmail ?? '',
                    }
                ],
                Bancos: [],
                Direcciones: [
                    {
                        CodDireccion: '01',
                        Departamento: departamento,
                        Direccion: domicilioFiscal,
                        Distrito: distrito,
                        Provincia: provincia,
                        NroLinea: '0',
                        Ubigeo: ubigeoValue
                    }
                ],
                DocumentoEvaluacion: [],
                ReferenciasComerciales: [],
                ServiciosOfrecidos: [],
            }

            const result = await createSupplierProfile(payload)
            const docEntryCode = result.record.DocEntry?.toString() ?? `USR-${Math.floor(Math.random() * 1_000_000)
                .toString()
                .padStart(6, '0')}`
            const username = data.cardCode.trim()
            const isNaturalPerson = username.startsWith('10')
            const userFullName = (isNaturalPerson ? data.cardName : data.cardName || data.contactPerson).trim() || data.contactPerson
            const tempPassword = generateTempPassword()

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
            alert(error instanceof Error ? error.message : 'Error al registrar el proveedor')
        }
    }

    const handleClose = () => {
        reset()
        setSunatData(null)
        setIsRucValid(false)
        onRegisterClose()
    }

    const closeSummary = () => {
        setIsSummaryOpen(false);
        setEmailSummary(null);
    };

    return (
        <>
            <Modal isOpen={isRegisterOpen} onClose={handleClose} size="3xl">
                <ModalContent>
                    {() => (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <ModalHeader>
                                <h3 className="text-xl font-bold">Registrar Nuevo Proveedor</h3>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
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

                                    <Controller
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
                                    />

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
                                            <Input
                                                {...field}
                                                label="Ubigeo"
                                                placeholder="Ej: 150101"
                                                size="sm"
                                                isInvalid={!!errors.ubigeo}
                                                errorMessage={errors.ubigeo?.message}
                                            />
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
                                                render={({field}) => (
                                                    <Input
                                                        {...field}
                                                        size="sm"
                                                        label="Teléfono de Contacto"
                                                        placeholder="+51 999 999 999"
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
                                                        placeholder="Seleccione un término"
                                                        selectedKeys={field.value ? [field.value] : []}
                                                        onSelectionChange={(keys) => {
                                                            const selectedKey = Array.from(keys)[0] as string
                                                            field.onChange(selectedKey)
                                                        }}
                                                        isInvalid={!!errors.paymentTerms}
                                                        errorMessage={errors.paymentTerms?.message}
                                                    >
                                                        {terminosPago.map((termino) => (
                                                            <SelectItem key={termino.key}>{termino.label}</SelectItem>
                                                        ))}
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