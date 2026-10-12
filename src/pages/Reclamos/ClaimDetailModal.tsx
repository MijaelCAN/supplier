// src/pages/Reclamos/ClaimDetailModal.tsx
// Detalle del reclamo: el proveedor responde (secciones 3–5) y Calidad/Almacén lo cierran (sección 6). OBS-008, parte 3.
import React, { useEffect, useState } from 'react';
import {
    Button,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
} from '@heroui/react';
import { PaperClipIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ClaimAction, SupplierClaim } from '@/store/types';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { closeClaim, localDateString, saveClaimResponse } from '@/services/agenda/claimsApi';
import { openClaimPDFInNewTab } from '@/utils/pdfGenerator';

interface ClaimDetailModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    claim: SupplierClaim | null;
    onClaimUpdated?: (claim: SupplierClaim) => void;
    /** Oculta "Ir a la cita" cuando ya se está en el detalle de la cita */
    hideGoToAppointment?: boolean;
}

export const CLAIM_STATUS_COLORS: Record<NonNullable<SupplierClaim['status']>, 'danger' | 'warning' | 'success'> = {
    'Abierto': 'danger',
    'En Respuesta': 'warning',
    'Cerrado': 'success',
};

const today = () => localDateString();

const SiNoSelector: React.FC<{
    label: string;
    value?: 'SI' | 'NO';
    onChange: (value: 'SI' | 'NO') => void;
    isDisabled: boolean;
}> = ({ label, value, onChange, isDisabled }) => (
    <div>
        <p className="text-sm text-gray-700 mb-1">{label}</p>
        <div className="flex gap-2">
            {(['SI', 'NO'] as const).map((option) => (
                <Button
                    key={option}
                    size="sm"
                    variant={value === option ? 'solid' : 'bordered'}
                    color={value === option ? (option === 'SI' ? 'success' : 'danger') : 'default'}
                    onPress={() => onChange(option)}
                    isDisabled={isDisabled}
                >
                    {option === 'SI' ? 'Sí' : 'No'}
                </Button>
            ))}
        </div>
    </div>
);

