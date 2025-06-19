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
import {Supplier, useConfigData} from "@/store";
import {FC} from "react";

interface ModalEditProps {
    isEditOpen: boolean;
    onEditClose: () => void;
    selectedSupplier: Supplier | null;
    updateSupplier?: (id: string, supplier: Supplier) => void;
}

const ModalEdit: FC<ModalEditProps> = ({isEditOpen, onEditClose, selectedSupplier}) => {
    const { estadosSupplier } = useConfigData()
    return (
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="3xl">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <h3 className="text-xl font-bold">Editar Proveedor</h3>
                        </ModalHeader>
                        <ModalBody>
                            {selectedSupplier && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Nombre de la Empresa"
                                            placeholder="Ingrese el nombre"
                                            defaultValue={selectedSupplier.cardName}
                                        />
                                        <Input
                                            label="Tipo de Negocio"
                                            placeholder="Tipo de negocio"
                                            defaultValue={selectedSupplier.businessType}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Email"
                                            type="email"
                                            placeholder="email@empresa.com"
                                            defaultValue={selectedSupplier.email}
                                        />
                                        <Input
                                            label="Teléfono"
                                            placeholder="+51 999 999 999"
                                            defaultValue={selectedSupplier.phone}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Sitio Web"
                                            placeholder="www.empresa.com"
                                            defaultValue={selectedSupplier.website}
                                        />
                                        <Input
                                            label="RUC/Tax ID"
                                            placeholder="20123456789"
                                            defaultValue={selectedSupplier.cardCode}
                                        />
                                    </div>

                                    <Input
                                        label="Dirección"
                                        placeholder="Dirección completa"
                                        defaultValue={selectedSupplier.address}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Ciudad"
                                            placeholder="Ciudad"
                                            defaultValue={selectedSupplier.city}
                                        />
                                        <Input
                                            label="País"
                                            placeholder="País"
                                            defaultValue={selectedSupplier.country}
                                        />
                                    </div>

                                    <Divider/>

                                    <div>
                                        <h4 className="font-semibold mb-4">Persona de Contacto</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Nombre Completo"
                                                placeholder="Nombre del contacto"
                                                defaultValue={selectedSupplier.contactPerson}
                                            />
                                            <Input
                                                label="Email de Contacto"
                                                type="email"
                                                placeholder="contacto@empresa.com"
                                                defaultValue={selectedSupplier.contactEmail}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <Input
                                                label="Teléfono de Contacto"
                                                placeholder="+51 999 999 999"
                                                defaultValue={selectedSupplier.contactPhone}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            size="sm"
                                            label="Términos de Pago"
                                            placeholder="30 días"
                                            defaultValue={selectedSupplier.paymentTerms}
                                        />
                                        <Select label="Estado" size="sm" defaultSelectedKeys={selectedSupplier.status}
                                                placeholder="Seleccione un estado">
                                            {estadosSupplier.map((estado) => (
                                                <SelectItem key={estado.key}>{estado.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={onClose}>
                                Guardar Cambios
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export { ModalEdit }*/
import { FC, useEffect } from 'react'
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
} from "@heroui/react";
import {Supplier, useConfigData} from "@/store";

// Schema de validación con Zod
const supplierSchema = z.object({
    cardName: z.string().min(1, 'El nombre de la empresa es requerido'),
    businessType: z.string().min(1, 'El tipo de negocio es requerido'),
    email: z.string().email('Email inválido').min(1, 'El email es requerido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    cardCode: z.string().min(1, 'El RUC/Tax ID es requerido'),
    address: z.string().min(1, 'La dirección es requerida'),
    city: z.string().min(1, 'La ciudad es requerida'),
    country: z.string().min(1, 'El país es requerido'),
    contactPerson: z.string().min(1, 'El nombre del contacto es requerido'),
    contactEmail: z.string().email('Email de contacto inválido').min(1, 'El email de contacto es requerido'),
    contactPhone: z.string().min(1, 'El teléfono de contacto es requerido'),
    paymentTerms: z.string().min(1, 'Los términos de pago son requeridos'),
    status: z.string().min(1, 'El estado es requerido')
})

type SupplierFormData = z.infer<typeof supplierSchema>

interface ModalEditProps {
    isEditOpen: boolean;
    onEditClose: () => void;
    selectedSupplier: Supplier | null;
    updateSupplier: (id: string, supplier: SupplierFormData) => void
}

const ModalEdit: FC<ModalEditProps> = ({
   isEditOpen,
   onEditClose,
   selectedSupplier,
   updateSupplier
}) => {
    const { estadosSupplier } = useConfigData()

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<SupplierFormData>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            cardName: '',
            businessType: '',
            email: '',
            phone: '',
            website: '',
            cardCode: '',
            address: '',
            city: '',
            country: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            paymentTerms: '',
            status: 'P'
        }
    })

    // Resetear el formulario cuando cambie el supplier seleccionado
    useEffect(() => {
        if (selectedSupplier) {
            reset({
                cardName: selectedSupplier.cardName || '',
                businessType: selectedSupplier.businessType || '',
                email: selectedSupplier.email || '',
                phone: selectedSupplier.phone || '',
                website: selectedSupplier.website || '',
                cardCode: selectedSupplier.cardCode || '',
                address: selectedSupplier.address || '',
                city: selectedSupplier.city || '',
                country: selectedSupplier.country || '',
                contactPerson: selectedSupplier.contactPerson || '',
                contactEmail: selectedSupplier.contactEmail || '',
                contactPhone: selectedSupplier.contactPhone || '',
                paymentTerms: selectedSupplier.paymentTerms || '',
                status: selectedSupplier.status || 'P'
            })
        }
    }, [selectedSupplier, reset])

    const onSubmit = async (data: SupplierFormData) => {
        if (!selectedSupplier?.docEntry) return

        try {
            updateSupplier(selectedSupplier.docEntry, data)
            onEditClose()
        } catch (error) {
            console.error('Error al actualizar el proveedor:', error)
        }
    }

    const handleClose = () => {
        reset() // Limpiar el formulario al cerrar
        onEditClose()
    }

    return (
        <Modal isOpen={isEditOpen} onClose={handleClose} size="3xl">
            <ModalContent>
                {() => (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader>
                            <h3 className="text-xl font-bold">Editar Proveedor</h3>
                        </ModalHeader>
                        <ModalBody>
                            {selectedSupplier && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="cardName"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Nombre de la Empresa"
                                                    placeholder="Ingrese el nombre"
                                                    isInvalid={!!errors.cardName}
                                                    errorMessage={errors.cardName?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="businessType"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Tipo de Negocio"
                                                    placeholder="Tipo de negocio"
                                                    isInvalid={!!errors.businessType}
                                                    errorMessage={errors.businessType?.message}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Email"
                                                    type="email"
                                                    placeholder="email@empresa.com"
                                                    isInvalid={!!errors.email}
                                                    errorMessage={errors.email?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="phone"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Teléfono"
                                                    placeholder="+51 999 999 999"
                                                    isInvalid={!!errors.phone}
                                                    errorMessage={errors.phone?.message}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="website"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Sitio Web"
                                                    placeholder="https://www.empresa.com"
                                                    isInvalid={!!errors.website}
                                                    errorMessage={errors.website?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="cardCode"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="RUC/Tax ID"
                                                    placeholder="20123456789"
                                                    isInvalid={!!errors.cardCode}
                                                    errorMessage={errors.cardCode?.message}
                                                />
                                            )}
                                        />
                                    </div>

                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                label="Dirección"
                                                placeholder="Dirección completa"
                                                isInvalid={!!errors.address}
                                                errorMessage={errors.address?.message}
                                            />
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="city"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Ciudad"
                                                    placeholder="Ciudad"
                                                    isInvalid={!!errors.city}
                                                    errorMessage={errors.city?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="country"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="País"
                                                    placeholder="País"
                                                    isInvalid={!!errors.country}
                                                    errorMessage={errors.country?.message}
                                                />
                                            )}
                                        />
                                    </div>

                                    <Divider/>

                                    <div>
                                        <h4 className="font-semibold mb-4">Persona de Contacto</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Controller
                                                name="contactPerson"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Nombre Completo"
                                                        placeholder="Nombre del contacto"
                                                        isInvalid={!!errors.contactPerson}
                                                        errorMessage={errors.contactPerson?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name="contactEmail"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Email de Contacto"
                                                        type="email"
                                                        placeholder="contacto@empresa.com"
                                                        isInvalid={!!errors.contactEmail}
                                                        errorMessage={errors.contactEmail?.message}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <Controller
                                                name="contactPhone"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        label="Teléfono de Contacto"
                                                        placeholder="+51 999 999 999"
                                                        isInvalid={!!errors.contactPhone}
                                                        errorMessage={errors.contactPhone?.message}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="paymentTerms"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    size="sm"
                                                    label="Términos de Pago"
                                                    placeholder="30 días"
                                                    isInvalid={!!errors.paymentTerms}
                                                    errorMessage={errors.paymentTerms?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    label="Estado"
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
                                                    {estadosSupplier.map((estado) => (
                                                        <SelectItem key={estado.key}>{estado.label}</SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
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
                            >
                                Guardar Cambios
                            </Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    )
}

export { ModalEdit }