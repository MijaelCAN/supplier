// src/components/ScheduleAppointmentModal.tsx
import React, { useState, useEffect } from 'react';
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
    Textarea,
    Card,
    CardBody,
    Chip,
    Divider,
    Progress
} from "@heroui/react";
import {
    MagnifyingGlassIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";

interface ScheduleAppointmentModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    onSchedule: (formData: any) => Promise<void>;
    onLookupRUC: (ruc: string) => Promise<{
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
    supplierData?: {
        supplierId: string;
        supplierName: string;
        supplierEmail: string;
        supplierPhone: string;
        supplierRUC: string;
        address?: string;
        contactPerson?: string;
    } | null;
    timeSlots: string[];
    isCreating: boolean;
    isLookingUp: boolean;
    prefilledDate?: string;
    prefilledTime?: string;
    /** Función para verificar si un horario está disponible (sin conflictos) */
    isTimeSlotAvailable?: (date: Date, startTime: string, endTime: string, excludeAppointmentId?: string, excludeSupplierRUC?: string) => boolean;
    /** Función para obtener las citas conflictivas */
    getConflictingAppointments?: (date: Date, startTime: string, endTime: string, excludeAppointmentId?: string, excludeSupplierRUC?: string) => Array<{
        supplierName: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
    }>;
    /** Modo edición: si está presente, el modal está en modo edición */
    editingAppointment?: {
        docEntry: string;
        supplierRUC: string;
        supplierName: string;
        deliveryDate: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
        warehouse?: string;
        notes?: string;
    } | null;
}

const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
    isOpen,
    supplierData: supplierDataProp,
    onOpenChange,
    onSchedule,
    onLookupRUC,
    timeSlots,
    isCreating,
    isLookingUp,
    prefilledDate,
    prefilledTime,
    isTimeSlotAvailable,
    getConflictingAppointments,
    editingAppointment
}) => {
    // Form state
    const [step, setStep] = useState<1 | 2>(1);
    const [rucSearch, setRucSearch] = useState('');
    const [formData, setFormData] = useState({
        deliveryDate: prefilledDate || '',
        deliveryTime: prefilledTime || '',
        deliveryTimeEnd: '',
        warehouse: '',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Usar el supplierData del prop, no estado local
    const supplierData = supplierDataProp;

    // Reset form when modal opens or closes
    useEffect(() => {
        if (isOpen) {
            if (editingAppointment) {
                // Modo edición: prellenar con los datos de la cita
                setStep(2); // Ir directamente al paso 2
                setFormData({
                    deliveryDate: editingAppointment.deliveryDate || '',
                    deliveryTime: editingAppointment.deliveryTime || '',
                    deliveryTimeEnd: editingAppointment.deliveryTimeEnd || '',
                    warehouse: editingAppointment.warehouse || '',
                    notes: editingAppointment.notes || ''
                });
            } else {
                // Modo creación: resetear todo al paso 1
                setStep(1);
                setRucSearch('');
                
                // Calcular hora de fin automáticamente si hay hora de inicio prefilled
                let deliveryTimeEnd = '';
                if (prefilledTime) {
                    const [hours, minutes] = prefilledTime.split(':').map(Number);
                    const endHours = hours + 1;
                    deliveryTimeEnd = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                }
                
                setFormData({
                    deliveryDate: prefilledDate || '',
                    deliveryTime: prefilledTime || '',
                    deliveryTimeEnd: deliveryTimeEnd,
                    warehouse: '',
                    notes: ''
                });
            }
            setErrors({});
        } else {
            // Cuando se cierra el modal, también resetear todo
            setStep(1);
            setRucSearch('');
            setFormData({
                deliveryDate: '',
                deliveryTime: '',
                deliveryTimeEnd: '',
                warehouse: '',
                notes: ''
            });
            setErrors({});
        }
    }, [isOpen, prefilledDate, prefilledTime, editingAppointment]);
    
    // Avanzar al paso 2 cuando se encuentra el proveedor (solo si el modal está abierto y no está en modo edición)
    useEffect(() => {
        if (isOpen && supplierData && step === 1 && !editingAppointment) {
            setStep(2);
        }
    }, [supplierData, step, isOpen, editingAppointment]);

    // Auto-set end time when start time changes
    useEffect(() => {
        if (formData.deliveryTime && !formData.deliveryTimeEnd) {
            const [hours, minutes] = formData.deliveryTime.split(':').map(Number);
            const endHours = hours + 1;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            setFormData(prev => ({ ...prev, deliveryTimeEnd: endTime }));
        }
    }, [formData.deliveryTime]);

    // State to store conflicting appointments
    const [conflictingAppointments, setConflictingAppointments] = useState<Array<{
        supplierName: string;
        deliveryTime: string;
        deliveryTimeEnd: string;
    }>>([]);

    // Validate time slot availability when date/time changes
    useEffect(() => {
        if (formData.deliveryDate && formData.deliveryTime && formData.deliveryTimeEnd && isTimeSlotAvailable) {
            const appointmentDate = new Date(formData.deliveryDate);
            // En modo edición, excluir citas del mismo RUC
            const excludeSupplierRUC = editingAppointment ? (supplierData?.supplierRUC || editingAppointment.supplierRUC) : undefined;
            const isAvailable = isTimeSlotAvailable(
                appointmentDate,
                formData.deliveryTime,
                formData.deliveryTimeEnd,
                undefined, // excludeAppointmentId se maneja en el padre
                excludeSupplierRUC
            );
            
            // Get conflicting appointments if function is provided
            if (getConflictingAppointments) {
                const conflicts = getConflictingAppointments(
                    appointmentDate,
                    formData.deliveryTime,
                    formData.deliveryTimeEnd,
                    undefined, // excludeAppointmentId se maneja en el padre
                    excludeSupplierRUC
                );
                setConflictingAppointments(conflicts);
            }
            
            if (!isAvailable) {
                setErrors(prev => ({
                    ...prev,
                    deliveryTime: 'Este horario está ocupado. Por favor, seleccione otro horario.',
                    deliveryTimeEnd: 'Este horario está ocupado. Por favor, seleccione otro horario.'
                }));
            } else {
                // Clear errors if slot is available
                setErrors(prev => {
                    const newErrors = { ...prev };
                    if (newErrors.deliveryTime === 'Este horario está ocupado. Por favor, seleccione otro horario.') {
                        delete newErrors.deliveryTime;
                    }
                    if (newErrors.deliveryTimeEnd === 'Este horario está ocupado. Por favor, seleccione otro horario.') {
                        delete newErrors.deliveryTimeEnd;
                    }
                    return newErrors;
                });
                setConflictingAppointments([]);
            }
        } else {
            setConflictingAppointments([]);
        }
    }, [formData.deliveryDate, formData.deliveryTime, formData.deliveryTimeEnd, isTimeSlotAvailable, getConflictingAppointments, editingAppointment, supplierData]);

    // Handle RUC lookup
    const handleRUCLookup = async () => {
        if (!rucSearch.trim()) {
            setErrors(prev => ({ ...prev, ruc: 'Ingrese un RUC válido' }));
            return;
        }

        setErrors(prev => ({ ...prev, ruc: '' }));
        
        try {
            // Llamar a onLookupRUC que retorna la respuesta
            const result = await onLookupRUC(rucSearch.trim());
            
            if (result.success && result.data) {
                // El supplierData se actualizará en el padre y llegará como prop
                // El useEffect detectará el cambio y avanzará al paso 2
                // No necesitamos hacer nada más aquí
            } else {
                setErrors(prev => ({ ...prev, ruc: result.message || 'Proveedor no encontrado' }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al consultar proveedor';
            setErrors(prev => ({ ...prev, ruc: errorMessage }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.deliveryDate) newErrors.deliveryDate = 'Fecha requerida';
        if (!formData.deliveryTime) newErrors.deliveryTime = 'Hora de inicio requerida';
        if (!formData.deliveryTimeEnd) newErrors.deliveryTimeEnd = 'Hora de fin requerida';
        
        // Validate time range
        if (formData.deliveryTime && formData.deliveryTimeEnd) {
            const timeToMinutes = (timeStr: string) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
            };
            const startMinutes = timeToMinutes(formData.deliveryTime);
            const endMinutes = timeToMinutes(formData.deliveryTimeEnd);
            
            if (endMinutes <= startMinutes) {
                newErrors.deliveryTimeEnd = 'La hora de fin debe ser posterior a la hora de inicio';
            }
        }

        // Validate time slot availability (check for conflicts with existing appointments)
        if (formData.deliveryDate && formData.deliveryTime && formData.deliveryTimeEnd && isTimeSlotAvailable) {
            const appointmentDate = new Date(formData.deliveryDate);
            // En modo edición, excluir citas del mismo RUC
            const excludeSupplierRUC = editingAppointment ? (supplierData?.supplierRUC || editingAppointment.supplierRUC) : undefined;
            const isAvailable = isTimeSlotAvailable(
                appointmentDate,
                formData.deliveryTime,
                formData.deliveryTimeEnd,
                undefined, // excludeAppointmentId se maneja en el padre
                excludeSupplierRUC
            );
            
            if (!isAvailable) {
                newErrors.deliveryTime = 'El horario seleccionado está ocupado. Por favor, seleccione otro horario.';
                newErrors.deliveryTimeEnd = 'El horario seleccionado está ocupado. Por favor, seleccione otro horario.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validateForm() || !supplierData) return;

        const appointmentData = {
            ...formData,
            supplierRUC: supplierData.supplierRUC,
            supplierId: supplierData.supplierId,
            supplierName: supplierData.supplierName,
            supplierEmail: supplierData.supplierEmail,
            supplierPhone: supplierData.supplierPhone
        };

        await onSchedule(appointmentData);
    };

    // Progress indicator
    const progress = step === 1 ? 50 : 100;

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange} 
            size="3xl" 
            scrollBehavior="inside"
            isDismissable={!isCreating}
            classNames={{
                base: "max-h-[90vh]",
                header: "border-b border-gray-200 pb-4",
                body: "py-6",
                footer: "border-t border-gray-100 pt-4"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {/* Header con Progress */}
                        <ModalHeader className="flex-col gap-4 px-6">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {editingAppointment ? 'Editar Cita' : 'Programar Nueva Entrega'}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {step === 1 ? 'Paso 1: Buscar Proveedor' : 'Paso 2: Detalles de Entrega'}
                                        </p>
                                    </div>
                                </div>
                                <Chip color="primary" variant="flat" size="lg">
                                    {step}/2
                                </Chip>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full">
                                <Progress
                                    value={progress}
                                    color="primary"
                                    size="sm"
                                    classNames={{
                                        indicator: "bg-gradient-to-r from-blue-500 to-blue-600"
                                    }}
                                />
                            </div>

                            {/* Steps Indicator */}
                            <div className="flex items-center justify-center gap-4 w-full">
                                {/* Step 1 */}
                                <div className="flex items-center gap-2">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                        ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
                                    `}>
                                        {supplierData ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
                                    </div>
                                    <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                                        Proveedor
                                    </span>
                                </div>

                                <div className={`h-0.5 w-16 ${step === 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />

                                {/* Step 2 */}
                                <div className="flex items-center gap-2">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                        ${step === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
                                    `}>
                                        2
                                    </div>
                                    <span className={`text-sm font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                                        Programación
                                    </span>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody className="px-6">
                            {/* STEP 1: RUC Lookup */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    {/* Info Card */}
                                    <Card className="bg-blue-50 border border-blue-100">
                                        <CardBody className="flex-row gap-3 py-3">
                                            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-blue-900">
                                                Ingrese el RUC del proveedor para buscar su información y programar la entrega.
                                            </p>
                                        </CardBody>
                                    </Card>

                                    {/* RUC Search */}
                                    <div className="space-y-2">
                                        <div className="flex gap-3">
                                            <Input
                                                label="RUC del Proveedor"
                                                placeholder="20123456789"
                                                value={rucSearch}
                                                size='sm'
                                                onValueChange={(value) => {
                                                    setRucSearch(value);
                                                    setErrors(prev => ({ ...prev, ruc: '' }));
                                                }}
                                                isInvalid={!!errors.ruc}
                                                errorMessage={errors.ruc}
                                                startContent={<BuildingOfficeIcon className="w-5 h-5 text-gray-400" />}
                                                
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !isLookingUp) {
                                                        handleRUCLookup();
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <Button
                                                color="primary"
                                                size="lg"
                                                onPress={handleRUCLookup}
                                                isLoading={isLookingUp}
                                                startContent={!isLookingUp && <MagnifyingGlassIcon className="w-5 h-5" />}
                                                className="px-8 font-semibold shadow-lg"
                                                isDisabled={!rucSearch.trim() || isLookingUp}
                                            >
                                                {isLookingUp ? 'Buscando...' : 'Buscar'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Supplier Data Preview */}
                                    {supplierData && (
                                        <Card className="border-2 border-emerald-200 bg-emerald-50/30">
                                            <CardBody className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                                                        Proveedor Encontrado
                                                    </h4>
                                                    <Chip color="success" variant="flat" size="sm">
                                                        Verificado
                                                    </Chip>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Razón Social */}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                            <BuildingOfficeIcon className="w-5 h-5 text-emerald-700" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                Razón Social
                                                            </p>
                                                            <p className="text-sm font-bold text-gray-900 mt-1">
                                                                {supplierData.supplierName}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* RUC */}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <DocumentTextIcon className="w-5 h-5 text-blue-700" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                RUC
                                                            </p>
                                                            <p className="text-sm font-bold text-gray-900 mt-1">
                                                                {supplierData.supplierRUC}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Email */}
                                                    {supplierData.supplierEmail && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                <DocumentTextIcon className="w-5 h-5 text-purple-700" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                    Email
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900 mt-1 break-all">
                                                                    {supplierData.supplierEmail}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Teléfono */}
                                                    {supplierData.supplierPhone && (
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                                <DocumentTextIcon className="w-5 h-5 text-amber-700" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                    Teléfono
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                                                    {supplierData.supplierPhone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dirección */}
                                                    {supplierData.address && (
                                                        <div className="col-span-2 flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                                <MapPinIcon className="w-5 h-5 text-gray-700" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                    Dirección
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                                                    {supplierData.address}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <Divider className="my-4" />

                                                <Button
                                                    color="primary"
                                                    size="lg"
                                                    fullWidth
                                                    onPress={() => setStep(2)}
                                                    className="font-semibold shadow-lg"
                                                    startContent={<CalendarIcon className="w-5 h-5" />}
                                                >
                                                    Continuar a Programación
                                                </Button>
                                            </CardBody>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Schedule Details */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    {/* Supplier Summary */}
                                    <Card className="bg-gray-50 border border-gray-200">
                                        <CardBody className="flex-row items-center gap-3 py-3">
                                            <BuildingOfficeIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {supplierData?.supplierName}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    RUC: {supplierData?.supplierRUC}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                onPress={() => setStep(1)}
                                            >
                                                Cambiar
                                            </Button>
                                        </CardBody>
                                    </Card>

                                    {/* Date and Time */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                                            Fecha y Horario de Entrega
                                        </h4>

                                        <div className="grid grid-cols-3 gap-4">
                                            <Input
                                                label="Fecha de Entrega"
                                                type="date"
                                                value={formData.deliveryDate}
                                                onValueChange={(value) => {
                                                    setFormData(prev => ({ ...prev, deliveryDate: value }));
                                                    setErrors(prev => ({ ...prev, deliveryDate: '' }));
                                                }}
                                                isRequired
                                                isInvalid={!!errors.deliveryDate}
                                                errorMessage={errors.deliveryDate}
                                                classNames={{
                                                    inputWrapper: "h-12"
                                                }}
                                            />
                                            
                                            <Input
                                                label="Hora de Inicio"
                                                type="time"
                                                size='sm'
                                                value={formData.deliveryTime}
                                                onValueChange={(value) => {
                                                    setFormData(prev => ({ ...prev, deliveryTime: value }));
                                                    setErrors(prev => ({ ...prev, deliveryTime: '' }));
                                                }}
                                                isRequired
                                                isInvalid={!!errors.deliveryTime}
                                                errorMessage={errors.deliveryTime}
                                                startContent={<ClockIcon className="w-4 h-4 text-gray-400" />}
                                                classNames={{
                                                    inputWrapper: "h-12"
                                                }}
                                                placeholder="09:47"
                                            />
                                            
                                            <Input
                                                label="Hora de Fin"
                                                type="time"
                                                size='sm'
                                                value={formData.deliveryTimeEnd}
                                                onValueChange={(value) => {
                                                    setFormData(prev => ({ ...prev, deliveryTimeEnd: value }));
                                                    setErrors(prev => ({ ...prev, deliveryTimeEnd: '' }));
                                                }}
                                                isRequired
                                                isInvalid={!!errors.deliveryTimeEnd}
                                                errorMessage={errors.deliveryTimeEnd}
                                                startContent={<ClockIcon className="w-4 h-4 text-gray-400" />}
                                                classNames={{
                                                    inputWrapper: "h-12"
                                                }}
                                                placeholder="10:34"
                                            />
                                        </div>

                                        {/* Time Range Preview */}
                                        {formData.deliveryTime && formData.deliveryTimeEnd && (
                                            <>
                                                {conflictingAppointments.length > 0 ? (
                                                    <Card className="bg-red-50 border border-red-200">
                                                        <CardBody className="py-3 space-y-2">
                                                            <div className="flex items-start gap-3">
                                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-red-900 mb-2">
                                                                        Horario ocupado
                                                                    </p>
                                                                    {conflictingAppointments.map((conflict, index) => (
                                                                        <p key={index} className="text-sm text-red-800">
                                                                            <span className="font-semibold">{conflict.supplierName}</span> - {conflict.deliveryTime} a {conflict.deliveryTimeEnd}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ) : (
                                                    <Card className="bg-blue-50 border border-blue-100">
                                                        <CardBody className="flex-row items-center gap-3 py-2">
                                                            <ClockIcon className="w-4 h-4 text-blue-600" />
                                                            <p className="text-sm text-blue-900">
                                                                Ventana de entrega: <span className="font-bold">
                                                                    {formData.deliveryTime} - {formData.deliveryTimeEnd}
                                                                </span>
                                                            </p>
                                                        </CardBody>
                                                    </Card>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Warehouse */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                                            <MapPinIcon className="w-5 h-5 text-purple-600" />
                                            Ubicación
                                        </h4>

                                        <Select
                                            label="Almacén de Destino"
                                            size='sm'
                                            placeholder="Seleccione el almacén"
                                            selectedKeys={formData.warehouse ? [formData.warehouse] : []}
                                            onSelectionChange={(keys) => setFormData(prev => ({ ...prev, warehouse: Array.from(keys)[0] as string }))}
                                            startContent={<MapPinIcon className="w-4 h-4 text-gray-400" />}
                                        >
                                            <SelectItem key="ALM001">Sede Ancon</SelectItem>
                                            <SelectItem key="ALM002">Sede Villas</SelectItem>
                                        </Select>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                                            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                            Información Adicional (Opcional)
                                        </h4>

                                        <Textarea
                                            label="Notas"
                                            placeholder="Ej: Entrega de productos perecederos, requiere refrigeración..."
                                            value={formData.notes}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                                            minRows={3}
                                            maxRows={5}
                                        />
                                    </div>

                                    {/* Warning if incomplete */}
                                    {(!formData.deliveryDate || !formData.deliveryTime || !formData.deliveryTimeEnd) && (
                                        <Card className="bg-amber-50 border border-amber-200">
                                            <CardBody className="flex-row gap-3 py-3">
                                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                <p className="text-sm text-amber-900">
                                                    Complete todos los campos requeridos para continuar.
                                                </p>
                                            </CardBody>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter className="px-6">
                            <div className="flex items-center justify-between w-full">
                                {/* Back button in step 2 */}
                                {step === 2 && (
                                    <Button 
                                        variant="flat" 
                                        onPress={() => setStep(1)}
                                        isDisabled={isCreating}
                                    >
                                        Atrás
                                    </Button>
                                )}
                                
                                <div className="flex gap-2 ml-auto">
                                    <Button 
                                        variant="light" 
                                        onPress={onClose}
                                        isDisabled={isCreating}
                                    >
                                        Cancelar
                                    </Button>
                                    
                                    {step === 2 && (
                                        <Button
                                            color="primary"
                                            size="lg"
                                            onPress={handleSubmit}
                                            isLoading={isCreating}
                                            isDisabled={
                                                (!supplierData ) || 
                                                !formData.deliveryDate || 
                                                !formData.deliveryTime || 
                                                !formData.deliveryTimeEnd || 
                                                isCreating ||
                                                // Solo deshabilitar si hay errores de validación reales (excluir errores de conflicto si es el mismo proveedor en edición)
                                                (() => {
                                                    // Filtrar errores: si está en modo edición y el error es de "ocupado", no contar ese error
                                                    const relevantErrors = Object.entries(errors).filter(([key, value]) => {
                                                        if (editingAppointment && (key === 'deliveryTime' || key === 'deliveryTimeEnd') && value.includes('ocupado')) {
                                                            return false; // No contar errores de conflicto si es el mismo proveedor
                                                        }
                                                        return true; // Contar todos los demás errores
                                                    });
                                                    return relevantErrors.length > 0;
                                                })()
                                            }
                                            className="px-8 font-semibold shadow-lg"
                                            startContent={!isCreating && <CheckCircleIcon className="w-5 h-5" />}
                                        >
                                            {isCreating ? (editingAppointment ? 'Actualizando...' : 'Programando...') : (editingAppointment ? 'Actualizar Cita' : 'Programar Entrega')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ScheduleAppointmentModal;