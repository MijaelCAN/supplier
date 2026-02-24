import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Textarea,
    Progress
} from '@heroui/react';
import {
    ArrowLeftIcon,
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

                {/* Resumen de Evaluación */}
                {evaluation && (
                    <Card className="mb-6">
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Puntaje Total */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Puntaje Total</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {evaluation.puntajeTotal ? evaluation.puntajeTotal.toFixed(2) : totalScore.toFixed(2)}
                                        </p>
                                        <span className="text-sm text-gray-500">/ 10.00</span>
                                    </div>
                                <Progress
                                    value={((evaluation.puntajeTotal || totalScore) / 10) * 100}
                                    color={getScoreColor(evaluation.puntajeTotal || totalScore) as any}
                                    className="mt-2"
                                    size="sm"
                                />
                                </div>

                                {/* Nivel/Badge */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nivel de Calificación</p>
                                    <Chip color={getBadgeColor(badge) as any} size="md" variant="flat" className="font-semibold">
                                        {badge || 'Sin calificar'}
                                    </Chip>
                                </div>

                                {/* Estado */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Estado</p>
                                    <Chip
                                        color={
                                            evaluation.estado === 'COMPLETADO'
                                                ? 'success'
                                                : evaluation.estado === 'CERRADO'
                                                ? 'default'
                                                : 'warning'
                                        }
                                        size="md"
                                        variant="flat"
                                        className="font-semibold"
                                    >
                                        {evaluation.estado || 'BORRADOR'}
                                    </Chip>
                                </div>

                                {/* Fecha de Evaluación */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Fecha de Evaluación</p>
                                    <p className="font-semibold text-gray-900">
                                        {evaluation.fechaEvaluacion
                                            ? new Date(evaluation.fechaEvaluacion).toLocaleDateString('es-PE', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                              })
                                            : 'No evaluada'}
                                    </p>
                                    {evaluation.evaluador && (
                                        <p className="text-xs text-gray-500 mt-1">Evaluador: {evaluation.evaluador}</p>
                                    )}
                                </div>
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
                                        <span className="text-2xl font-bold text-gray-900">
                                            {evaluation.puntualidad.puntaje.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">/ 10</span>
                                        <Progress
                                            value={(evaluation.puntualidad.puntaje / 10) * 100}
                                            color={getScoreColor(evaluation.puntualidad.puntaje) as any}
                                            className="flex-1 max-w-xs"
                                            size="sm"
                                        />
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
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {evaluation.documentacion.puntaje.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">/ 10</span>
                                        <Progress
                                            value={(evaluation.documentacion.puntaje / 10) * 100}
                                            color={getScoreColor(evaluation.documentacion.puntaje) as any}
                                            className="flex-1 max-w-xs"
                                            size="sm"
                                        />
                                    </div>
                                    {evaluation.documentacion.comentario && (
                                        <p className="text-sm text-gray-600 mt-2">{evaluation.documentacion.comentario}</p>
                                    )}
                                    {/* Archivos si existen para documentación (aunque normalmente no debería tener) */}
                                    {evaluation.archivos && evaluation.archivos.some(a => a.tipo === 'documentacion') && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Archivos adjuntos:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {evaluation.archivos
                                                    .filter(archivo => archivo.tipo === 'documentacion')
                                                    .map((archivo, index) => (
                                                        <a
                                                            key={index}
                                                            href={archivo.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline"
                                                        >
                                                            {archivo.nombre}
                                                        </a>
                                                    ))}
                                            </div>
                                        </div>
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
                                <div className="space-y-3">
                                    {/* Mostrar Estado */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Chip
                                            color={
                                                evaluation.estadoMercaderia.estado === 'ACEPTADO' 
                                                    ? 'success' 
                                                    : evaluation.estadoMercaderia.estado === 'OBSERVADO'
                                                    ? 'warning'
                                                    : 'danger'
                                            }
                                            variant="flat"
                                            size="lg"
                                            className="font-semibold"
                                        >
                                            {evaluation.estadoMercaderia.estado || 'Evaluado'}
                                        </Chip>
                                        <span className="text-sm text-gray-500">
                                            Puntaje: {evaluation.estadoMercaderia.puntaje.toFixed(1)}/10
                                        </span>
                                    </div>
                                    
                                    {/* Mostrar Comentario/Motivo si existe */}
                                    {evaluation.estadoMercaderia.comentario && (
                                        <div className={`p-3 rounded-lg border ${
                                            evaluation.estadoMercaderia.estado === 'ACEPTADO'
                                                ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                                                : evaluation.estadoMercaderia.estado === 'OBSERVADO'
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        }`}>
                                            <p className={`text-xs font-semibold mb-1 ${
                                                evaluation.estadoMercaderia.estado === 'ACEPTADO'
                                                    ? 'text-gray-600 dark:text-gray-400'
                                                    : evaluation.estadoMercaderia.estado === 'OBSERVADO'
                                                    ? 'text-yellow-800 dark:text-yellow-300'
                                                    : 'text-red-800 dark:text-red-300'
                                            }`}>
                                                {evaluation.estadoMercaderia.estado === 'ACEPTADO'
                                                    ? 'Comentario:'
                                                    : evaluation.estadoMercaderia.estado === 'OBSERVADO'
                                                    ? 'Motivo de Observación:'
                                                    : 'Motivo de Rechazo:'}
                                            </p>
                                            <p className={`text-sm ${
                                                evaluation.estadoMercaderia.estado === 'ACEPTADO'
                                                    ? 'text-gray-700 dark:text-gray-300'
                                                    : evaluation.estadoMercaderia.estado === 'OBSERVADO'
                                                    ? 'text-yellow-900 dark:text-yellow-200'
                                                    : 'text-red-900 dark:text-red-200'
                                            }`}>
                                                {evaluation.estadoMercaderia.comentario}
                                            </p>
                                        </div>
                                    )}

                                    {/* Mostrar imágenes si existen (CALIDAD) */}
                                    {evaluation.archivos && evaluation.archivos.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Archivos adjuntos:</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {evaluation.archivos
                                                    .filter(archivo => archivo.tipo === 'calidad')
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
                                                                            // Si falla la carga, mostrar un placeholder
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
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {evaluation.cantidadCorrecta.puntaje.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">/ 10</span>
                                        <Progress
                                            value={(evaluation.cantidadCorrecta.puntaje / 10) * 100}
                                            color={getScoreColor(evaluation.cantidadCorrecta.puntaje) as any}
                                            className="flex-1 max-w-xs"
                                            size="sm"
                                        />
                                    </div>
                                    {evaluation.cantidadCorrecta.comentario && (
                                        <p className="text-sm text-gray-600 mt-2">{evaluation.cantidadCorrecta.comentario}</p>
                                    )}

                                    {/* Mostrar archivos si existen (ALMACEN) */}
                                    {evaluation.archivos && evaluation.archivos.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Archivos adjuntos:</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {evaluation.archivos
                                                    .filter(archivo => archivo.tipo === 'almacen')
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