const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
    isOpen,
    onOpenChange,
    claim,
    onClaimUpdated,
    hideGoToAppointment,
}) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [draft, setDraft] = useState<SupplierClaim | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isProvider = currentUser?.role === UserRole.PROVEEDOR;
    const isInternal = [UserRole.CALIDAD, UserRole.ALMACEN, UserRole.ADMIN].includes(currentUser?.role as UserRole);
    // El proveedor responde mientras no esté cerrado; el área interna cierra cuando ya hay respuesta
    const canRespond = isProvider && !!claim && claim.status !== 'Cerrado';
    const canClose = isInternal && claim?.status === 'En Respuesta';

    useEffect(() => {
        if (!isOpen || !claim) return;
        const fullName = currentUser?.fullName || '';
        setDraft({
            ...claim,
            respuestaInmediata: {
                ...claim.respuestaInmediata,
                fechaRespuesta: claim.respuestaInmediata?.fechaRespuesta || (canRespond ? today() : ''),
                responsable: claim.respuestaInmediata?.responsable || (canRespond ? fullName : ''),
            },
            evaluacionReclamo: {
                ...claim.evaluacionReclamo,
                fechaEvaluacion: claim.evaluacionReclamo?.fechaEvaluacion || (canRespond ? today() : ''),
                evaluadoPor: claim.evaluacionReclamo?.evaluadoPor || (canRespond ? fullName : ''),
            },
            planAcciones: claim.planAcciones ?? [],
            cierreReclamo: {
                ...claim.cierreReclamo,
                fechaCierre: claim.cierreReclamo?.fechaCierre || (canClose ? today() : ''),
                responsableCierre: claim.cierreReclamo?.responsableCierre || (canClose ? fullName : ''),
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, claim]);

    if (!claim || !draft) return null;

    const updateSection = <K extends 'respuestaInmediata' | 'evaluacionReclamo' | 'cierreReclamo'>(
        section: K,
        changes: Partial<NonNullable<SupplierClaim[K]>>
    ) => setDraft((prev) => prev && { ...prev, [section]: { ...prev[section], ...changes } });

    const updateAction = (index: number, changes: Partial<ClaimAction>) =>
        setDraft((prev) => prev && {
            ...prev,
            planAcciones: (prev.planAcciones ?? []).map((a, i) => (i === index ? { ...a, ...changes } : a)),
        });

    const handleRespond = async () => {
        if (!draft.respuestaInmediata?.respuesta?.trim()) {
            alert('Ingrese la respuesta inmediata');
            return;
        }
        if (!draft.evaluacionReclamo?.reclamoProcede) {
            alert('Indique si el reclamo procede');
            return;
        }
        const incompleteAction = (draft.planAcciones ?? []).find((a) => !a.accion.trim() || !a.fecha);
        if (incompleteAction) {
            alert('Complete la acción y la fecha de cada acción del plan');
            return;
        }

        setIsSaving(true);
        try {
            const saved = await saveClaimResponse(draft);
            onClaimUpdated?.(saved);
            onOpenChange(false);
            alert('Respuesta enviada correctamente.');
        } catch (error) {
            alert(`Error al enviar la respuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = async () => {
        if (!draft.cierreReclamo?.accionesEfectivas || !draft.cierreReclamo?.fechaCierre) {
            alert('Indique si las acciones fueron efectivas y la fecha de cierre');
            return;
        }
        if (!window.confirm(`¿Confirma el cierre del reclamo ${claim.numeroReclamo}? Ya no se podrá modificar.`)) return;

        setIsSaving(true);
        try {
            const saved = await closeClaim(draft);
            onClaimUpdated?.(saved);
            onOpenChange(false);
            alert('Reclamo cerrado correctamente.');
        } catch (error) {
            alert(`Error al cerrar el reclamo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewPDF = async () => {
        try {
            await openClaimPDFInNewTab(draft);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'No se pudo abrir el PDF');
        }
    };

    const readOnlyField = (label: string, value?: string) => (
        <div>
            <span className="text-gray-600">{label}:</span>
            <span className="ml-2 font-medium">{value || '-'}</span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="text-xl font-semibold">Reclamo {claim.numeroReclamo}</h3>
                                    <p className="text-sm font-normal text-gray-500">
                                        {claim.proveedor} · Cita {claim.codCita} · {claim.fechaReclamo}
                                    </p>
                                </div>
                                {claim.status && (
                                    <Chip size="sm" variant="flat" color={CLAIM_STATUS_COLORS[claim.status]}>
                                        {claim.status}
                                    </Chip>
                                )}
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-5">
                                {/* Cabecera */}
                                <div className="p-3 bg-gray-50 rounded-lg grid grid-cols-2 gap-2 text-sm">
                                    {readOnlyField('Área que emite', claim.areaEmite)}
                                    {readOnlyField('Responsable', claim.responsable)}
                                    {readOnlyField('N° Lote', claim.nLote)}
                                    {readOnlyField('Orden de compra', claim.ordenCompra)}
                                    {readOnlyField('Factura', claim.factura)}
                                    {readOnlyField('Fecha de arribo', claim.fechaArribo)}
                                </div>

                                {/* Productos */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-900">Productos del reclamo</h4>
                                    <Table aria-label="Productos del reclamo" removeWrapper>
                                        <TableHeader>
                                            <TableColumn>CÓDIGO</TableColumn>
                                            <TableColumn>DESCRIPCIÓN</TableColumn>
                                            <TableColumn>CANT. RECHAZADA</TableColumn>
                                            <TableColumn>MOTIVO</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="Sin productos">
                                            {(claim.productos ?? []).map((p, index) => (
                                                <TableRow key={`${p.document}-${p.lineNumber}-${index}`}>
                                                    <TableCell className="whitespace-nowrap">{p.itemCode}</TableCell>
                                                    <TableCell>{p.itemName}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{p.cantidadRechazada}</TableCell>
                                                    <TableCell>{p.motivo}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Secciones 1 y 2 */}
                                <div className="space-y-2 text-sm">
                                    <h4 className="font-semibold text-gray-900">1. Datos del registro de inspección o análisis</h4>
                                    <p className="whitespace-pre-wrap text-gray-700">{claim.datosRegistroInspeccion || '-'}</p>
                                    <h4 className="font-semibold text-gray-900 pt-2">2. Motivo del reclamo e impacto</h4>
                                    <p className="whitespace-pre-wrap text-gray-700">{claim.motivoReclamo}</p>
                                    {claim.impacto && (
                                        <p className="whitespace-pre-wrap text-gray-700"><span className="font-medium">Impacto: </span>{claim.impacto}</p>
                                    )}
                                </div>

                                {/* Evidencias */}
                                {(claim.adjuntos ?? []).length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Evidencias</h4>
                                        {(claim.adjuntos ?? []).map((a, index) => (
                                            <a
                                                key={`${a.nameFile}-${index}`}
                                                href={a.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                            >
                                                <PaperClipIcon className="w-4 h-4" />
                                                {a.nameFile}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Sección 3: Respuesta inmediata del proveedor */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">3. Respuesta inmediata del proveedor</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            size="sm"
                                            type="date"
                                            label="Fecha de respuesta"
                                            value={draft.respuestaInmediata?.fechaRespuesta || ''}
                                            onValueChange={(value) => updateSection('respuestaInmediata', { fechaRespuesta: value })}
                                            isReadOnly={!canRespond}
                                        />
                                        <Input
                                            size="sm"
                                            label="Responsable"
                                            value={draft.respuestaInmediata?.responsable || ''}
                                            onValueChange={(value) => updateSection('respuestaInmediata', { responsable: value })}
                                            isReadOnly={!canRespond}
                                        />
                                    </div>
                                    <Textarea
                                        size="sm"
                                        label="Respuesta"
                                        value={draft.respuestaInmediata?.respuesta || ''}
                                        onValueChange={(value) => updateSection('respuestaInmediata', { respuesta: value })}
                                        minRows={3}
                                        isRequired={canRespond}
                                        isReadOnly={!canRespond}
                                    />
                                </div>

                                {/* Sección 4: Evaluación del reclamo (proveedor) */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">4. Evaluación del reclamo</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            size="sm"
                                            type="date"
                                            label="Fecha de evaluación"
                                            value={draft.evaluacionReclamo?.fechaEvaluacion || ''}
                                            onValueChange={(value) => updateSection('evaluacionReclamo', { fechaEvaluacion: value })}
                                            isReadOnly={!canRespond}
                                        />
                                        <Input
                                            size="sm"
                                            label="Evaluado por"
                                            value={draft.evaluacionReclamo?.evaluadoPor || ''}
                                            onValueChange={(value) => updateSection('evaluacionReclamo', { evaluadoPor: value })}
                                            isReadOnly={!canRespond}
                                        />
                                    </div>
                                    <SiNoSelector
                                        label="¿El reclamo procede?"
                                        value={draft.evaluacionReclamo?.reclamoProcede}
                                        onChange={(value) => updateSection('evaluacionReclamo', { reclamoProcede: value })}
                                        isDisabled={!canRespond}
                                    />
                                    <Textarea
                                        size="sm"
                                        label="Descripción"
                                        value={draft.evaluacionReclamo?.descripcion || ''}
                                        onValueChange={(value) => updateSection('evaluacionReclamo', { descripcion: value })}
                                        minRows={2}
                                        isReadOnly={!canRespond}
                                    />
                                </div>

                                {/* Sección 5: Plan de acciones (proveedor) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">5. Plan de acciones</h4>
                                        {canRespond && (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                startContent={<PlusIcon className="w-4 h-4" />}
                                                onPress={() => setDraft((prev) => prev && {
                                                    ...prev,
                                                    planAcciones: [...(prev.planAcciones ?? []), { accion: '', fecha: '', estado: 'Abierto' }],
                                                })}
                                            >
                                                Agregar acción
                                            </Button>
                                        )}
                                    </div>
                                    {(draft.planAcciones ?? []).length === 0 && (
                                        <p className="text-sm text-gray-500">Sin acciones registradas.</p>
                                    )}
                                    {(draft.planAcciones ?? []).map((action, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-start">
                                            <Input
                                                size="sm"
                                                label="Acción"
                                                value={action.accion}
                                                onValueChange={(value) => updateAction(index, { accion: value })}
                                                isReadOnly={!canRespond}
                                                className="col-span-7"
                                            />
                                            <Input
                                                size="sm"
                                                type="date"
                                                label="Fecha"
                                                value={action.fecha}
                                                onValueChange={(value) => updateAction(index, { fecha: value })}
                                                isReadOnly={!canRespond}
                                                className="col-span-3"
                                            />
                                            <div className="col-span-2 flex items-center gap-1 pt-2">
                                                <Chip size="sm" variant="flat" color={action.estado === 'Cerrado' ? 'success' : 'default'}>
                                                    {action.estado || 'Abierto'}
                                                </Chip>
                                                {canRespond && (
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        aria-label="Quitar acción"
                                                        onPress={() => setDraft((prev) => prev && {
                                                            ...prev,
                                                            planAcciones: (prev.planAcciones ?? []).filter((_, i) => i !== index),
                                                        })}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Sección 6: Cierre (área interna) */}
                                {(canClose || claim.status === 'Cerrado') && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900">6. Cierre del reclamo</h4>
                                        <SiNoSelector
                                            label="¿Las acciones fueron efectivas?"
                                            value={draft.cierreReclamo?.accionesEfectivas}
                                            onChange={(value) => updateSection('cierreReclamo', { accionesEfectivas: value })}
                                            isDisabled={!canClose}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                size="sm"
                                                type="date"
                                                label="Fecha de cierre"
                                                value={draft.cierreReclamo?.fechaCierre || ''}
                                                onValueChange={(value) => updateSection('cierreReclamo', { fechaCierre: value })}
                                                isReadOnly={!canClose}
                                            />
                                            <Input
                                                size="sm"
                                                label="Responsable de cierre"
                                                value={draft.cierreReclamo?.responsableCierre || ''}
                                                onValueChange={(value) => updateSection('cierreReclamo', { responsableCierre: value })}
                                                isReadOnly={!canClose}
                                            />
                                        </div>
                                        <Textarea
                                            size="sm"
                                            label="Observación"
                                            value={draft.cierreReclamo?.observacion || ''}
                                            onValueChange={(value) => updateSection('cierreReclamo', { observacion: value })}
                                            minRows={2}
                                            isReadOnly={!canClose}
                                        />
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose} isDisabled={isSaving}>
                                Cerrar
                            </Button>
                            {!hideGoToAppointment && !isProvider && claim.codCita && (
                                <Button variant="flat" onPress={() => navigate(`/agenda/detail/${claim.codCita}`)} isDisabled={isSaving}>
                                    Ir a la cita
                                </Button>
                            )}
                            <Button variant="flat" onPress={handleViewPDF} isDisabled={isSaving}>
                                Ver PDF
                            </Button>
                            {canRespond && (
                                <Button color="primary" onPress={handleRespond} isLoading={isSaving}>
                                    Enviar respuesta
                                </Button>
                            )}
                            {canClose && (
                                <Button color="success" onPress={handleClose} isLoading={isSaving}>
                                    Cerrar reclamo
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ClaimDetailModal;
