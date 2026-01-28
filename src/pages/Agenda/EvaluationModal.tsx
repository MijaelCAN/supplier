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
    Progress,
    Chip,
} from '@heroui/react';
import { StarIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { DeliveryEvaluation, EvaluationScore } from '@/store/types';
import { saveEvaluation, uploadEvaluationFile } from '@/services/agenda/evaluationsApi';
import { UserRole } from '@/routes/menuTypes';

interface EvaluationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    codCita: string;
    userRole: UserRole;
    evaluationType: 'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta' | 'full';
    currentEvaluation?: DeliveryEvaluation;
    onEvaluationSaved?: (evaluation: DeliveryEvaluation) => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
    isOpen,
    onOpenChange,
    codCita,
    userRole,
    evaluationType,
    currentEvaluation,
    onEvaluationSaved,
}) => {
    const [score, setScore] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [generalComment, setGeneralComment] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Títulos y descripciones según el tipo
    const getEvaluationConfig = () => {
        switch (evaluationType) {
            case 'puntualidad':
                return {
                    title: 'Evaluar Puntualidad de Entrega',
                    description: 'Evalúa si la entrega se realizó en el horario programado',
                    label: 'Puntualidad',
                    canUploadFile: false,
                };
            case 'documentacion':
                return {
                    title: 'Evaluar Documentación Completa',
                    description: 'Evalúa si todos los documentos requeridos fueron entregados correctamente',
                    label: 'Documentación',
                    canUploadFile: false,
                };
            case 'estadoMercaderia':
                return {
                    title: 'Evaluar Estado de la Mercadería',
                    description: 'Evalúa el estado físico y calidad de la mercadería recibida',
                    label: 'Estado de Mercadería',
                    canUploadFile: true,
                };
            case 'cantidadCorrecta':
                return {
                    title: 'Evaluar Cantidad Correcta',
                    description: 'Evalúa si las cantidades recibidas coinciden con el PackingList',
                    label: 'Cantidad Correcta',
                    canUploadFile: true,
                };
            case 'full':
                return {
                    title: 'Calificación Completa de Entrega',
                    description: 'Evalúa todos los aspectos de la entrega',
                    label: 'Calificación General',
                    canUploadFile: false,
                };
            default:
                return {
                    title: 'Evaluar Entrega',
                    description: '',
                    label: '',
                    canUploadFile: false,
                };
        }
    };

    const config = getEvaluationConfig();
    const canUploadFile = config.canUploadFile && (userRole === UserRole.CALIDAD || userRole === UserRole.ALMACEN);
    const canEditAll = userRole === UserRole.COMPRAS;

    // Cargar datos existentes cuando se abre el modal
    useEffect(() => {
        if (isOpen && currentEvaluation) {
            if (evaluationType === 'puntualidad' && currentEvaluation.puntualidad) {
                setScore(currentEvaluation.puntualidad.puntaje || 0);
                setComment(currentEvaluation.puntualidad.comentario || '');
            } else if (evaluationType === 'documentacion' && currentEvaluation.documentacion) {
                setScore(currentEvaluation.documentacion.puntaje || 0);
                setComment(currentEvaluation.documentacion.comentario || '');
            } else if (evaluationType === 'estadoMercaderia' && currentEvaluation.estadoMercaderia) {
                setScore(currentEvaluation.estadoMercaderia.puntaje || 0);
                setComment(currentEvaluation.estadoMercaderia.comentario || '');
            } else if (evaluationType === 'cantidadCorrecta' && currentEvaluation.cantidadCorrecta) {
                setScore(currentEvaluation.cantidadCorrecta.puntaje || 0);
                setComment(currentEvaluation.cantidadCorrecta.comentario || '');
            } else if (evaluationType === 'full') {
                setGeneralComment(currentEvaluation.comentario || '');
            }
        } else if (isOpen) {
            // Reset cuando se abre sin evaluación previa
            setScore(0);
            setComment('');
            setGeneralComment('');
            setFile(null);
        }
    }, [isOpen, currentEvaluation, evaluationType]);

    const handleSave = async () => {
        if (evaluationType !== 'full' && score === 0) {
            alert('Por favor seleccione un puntaje');
            return;
        }

        setIsSaving(true);
        try {
            const evaluation: Partial<DeliveryEvaluation> = {
                codCita,
                comentario: generalComment || comment,
            };

            // Asignar según el tipo
            if (evaluationType === 'puntualidad') {
                evaluation.puntualidad = {
                    puntaje: score,
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            } else if (evaluationType === 'documentacion') {
                evaluation.documentacion = {
                    puntaje: score,
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            } else if (evaluationType === 'estadoMercaderia') {
                evaluation.estadoMercaderia = {
                    puntaje: score,
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            } else if (evaluationType === 'cantidadCorrecta') {
                evaluation.cantidadCorrecta = {
                    puntaje: score,
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            }

            // Si hay evaluación previa, mantener los otros campos
            if (currentEvaluation) {
                if (!evaluation.puntualidad && currentEvaluation.puntualidad) {
                    evaluation.puntualidad = currentEvaluation.puntualidad;
                }
                if (!evaluation.documentacion && currentEvaluation.documentacion) {
                    evaluation.documentacion = currentEvaluation.documentacion;
                }
                if (!evaluation.estadoMercaderia && currentEvaluation.estadoMercaderia) {
                    evaluation.estadoMercaderia = currentEvaluation.estadoMercaderia;
                }
                if (!evaluation.cantidadCorrecta && currentEvaluation.cantidadCorrecta) {
                    evaluation.cantidadCorrecta = currentEvaluation.cantidadCorrecta;
                }
                if (!evaluation.comentario && currentEvaluation.comentario) {
                    evaluation.comentario = currentEvaluation.comentario;
                }
            }

            const savedEvaluation = await saveEvaluation(evaluation, userRole);

            // Subir archivo si existe y es permitido
            if (file && canUploadFile) {
                setIsUploading(true);
                try {
                    const fileType = userRole === UserRole.CALIDAD ? 'calidad' : 'almacen';
                    await uploadEvaluationFile(codCita, file, fileType, userRole);
                } catch (error) {
                    console.error('Error al subir archivo:', error);
                    alert('La evaluación se guardó pero hubo un error al subir el archivo');
                } finally {
                    setIsUploading(false);
                }
            }

            if (onEvaluationSaved) {
                onEvaluationSaved(savedEvaluation);
            }

            alert('Evaluación guardada exitosamente');
            onOpenChange(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar evaluación';
            alert(`Error: ${errorMessage}`);
            console.error('Error al guardar evaluación:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validar tipo de archivo
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(selectedFile.type)) {
                alert('Solo se permiten archivos PDF e imágenes (JPG, PNG)');
                return;
            }
            // Validar tamaño (máximo 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert('El archivo no debe exceder 10MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="2xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl font-semibold">{config.title}</h3>
                                <p className="text-sm font-normal text-gray-500">{config.description}</p>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {evaluationType !== 'full' && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                {config.label} (1-5)
                                            </label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((value) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setScore(value)}
                                                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                                            score === value
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            <StarIcon
                                                                className={`w-5 h-5 ${
                                                                    score >= value ? 'fill-yellow-400 text-yellow-400' : ''
                                                                }`}
                                                            />
                                                            <span className="font-semibold">{value}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Textarea
                                            label="Comentario"
                                            placeholder="Agregue un comentario sobre esta evaluación..."
                                            value={comment}
                                            onValueChange={setComment}
                                            minRows={3}
                                        />
                                    </>
                                )}

                                {evaluationType === 'full' && (
                                    <Textarea
                                        label="Comentario General"
                                        placeholder="Agregue un comentario general sobre la entrega..."
                                        value={generalComment}
                                        onValueChange={setGeneralComment}
                                        minRows={4}
                                    />
                                )}

                                {canUploadFile && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Archivo Adjunto (PDF, JPG, PNG - Máx. 10MB)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-blue-50 file:text-blue-700
                                                hover:file:bg-blue-100"
                                        />
                                        {file && (
                                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-700">
                                                    Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onClose}
                                isDisabled={isSaving || isUploading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSave}
                                isLoading={isSaving || isUploading}
                                isDisabled={evaluationType !== 'full' && score === 0}
                            >
                                {isSaving ? 'Guardando...' : isUploading ? 'Subiendo archivo...' : 'Guardar Evaluación'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default EvaluationModal;
