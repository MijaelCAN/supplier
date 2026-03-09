import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
} from '@heroui/react';
import { DeliveryEvaluation } from '@/store/types';
import { saveEvaluation, EVALUATION_CRITERIA_CODES } from '@/services/agenda/evaluationsApi';
import { UserRole } from '@/routes/menuTypes';

interface EvaluationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    codCita: string;
    userRole: UserRole;
    evaluationType: 'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta' | 'full';
    currentEvaluation?: DeliveryEvaluation;
    onEvaluationSaved?: (evaluation: DeliveryEvaluation) => void;
    appointment?: any; // DeliveryAppointment - para generar reclamo
    onReject?: (evaluation: DeliveryEvaluation) => void; // Callback cuando se rechaza
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
    isOpen,
    onOpenChange,
    codCita,
    userRole,
    evaluationType,
    currentEvaluation,
    onEvaluationSaved,
    onReject,
}) => {
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState<string>('');
    const [generalComment, setGeneralComment] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Estados específicos para estadoMercaderia
    const [estadoMercaderia, setEstadoMercaderia] = useState<'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO' | ''>('');
    const [files, setFiles] = useState<File[]>([]); // Múltiples archivos para estadoMercaderia

    // Títulos y descripciones según el tipo
    const getEvaluationConfig = () => {
        switch (evaluationType) {
            case 'puntualidad':
                return {
                    title: '¿Cumple con la hora de Cita?',
                    description: 'Evalúa si la entrega se realizó en el horario programado',
                    label: 'Puntualidad',
                    canUploadFile: true,
                };
            case 'documentacion':
                return {
                    title: 'Cumple con la entrega de la documentación',
                    description: '( Guia de remisión, Factura, Orden de compra)',
                    label: 'Documentación',
                    canUploadFile: true,
                };
            case 'estadoMercaderia':
                return {
                    title: '¿El producto cumple con los requisitos solicitados (*)?',
                    description: 'Evalúa el estado físico y calidad de la mercadería recibida',
                    label: 'Estado de Mercadería',
                    canUploadFile: true,
                };
            case 'cantidadCorrecta':
                return {
                    title: 'Cumple con las cantidades solicitadas',
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
    const canUploadFile = config.canUploadFile;
    // Cargar datos existentes cuando se abre el modal
    useEffect(() => {
        if (!isOpen) return;

        // Siempre resetear al abrir/cambiar de criterio para no arrastrar datos entre modales
        setScore(null);
        setComment('');
        setGeneralComment('');
        setFile(null);
        setEstadoMercaderia('');
        setFiles([]);

        if (currentEvaluation) {
            if (evaluationType === 'puntualidad' && currentEvaluation.puntualidad) {
                setScore(currentEvaluation.puntualidad.puntaje);
                setComment(currentEvaluation.puntualidad.comentario || '');
            } else if (evaluationType === 'documentacion' && currentEvaluation.documentacion) {
                setScore(currentEvaluation.documentacion.puntaje);
                setComment(currentEvaluation.documentacion.comentario || '');
            } else if (evaluationType === 'estadoMercaderia' && currentEvaluation.estadoMercaderia) {
                setEstadoMercaderia(currentEvaluation.estadoMercaderia.estado || '');
                // El comentario puede ser el motivo o comentario adicional
                setComment(currentEvaluation.estadoMercaderia.comentario || '');
                // Si hay puntaje antiguo, convertirlo a estado si es necesario (escala 1-10)
                if (!currentEvaluation.estadoMercaderia.estado && currentEvaluation.estadoMercaderia.puntaje) {
                    const oldScore = currentEvaluation.estadoMercaderia.puntaje;
                    if (oldScore >= 9.0) setEstadoMercaderia('ACEPTADO');
                    else if (oldScore >= 5.0) setEstadoMercaderia('OBSERVADO');
                    else setEstadoMercaderia('RECHAZADO');
                }
            } else if (evaluationType === 'cantidadCorrecta' && currentEvaluation.cantidadCorrecta) {
                setScore(currentEvaluation.cantidadCorrecta.puntaje);
                setComment(currentEvaluation.cantidadCorrecta.comentario || '');
            } else if (evaluationType === 'full') {
                setGeneralComment(currentEvaluation.comentario || '');
            }
        }
    }, [isOpen, currentEvaluation, evaluationType]);

    const handleSave = async () => {
        // Validaciones específicas para estadoMercaderia
        if (evaluationType === 'estadoMercaderia') {
            if (!estadoMercaderia) {
                alert('Por favor seleccione un estado (ACEPTADO, OBSERVADO o RECHAZADO)');
                return;
            }
            if ((estadoMercaderia === 'OBSERVADO' || estadoMercaderia === 'RECHAZADO') && !comment.trim()) {
                const tipoMotivo = estadoMercaderia === 'OBSERVADO' ? 'observación' : 'rechazo';
                alert(`Por favor ingrese el motivo de ${tipoMotivo}`);
                return;
            }
        } else if (evaluationType === 'cantidadCorrecta' && score === null) {
            alert('Por favor seleccione Sí o No');
            return;
        } else if ((evaluationType === 'puntualidad' || evaluationType === 'documentacion') && score === null) {
            alert('Por favor seleccione Sí o No');
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
                    puntaje: score === 10 ? 10 : 0, // Binario: 10 = Sí, 0 = No
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            } else if (evaluationType === 'documentacion') {
                evaluation.documentacion = {
                    puntaje: score === 10 ? 10 : 0, // Binario: 10 = Sí, 0 = No
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            } else if (evaluationType === 'estadoMercaderia') {
                // Convertir estado a puntaje para cálculo (escala 1-10: ACEPTADO=10, OBSERVADO=7, RECHAZADO=2)
                const puntajeMap: Record<string, number> = {
                    'ACEPTADO': 10,
                    'OBSERVADO': 7,
                    'RECHAZADO': 2
                };
                evaluation.estadoMercaderia = {
                    puntaje: puntajeMap[estadoMercaderia] || 0,
                    estado: estadoMercaderia as 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO',
                    comentario: comment || undefined, // Comentario se usa como motivo cuando es OBSERVADO o RECHAZADO
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            } else if (evaluationType === 'cantidadCorrecta') {
                evaluation.cantidadCorrecta = {
                    puntaje: score === 10 ? 10 : 0, // Binario: 10 = Sí, 0 = No
                    estado: score === 10 ? 'ACEPTADO' : 'RECHAZADO',
                    comentario: comment,
                    evaluadoPor: userRole,
                    fechaEvaluacion: new Date().toISOString(),
                };
            }

            // Preparar archivos para enviar con los criterios
            const filesToSend: { criterioCodigo: string; file: File }[] = [];
            
            if (canUploadFile) {
                if (evaluationType === 'estadoMercaderia' && files.length > 0) {
                    // Múltiples archivos para estadoMercaderia
                    files.forEach(f => {
                        filesToSend.push({
                            criterioCodigo: EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA,
                            file: f,
                        });
                    });
                } else if (evaluationType === 'cantidadCorrecta' && file) {
                    // Un archivo para cantidadCorrecta
                    filesToSend.push({
                        criterioCodigo: EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA,
                        file: file,
                    });
                } else if (evaluationType === 'puntualidad' && file) {
                    filesToSend.push({
                        criterioCodigo: EVALUATION_CRITERIA_CODES.PUNTUALIDAD,
                        file,
                    });
                } else if (evaluationType === 'documentacion' && file) {
                    filesToSend.push({
                        criterioCodigo: EVALUATION_CRITERIA_CODES.DOCUMENTACION,
                        file,
                    });
                }
            }

            const savedEvaluation = await saveEvaluation(evaluation, userRole, filesToSend.length > 0 ? filesToSend : undefined);

            if (onEvaluationSaved) {
                onEvaluationSaved(savedEvaluation);
            }

            // Si es estadoMercaderia y se rechazó, abrir modal de reclamo
            if (evaluationType === 'estadoMercaderia' && estadoMercaderia === 'RECHAZADO') {
                if (onReject) {
                    onOpenChange(false);
                    // Pequeño delay para que se cierre el modal actual
                    setTimeout(() => {
                        onReject(savedEvaluation);
                    }, 300);
                } else {
                    alert('Evaluación guardada exitosamente. Nota: Debe generar el reclamo manualmente.');
                    onOpenChange(false);
                }
            } else {
                alert('Evaluación guardada exitosamente');
                onOpenChange(false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar evaluación';
            console.error('Error al guardar evaluación:', error);
            
            // Si es RECHAZADO, permitir abrir el modal de reclamo incluso si falla el guardado
            if (evaluationType === 'estadoMercaderia' && estadoMercaderia === 'RECHAZADO' && onReject) {
                const shouldOpenClaim = window.confirm(
                    `Error al guardar la evaluación: ${errorMessage}\n\n` +
                    `¿Desea generar el reclamo de todas formas? (La evaluación no se guardó en el sistema)`
                );
                
                if (shouldOpenClaim) {
                    // Crear una evaluación temporal para el reclamo
                    const tempEvaluation: DeliveryEvaluation = {
                        codCita,
                        estadoMercaderia: {
                            puntaje: 1,
                            estado: 'RECHAZADO',
                            comentario: comment,
                            evaluadoPor: userRole,
                            fechaEvaluacion: new Date().toISOString(),
                        },
                    };
                    
                    onOpenChange(false);
                    setTimeout(() => {
                        onReject(tempEvaluation);
                    }, 300);
                } else {
                    onOpenChange(false);
                }
            } else {
                alert(`Error al guardar la evaluación: ${errorMessage}\n\nPor favor, intente nuevamente.`);
                // No cerrar el modal si hay error, para que el usuario pueda corregir
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
        const maxSize = 50 * 1024 * 1024; // 50MB para videos

        if (evaluationType === 'estadoMercaderia') {
            // Permitir múltiples archivos para estadoMercaderia
            const validFiles: File[] = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                if (!allowedTypes.includes(file.type)) {
                    alert(`El archivo ${file.name} no es válido. Solo se permiten PDF, imágenes (JPG, PNG) y videos (MP4, MOV, AVI)`);
                    continue;
                }
                if (file.size > maxSize) {
                    alert(`El archivo ${file.name} excede el tamaño máximo de 50MB`);
                    continue;
                }
                validFiles.push(file);
            }
            setFiles((prev) => [...prev, ...validFiles]);
        } else {
            // Un solo archivo para otros tipos
            const selectedFile = selectedFiles[0];
            const allowedTypesSingle = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypesSingle.includes(selectedFile.type)) {
                alert('Solo se permiten archivos PDF e imágenes (JPG, PNG)');
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert('El archivo no debe exceder 10MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
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
                        <ModalHeader className="flex justify-center">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl font-semibold">{config.title}</h3>
                                <p className="text-sm font-normal text-gray-500">{config.description}</p>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                {evaluationType !== 'full' && (
                                    <>
                                        {evaluationType === 'estadoMercaderia' ? (
                                            <>
                                                {/* Selector de Estado para Estado de Mercadería */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                        Estado de la Mercadería *
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {(['ACEPTADO', 'OBSERVADO', 'RECHAZADO'] as const).map((estado) => (
                                                            <button
                                                                key={estado}
                                                                type="button"
                                                                onClick={() => setEstadoMercaderia(estado)}
                                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                                    estadoMercaderia === estado
                                                                        ? estado === 'ACEPTADO'
                                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                                            : estado === 'OBSERVADO'
                                                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                                            : 'border-red-500 bg-red-50 text-red-700'
                                                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <span className="font-semibold text-lg">{estado}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Campo de Comentario/Motivo (label dinámico según estado) */}
                                                <Textarea
                                                    label={
                                                        estadoMercaderia === 'ACEPTADO'
                                                            ? 'Comentario (Opcional)'
                                                            : estadoMercaderia === 'OBSERVADO'
                                                            ? 'Motivo de Observación'
                                                            : estadoMercaderia === 'RECHAZADO'
                                                            ? 'Motivo de Rechazo'
                                                            : 'Comentario'
                                                    }
                                                    placeholder={
                                                        estadoMercaderia === 'ACEPTADO'
                                                            ? 'Agregue un comentario opcional sobre esta evaluación...'
                                                            : estadoMercaderia === 'OBSERVADO'
                                                            ? 'Ingrese el motivo de la observación...'
                                                            : estadoMercaderia === 'RECHAZADO'
                                                            ? 'Ingrese el motivo del rechazo...'
                                                            : 'Seleccione un estado primero...'
                                                    }
                                                    value={comment}
                                                    onValueChange={setComment}
                                                    minRows={3}
                                                    isRequired={estadoMercaderia === 'OBSERVADO' || estadoMercaderia === 'RECHAZADO'}
                                                    isDisabled={!estadoMercaderia}
                                                />
                                            </>
                                        ) : (evaluationType === 'puntualidad' || evaluationType === 'documentacion' || evaluationType === 'cantidadCorrecta') ? (
                                            <>
                                                {/* Selector binario para puntualidad, documentación y cantidad */}
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                        {config.label} *
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setScore(10)}
                                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                                score === 10
                                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="text-2xl">✓</span>
                                                                <span className="font-semibold text-lg">Sí</span>
                                                                <span className="text-xs text-gray-600">
                                                                    {evaluationType === 'documentacion' 
                                                                        ? 'Documentación completa' 
                                                                        : evaluationType === 'cantidadCorrecta'
                                                                        ? 'Coincide con el PackingList'
                                                                        : 'Llegó puntual'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setScore(0)}
                                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                                score === 0 && score !== null
                                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="text-2xl">✗</span>
                                                                <span className="font-semibold text-lg">No</span>
                                                                <span className="text-xs text-gray-600">
                                                                    {evaluationType === 'puntualidad' 
                                                                        ? 'No llegó puntual' 
                                                                        : evaluationType === 'documentacion'
                                                                        ? 'Documentación incompleta'
                                                                        : 'No coincide con el PackingList'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>

                                                <Textarea
                                                    label="Comentario"
                                                    placeholder={
                                                        evaluationType === 'cantidadCorrecta'
                                                            ? 'Agregue un comentario sobre cantidades, faltantes o diferencias...'
                                                            : 'Agregue un comentario sobre esta evaluación...'
                                                    }
                                                    value={comment}
                                                    onValueChange={setComment}
                                                    minRows={3}
                                                />
                                            </>
                                        ) : null}
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
                                            {evaluationType === 'estadoMercaderia'
                                                ? 'Archivos Adjuntos (PDF, Imágenes, Videos - Máx. 50MB por archivo)'
                                                : 'Archivo Adjunto (PDF, JPG, PNG - Máx. 10MB)'}
                                        </label>
                                        <input
                                            type="file"
                                            accept={evaluationType === 'estadoMercaderia'
                                                ? ".pdf,.jpg,.jpeg,.png,.mp4,.mov,.avi"
                                                : ".pdf,.jpg,.jpeg,.png"}
                                            multiple={evaluationType === 'estadoMercaderia'}
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-blue-50 file:text-blue-700
                                                hover:file:bg-blue-100"
                                        />
                                        {evaluationType === 'estadoMercaderia' && files.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {files.map((file, index) => (
                                                    <div key={index} className="p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.includes('video') ? 'Video' : file.type.includes('image') ? 'Imagen' : 'PDF'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="danger"
                                                            onPress={() => handleRemoveFile(index)}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {evaluationType !== 'estadoMercaderia' && file && (
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
                                isDisabled={
                                    evaluationType === 'estadoMercaderia' 
                                        ? !estadoMercaderia || ((estadoMercaderia === 'OBSERVADO' || estadoMercaderia === 'RECHAZADO') && !comment.trim())
                                        : evaluationType === 'puntualidad' || evaluationType === 'documentacion' || evaluationType === 'cantidadCorrecta'
                                        ? score === null
                                        : false
                                }
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
