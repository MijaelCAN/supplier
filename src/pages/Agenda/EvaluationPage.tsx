import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Textarea,
    Progress,
    Divider,
} from '@heroui/react';
import {
    ArrowLeftIcon,
    StarIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import Dashboard from '@/layouts/Dashboard';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { DeliveryEvaluation, EVALUATION_WEIGHTS } from '@/store/types';
import { fetchEvaluationByCodCita, saveEvaluation, calculateTotalScore, getBadgeFromScore } from '@/services/agenda/evaluationsApi';
import { fetchAppointmentsFromApi } from '@/services/agenda/appointmentsApi';
import { DeliveryAppointment } from '@/store/types';
import EvaluationModal from './EvaluationModal';

const EvaluationPage: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [appointment, setAppointment] = useState<DeliveryAppointment | null>(null);
    const [evaluation, setEvaluation] = useState<DeliveryEvaluation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [generalComment, setGeneralComment] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta'>('puntualidad');

    const canEdit = currentUser?.role === UserRole.COMPRAS || currentUser?.role === UserRole.ADMIN;

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
                        setGeneralComment(evalData.comentario || '');
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

    const handleSaveGeneralComment = async () => {
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
    };

    const handleOpenModal = (type: 'puntualidad' | 'documentacion' | 'estadoMercaderia' | 'cantidadCorrecta') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleEvaluationSaved = (updatedEvaluation: DeliveryEvaluation) => {
        setEvaluation(updatedEvaluation);
    };

    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'success';
        if (score >= 3.5) return 'primary';
        if (score >= 2.5) return 'warning';
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
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="light"
                        startContent={<ArrowLeftIcon className="w-5 h-5" />}
                        onPress={() => navigate(`/agenda/detail/${appointmentId}`)}
                        className="mb-4"
                    >
                        Volver al Detalle
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Calificación de Entrega</h1>
                    <p className="text-gray-600 mt-1">Evaluación completa de la cita #{appointment.docEntry || appointment.appointmentNumber}</p>
                </div>

                {/* Información de la Cita */}
                <Card className="mb-6">
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Proveedor</p>
                                <p className="font-semibold text-gray-900">{appointment.supplierName}</p>
                                <p className="text-sm text-gray-600">RUC: {appointment.supplierRUC}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha y Hora</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(appointment.deliveryDate).toLocaleDateString('es-PE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {appointment.deliveryTime}
                                    {appointment.deliveryTimeEnd && ` - ${appointment.deliveryTimeEnd}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Almacén</p>
                                <p className="font-semibold text-gray-900">{appointment.warehouse || 'No especificado'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <Chip color={appointment.status === 'Completada' ? 'success' : 'warning'} variant="flat">
                                    {appointment.status}
                                </Chip>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Puntaje Total y Badge */}
                {totalScore > 0 && (
                    <Card className="mb-6">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Puntaje Total</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-bold text-gray-900">{totalScore.toFixed(2)}</p>
                                        <Chip color={getBadgeColor(badge) as any} size="lg" variant="flat">
                                            {badge}
                                        </Chip>
                                    </div>
                                </div>
                                <Progress
                                    value={(totalScore / 5) * 100}
                                    color={getScoreColor(totalScore) as any}
                                    className="max-w-md"
                                    size="lg"
                                />
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Secciones de Evaluación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Puntualidad */}
                    <Card>
                        <CardBody>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <ClockIcon className="w-5 h-5 text-blue-600" />
                                        Puntualidad de Entrega
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Peso: {(EVALUATION_WEIGHTS.puntualidad * 100).toFixed(0)}%</p>
                                </div>
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        onPress={() => handleOpenModal('puntualidad')}
                                    >
                                        {evaluation?.puntualidad ? 'Editar' : 'Evaluar'}
                                    </Button>
                                )}
                            </div>
                            {evaluation?.puntualidad ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <StarIcon
                                                key={val}
                                                className={`w-5 h-5 ${
                                                    val <= evaluation.puntualidad!.puntaje
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="font-semibold text-gray-900 ml-2">
                                            {evaluation.puntualidad.puntaje}/5
                                        </span>
                                    </div>
                                    {evaluation.puntualidad.comentario && (
                                        <p className="text-sm text-gray-600 mt-2">{evaluation.puntualidad.comentario}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No evaluado</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Documentación */}
                    <Card>
                        <CardBody>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                        Documentación Completa
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Peso: {(EVALUATION_WEIGHTS.documentacion * 100).toFixed(0)}%</p>
                                </div>
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        onPress={() => handleOpenModal('documentacion')}
                                    >
                                        {evaluation?.documentacion ? 'Editar' : 'Evaluar'}
                                    </Button>
                                )}
                            </div>
                            {evaluation?.documentacion ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <StarIcon
                                                key={val}
                                                className={`w-5 h-5 ${
                                                    val <= evaluation.documentacion!.puntaje
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="font-semibold text-gray-900 ml-2">
                                            {evaluation.documentacion.puntaje}/5
                                        </span>
                                    </div>
                                    {evaluation.documentacion.comentario && (
                                        <p className="text-sm text-gray-600 mt-2">{evaluation.documentacion.comentario}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No evaluado</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Estado de Mercadería */}
                    <Card>
                        <CardBody>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                        Estado de la Mercadería
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Peso: {(EVALUATION_WEIGHTS.estadoMercaderia * 100).toFixed(0)}%</p>
                                </div>
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        onPress={() => handleOpenModal('estadoMercaderia')}
                                    >
                                        {evaluation?.estadoMercaderia ? 'Editar' : 'Evaluar'}
                                    </Button>
                                )}
                            </div>
                            {evaluation?.estadoMercaderia ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <StarIcon
                                                key={val}
                                                className={`w-5 h-5 ${
                                                    val <= evaluation.estadoMercaderia!.puntaje
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="font-semibold text-gray-900 ml-2">
                                            {evaluation.estadoMercaderia.puntaje}/5
                                        </span>
                                    </div>
                                    {evaluation.estadoMercaderia.comentario && (
                                        <p className="text-sm text-gray-600 mt-2">{evaluation.estadoMercaderia.comentario}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No evaluado</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Cantidad Correcta */}
                    <Card>
                        <CardBody>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                                        Cantidad Correcta
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Peso: {(EVALUATION_WEIGHTS.cantidadCorrecta * 100).toFixed(0)}%</p>
                                </div>
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        onPress={() => handleOpenModal('cantidadCorrecta')}
                                    >
                                        {evaluation?.cantidadCorrecta ? 'Editar' : 'Evaluar'}
                                    </Button>
                                )}
                            </div>
                            {evaluation?.cantidadCorrecta ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <StarIcon
                                                key={val}
                                                className={`w-5 h-5 ${
                                                    val <= evaluation.cantidadCorrecta!.puntaje
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="font-semibold text-gray-900 ml-2">
                                            {evaluation.cantidadCorrecta.puntaje}/5
                                        </span>
                                    </div>
                                    {evaluation.cantidadCorrecta.comentario && (
                                        <p className="text-sm text-gray-600 mt-2">{evaluation.cantidadCorrecta.comentario}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No evaluado</p>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Comentario General */}
                {canEdit && (
                    <Card>
                        <CardBody>
                            <h3 className="font-semibold text-gray-900 mb-4">Comentario General</h3>
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
                        </CardBody>
                    </Card>
                )}

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
