import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    Input,
    Textarea,
    Select,
    SelectItem,
} from '@heroui/react';
import { ExclamationTriangleIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ClaimAttachment, ClaimProduct, DeliveryAppointment, SupplierClaim } from '@/store/types';
import { useAuth } from '@/store/authStore';
import { fetchPackingListFromApi, PackingListApiRecord } from '@/services/agenda/packingListApi';
import {
    CLAIMS_API_ENABLED,
    createClaim,
    fetchClaimByCita,
    mergeClaimProducts,
    updateClaim,
} from '@/services/agenda/claimsApi';
import { openClaimPDFInNewTab } from '@/utils/pdfGenerator';
import { parsePackingListQuantityInput } from '@/utils/packingList';

interface ClaimModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: DeliveryAppointment | null;
    /** Sin API de reclamos: genera solo el PDF (comportamiento anterior) */
    onGenerateClaim: (claimData: Partial<SupplierClaim>) => void;
    /** Productos rechazados en la evaluación, para precargar el reclamo */
    rejectedProducts?: ClaimProduct[];
    /** Con API de reclamos: se llama al guardar */
    onClaimSaved?: (claim: SupplierClaim) => void;
}

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];

const productKey = (p: Pick<ClaimProduct, 'document' | 'lineNumber'>) => `${p.document}-${p.lineNumber}`;

