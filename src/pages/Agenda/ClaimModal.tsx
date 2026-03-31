import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
} from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DeliveryAppointment, SupplierClaim } from '@/store/types';
import { useAuth } from '@/store/authStore';
import { fetchPackingListFromApi, PackingListApiRecord } from '@/services/agenda/packingListApi';

interface ClaimModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: DeliveryAppointment | null;
    onGenerateClaim: (claimData: Partial<SupplierClaim>) => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({
    isOpen,
    onOpenChange,
    appointment,
    onGenerateClaim,
}) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Partial<SupplierClaim>>({
        motivoReclamo: '',
        impacto: '',
        nLote: '',
        cantidad: '',
        ordenCompra: '',
        factura: '',
        insumoMaterial: '',
        fechaArribo: '',
        datosRegistroInspeccion: '',
        responsable: currentUser?.fullName || '',
        areaEmite: currentUser?.role || '',
    });
    const [packingLists, setPackingLists] = useState<PackingListApiRecord[]>([]);
    const [selectedPackingListId, setSelectedPackingListId] = useState<string>('');
    const [isLoadingPackingLists, setIsLoadingPackingLists] = useState(false);

    // Cargar packing lists cuando se abre el modal
    useEffect(() => {
        const loadPackingLists = async () => {
            if (isOpen && appointment?.docEntry) {
                setIsLoadingPackingLists(true);
                try {
                    const fechaInicio = appointment.deliveryDate ? appointment.deliveryDate.replace(/-/g, '') : '';
                    const fechaFin = appointment.deliveryDate ? appointment.deliveryDate.replace(/-/g, '') : '';
                    const lists = await fetchPackingListFromApi(fechaInicio, fechaFin, appointment.docEntry);
                    setPackingLists(lists);
                } catch (error) {
                    console.error('Error al cargar PackingLists:', error);
                } finally {
                    setIsLoadingPackingLists(false);
                }
            }
        };
        loadPackingLists();
    }, [isOpen, appointment]);

    useEffect(() => {
        if (isOpen && appointment) {
            // Generar número de reclamo único
            const numeroReclamo = `REC-${appointment.docEntry || appointment.id}-${Date.now()}`;
            
            // Intentar obtener orden de compra y factura del packing list si existe
            const packingList = appointment.packingList;
            const ordenCompra = packingList?.id || '';
            const factura = ''; // No hay factura en el packing list por defecto
            
            setFormData({
                motivoReclamo: '',
                impacto: '',
                nLote: '',
                cantidad: packingList?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0).toString() || '',
                ordenCompra: ordenCompra,
                factura: factura,
                insumoMaterial: packingList?.items?.map(item => item.productName).join(', ') || '',
                fechaArribo: appointment.deliveryDate || '',
                datosRegistroInspeccion: '',
                responsable: currentUser?.fullName || '',
                areaEmite: currentUser?.role || '',
                numeroReclamo,
                fechaReclamo: new Date().toISOString().split('T')[0],
                proveedor: appointment.supplierName,
                codCita: appointment.docEntry || appointment.id,
            });
            setSelectedPackingListId('');
        }
    }, [isOpen, appointment, currentUser]);

    const handleSubmit = () => {
        if (!formData.motivoReclamo?.trim()) {
            alert('El motivo del reclamo es obligatorio');
            return;
        }

        onGenerateClaim(formData);
        onOpenChange(false);
    };

    const handleChange = (field: keyof SupplierClaim, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePackingListChange = (packingListId: string) => {
        setSelectedPackingListId(packingListId);
        
        const selectedPackingList = packingLists.find(pl => pl.number === packingListId || pl.id?.toString() === packingListId);

        if (selectedPackingList) {
            const items = selectedPackingList.detalle_packin_list || selectedPackingList.DetallePackinList || [];

            // Calcular cantidad total
            const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

            // Obtener nombres de materiales/insumos
            const materiales = items.map(item => item.item_name || '').filter(Boolean).join(', ');

            // Actualizar campos
            setFormData(prev => ({
                ...prev,
                cantidad: totalQuantity.toString(),
                insumoMaterial: materiales,
                ordenCompra: selectedPackingList.number || prev.ordenCompra || '',
                // El lote puede venir de algún campo del packing list o ser manual
                // nLote se mantiene si ya tiene valor, sino se puede dejar vacío para llenar manualmente
            }));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                <div>
                                    <h3 className="text-xl font-semibold">Generar Reclamo a Proveedor</h3>
                                    <p className="text-sm font-normal text-gray-500">
                                        Complete los datos necesarios para generar el formato de reclamo
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {/* Información de la Cita */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                        Información de la Cita
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Proveedor:</span>
                                            <span className="ml-2 font-medium">{appointment?.supplierName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Fecha de Entrega:</span>
                                            <span className="ml-2 font-medium">{appointment?.deliveryDate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos de Cabecera */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Datos de Cabecera</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select
                                            label="Packing List"
                                            selectedKeys={selectedPackingListId ? [selectedPackingListId] : []}
                                            onSelectionChange={(keys) => {
                                                const selectedKey = Array.from(keys)[0] as string;
                                                handlePackingListChange(selectedKey || '');
                                            }}
                                            placeholder="Seleccione un Packing List"
                                            isLoading={isLoadingPackingLists}
                                            size="sm"
                                            className="col-span-2"
                                        >
                                            {packingLists.map((pl) => (
                                                <SelectItem key={pl.number || pl.id?.toString() || ''}>
                                                    {pl.number} - {pl.date_expected ? new Date(pl.date_expected).toLocaleDateString() : ''}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Input
                                            label="N° Lote"
                                            value={formData.nLote || ''}
                                            onValueChange={(value) => handleChange('nLote', value)}
                                            placeholder="Ingrese el número de lote"
                                            size="sm"
                                        />
                                        <Input
                                            label="Cantidad"
                                            value={formData.cantidad || ''}
                                            onValueChange={(value) => handleChange('cantidad', value)}
                                            placeholder="Cantidad"
                                            size="sm"
                                        />
                                        <Input
                                            label="Orden de Compra"
                                            value={formData.ordenCompra || ''}
                                            onValueChange={(value) => handleChange('ordenCompra', value)}
                                            placeholder="Número de orden de compra"
                                            size="sm"
                                        />
                                        <Input
                                            label="Factura"
                                            value={formData.factura || ''}
                                            onValueChange={(value) => handleChange('factura', value)}
                                            placeholder="Número de factura"
                                            size="sm"
                                        />
                                        <Input
                                            label="Insumo/Material"
                                            value={formData.insumoMaterial || ''}
                                            onValueChange={(value) => handleChange('insumoMaterial', value)}
                                            placeholder="Descripción del insumo o material"
                                            className="col-span-2"
                                            size="sm"
                                        />
                                        <Input
                                            label="Fecha de Arribo del Insumo"
                                            type="date"
                                            value={formData.fechaArribo || ''}
                                            onValueChange={(value) => handleChange('fechaArribo', value)}
                                            className="col-span-2"
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                {/* Sección 1: Datos del Registro de Inspección */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">
                                        1. Datos del Registro de Inspección o Análisis
                                    </h4>
                                    <Textarea
                                        label="Datos del Registro"
                                        value={formData.datosRegistroInspeccion || ''}
                                        onValueChange={(value) => handleChange('datosRegistroInspeccion', value)}
                                        placeholder="Ingrese los datos del registro de inspección o análisis..."
                                        minRows={3}
                                        size="sm"
                                    />
                                </div>

                                {/* Sección 2: Motivo del Reclamo e Impacto */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">
                                        2. Motivo del Reclamo e Impacto
                                    </h4>
                                    <Textarea
                                        label="Motivo del Reclamo *"
                                        value={formData.motivoReclamo || ''}
                                        onValueChange={(value) => handleChange('motivoReclamo', value)}
                                        placeholder="Ingrese el motivo del reclamo..."
                                        minRows={4}
                                        isRequired
                                        size="sm"
                                    />
                                    <Textarea
                                        label="Impacto"
                                        value={formData.impacto || ''}
                                        onValueChange={(value) => handleChange('impacto', value)}
                                        placeholder="Describa el impacto del reclamo..."
                                        minRows={3}
                                        size="sm"
                                    />
                                </div>

                                {/* Información del Reclamo */}
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Área que Emite:</span>
                                            <span className="ml-2 font-medium">{formData.areaEmite}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Responsable:</span>
                                            <span className="ml-2 font-medium">{formData.responsable}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Número de Reclamo:</span>
                                            <span className="ml-2 font-medium">{formData.numeroReclamo}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Fecha de Reclamo:</span>
                                            <span className="ml-2 font-medium">{formData.fechaReclamo}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleSubmit}
                                isDisabled={!formData.motivoReclamo?.trim()}
                            >
                                Generar PDF de Reclamo
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ClaimModal;
