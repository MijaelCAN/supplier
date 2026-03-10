import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Textarea,
    Select,
    SelectItem,
    Spinner
} from '@heroui/react';
import {
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { PackingListApiRecord } from '@/services/agenda/packingListApi';
import {
    validatePCPItems,
    getPCPValidations,
    PCPValidationItem,
    CoverageResponse
} from '@/services/agenda/pcpApi';
import { useAuth } from '@/store/authStore';

interface PCPValidationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    codCita: string;
    packingList: PackingListApiRecord | null;
    onValidationSaved?: () => void;
}

interface ItemValidationData {
    item_code: string;
    item_name: string;
    line_number: number;
    document?: number;
    confirmacion_pcp: 'CONFORME' | 'NO_CONFORME' | '';
    cobertura_actual: string;
    cobertura_con_ingresos: string;
    comentario: string;
    isLoadingCoverage: boolean;
    coverageData?: CoverageResponse['data'];
}

const PCPValidationModal: React.FC<PCPValidationModalProps> = ({
    isOpen,
    onOpenChange,
    codCita,
    packingList,
    onValidationSaved,
}) => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState<ItemValidationData[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingValidations, setIsLoadingValidations] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Cargar items del PackingList y validaciones existentes
    useEffect(() => {
        if (isOpen && packingList) {
            loadItemsAndValidations();
        }
    }, [isOpen, packingList, codCita]);

    const loadItemsAndValidations = async () => {
        if (!packingList) return;

        setIsLoadingValidations(true);
        try {
            // Obtener detalle del PackingList
            const detalle = packingList.detalle_packin_list || packingList.DetallePackinList || [];

            // Cargar validaciones existentes
            const existingValidations = await getPCPValidations(codCita, packingList.number);

            // Mapear items con sus validaciones existentes
            const itemsData: ItemValidationData[] = detalle.map((item: any, index: number) => {
                const itemCode = item.ItemCode || item.item_code || '';
                const itemName = item.ItemName || item.item_name || '';
                const lineNumber = item.LineNumber || item.line_number || index + 1;
                const document = item.Document || item.document;

                // Buscar validación existente para este item
                const existingValidation = existingValidations.find(
                    (v) => v.item_code === itemCode && v.line_number === lineNumber
                );

                return {
                    item_code: itemCode,
                    item_name: itemName,
                    line_number: lineNumber,
                    document: document,
                    confirmacion_pcp: existingValidation?.confirmacion_pcp || '',
                    cobertura_actual: existingValidation?.cobertura_actual?.toString() || '',
                    cobertura_con_ingresos: existingValidation?.cobertura_con_ingresos?.toString() || '',
                    comentario: existingValidation?.comentario || '',
                    isLoadingCoverage: false,
                    coverageData: undefined,
                };
            });

            setItems(itemsData);
            setHasChanges(false);
        } catch (error) {
            console.error('Error al cargar validaciones:', error);
            alert('Error al cargar las validaciones existentes');
        } finally {
            setIsLoadingValidations(false);
        }
    };

    const handleItemChange = (index: number, field: keyof ItemValidationData, value: any) => {
        setItems(prev => prev.map((it, idx) =>
            idx === index ? { ...it, [field]: value } : it
        ));
        setHasChanges(true);
    };

    const handleSave = async () => {
        // Validar que todos los items tengan confirmación
        const itemsWithoutConfirmation = items.filter(item => !item.confirmacion_pcp);
        if (itemsWithoutConfirmation.length > 0) {
            alert('Por favor, seleccione una confirmación (CONFORME/NO_CONFORME) para todos los items.');
            return;
        }

        setIsSaving(true);
        try {
            const validationItems: PCPValidationItem[] = items.map(item => ({
                item_code: item.item_code,
                item_name: item.item_name,
                line_number: item.line_number,
                document: item.document,
                confirmacion_pcp: item.confirmacion_pcp as 'CONFORME' | 'NO_CONFORME',
                cobertura_actual: item.cobertura_actual ? parseFloat(item.cobertura_actual) : undefined,
                cobertura_con_ingresos: item.cobertura_con_ingresos ? parseFloat(item.cobertura_con_ingresos) : undefined,
                comentario: item.comentario.trim() || undefined,
            }));

            await validatePCPItems({
                cod_cita: codCita,
                packing_list_number: packingList?.number,
                items: validationItems,
                validado_por: currentUser?.fullName || currentUser?.username || 'system',
            });

            alert('Validación PCP guardada exitosamente');
            setHasChanges(false);
            if (onValidationSaved) {
                onValidationSaved();
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Error al guardar validación:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar la validación';
            alert(`Error al guardar la validación: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="full"
            scrollBehavior="inside"
            isDismissable={!isSaving && !hasChanges}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600" />
                                <div>
                                    <h3 className="text-xl font-bold">Validación PCP</h3>
                                    <p className="text-sm text-gray-500">
                                        PackingList: {packingList?.number || 'N/A'} | Cita: {codCita}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {isLoadingValidations ? (
                                <div className="flex justify-center items-center py-12">
                                    <Spinner size="lg" />
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <ClipboardDocumentCheckIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No hay items en este PackingList</p>
                                </div>
                            ) : (
                                <div className="space-y-4">

                                    {/* Tabla de validación */}
                                    <div className="overflow-x-auto">
                                        <Table aria-label="Tabla de validación PCP" removeWrapper>
                                            <TableHeader>
                                                <TableColumn width={80}>LÍNEA</TableColumn>
                                                <TableColumn width={90}>CÓDIGO</TableColumn>
                                                <TableColumn>DESCRIPCIÓN</TableColumn>
                                                <TableColumn width={180}>CONFIRMACIÓN PCP *</TableColumn>
                                                <TableColumn width={150}>COBERTURA ACTUAL</TableColumn>
                                                <TableColumn width={180}>COBERTURA CON INGRESOS</TableColumn>
                                                <TableColumn>COMENTARIO</TableColumn>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="text-center">
                                                            {item.line_number}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.item_code}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-[300px]">
                                                                {item.item_name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                size="sm"
                                                                selectedKeys={item.confirmacion_pcp ? [item.confirmacion_pcp] : []}
                                                                onSelectionChange={(keys) => {
                                                                    const selected = Array.from(keys)[0] as string;
                                                                    handleItemChange(index, 'confirmacion_pcp', selected || '');
                                                                }}
                                                                placeholder="Seleccionar"
                                                                isDisabled={isSaving}
                                                            >
                                                                <SelectItem key="CONFORME">
                                                                    CONFORME
                                                                </SelectItem>
                                                                <SelectItem key="NO_CONFORME">
                                                                    NO CONFORME
                                                                </SelectItem>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    size="sm"
                                                                    value={item.cobertura_actual}
                                                                    onValueChange={(value) => handleItemChange(index, 'cobertura_actual', value)}
                                                                    placeholder="0.00"
                                                                    isDisabled={isSaving}
                                                                    classNames={{
                                                                        input: "text-right"
                                                                    }}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                size="sm"
                                                                value={item.cobertura_con_ingresos}
                                                                onValueChange={(value) => handleItemChange(index, 'cobertura_con_ingresos', value)}
                                                                placeholder="0.00"
                                                                isDisabled={isSaving}
                                                                classNames={{
                                                                    input: "text-right"
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Textarea
                                                                size="sm"
                                                                value={item.comentario}
                                                                onValueChange={(value) => handleItemChange(index, 'comentario', value)}
                                                                placeholder=" Ingrese comentario ..."
                                                                minRows={1}
                                                                maxRows={3}
                                                                isDisabled={isSaving}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Información adicional */}
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start gap-3">
                                            <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                            <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                                                <p className="font-semibold mb-1">Información sobre la validación PCP:</p>
                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                    <li><strong>Confirmación PCP:</strong> Marque "CONFORME" si el item cumple con los requisitos de producción.</li>
                                                    <li><strong>Cobertura Actual:</strong> Meses de stock disponible actualmente en inventario.</li>
                                                    <li><strong>Cobertura con Ingresos:</strong> Meses de cobertura proyectada incluyendo los ingresos programados.</li>
                                                    <li><strong>Comentario:</strong> Agregue notas especiales como "Código nuevo", "Reemplazo de XXXX", etc.</li>
                                                </ul>
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
                                Cancelar
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSave}
                                isLoading={isSaving}
                                isDisabled={isSaving || items.length === 0}
                                startContent={!isSaving && <CheckCircleIcon className="w-4 h-4" />}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Validación'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default PCPValidationModal;