const ClaimModal: React.FC<ClaimModalProps> = ({
    isOpen,
    onOpenChange,
    appointment,
    onGenerateClaim,
    rejectedProducts,
    onClaimSaved,
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
    // Con API de reclamos (OBS-008)
    const [existingClaim, setExistingClaim] = useState<SupplierClaim | null>(null);
    const [products, setProducts] = useState<ClaimProduct[]>([]);
    const [productQuantityTexts, setProductQuantityTexts] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<ClaimAttachment[]>([]);
    const [isLoadingClaim, setIsLoadingClaim] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isReadOnly = CLAIMS_API_ENABLED && !!existingClaim && existingClaim.status !== 'Abierto';

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
        if (!isOpen || !appointment) return;

        const defaults: Partial<SupplierClaim> = {
            motivoReclamo: '',
            impacto: '',
            nLote: '',
            cantidad: '',
            ordenCompra: '',
            factura: '',
            insumoMaterial: '',
            fechaArribo: appointment.deliveryDate || '',
            datosRegistroInspeccion: '',
            responsable: currentUser?.fullName || '',
            areaEmite: currentUser?.role || '',
            fechaReclamo: new Date().toISOString().split('T')[0],
            proveedor: appointment.supplierName,
            codCita: appointment.docEntry || appointment.id,
        };
        setSelectedPackingListId('');

        if (!CLAIMS_API_ENABLED) {
            // Generar número de reclamo único
            const numeroReclamo = `REC-${appointment.docEntry || appointment.id}-${Date.now()}`;
            const packingList = appointment.packingList;
            setFormData({
                ...defaults,
                cantidad: packingList?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0).toString() || '',
                ordenCompra: packingList?.id || '',
                insumoMaterial: packingList?.items?.map(item => item.productName).join(', ') || '',
                numeroReclamo,
            });
            return;
        }

        // Un reclamo por cita: si ya existe se edita y se le suman los productos nuevos
        let isCancelled = false;
        const loadClaim = async () => {
            setIsLoadingClaim(true);
            setExistingClaim(null);
            try {
                const claim = appointment.docEntry ? await fetchClaimByCita(appointment.docEntry) : null;
                if (isCancelled) return;
                setExistingClaim(claim);
                setFormData(claim ?? { ...defaults, areaEmite: String(currentUser?.role || '').toUpperCase() });
                setProducts(mergeClaimProducts(claim?.productos ?? [], rejectedProducts ?? []));
                setAttachments(claim?.adjuntos ?? []);
            } catch (error) {
                if (isCancelled) return;
                console.error('Error al consultar el reclamo de la cita:', error);
                alert(`No se pudo consultar si la cita ya tiene reclamo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                onOpenChange(false);
            } finally {
                if (!isCancelled) setIsLoadingClaim(false);
            }
        };
        setProductQuantityTexts({});
        loadClaim();
        return () => {
            isCancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, appointment, currentUser]);

    const handleSubmit = async () => {
        if (!formData.motivoReclamo?.trim()) {
            alert('El motivo del reclamo es obligatorio');
            return;
        }

        if (!CLAIMS_API_ENABLED) {
            onGenerateClaim(formData);
            onOpenChange(false);
            return;
        }

        if (products.length === 0) {
            alert('Agregue al menos un producto al reclamo');
            return;
        }
        const invalidProduct = products.find((p) => p.cantidadRechazada <= 0 || !p.motivo.trim());
        if (invalidProduct) {
            alert(`Complete la cantidad rechazada y el motivo de ${invalidProduct.itemCode}`);
            return;
        }

        setIsSaving(true);
        try {
            const claim: SupplierClaim = {
                ...(formData as SupplierClaim),
                codCita: appointment?.docEntry || appointment?.id || '',
                rucProveedor: appointment?.supplierRUC || appointment?.supplierId || '',
                proveedor: appointment?.supplierName || formData.proveedor || '',
                productos: products.map((p) => ({ ...p, motivo: p.motivo.trim() })),
                adjuntos: attachments,
            };
            const saved = existingClaim?.docEntry
                ? await updateClaim({ ...claim, docEntry: existingClaim.docEntry, status: existingClaim.status })
                : await createClaim(claim);

            onClaimSaved?.(saved);
            onOpenChange(false);
            alert(existingClaim
                ? `Reclamo ${saved.numeroReclamo} actualizado.`
                : `Reclamo ${saved.numeroReclamo} registrado. Se notificó al proveedor por correo.`);
        } catch (error) {
            console.error('Error al guardar el reclamo:', error);
            alert(`Error al guardar el reclamo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof SupplierClaim, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePackingListChange = (packingListId: string) => {
        setSelectedPackingListId(packingListId);
        if (CLAIMS_API_ENABLED) return; // Con API se agregan productos línea por línea

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

    // --- Productos y adjuntos (con API de reclamos) ---
    const selectedPackingList = packingLists.find(pl => pl.number === selectedPackingListId || pl.id?.toString() === selectedPackingListId);
    const availableLines = (selectedPackingList?.detalle_packin_list || selectedPackingList?.DetallePackinList || [])
        .filter((item) => item.document != null && item.line_number != null)
        .filter((item) => !products.some((p) => productKey(p) === `${item.document}-${item.line_number}`));

    const updateProduct = (index: number, changes: Partial<ClaimProduct>) => {
        setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...changes } : p)));
    };

    const handleAddLine = (item: (typeof availableLines)[number]) => {
        setProducts((prev) => [...prev, {
            document: Number(item.document),
            lineNumber: Number(item.line_number),
            itemCode: item.item_code || '',
            itemName: item.item_name || '',
            cantidadRechazada: item.quantity || 0,
            motivo: '',
        }]);
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        const valid = selected.filter((file) => {
            if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
                alert(`El archivo ${file.name} no es válido. Solo se permiten PDF, imágenes (JPG, PNG) y videos (MP4, MOV, AVI)`);
                return false;
            }
            if (file.size > MAX_ATTACHMENT_SIZE) {
                alert(`El archivo ${file.name} excede el tamaño máximo de 50MB`);
                return false;
            }
            return true;
        });
        setAttachments((prev) => [...prev, ...valid.map((file) => ({ nameFile: file.name, file }))]);
        e.target.value = '';
    };

    const handleViewPDF = async () => {
        if (!existingClaim) return;
        try {
            await openClaimPDFInNewTab(existingClaim);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'No se pudo abrir el PDF');
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
                                    <h3 className="text-xl font-semibold">
                                        {existingClaim ? `Reclamo ${existingClaim.numeroReclamo}` : CLAIMS_API_ENABLED ? 'Registrar Reclamo a Proveedor' : 'Generar Reclamo a Proveedor'}
                                    </h3>
                                    <p className="text-sm font-normal text-gray-500">
                                        {isReadOnly
                                            ? 'El reclamo ya no está Abierto: solo se puede consultar'
                                            : CLAIMS_API_ENABLED
                                                ? 'Complete los datos del reclamo. Al guardarlo se notifica al proveedor'
                                                : 'Complete los datos necesarios para generar el formato de reclamo'}
                                    </p>
                                </div>
                                {existingClaim?.status && (
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={existingClaim.status === 'Abierto' ? 'danger' : existingClaim.status === 'En Respuesta' ? 'warning' : 'success'}
                                    >
                                        {existingClaim.status}
                                    </Chip>
                                )}
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {isLoadingClaim ? (
                                <div className="p-3 text-sm text-gray-600">Consultando el reclamo de la cita...</div>
                            ) : (
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
                                        {!CLAIMS_API_ENABLED && (
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
                                        )}
                                        <Input
                                            label="N° Lote"
                                            value={formData.nLote || ''}
                                            onValueChange={(value) => handleChange('nLote', value)}
                                            placeholder="Ingrese el número de lote"
                                            size="sm"
                                            isReadOnly={isReadOnly}
                                        />
                                        {!CLAIMS_API_ENABLED && (
                                            <Input
                                                label="Cantidad"
                                                value={formData.cantidad || ''}
                                                onValueChange={(value) => handleChange('cantidad', value)}
                                                placeholder="Cantidad"
                                                size="sm"
                                            />
                                        )}
                                        <Input
                                            label="Orden de Compra"
                                            value={formData.ordenCompra || ''}
                                            onValueChange={(value) => handleChange('ordenCompra', value)}
                                            placeholder="Número de orden de compra"
                                            size="sm"
                                            isReadOnly={isReadOnly}
                                        />
                                        <Input
                                            label="Factura"
                                            value={formData.factura || ''}
                                            onValueChange={(value) => handleChange('factura', value)}
                                            placeholder="Número de factura"
                                            size="sm"
                                            isReadOnly={isReadOnly}
                                        />
                                        {!CLAIMS_API_ENABLED && (
                                            <Input
                                                label="Insumo/Material"
                                                value={formData.insumoMaterial || ''}
                                                onValueChange={(value) => handleChange('insumoMaterial', value)}
                                                placeholder="Descripción del insumo o material"
                                                className="col-span-2"
                                                size="sm"
                                            />
                                        )}
                                        <Input
                                            label="Fecha de Arribo del Insumo"
                                            type="date"
                                            value={formData.fechaArribo || ''}
                                            onValueChange={(value) => handleChange('fechaArribo', value)}
                                            className={CLAIMS_API_ENABLED ? '' : 'col-span-2'}
                                            size="sm"
                                            isReadOnly={isReadOnly}
                                        />
                                    </div>
                                </div>

                                {/* Productos rechazados (con API de reclamos) */}
                                {CLAIMS_API_ENABLED && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900">Productos del reclamo ({products.length}) *</h4>
                                        {products.length === 0 && (
                                            <p className="text-sm text-gray-500">Agregue los productos rechazados desde el PackingList.</p>
                                        )}
                                        {products.map((product, index) => {
                                            // La misma línea puede venir dos veces (rechazo de Calidad y de Almacén)
                                            const key = `${productKey(product)}-${index}`;
                                            const typedText = productQuantityTexts[key];
                                            // Conserva lo que se está escribiendo ("12.") mientras corresponda a la cantidad
                                            const quantityText = typedText !== undefined && (parseFloat(typedText) || 0) === product.cantidadRechazada
                                                ? typedText
                                                : String(product.cantidadRechazada);
                                            return (
                                                <div key={key} className="p-3 rounded-lg border border-gray-200 space-y-2">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate" title={product.itemName}>
                                                                {product.itemName || product.itemCode}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{product.itemCode}</p>
                                                        </div>
                                                        {/* El backend aún no quita productos ya guardados: solo se quitan los nuevos */}
                                                        {!isReadOnly && product.lineId == null && (
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                color="danger"
                                                                aria-label="Quitar producto"
                                                                onPress={() => setProducts((prev) => prev.filter((_, i) => i !== index))}
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Input
                                                            size="sm"
                                                            label="Cantidad rechazada"
                                                            value={quantityText}
                                                            onValueChange={(value) => {
                                                                const parsed = parsePackingListQuantityInput(value);
                                                                if (parsed === null) return;
                                                                setProductQuantityTexts((prev) => ({ ...prev, [key]: parsed.text }));
                                                                updateProduct(index, { cantidadRechazada: parsed.quantity });
                                                            }}
                                                            isInvalid={product.cantidadRechazada <= 0}
                                                            isReadOnly={isReadOnly}
                                                        />
                                                        <Input
                                                            size="sm"
                                                            label="Motivo"
                                                            value={product.motivo}
                                                            onValueChange={(value) => updateProduct(index, { motivo: value })}
                                                            isInvalid={!product.motivo.trim()}
                                                            isReadOnly={isReadOnly}
                                                            className="col-span-2"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {!isReadOnly && (
                                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                                                <Select
                                                    label="Agregar desde PackingList"
                                                    selectedKeys={selectedPackingListId ? [selectedPackingListId] : []}
                                                    onSelectionChange={(keys) => handlePackingListChange((Array.from(keys)[0] as string) || '')}
                                                    placeholder="Seleccione un PackingList"
                                                    isLoading={isLoadingPackingLists}
                                                    size="sm"
                                                >
                                                    {packingLists.map((pl) => (
                                                        <SelectItem key={pl.number || pl.id?.toString() || ''}>
                                                            {pl.number}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                                {selectedPackingList && availableLines.length === 0 && (
                                                    <p className="text-xs text-gray-500">Todos los productos de este PackingList ya están en el reclamo.</p>
                                                )}
                                                {availableLines.map((item) => (
                                                    <div key={`${item.document}-${item.line_number}`} className="flex items-center justify-between gap-2 text-sm">
                                                        <span className="truncate">{item.item_code} - {item.item_name} ({item.quantity})</span>
                                                        <Button size="sm" variant="flat" onPress={() => handleAddLine(item)}>Agregar</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                        isReadOnly={isReadOnly}
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
                                        isReadOnly={isReadOnly}
                                    />
                                    <Textarea
                                        label="Impacto"
                                        value={formData.impacto || ''}
                                        onValueChange={(value) => handleChange('impacto', value)}
                                        placeholder="Describa el impacto del reclamo..."
                                        minRows={3}
                                        size="sm"
                                        isReadOnly={isReadOnly}
                                    />
                                </div>

                                {/* Evidencias (con API de reclamos) */}
                                {CLAIMS_API_ENABLED && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Evidencias</h4>
                                        {attachments.map((attachment, index) => (
                                            <div key={`${attachment.nameFile}-${index}`} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <PaperClipIcon className="w-4 h-4 flex-shrink-0 text-gray-500" />
                                                    {attachment.url ? (
                                                        <a href={attachment.url} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline">
                                                            {attachment.nameFile}
                                                        </a>
                                                    ) : (
                                                        <span className="truncate">{attachment.nameFile} (por subir)</span>
                                                    )}
                                                </span>
                                                {!isReadOnly && attachment.file && (
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        onPress={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                                                    >
                                                        Quitar
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {!isReadOnly && (
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,.avi"
                                                onChange={handleAttachmentChange}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-blue-50 file:text-blue-700
                                                    hover:file:bg-blue-100"
                                            />
                                        )}
                                    </div>
                                )}

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
                                            <span className="ml-2 font-medium">
                                                {formData.numeroReclamo || 'Se asigna al guardar'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Fecha de Reclamo:</span>
                                            <span className="ml-2 font-medium">{formData.fechaReclamo}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onClose}
                                isDisabled={isSaving}
                            >
                                {isReadOnly ? 'Cerrar' : 'Cancelar'}
                            </Button>
                            {existingClaim && (
                                <Button variant="flat" onPress={handleViewPDF} isDisabled={isSaving}>
                                    Ver PDF
                                </Button>
                            )}
                            {!isReadOnly && (
                                <Button
                                    color="danger"
                                    onPress={handleSubmit}
                                    isLoading={isSaving}
                                    isDisabled={isLoadingClaim || !formData.motivoReclamo?.trim() || (CLAIMS_API_ENABLED && products.length === 0)}
                                >
                                    {!CLAIMS_API_ENABLED ? 'Generar PDF de Reclamo' : existingClaim ? 'Guardar cambios' : 'Registrar reclamo'}
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ClaimModal;
