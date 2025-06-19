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
import { FC, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import {Supplier, useConfigData} from '@/store'
import { useAuth, useAuthStore } from '@/store/authStore'

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
    city: z.string().min(1, "La ciudad es requerida"),
    country: z.string().min(1, "El país es requerido"),
    contactPerson: z.string().min(1, "El nombre del contacto es requerido"),
    contactEmail: z.string().email("Email de contacto inválido").min(1, "El email de contacto es requerido"),
    contactPhone: z.string().min(1, "El teléfono de contacto es requerido"),
    personType: z.string().min(1,"Seleccione un tipo de persona"),
    businessType: z.string().min(1, "La actividad económica es requerida"),
    status: z.enum(["A", "I", "P", "S"], undefined),
    rating: z.number().min(0, "La calificación debe ser al menos 0"),
    totalOrders: z.number().int().min(0, "El número de órdenes debe ser 0 o mayor"),
    totalAmount: z.number().min(0, "El monto total debe ser 0 o mayor"),
    paymentTerms: z.string().min(1, "El término de pago es requerido"),
    certifications: z.array(z.string()).optional(),
    registrationDate: z.string().min(1, "La fecha de registro es requerida"),
    lastOrderDate: z.string().min(1, "La fecha de última orden es requerida"),
    avatar: z.string().url("La URL del avatar debe ser válida"),
    //generalManager: z.string().min(1, "generalManager es requerido"),
    //adminManager: z.string().min(1, "adminManager es requerido"),
    //salesManager: z.string().min(1, "salesManager es requerido"),
});




type SupplierRegisterFormData = z.infer<typeof supplierRegisterSchema>

// Interface para los datos de SUNAT
interface SunatData {
    razonSocial: string
    domicilioFiscal: string
    estado: string
    condicion: string
    gerenteGeneral?: string
    gerenteAdministrativo?: string
    gerenteVentas?: string
}

interface ModalRegisterProps {
    isRegisterOpen: boolean
    onRegisterClose: () => void
    addSupplier: (supplier: Omit<Supplier, 'id' | 'fechaRegistro'>) => void
}

