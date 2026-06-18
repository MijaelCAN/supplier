import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Chip,
    Progress,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/react';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import Dashboard from '@/layouts/Dashboard';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { DeliveryEvaluation, EVALUATION_WEIGHTS } from '@/store/types';
import { fetchEvaluationByCodCita, calculateTotalScore, getBadgeFromScore } from '@/services/agenda/evaluationsApi';
import { fetchAppointmentsFromApi } from '@/services/agenda/appointmentsApi';
import { DeliveryAppointment } from '@/store/types';
import { STATUS_CONFIG } from '@/services/agenda/appointmentStatus';
import EvaluationModal from './EvaluationModal';

const EvaluationPage: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [appointment, setAppointment] = useState<DeliveryAppointment | null>(null);
    const [evaluation, setEvaluation] = useState<DeliveryEvaluation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    //const [isSaving, setIsSaving] = useState(false);
    //const [generalComment, setGeneralComment] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta'>('puntualidad');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailModalType, setDetailModalType] = useState<EvaluationModalType | null>(null);

    const canEdit = currentUser?.role === UserRole.COMPRAS || currentUser?.role === UserRole.ADMIN;
    type EvaluationModalType = 'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta';

    const isCriterionEvaluated = (type: EvaluationModalType): boolean => {
        if (!evaluation) return false;

        switch (type) {
            case 'puntualidad':
                return evaluation.puntualidad?.puntaje !== undefined;
            case 'documentacion':
                return evaluation.documentacion?.puntaje !== undefined;
            case 'estadoMercaderia':
                return evaluation.estadoMercaderia?.puntaje !== undefined;
            case 'cantidadCorrecta':
                return evaluation.cantidadCorrecta?.puntaje !== undefined;
            default:
                return false;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!appointmentId) return;

            setIsLoading(true);
            try {
                // Cargar cita
                const apiAppointments = await fetchAppointmentsFromApi();
                const foundAppointment = apiAppointments.find(
                    (apt) => apt.docEntry === appointmentId || apt.appointmentNumber === appointmentId
                );

                if (!foundAppointment) {
                    alert('Cita no encontrada');
                    navigate('/agenda');
                    return;
                }

                setAppointment(foundAppointment);

                // Cargar evaluación
                if (foundAppointment.docEntry) {
                    const evalData = await fetchEvaluationByCodCita(foundAppointment.docEntry);
                    if (evalData) {
                        setEvaluation(evalData);
                        //setGeneralComment(evalData.comentario || '');
                    } else {
                        // Crear evaluación vacía
                        setEvaluation({
                            codCita: foundAppointment.docEntry,
                        });
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos:', error);
                alert('Error al cargar los datos de la evaluación');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [appointmentId, navigate]);

    /*const handleSaveGeneralComment = async () => {
        if (!appointment?.docEntry || !canEdit) return;

        setIsSaving(true);
        try {
            const updatedEvaluation: Partial<DeliveryEvaluation> = {
                ...evaluation,
                codCita: appointment.docEntry,
                comentario: generalComment,
            };

            const saved = await saveEvaluation(updatedEvaluation, currentUser?.role || '');
            setEvaluation(saved);
            alert('Comentario guardado exitosamente');
        } catch (error) {
            console.error('Error al guardar comentario:', error);
            alert('Error al guardar el comentario');
        } finally {
            setIsSaving(false);
        }
    };*/

    // Validaciones para abrir modales de evaluación
    const canEvaluateDocumentacion = (): boolean => {
        // Debe haber al menos un documento
        if (!appointment) return false;
        
        // Verificar documentos del API si están disponibles
        if ((appointment as any).Documents && Array.isArray((appointment as any).Documents)) {
            return (appointment as any).Documents.length > 0;
        }
        
        // Verificar documentos mapeados
        if (appointment.documents) {
            const hasInvoice = !!appointment.documents.invoice?.url;
            const hasPurchaseOrder = !!appointment.documents.purchaseOrder?.url;
            const hasDeliveryGuide = !!appointment.documents.deliveryGuide?.url;
            return hasInvoice || hasPurchaseOrder || hasDeliveryGuide;
        }
        
        return false;
    };

    const canEvaluatePuntualidad = (): boolean => {
        // Debe haber llegado la fecha y hora de la cita
        if (!appointment?.deliveryDate || !appointment?.deliveryTime) {
            return false;
        }
        
        // Construir fecha/hora de la cita
        const appointmentDateTime = new Date(`${appointment.deliveryDate}T${appointment.deliveryTime}`);
        const now = new Date();
        
        // La fecha/hora de la cita debe haber pasado
        return appointmentDateTime <= now;
    };

    const canEvaluateCalidadYCantidad = (): boolean => {
        // Debe haberse calificado puntualidad primero
        return isCriterionEvaluated('puntualidad');
    };

    const getEvaluationErrorMessage = (type: EvaluationModalType): string => {
        switch (type) {
            case 'documentacion':
                return 'No se puede calificar Documentación: aún no hay documentos cargados.';
            case 'puntualidad':
                return 'No se puede calificar Puntualidad: la fecha y hora de la cita aún no han llegado.';
            case 'estadoMercaderia':
            case 'cantidadCorrecta':
                return 'No se puede calificar: primero debe calificarse la Puntualidad (asistencia).';
            default:
                return 'No se puede evaluar en este momento.';
        }
    };

    const handleOpenModal = (type: EvaluationModalType) => {
        // Verificar si ya está evaluado
        if (isCriterionEvaluated(type)) {
            return;
        }

        // Validaciones específicas por tipo
        let canOpen = true;
        switch (type) {
            case 'documentacion':
                canOpen = canEvaluateDocumentacion();
                break;
            case 'puntualidad':
                canOpen = canEvaluatePuntualidad();
                break;
            case 'estadoMercaderia':
            case 'cantidadCorrecta':
                canOpen = canEvaluateCalidadYCantidad();
                break;
        }

        if (!canOpen) {
            // Mostrar mensaje de error específico
            const errorMessage = getEvaluationErrorMessage(type);
            alert(errorMessage);
            return;
        }

        setModalType(type);
        setIsModalOpen(true);
    };

    const handleEvaluationSaved = (updatedEvaluation: DeliveryEvaluation) => {
        setEvaluation(updatedEvaluation);
    };

    const handleOpenDetailModal = (type: EvaluationModalType) => {
        setDetailModalType(type);
        setIsDetailModalOpen(true);
    };

    const getScoreColor = (score: number) => {
        if (score >= 9.0) return 'success';
        if (score >= 7.0) return 'primary';
        if (score >= 5.0) return 'warning';
        return 'danger';
    };

    const getBadgeColor = (badge?: string) => {
        switch (badge) {
            case 'Excelente':
                return 'success';
            case 'Bueno':
                return 'primary';
            case 'Regular':
                return 'warning';
            case 'Deficiente':
                return 'danger';
            default:
                return 'default';
        }
    };

    const getStatusConfig = (status: string) => {
        const statusKey = status as keyof typeof STATUS_CONFIG;
        if (statusKey && STATUS_CONFIG[statusKey]) {
            return STATUS_CONFIG[statusKey];
        }
        // Fallback para estados no reconocidos
        return {
            color: 'default' as const,
            label: status,
            description: ''
        };
    };

    if (isLoading) {
        return (
            <Dashboard>
                <div className="p-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Cargando evaluación...</p>
                    </div>
                </div>
            </Dashboard>
        );
    }

    if (!appointment) {
        return (
            <Dashboard>
                <div className="p-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Cita no encontrada</p>
                        <Button className="mt-4" onPress={() => navigate('/agenda')}>
                            Volver a Agenda
                        </Button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    const totalScore = evaluation ? calculateTotalScore(evaluation) : 0;
    const badge = evaluation?.badge || (totalScore > 0 ? getBadgeFromScore(totalScore) : undefined);

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50">
                {/* Header con fondo blanco */}
                <div>
                    <div className="max-w-8xl mx-auto py-6">

                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-0 min-w-0">
                                <Button
                                    variant="light"
                                    startContent={<ArrowLeftIcon className="w-5 h-5"/>}
                                    onPress={() => navigate(`/agenda/detail/${appointmentId}`)}
                                />
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate mr-1">
                                    Calificación de Entrega {appointment.docEntry || appointment.appointmentNumber}
                                </h1>
                            </div>
                            {/* Final: Estado, futuros botones */}
                            <div className="flex items-center gap-3">
                            {appointment && (() => {
                                const statusConfig = getStatusConfig(appointment.status);
                                return (
                                    <Chip 
                                        color={statusConfig.color as any} 
                                        variant="flat"
                                        size="lg"
                                        className="font-semibold"
                                    >
                                        {statusConfig.label}
                                    </Chip>
                                );
                            })()}
                                {/*<Button variant="light">Imprimir</Button>*/}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Información de la Cita - Diseño horizontal compacto */}
                    <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <UserIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</p>
                                    <p className="font-semibold text-gray-900 mt-1">{appointment.supplierName}</p>
                                    <p className="text-sm text-gray-600 mt-0.5">RUC: {appointment.supplierRUC}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <CalendarIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha y Hora</p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {new Date(appointment.deliveryDate).toLocaleDateString('es-PE', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {appointment.deliveryTime}
                                        {appointment.deliveryTimeEnd && ` - ${appointment.deliveryTimeEnd}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <MapPinIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Almacén</p>
                                    <p className="font-semibold text-gray-900 mt-1">{appointment.warehouse || 'No especificado'}</p>
                                </div>
                            </div>
                            {evaluation?.evaluador && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <UserIcon className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evaluador</p>
                                        <p className="font-semibold text-gray-900 mt-1">{evaluation.evaluador}</p>
                                        {evaluation.fechaEvaluacion && (
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                {new Date(evaluation.fechaEvaluacion).toLocaleDateString('es-PE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Layout Principal: Criterios a la izquierda, Indicador grande a la derecha */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Columna Izquierda: Criterios de Evaluación Compactos */}
                        <div className="lg:col-span-2 space-y-3">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Criterios de Evaluación</h2>
                            
                            {/* Puntualidad */}
                            <div 
                                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${
                                    isCriterionEvaluated('puntualidad') ? 'border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => {
                                    if (isCriterionEvaluated('puntualidad')) {
                                        handleOpenDetailModal('puntualidad');
                                    } else if (canEdit) {
                                        handleOpenModal('puntualidad');
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <ClockIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">Puntualidad de Entrega</h3>
                                            {evaluation?.puntualidad ? (
                                                <span className="text-sm font-bold text-gray-900">
                                                    {evaluation.puntualidad.puntaje.toFixed(1)} / 10
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">No evaluado</span>
                                            )}
                                        </div>
                                        {evaluation?.puntualidad ? (
                                            <Progress
                                                value={(evaluation.puntualidad.puntaje / 10) * 100}
                                                color={getScoreColor(evaluation.puntualidad.puntaje) as any}
                                                size="sm"
                                                className="h-2"
                                            />
                                        ) : (
                                            <div className="h-2 bg-gray-100 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Documentación */}
                            <div 
                                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${
                                    isCriterionEvaluated('documentacion') ? 'border-l-4 border-l-indigo-500' : ''
                                }`}
                                onClick={() => {
                                    if (isCriterionEvaluated('documentacion')) {
                                        handleOpenDetailModal('documentacion');
                                    } else if (canEdit) {
                                        handleOpenModal('documentacion');
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">Documentación Completa</h3>
                                            {evaluation?.documentacion ? (
                                                <span className="text-sm font-bold text-gray-900">
                                                    {evaluation.documentacion.puntaje.toFixed(1)} / 10
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">No evaluado</span>
                                            )}
                                        </div>
                                        {evaluation?.documentacion ? (
                                            <Progress
                                                value={(evaluation.documentacion.puntaje / 10) * 100}
                                                color={getScoreColor(evaluation.documentacion.puntaje) as any}
                                                size="sm"
                                                className="h-2"
                                            />
                                        ) : (
                                            <div className="h-2 bg-gray-100 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Estado de Mercadería */}
                            <div 
                                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${
                                    isCriterionEvaluated('estadoMercaderia') ? 'border-l-4 border-l-green-500' : ''
                                }`}
                                onClick={() => {
                                    if (isCriterionEvaluated('estadoMercaderia')) {
                                        handleOpenDetailModal('estadoMercaderia');
                                    } else if (canEdit) {
                                        handleOpenModal('estadoMercaderia');
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">Estado de la Mercadería</h3>
                                            {evaluation?.estadoMercaderia ? (
                                                <span className="text-sm font-bold text-gray-900">
                                                    {evaluation.estadoMercaderia.puntaje.toFixed(1)} / 10
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">No evaluado</span>
                                            )}
                                        </div>
                                        {evaluation?.estadoMercaderia ? (
                                            <Progress
                                                value={(evaluation.estadoMercaderia.puntaje / 10) * 100}
                                                color={getScoreColor(evaluation.estadoMercaderia.puntaje) as any}
                                                size="sm"
                                                className="h-2"
                                            />
                                        ) : (
                                            <div className="h-2 bg-gray-100 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cantidad Correcta */}
                            <div 
                                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer ${
                                    isCriterionEvaluated('cantidadCorrecta') ? 'border-l-4 border-l-purple-500' : ''
                                }`}
                                onClick={() => {
                                    if (isCriterionEvaluated('cantidadCorrecta')) {
                                        handleOpenDetailModal('cantidadCorrecta');
                                    } else if (canEdit) {
                                        handleOpenModal('cantidadCorrecta');
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">Cantidad Correcta</h3>
                                            {evaluation?.cantidadCorrecta ? (
                                                <span className="text-sm font-bold text-gray-900">
                                                    {evaluation.cantidadCorrecta.puntaje.toFixed(1)} / 10
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">No evaluado</span>
                                            )}
                                        </div>
                                        {evaluation?.cantidadCorrecta ? (
                                            <Progress
                                                value={(evaluation.cantidadCorrecta.puntaje / 10) * 100}
                                                color={getScoreColor(evaluation.cantidadCorrecta.puntaje) as any}
                                                size="sm"
                                                className="h-2"
                                            />
                                        ) : (
                                            <div className="h-2 bg-gray-100 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Indicador Principal Grande */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl border border-gray-200 p-8 sticky top-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Puntuación General</h2>
                                
                                {/* Círculo de Progreso Grande */}
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="relative w-48 h-48 mb-4">
                                        <svg className="transform -rotate-90 w-48 h-48">
                                            <circle
                                                cx="96"
                                                cy="96"
                                                r="88"
                                                stroke="currentColor"
                                                strokeWidth="16"
                                                fill="none"
                                                className="text-gray-200"
                                            />
                                            {totalScore > 0 && (
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="88"
                                                    stroke="currentColor"
                                                    strokeWidth="16"
                                                    fill="none"
                                                    strokeDasharray={`${2 * Math.PI * 88}`}
                                                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - (totalScore / 10))}`}
                                                    className={`${
                                                        totalScore >= 9.0 ? 'text-green-500' :
                                                        totalScore >= 7.0 ? 'text-blue-500' :
                                                        totalScore >= 5.0 ? 'text-yellow-500' :
                                                        'text-red-500'
                                                    } transition-all duration-500`}
                                                    strokeLinecap="round"
                                                />
                                            )}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-bold text-gray-900">
                                                {totalScore > 0 ? totalScore.toFixed(1) : '0.0'}
                                            </span>
                                            <span className="text-lg text-gray-500">/ 10.00</span>
                                        </div>
                                    </div>
                                    
                                    {/* Badge */}
                                    {badge ? (
                                        <Chip 
                                            color={getBadgeColor(badge) as any} 
                                            size="lg" 
                                            variant="flat" 
                                            className="font-bold text-lg px-6 py-3 mb-4"
                                        >
                                            {badge}
                                        </Chip>
                                    ) : (
                                        <div className="px-6 py-3 mb-4 text-gray-400 font-semibold">
                                            Sin calificar
                                        </div>
                                    )}
                                </div>

                                {/* Resumen */}
                                {evaluation && (
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Estado</p>
                                            <Chip
                                                color={
                                                    evaluation.estado === 'COMPLETADO'
                                                        ? 'success'
                                                        : evaluation.estado === 'CERRADO'
                                                        ? 'default'
                                                        : 'warning'
                                                }
                                                variant="flat"
                                                size="md"
                                                className="font-semibold"
                                            >
                                                {evaluation.estado || 'BORRADOR'}
                                            </Chip>
                                        </div>
                                        
                                        {evaluation.comentario && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Comentario General</p>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                    {evaluation.comentario}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Comentario General */}
                    {/*canEdit && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentario General</h3>
                            <Textarea
                                value={generalComment}
                                onValueChange={setGeneralComment}
                                placeholder="Agregue un comentario general sobre la entrega..."
                                minRows={4}
                                className="mb-4"
                            />
                            <Button
                                color="primary"
                                onPress={handleSaveGeneralComment}
                                isLoading={isSaving}
                            >
                                Guardar Comentario
                            </Button>
                        </div>
                    )*/}
                </div>

                {/* Modal de Detalles del Criterio */}
                <Modal
                    isOpen={isDetailModalOpen}
                    onOpenChange={setIsDetailModalOpen}
                    size="2xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        {(onClose) => {
                            if (!detailModalType) return null;
                            
                            const getCriterionData = () => {
                                if (!evaluation) return null;
                                
                                switch (detailModalType) {
                                    case 'puntualidad':
                                        return {
                                            title: 'Puntualidad de Entrega',
                                            icon: ClockIcon,
                                            iconColor: 'text-blue-600',
                                            bgColor: 'bg-blue-50',
                                            data: evaluation.puntualidad,
                                            peso: EVALUATION_WEIGHTS.puntualidad,
                                            archivoTipo: 'puntualidad' as const,
                                        };
                                    case 'documentacion':
                                        return {
                                            title: 'Documentación Completa',
                                            icon: DocumentTextIcon,
                                            iconColor: 'text-indigo-600',
                                            bgColor: 'bg-indigo-50',
                                            data: evaluation.documentacion,
                                            peso: EVALUATION_WEIGHTS.documentacion,
                                            archivoTipo: 'documentacion' as const,
                                        };
                                    case 'estadoMercaderia':
                                        return {
                                            title: 'Estado de la Mercadería',
                                            icon: CheckCircleIcon,
                                            iconColor: 'text-green-600',
                                            bgColor: 'bg-green-50',
                                            data: evaluation.estadoMercaderia,
                                            peso: EVALUATION_WEIGHTS.estadoMercaderia,
                                            archivoTipo: 'calidad' as const,
                                        };
                                    case 'cantidadCorrecta':
                                        return {
                                            title: 'Cantidad Correcta',
                                            icon: BuildingOfficeIcon,
                                            iconColor: 'text-purple-600',
                                            bgColor: 'bg-purple-50',
                                            data: evaluation.cantidadCorrecta,
                                            peso: EVALUATION_WEIGHTS.cantidadCorrecta,
                                            archivoTipo: 'almacen' as const,
                                        };
                                }
                            };

                            const criterion = getCriterionData();
                            if (!criterion || !criterion.data) {
                                // Si no hay datos, mostrar mensaje
                                const getTitle = () => {
                                    switch (detailModalType) {
                                        case 'puntualidad': return 'Puntualidad de Entrega';
                                        case 'documentacion': return 'Documentación Completa';
                                        case 'estadoMercaderia': return 'Estado de la Mercadería';
                                        case 'cantidadCorrecta': return 'Cantidad Correcta';
                                    }
                                };
                                
                                return (
                                    <>
                                        <ModalHeader>
                                            <h3 className="text-xl font-semibold">{getTitle()}</h3>
                                        </ModalHeader>
                                        <ModalBody>
                                            <p className="text-gray-500 text-center py-8">Este criterio aún no ha sido evaluado.</p>
                                        </ModalBody>
                                        <ModalFooter>
                                            <Button variant="light" onPress={onClose}>
                                                Cerrar
                                            </Button>
                                            {canEdit && (
                                                <Button
                                                    color="primary"
                                                    onPress={() => {
                                                        onClose();
                                                        setModalType(detailModalType);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    Iniciar Evaluación
                                                </Button>
                                            )}
                                        </ModalFooter>
                                    </>
                                );
                            }

                            const IconComponent = criterion.icon;

                            return (
                                <>
                                    <ModalHeader className="flex items-center gap-3">
                                        <div className={`p-2 ${criterion.bgColor} rounded-lg`}>
                                            <IconComponent className={`w-6 h-6 ${criterion.iconColor}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">{criterion.title}</h3>
                                            <p className="text-sm text-gray-500">Peso: {(criterion.peso * 100).toFixed(0)}%</p>
                                        </div>
                                    </ModalHeader>
                                    <ModalBody>
                                        <div className="space-y-6">
                                            {/* Puntaje */}
                                            <div>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-bold text-gray-900">
                                                            {criterion.data.puntaje.toFixed(1)}
                                                        </span>
                                                        <span className="text-lg text-gray-500">/ 10</span>
                                                    </div>
                                                    <Progress
                                                        value={(criterion.data.puntaje / 10) * 100}
                                                        color={getScoreColor(criterion.data.puntaje) as any}
                                                        className="flex-1"
                                                        size="md"
                                                    />
                                                </div>
                                                
                                                {/* Estado especial para estadoMercaderia */}
                                                {detailModalType === 'estadoMercaderia' && criterion.data.estado && (
                                                    <div className="mb-4">
                                                        <Chip
                                                            color={
                                                                criterion.data.estado === 'ACEPTADO' 
                                                                    ? 'success' 
                                                                    : criterion.data.estado === 'OBSERVADO'
                                                                    ? 'warning'
                                                                    : 'danger'
                                                            }
                                                            variant="flat"
                                                            size="lg"
                                                            className="font-semibold"
                                                        >
                                                            {criterion.data.estado}
                                                        </Chip>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Comentario */}
                                            {criterion.data.comentario && (
                                                <div className={`rounded-lg p-4 border ${
                                                    detailModalType === 'estadoMercaderia' && criterion.data.estado === 'ACEPTADO'
                                                        ? 'bg-gray-50 border-gray-200'
                                                        : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'OBSERVADO'
                                                        ? 'bg-yellow-50 border-yellow-200'
                                                        : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'RECHAZADO'
                                                        ? 'bg-red-50 border-red-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                                                        detailModalType === 'estadoMercaderia' && criterion.data.estado === 'ACEPTADO'
                                                            ? 'text-gray-600'
                                                            : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'OBSERVADO'
                                                            ? 'text-yellow-800'
                                                            : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'RECHAZADO'
                                                            ? 'text-red-800'
                                                            : 'text-gray-600'
                                                    }`}>
                                                        {detailModalType === 'estadoMercaderia' && criterion.data.estado === 'ACEPTADO'
                                                            ? 'Comentario'
                                                            : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'OBSERVADO'
                                                            ? 'Motivo de Observación'
                                                            : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'RECHAZADO'
                                                            ? 'Motivo de Rechazo'
                                                            : 'Comentario'}
                                                    </p>
                                                    <p className={`text-sm ${
                                                        detailModalType === 'estadoMercaderia' && criterion.data.estado === 'ACEPTADO'
                                                            ? 'text-gray-700'
                                                            : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'OBSERVADO'
                                                            ? 'text-yellow-900'
                                                            : detailModalType === 'estadoMercaderia' && criterion.data.estado === 'RECHAZADO'
                                                            ? 'text-red-900'
                                                            : 'text-gray-700'
                                                    }`}>
                                                        {criterion.data.comentario}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Archivos adjuntos */}
                                            {evaluation && evaluation.archivos && evaluation.archivos.some(a => a.tipo === criterion.archivoTipo) && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-3">
                                                        {criterion.archivoTipo === 'calidad' ? 'Evidencias Fotográficas' : 
                                                         criterion.archivoTipo === 'almacen' ? 'Evidencias de Almacén' : 
                                                         'Archivos Adjuntos'}
                                                    </p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {evaluation.archivos
                                                            .filter(archivo => archivo.tipo === criterion.archivoTipo)
                                                            .map((archivo, index) => (
                                                                <div key={index} className="relative group">
                                                                    <a
                                                                        href={archivo.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block"
                                                                    >
                                                                        {archivo.url.match(/\.(jpg|jpeg|png|gif|webp)/i) || archivo.nombre.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                                                                            <img
                                                                                src={archivo.url}
                                                                                alt={archivo.nombre}
                                                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                                                                                onError={(e) => {
                                                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12"%3EImagen%3C/text%3E%3C/svg%3E';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                                                                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                                                                            </div>
                                                                        )}
                                                                        <p className="text-xs text-gray-600 mt-1 truncate" title={archivo.nombre}>
                                                                            {archivo.nombre}
                                                                        </p>
                                                                    </a>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button variant="light" onPress={onClose}>
                                            Cerrar
                                        </Button>
                                        {canEdit && (
                                            <Button
                                                color="primary"
                                                onPress={() => {
                                                    onClose();
                                                    setModalType(detailModalType);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                Editar Evaluación
                                            </Button>
                                        )}
                                    </ModalFooter>
                                </>
                            );
                        }}
                    </ModalContent>
                </Modal>

                {/* Modal de Evaluación */}
                {appointment?.docEntry && (
                    <EvaluationModal
                        isOpen={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        codCita={appointment.docEntry}
                        userRole={currentUser?.role || UserRole.ADMIN}
                        evaluationType={modalType}
                        currentEvaluation={evaluation || undefined}
                        onEvaluationSaved={handleEvaluationSaved}
                    />
                )}
            </div>
        </Dashboard>
    );
};

export default EvaluationPage;
