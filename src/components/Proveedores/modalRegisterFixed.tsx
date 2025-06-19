import React, { useState } from 'react';
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
    Card,
    CardBody,
    Divider
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { useSuppliers } from '@/store/extendedStore';
import type { Supplier } from '@/store/extendedStore';

interface ModalRegisterProps {
    isOpen: boolean;
    onOpenChange: () => void;
}

type SupplierFormData = Omit<Supplier, 'id' | 'fechaRegistro' | 'lastOrderDate' | 'avatar'>;

const ModalRegisterFixed: React.FC<ModalRegisterProps> = ({ isOpen, onOpenChange }) => {
    const { addSupplier } = useSuppliers();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<SupplierFormData>({
        defaultValues: {
            docEntry: '',
            cardCode: '',
            cardName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: 'Perú',
            website: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            businessType: 'TECNOLOGIA',
            status: 'P',
            rating: 0,
            totalOrders: 0,
            totalAmount: 0,
            paymentTerms: '',
            certifications: []
        }
    });

    const onSubmit = async (data: SupplierFormData) => {
        setIsLoading(true);
        try {
            const newSupplier: Omit<Supplier, 'id' | 'fechaRegistro'> = {
                ...data,
                lastOrderDate: '',
                avatar: `https://i.pravatar.cc/150?u=${data.cardCode}`
            };
            
            await addSupplier(newSupplier);
            reset();
            onOpenChange();
        } catch (error) {
            console.error('Error adding supplier:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const businessTypes = [
        { key: 'TECNOLOGIA', label: 'Tecnología' },
        { key: 'CONSTRUCCION', label: 'Construcción' },
        { key: 'SALUD', label: 'Salud' },
        { key: 'EDUCACION', label: 'Educación' },
        { key: 'MANUFACTURA', label: 'Manufactura' },
        { key: 'SERVICIOS', label: 'Servicios' },
        { key: 'COMERCIO', label: 'Comercio' }
    ];

    const supplierStatuses = [
        { key: 'A', label: 'Activo' },
        { key: 'P', label: 'Pendiente' },
        { key: 'I', label: 'Inactivo' },
        { key: 'S', label: 'Suspendido' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
            isDismissable={false}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3>Registrar Nuevo Proveedor</h3>
                            <p className="text-sm text-gray-500">Complete la información del proveedor</p>
                        </ModalHeader>
                        <ModalBody>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <Card>
                                    <CardBody className="space-y-4">
                                        <h4 className="text-lg font-medium">Información Básica</h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Código de Proveedor"
                                                placeholder="Ingrese código único"
                                                {...register("cardCode", { required: "El código es requerido" })}
                                                isInvalid={!!errors.cardCode}
                                                errorMessage={errors.cardCode?.message}
                                            />
                                            
                                            <Input
                                                label="RUC/Documento"
                                                placeholder="Ingrese RUC o documento"
                                                {...register("docEntry", { required: "El documento es requerido" })}
                                                isInvalid={!!errors.docEntry}
                                                errorMessage={errors.docEntry?.message}
                                            />
                                        </div>

                                        <Input
                                            label="Razón Social"
                                            placeholder="Ingrese razón social"
                                            {...register("cardName", { required: "La razón social es requerida" })}
                                            isInvalid={!!errors.cardName}
                                            errorMessage={errors.cardName?.message}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Email"
                                                type="email"
                                                placeholder="correo@empresa.com"
                                                {...register("email", { 
                                                    required: "El email es requerido",
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: "Email inválido"
                                                    }
                                                })}
                                                isInvalid={!!errors.email}
                                                errorMessage={errors.email?.message}
                                            />
                                            
                                            <Input
                                                label="Teléfono"
                                                placeholder="+51 999 999 999"
                                                {...register("phone", { required: "El teléfono es requerido" })}
                                                isInvalid={!!errors.phone}
                                                errorMessage={errors.phone?.message}
                                            />
                                        </div>

                                        <Input
                                            label="Sitio Web"
                                            placeholder="https://www.empresa.com"
                                            {...register("website")}
                                        />
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardBody className="space-y-4">
                                        <h4 className="text-lg font-medium">Dirección</h4>
                                        
                                        <Input
                                            label="Dirección"
                                            placeholder="Ingrese dirección completa"
                                            {...register("address", { required: "La dirección es requerida" })}
                                            isInvalid={!!errors.address}
                                            errorMessage={errors.address?.message}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Ciudad"
                                                placeholder="Ingrese ciudad"
                                                {...register("city", { required: "La ciudad es requerida" })}
                                                isInvalid={!!errors.city}
                                                errorMessage={errors.city?.message}
                                            />
                                            
                                            <Input
                                                label="País"
                                                placeholder="País"
                                                {...register("country")}
                                                defaultValue="Perú"
                                            />
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardBody className="space-y-4">
                                        <h4 className="text-lg font-medium">Contacto</h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Persona de Contacto"
                                                placeholder="Nombre del contacto principal"
                                                {...register("contactPerson", { required: "El contacto es requerido" })}
                                                isInvalid={!!errors.contactPerson}
                                                errorMessage={errors.contactPerson?.message}
                                            />
                                            
                                            <Input
                                                label="Email de Contacto"
                                                type="email"
                                                placeholder="contacto@empresa.com"
                                                {...register("contactEmail", { required: "El email de contacto es requerido" })}
                                                isInvalid={!!errors.contactEmail}
                                                errorMessage={errors.contactEmail?.message}
                                            />
                                        </div>

                                        <Input
                                            label="Teléfono de Contacto"
                                            placeholder="+51 999 999 999"
                                            {...register("contactPhone", { required: "El teléfono de contacto es requerido" })}
                                            isInvalid={!!errors.contactPhone}
                                            errorMessage={errors.contactPhone?.message}
                                        />
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardBody className="space-y-4">
                                        <h4 className="text-lg font-medium">Configuración</h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <Select
                                                label="Tipo de Negocio"
                                                placeholder="Seleccione tipo"
                                                {...register("businessType")}
                                            >
                                                {businessTypes.map(type => (
                                                    <SelectItem key={type.key} value={type.key}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                            
                                            <Select
                                                label="Estado"
                                                placeholder="Seleccione estado"
                                                {...register("status")}
                                            >
                                                {supplierStatuses.map(status => (
                                                    <SelectItem key={status.key} value={status.key}>
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <Input
                                            label="Términos de Pago"
                                            placeholder="Ej: 30 días"
                                            {...register("paymentTerms")}
                                        />
                                    </CardBody>
                                </Card>
                            </form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button 
                                color="primary" 
                                onPress={handleSubmit(onSubmit)}
                                isLoading={isLoading}
                            >
                                Registrar Proveedor
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ModalRegisterFixed;