const ModalRegister: FC<ModalRegisterProps> = ({
   isRegisterOpen,
   onRegisterClose,
   addSupplier
}) => {
    const { terminosPago, estadosRegister, tipoPersona } = useConfigData()
    const { createSupplierUser } = useAuthStore()
    const [isConsultingRuc, setIsConsultingRuc] = useState(false)
    const [sunatData, setSunatData] = useState<SunatData | null>(null)
    const [isRucValid, setIsRucValid] = useState(false)

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
            docEntry: '123456',
            cardCode: '',
            cardName: '',
            email: '',
            phone: '963852741',
            website: 'https://www.miempresa.com.pe',
            address: '',
            city: 'Lima',
            country: 'PERU',
            contactPerson: '',
            contactEmail: 'contacto@gmail.com',
            contactPhone: '',
            personType: '',
            businessType: 'SALUD',
            status: 'P',            // Puedes usar un valor por defecto válido del enum
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

    const watchedRuc = watch('cardCode')

    // Función para consultar RUC en SUNAT
    const consultarRUC = async () => {
        if (!watchedRuc || watchedRuc.length !== 11) {
            alert('Ingrese un RUC válido de 11 dígitos')
            return
        }

        setIsConsultingRuc(true)

        try {
            // Aquí iría tu llamada real a la API de SUNAT
            // Por ahora simulo una respuesta
            const response = await simulateRucConsultation(watchedRuc)

            if (response.success) {
                const data = response.data
                setSunatData(data)

                // Solo habilitar campos si está ACTIVO y HABIDO
                const isValidStatus = data.estado === 'ACTIVO' && data.condicion === 'HABIDO'
                setIsRucValid(isValidStatus)

                if (isValidStatus) {
                    // Llenar automáticamente los campos
                    setValue('cardName', data.razonSocial)
                    setValue('address', data.domicilioFiscal)

                    // Manager fields temporarily disabled
                    // if (data.gerenteGeneral) setValue('generalManager', data.gerenteGeneral)
                    // if (data.gerenteAdministrativo) setValue('adminManager', data.gerenteAdministrativo)
                    // if (data.gerenteVentas) setValue('salesManager', data.gerenteVentas)
                } else {
                    alert(`RUC no válido: Estado ${data.estado}, Condición ${data.condicion}`)
                }
            } else {
                alert('Error al consultar RUC en SUNAT')
            }
        } catch (error) {
            console.error('Error consultando RUC:', error)
            alert('Error al consultar RUC')
        } finally {
            setIsConsultingRuc(false)
        }
    }

    // Simulación de consulta RUC (reemplazar con tu API real)
    const simulateRucConsultation = async (ruc: string): Promise<{success: boolean, data: SunatData}> => {
        console.log("RUC", ruc)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        razonSocial: 'AXIOM Solutions S.A.C',
                        domicilioFiscal: 'AV. Constructores 2839, LIMA, LIMA',
                        estado: 'ACTIVO',
                        condicion: 'HABIDO',
                        gerenteGeneral: 'JUAN PEREZ GARCIA'
                    }
                })
            }, 1500)
        })
    }

    const onSubmit = async (data: SupplierRegisterFormData) => {
        console.log("ENTRO A FUNCION DE ENVIO")
        if (!isRucValid) {
            alert('Debe consultar un RUC válido antes de registrar')
            return
        }

        try {
            // Transformar los datos del formulario al formato Supplier
            const newSupplier = {
                docEntry: data.docEntry,
                cardCode: data.cardCode,
                cardName: data.cardName,
                businessType: data.businessType,
                email: data.email,
                phone: data.phone || '',
                website: data.website || 'www.miempresa.com.pe',
                address: data.address,
                city: data.city,
                country: 'PERU',
                contactPerson: data.contactPerson,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone || '',
                paymentTerms: data.paymentTerms,
                certifications: data.certifications,
                status: data.status,
                rating: data.rating,
                totalAmount: data.totalAmount,
                totalOrders: data.totalOrders,
                registrationDate: new Date().toLocaleDateString('es-PE'),
                lastOrderDate: new Date().toLocaleDateString('es-PE'),
                avatar: data.avatar,
                personType: data.personType || 'Juridica'
            }

            // Add supplier to store
            await addSupplier(newSupplier)
            
            // Simulate email sending and create user account
            await simulateEmailSending(data.contactEmail, data.cardName, data.contactPerson, data.docEntry)
            
            // Close modal after success
            handleClose()
        } catch (error) {
            console.error('Error al registrar el proveedor:', error)
            alert('Error al registrar el proveedor')
        }
    }

    // Simulate sending credentials via email
    const simulateEmailSending = async (email: string, companyName: string, contactPerson: string, supplierId: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate temporary credentials
                const tempPassword = generateTempPassword()
                
                // Create user account for the supplier
                createSupplierUser({
                    email: email,
                    companyName: companyName,
                    contactPerson: contactPerson,
                    supplierId: supplierId,
                    tempPassword: tempPassword
                })
                
                // Simulate email sending
                console.log(`
                    ===== EMAIL SIMULADO =====
                    Para: ${email}
                    Asunto: Credenciales de acceso al Portal de Proveedores
                    
                    Estimado/a ${contactPerson} de ${companyName},
                    
                    Su empresa ha sido registrada exitosamente en nuestro Portal de Proveedores.
                    
                    Sus credenciales de acceso son:
                    - Usuario: ${email}
                    - Contraseña temporal: ${tempPassword}
                    
                    Por favor, ingrese al portal usando estas credenciales y cambie su contraseña.
                    
                    Portal: ${window.location.origin}/login
                    
                    Saludos cordiales,
                    Equipo de Administración
                    ===========================
                `)
                
                alert(`¡Proveedor registrado exitosamente!\n\nSe han enviado las credenciales de acceso al correo: ${email}\n\nCredenciales temporales:\nUsuario: ${email}\nContraseña: ${tempPassword}\n\nEl proveedor ya puede ingresar al sistema con estas credenciales.`)
                
                resolve()
            }, 2000) // Simulate 2 second delay for email sending
        })
    }

    // Generate a temporary password
    const generateTempPassword = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let password = ''
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }

    const handleClose = () => {
        reset()
        setSunatData(null)
        setIsRucValid(false)
        onRegisterClose()
    }

    return (
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
                                        name="personType"
                                        control={control}
                                        render={({field}) => (
                                            <Select
                                                {...field}
                                                label="Tipo de persona"
                                                size="sm"
                                                placeholder="Seleccione un tipo"
                                                selectedKeys={field.value ? [field.value] : []}
                                                onSelectionChange={(keys) => {
                                                    const selectedKey = Array.from(keys)[0] as string
                                                    field.onChange(selectedKey)
                                                }}
                                                isInvalid={!!errors.personType}
                                                errorMessage={errors.personType?.message}
                                            >
                                                {tipoPersona.map((tipo) => (
                                                    <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </div>

                                {/* Campos de gerentes - solo mostrar si tienen datos */}
                                {sunatData?.gerenteGeneral && (
                                    <Controller
                                        name="generalManager"
                                        control={control}
                                        render={({field}) => (
                                            <Input
                                                {...field}
                                                label="Gerente General"
                                                placeholder="Se completará automáticamente"
                                                size="sm"
                                                isDisabled
                                            />
                                        )}
                                    />
                                )}

                                {sunatData?.gerenteAdministrativo && (
                                    <Controller
                                        name="adminManager"
                                        control={control}
                                        render={({field}) => (
                                            <Input
                                                {...field}
                                                label="Gerente Administrativo"
                                                placeholder="Se completará automáticamente"
                                                size="sm"
                                                isDisabled
                                            />
                                        )}
                                    />
                                )}

                                {sunatData?.gerenteVentas && (
                                    <Controller
                                        name="salesManager"
                                        control={control}
                                        render={({field}) => (
                                            <Input
                                                {...field}
                                                label="Gerente de Ventas"
                                                placeholder="Se completará automáticamente"
                                                size="sm"
                                                isDisabled
                                                isInvalid={!!errors.salesManager}
                                                errorMessage={errors.generalManager?.message}
                                            />
                                        )}
                                    />
                                )}

                                <Divider/>

                                <div>
                                    <h4 className="font-semibold mb-4">Persona de Contacto</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="contactPerson"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    size="sm"
                                                    label="Nombre Completo"
                                                    placeholder="Nombre del contacto principal"
                                                    isInvalid={!!errors.contactPerson}
                                                    errorMessage={errors.contactPerson?.message}
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
                                                    isInvalid={!!errors.contactPerson}
                                                    errorMessage={errors.contactPerson?.message}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                <Divider/>

                                <div>
                                    <h4 className="font-semibold mb-4">Otros</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({field}) => (
                                                <Select
                                                    {...field}
                                                    label="Estado inicial"
                                                    size="sm"
                                                    placeholder="Seleccione un estado"
                                                    selectedKeys={field.value ? [field.value] : []}
                                                    onSelectionChange={(keys) => {
                                                        const selectedKey = Array.from(keys)[0] as string
                                                        field.onChange(selectedKey)
                                                    }}
                                                    isInvalid={!!errors.status}
                                                    errorMessage={errors.status?.message}
                                                >
                                                    {estadosRegister.map((estado) => (
                                                        <SelectItem key={estado.key}>{estado.label}</SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

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

                                <div className={`p-3 rounded-lg ${isRucValid ? 'bg-green-50' : 'bg-blue-50'}`}>
                                    <p className={`text-xs ${isRucValid ? 'text-green-600' : 'text-blue-600'}`}>
                                        <strong>Nota:</strong> {
                                        isRucValid
                                            ? 'RUC válido. Los campos se han completado automáticamente.'
                                            : 'Consulte el RUC para completar automáticamente la información de la empresa. Solo se habilitarán los campos si el estado es ACTIVO y HABIDO.'
                                    }
                                    </p>
                                    <p>{errors.docEntry?.message}</p>
                                    <p>{errors.cardCode?.message}</p>
                                    <p>{errors.cardName?.message}</p>
                                    <p>{errors.email?.message}</p>
                                    <p>{errors.phone?.message}</p>
                                    <p>{errors.website?.message}</p>
                                    <p>{errors.address?.message}</p>
                                    <p>{errors.city?.message}</p>
                                    <p>{errors.country?.message}</p>
                                    <p>{errors.contactPerson?.message}</p>
                                    <p>{errors.contactEmail?.message}</p>
                                    <p>{errors.contactPhone?.message}</p>
                                    <p>{errors.personType?.message}</p>
                                    <p>{errors.businessType?.message}</p>
                                    <p>{errors.status?.message}</p>
                                    <p>{errors.rating?.message}</p>
                                    <p>{errors.totalOrders?.message}</p>
                                    <p>{errors.totalAmount?.message}</p>
                                    <p>{errors.paymentTerms?.message}</p>
                                    <p>{errors.certifications?.message}</p>
                                    <p>{errors.registrationDate?.message}</p>
                                    <p>{errors.lastOrderDate?.message}</p>
                                    <p>{errors.avatar?.message}</p>
                                    <p>{errors.adminManager?.message}</p>
                                    <p>{errors.salesManager?.message}</p>
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
    )
}

export {ModalRegister}