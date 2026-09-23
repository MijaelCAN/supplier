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
import {useConfigData} from "@/store";
import {Supplier} from "@/store/extendedStore";
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
import { FC, useEffect, useState, useCallback } from 'react'
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
    Divider,
    addToast
} from "@heroui/react";
import {Supplier} from "@/store/types";
import {useExtendedStore} from "@/store/extendedStore.ts";
import { fetchSupplierByCardCode, updateSupplierProfile, type SupplierApiRecord } from '@/services/providers/providersApi';

// Schema de validación con Zod
const supplierSchema = z.object({
    cardName: z.string().min(1, 'El nombre de la empresa es requerido'),
    businessType: z.string().min(1, 'El tipo de negocio es requerido'),
    email: z.string().email('Email inválido').min(1, 'El email es requerido'),
    phone: z.string().min(1, 'El teléfono es requerido'),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    cardCode: z.string().min(1, 'El RUC/Tax ID es requerido'),
    address: z.string().min(1, 'La dirección es requerida'),
    department: z.string().min(1, 'El departamento es requerido'),
    province: z.string().min(1, 'La provincia es requerida'),
    district: z.string().min(1, 'El distrito es requerido'),
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
    updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
    onUpdated?: () => Promise<void> | void;
}

const ModalEdit: FC<ModalEditProps> = ({
   isEditOpen,
   onEditClose,
   selectedSupplier,
   updateSupplier,
   onUpdated
}) => {
    const estadosSupplier = useExtendedStore( state => state.estadosSupplier)
    const setSelectedSupplier = useExtendedStore(state => state.setSelectedSupplier);
    const [apiRecord, setApiRecord] = useState<SupplierApiRecord | null>(null);
    const [ ,setIsLoadingRecord] = useState(false);
    const [ ,setApiError] = useState<string | null>(null);

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
            department: '',
            province: '',
            district: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            paymentTerms: '',
            status: 'P'
        }
    })

    const loadSupplierRecord = useCallback(async (cardCode: string) => {
        setIsLoadingRecord(true);
        setApiError(null);
        try {
            const response = await fetchSupplierByCardCode(cardCode);
            if (response?.record) {
                setApiRecord(response.record);
                const contactoPrincipal = response.record.contactos?.[0];
                reset({
                    cardName: response.record.nombre_sn ?? selectedSupplier?.cardName ?? '',
                    businessType: selectedSupplier?.businessType ?? '',
                    email: response.record.correo ?? selectedSupplier?.email ?? '',
                    phone: response.record.telefono1 ?? selectedSupplier?.phone ?? '',
                    website: response.record.website ?? selectedSupplier?.website ?? '',
                    cardCode: response.record.ruc ?? cardCode,
                    address: response.record.direccion ?? selectedSupplier?.address ?? '',
                    department: response.record.departamento ?? '',
                    province: response.record.provincia ?? '',
                    district: response.record.distrito ?? '',
                    contactPerson: contactoPrincipal?.name ?? selectedSupplier?.contactPerson ?? '',
                    contactEmail: contactoPrincipal?.e_mail_l ?? selectedSupplier?.contactEmail ?? '',
                    contactPhone: contactoPrincipal?.telefono ?? selectedSupplier?.contactPhone ?? '',
                    paymentTerms: response.record.condicion_pago ?? selectedSupplier?.paymentTerms ?? '',
                    status: selectedSupplier?.status ?? 'Pendiente'
                });
            } else {
                setApiError('No se pudo obtener la información actual del proveedor.');
            }
        } catch (error) {
            console.error('Error al consultar el proveedor en SAP.', error);
            setApiError('No se pudo obtener la información actual del proveedor.');
        } finally {
            setIsLoadingRecord(false);
        }
    }, [reset, selectedSupplier]);

    useEffect(() => {
        if (isEditOpen && selectedSupplier?.cardCode) {
            loadSupplierRecord(selectedSupplier.cardCode);
        } else {
            setApiRecord(null);
            reset({
                cardName: '',
                businessType: '',
                email: '',
                phone: '',
                website: '',
                cardCode: '',
                address: '',
                department: '',
                province: '',
                district: '',
                contactPerson: '',
                contactEmail: '',
                contactPhone: '',
                paymentTerms: '',
                status: 'P'
            });
        }
    }, [isEditOpen, selectedSupplier, reset, loadSupplierRecord]);

    const onSubmit = async (data: SupplierFormData) => {
        if (!selectedSupplier?.docEntry || !selectedSupplier.cardCode || !apiRecord) {
            return;
        }

        try {
            const contactos = [...(apiRecord.contactos ?? [])];
            if (contactos.length === 0) {
                contactos.push({
                    doc_entry: '',
                    active: 'Y',
                    name: data.contactPerson,
                    nombre: '',
                    segundo_nombre: '',
                    apellido: '',
                    profesion: '',
                    telefono: data.contactPhone,
                    e_mail_l: data.contactEmail,
                });
            } else {
                contactos[0] = {
                    ...contactos[0],
                    active: 'Y',
                    name: data.contactPerson,
                    telefono: data.contactPhone,
                    e_mail_l: data.contactEmail,
                };
            }

            const updatedRecord: SupplierApiRecord = {
                ...apiRecord,
                nombre_sn: data.cardName,
                ruc: data.cardCode,
                correo: data.email,
                telefono1: data.phone,
                website: data.website || null,
                direccion: data.address,
                direccion_sunat: apiRecord.direccion_sunat ?? data.address,
                departamento: data.department,
                provincia: data.province,
                distrito: data.district,
                // tipo_persona y tipo_documento ahora vienen del API como texto legible
                // (antes venían como código). El backend sigue esperando el código en el PATCH.
                tipo_persona: apiRecord.cod_tipo_persona || apiRecord.tipo_persona,
                tipo_documento: apiRecord.cod_tipo_documeto || apiRecord.tipo_documento,
                condicion_pago: data.paymentTerms,
                status: data.status,
                contactos: contactos,
            };

            const response = await updateSupplierProfile(updatedRecord.codigo_sn, updatedRecord);
            const refreshedSupplier = response.supplier;

            updateSupplier(refreshedSupplier.docEntry, refreshedSupplier);
            setSelectedSupplier(refreshedSupplier);

            if (onUpdated) {
                await onUpdated();
            }

            addToast({
                title: 'Proveedor actualizado',
                description: 'Los cambios se guardaron correctamente.',
                color: 'success',
                timeout: 3000,
            });

            onEditClose();
        } catch (error) {
            console.error('Error al actualizar el proveedor:', error)
            const message = error instanceof Error ? error.message : 'No se pudo actualizar el proveedor.';
            addToast({
                title: 'Error al actualizar',
                description: message,
                color: 'danger',
                timeout: 4000,
            });
        }
    }

    const handleClose = () => {
        reset();
        onEditClose();
        setApiRecord(null);
        setApiError(null);
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
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="cardName"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Nombre de la Empresa"
                                                    size="sm"
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
                                                    size="sm"
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
                                                    size="sm"
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
                                                    size="sm"
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
                                                    size="sm"
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
                                                    size="sm"
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
                                                size="sm"
                                                placeholder="Dirección completa"
                                                isInvalid={!!errors.address}
                                                errorMessage={errors.address?.message}
                                            />
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Controller
                                            name="department"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Departamento"
                                                    size="sm"
                                                    placeholder="Departamento"
                                                    isInvalid={!!errors.department}
                                                    errorMessage={errors.department?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="province"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Provincia"
                                                    size="sm"
                                                    placeholder="Provincia"
                                                    isInvalid={!!errors.province}
                                                    errorMessage={errors.province?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="district"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Distrito"
                                                    size="sm"
                                                    placeholder="Distrito"
                                                    isInvalid={!!errors.district}
                                                    errorMessage={errors.district?.message}
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
                                                        size="sm"
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
                                                        size="sm"
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
                                                        size="sm"
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