/*import React from "react";;
import {UserRole} from "@/routes/menuTypes.ts";
import {ClipboardDocumentCheckIcon} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";

interface EvaluacionesProps {
    role: UserRole;
}

const SupplierEvaluations: React.FC<EvaluacionesProps> = ({ role }) => {

    return (
        <Dashboard>
            <div className="w-full space-y-6">
                <header className="flex items-center mb-6">
                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 mr-3"/>
                    <h1 className="text-2xl font-semibold text-gray-800">Evaluaciones de Proveedores</h1>
                </header>

                {role === UserRole.PROVEEDOR ? (
                    <p className="text-gray-700">
                        Bienvenido proveedor. Aquí puedes consultar tus evaluaciones recientes, resultados y
                        recomendaciones para mejorar tu desempeño.
                    </p>
                ) : (
                    <>
                        <p className="text-gray-700 mb-4">
                            En esta sección puedes gestionar y revisar las evaluaciones realizadas a los
                            proveedores,
                            asegurando el cumplimiento de los estándares de calidad y desempeño.
                        </p>

                        {/* Tabla o lista de evaluaciones - ejemplo estático *
                        <table className="w-full border-collapse border border-gray-200">
                            <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Proveedor</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Fecha</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Calificación</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Comentarios</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">Proveedor A</td>
                                <td className="border border-gray-300 px-4 py-2">2025-06-01</td>
                                <td className="border border-gray-300 px-4 py-2">85%</td>
                                <td className="border border-gray-300 px-4 py-2">Cumple con los estándares de
                                    calidad.
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">Proveedor B</td>
                                <td className="border border-gray-300 px-4 py-2">2025-05-20</td>
                                <td className="border border-gray-300 px-4 py-2">78%</td>
                                <td className="border border-gray-300 px-4 py-2">Requiere mejorar tiempos de
                                    entrega.
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </Dashboard>
);
};

export default SupplierEvaluations;*/

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input,
    Select,
    SelectItem,
    Textarea,
    Progress,
    Divider,
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Tabs,
    Tab
} from "@heroui/react";
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ChartBarIcon,
    StarIcon,
    DocumentTextIcon,
    CalendarIcon,
    UserIcon,
    BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Dashboard from "@/layouts/Dashboard";

// Tipos de datos
interface Evaluacion {
    id: string;
    proveedor: {
        id: string;
        nombre: string;
        ruc: string;
        avatar?: string;
    };
    periodo: string;
    fechaEvaluacion: string;
    evaluador: string;
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'revisada';
    puntuacionTotal: number;
    categorias: {
        calidad: number;
        cumplimiento: number;
        atencionCliente: number;
        precios: number;
        innovacion: number;
    };
    observaciones?: string;
    documentos?: string[];
}

interface EvaluacionesProps {
    rol: 'ADMIN' | 'COMPRAS' | 'PROVEEDOR' | 'FINANZAS';
}

const Evaluaciones: React.FC<EvaluacionesProps> = ({ rol }) => {
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [busqueda, setBusqueda] = useState<string>('');
    const [selectedTab, setSelectedTab] = useState('lista');
    const [selectedEvaluacion, setSelectedEvaluacion] = useState<Evaluacion | null>(null);

    const {
        isOpen: isViewOpen,
        onOpen: onViewOpen,
        onClose: onViewClose
    } = useDisclosure();

    const {
        isOpen: isCreateOpen,
        onOpen: onCreateOpen,
        onClose: onCreateClose
    } = useDisclosure();

    // Datos de ejemplo
    useEffect(() => {
        const datosEjemplo: Evaluacion[] = [
            {
                id: '1',
                proveedor: {
                    id: 'prov-001',
                    nombre: 'Distribuidora ABC S.A.C.',
                    ruc: '20123456789'
                },
                periodo: '2024-Q1',
                fechaEvaluacion: '2024-03-15',
                evaluador: 'María González',
                estado: 'completada',
                puntuacionTotal: 8.5,
                categorias: {
                    calidad: 9.0,
                    cumplimiento: 8.5,
                    atencionCliente: 8.0,
                    precios: 8.5,
                    innovacion: 8.0
                },
                observaciones: 'Proveedor con excelente desempeño en calidad. Se recomienda mantener la relación comercial.',
                documentos: ['evaluacion_q1_2024.pdf', 'evidencias_calidad.pdf']
            },
            {
                id: '2',
                proveedor: {
                    id: 'prov-002',
                    nombre: 'Servicios Integrales XYZ E.I.R.L.',
                    ruc: '20987654321'
                },
                periodo: '2024-Q1',
                fechaEvaluacion: '2024-03-10',
                evaluador: 'Carlos Ramírez',
                estado: 'en_proceso',
                puntuacionTotal: 7.2,
                categorias: {
                    calidad: 7.5,
                    cumplimiento: 6.5,
                    atencionCliente: 7.0,
                    precios: 8.0,
                    innovacion: 7.0
                },
                observaciones: 'Requiere mejora en tiempos de entrega. Calidad aceptable.',
                documentos: ['evaluacion_parcial.pdf']
            },
            {
                id: '3',
                proveedor: {
                    id: 'prov-003',
                    nombre: 'Tecnología Avanzada S.A.',
                    ruc: '20555666777'
                },
                periodo: '2024-Q1',
                fechaEvaluacion: '2024-03-20',
                evaluador: 'Ana Torres',
                estado: 'pendiente',
                puntuacionTotal: 0,
                categorias: {
                    calidad: 0,
                    cumplimiento: 0,
                    atencionCliente: 0,
                    precios: 0,
                    innovacion: 0
                }
            }
        ];
        setEvaluaciones(datosEjemplo);
    }, []);

    // Funciones auxiliares
    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'completada': return 'success';
            case 'en_proceso': return 'warning';
            case 'pendiente': return 'default';
            case 'revisada': return 'primary';
            default: return 'default';
        }
    };

    const getStatusText = (estado: string) => {
        switch (estado) {
            case 'completada': return 'Completada';
            case 'en_proceso': return 'En Proceso';
            case 'pendiente': return 'Pendiente';
            case 'revisada': return 'Revisada';
            default: return estado;
        }
    };

    const getPuntuacionColor = (puntuacion: number) => {
        if (puntuacion >= 8.5) return 'text-green-600';
        if (puntuacion >= 7.0) return 'text-yellow-600';
        if (puntuacion >= 5.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating / 2);
        const hasHalfStar = rating % 2 >= 1;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarIcon key={i} className="w-4 h-4 text-yellow-400" />);
            } else {
                stars.push(<StarIcon key={i} className="w-4 h-4 text-gray-300" />);
            }
        }
        return stars;
    };

    // Filtrar evaluaciones
    const evaluacionesFiltradas = evaluaciones.filter(evaluacion => {
        const coincideBusqueda = evaluacion.proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            evaluacion.proveedor.ruc.includes(busqueda);
        const coincidenEstado = filtroEstado === 'todos' || evaluacion.estado === filtroEstado;
        return coincideBusqueda && coincidenEstado;
    });

    // Componente de estadísticas
    const EstadisticasCard = () => {
        const totalEvaluaciones = evaluaciones.length;
        const completadas = evaluaciones.filter(e => e.estado === 'completada').length;
        const promedioGeneral = evaluaciones.length > 0
            ? evaluaciones.reduce((acc, e) => acc + e.puntuacionTotal, 0) / evaluaciones.length
            : 0;

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Evaluaciones</p>
                                <p className="text-2xl font-bold">{totalEvaluaciones}</p>
                            </div>
                            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Completadas</p>
                                <p className="text-2xl font-bold text-green-600">{completadas}</p>
                            </div>
                            <ChartBarIcon className="w-8 h-8 text-green-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Promedio General</p>
                                <p className={`text-2xl font-bold ${getPuntuacionColor(promedioGeneral)}`}>
                                    {promedioGeneral.toFixed(1)}
                                </p>
                            </div>
                            <StarIconSolid className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">En Proceso</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {evaluaciones.filter(e => e.estado === 'en_proceso').length}
                                </p>
                            </div>
                            <CalendarIcon className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    };

    // Modal para ver detalles de evaluación
    const ModalDetalles = () => (
        <Modal
            isOpen={isViewOpen}
            onClose={onViewClose}
            size="4xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold">Detalles de Evaluación</h3>
                    {selectedEvaluacion && (
                        <p className="text-sm text-gray-500">
                            {selectedEvaluacion.proveedor.nombre} - {selectedEvaluacion.periodo}
                        </p>
                    )}
                </ModalHeader>
                <ModalBody>
                    {selectedEvaluacion && (
                        <div className="space-y-6">
                            {/* Información general */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                                            <h4 className="font-semibold">Información del Proveedor</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <p><span className="font-medium">Nombre:</span> {selectedEvaluacion.proveedor.nombre}</p>
                                            <p><span className="font-medium">RUC:</span> {selectedEvaluacion.proveedor.ruc}</p>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Card>
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CalendarIcon className="w-5 h-5 text-green-500" />
                                            <h4 className="font-semibold">Información de la Evaluación</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <p><span className="font-medium">Período:</span> {selectedEvaluacion.periodo}</p>
                                            <p><span className="font-medium">Fecha:</span> {selectedEvaluacion.fechaEvaluacion}</p>
                                            <p><span className="font-medium">Evaluador:</span> {selectedEvaluacion.evaluador}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Estado:</span>
                                                <Chip color={getStatusColor(selectedEvaluacion.estado)} variant="flat" size="sm">
                                                    {getStatusText(selectedEvaluacion.estado)}
                                                </Chip>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Puntuación total */}
                            <Card>
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <h4 className="text-lg font-semibold mb-2">Puntuación Total</h4>
                                        <div className={`text-4xl font-bold ${getPuntuacionColor(selectedEvaluacion.puntuacionTotal)}`}>
                                            {selectedEvaluacion.puntuacionTotal.toFixed(1)}
                                        </div>
                                        <div className="flex justify-center gap-1 mt-2">
                                            {renderStars(selectedEvaluacion.puntuacionTotal)}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Categorías de evaluación */}
                            <Card>
                                <CardHeader>
                                    <h4 className="font-semibold">Evaluación por Categorías</h4>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    {Object.entries(selectedEvaluacion.categorias).map(([categoria, puntuacion]) => (
                                        <div key={categoria}>
                                            <div className="flex justify-between items-center mb-2">
                        <span className="capitalize font-medium">
                          {categoria.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                                                <span className={`font-semibold ${getPuntuacionColor(puntuacion)}`}>
                          {puntuacion.toFixed(1)}
                        </span>
                                            </div>
                                            <Progress
                                                value={puntuacion * 10}
                                                color={puntuacion >= 8.5 ? 'success' : puntuacion >= 7 ? 'warning' : 'danger'}
                                                className="mb-2"
                                            />
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>

                            {/* Observaciones */}
                            {selectedEvaluacion.observaciones && (
                                <Card>
                                    <CardHeader>
                                        <h4 className="font-semibold">Observaciones</h4>
                                    </CardHeader>
                                    <CardBody>
                                        <p className="text-gray-700">{selectedEvaluacion.observaciones}</p>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Documentos */}
                            {selectedEvaluacion.documentos && selectedEvaluacion.documentos.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <h4 className="font-semibold">Documentos Adjuntos</h4>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-2">
                                            {selectedEvaluacion.documentos.map((doc, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                                                    <span className="flex-1">{doc}</span>
                                                    <Button size="sm" variant="light" color="primary">
                                                        Descargar
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onViewClose}>
                        Cerrar
                    </Button>
                    {(rol === 'ADMIN' || rol === 'COMPRAS') && selectedEvaluacion?.estado !== 'completada' && (
                        <Button color="primary">
                            Editar Evaluación
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );

    return (
        <Dashboard>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluaciones de Proveedores</h1>
                    <p className="text-gray-600">
                        Gestiona y supervisa las evaluaciones de desempeño de tus proveedores
                    </p>
                </div>

                {/* Tabs */}
                <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    className="mb-6"
                >
                    <Tab key="lista" title="Lista de Evaluaciones">
                        {/* Estadísticas */}
                        <EstadisticasCard/>

                        {/* Controles */}
                        <Card className="mb-6">
                            <CardBody className="p-4">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                                        <Input
                                            placeholder="Buscar por nombre o RUC..."
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400"/>}
                                            className="w-full md:w-80"
                                        />

                                        <Select
                                            placeholder="Filtrar por estado"
                                            selectedKeys={[filtroEstado]}
                                            onSelectionChange={(keys) => setFiltroEstado(Array.from(keys)[0] as string)}
                                            className="w-full md:w-48"
                                            startContent={<FunnelIcon className="w-4 h-4 text-gray-400"/>}
                                        >
                                            <SelectItem key="todos" value="todos">Todos los estados</SelectItem>
                                            <SelectItem key="pendiente" value="pendiente">Pendiente</SelectItem>
                                            <SelectItem key="en_proceso" value="en_proceso">En Proceso</SelectItem>
                                            <SelectItem key="completada" value="completada">Completada</SelectItem>
                                            <SelectItem key="revisada" value="revisada">Revisada</SelectItem>
                                        </Select>
                                    </div>

                                    {(rol === 'ADMIN' || rol === 'COMPRAS') && (
                                        <Button
                                            color="primary"
                                            startContent={<PlusIcon className="w-4 h-4"/>}
                                            onPress={onCreateOpen}
                                        >
                                            Nueva Evaluación
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Tabla de evaluaciones */}
                        <Card>
                            <CardBody className="p-0">
                                <Table aria-label="Tabla de evaluaciones" removeWrapper>
                                    <TableHeader>
                                        <TableColumn>PROVEEDOR</TableColumn>
                                        <TableColumn>PERÍODO</TableColumn>
                                        <TableColumn>FECHA</TableColumn>
                                        <TableColumn>EVALUADOR</TableColumn>
                                        <TableColumn>ESTADO</TableColumn>
                                        <TableColumn>PUNTUACIÓN</TableColumn>
                                        <TableColumn align="center">ACCIONES</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {evaluacionesFiltradas.map((evaluacion) => (
                                            <TableRow key={evaluacion.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            name={evaluacion.proveedor.nombre.charAt(0)}
                                                            size="sm"
                                                            className="bg-blue-100 text-blue-600"
                                                        />
                                                        <div>
                                                            <p className="font-medium">{evaluacion.proveedor.nombre}</p>
                                                            <p className="text-sm text-gray-500">RUC: {evaluacion.proveedor.ruc}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{evaluacion.periodo}</span>
                                                </TableCell>
                                                <TableCell>{evaluacion.fechaEvaluacion}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4 text-gray-400"/>
                                                        {evaluacion.evaluador}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        color={getStatusColor(evaluacion.estado)}
                                                        variant="flat"
                                                        size="sm"
                                                    >
                                                        {getStatusText(evaluacion.estado)}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    {evaluacion.puntuacionTotal > 0 ? (
                                                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${getPuntuacionColor(evaluacion.puntuacionTotal)}`}>
                              {evaluacion.puntuacionTotal.toFixed(1)}
                            </span>
                                                            <div className="flex gap-0.5">
                                                                {renderStars(evaluacion.puntuacionTotal)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="primary"
                                                            startContent={<EyeIcon className="w-4 h-4"/>}
                                                            onPress={() => {
                                                                setSelectedEvaluacion(evaluacion);
                                                                onViewOpen();
                                                            }}
                                                        >
                                                            Ver
                                                        </Button>
                                                        {(rol === 'ADMIN' || rol === 'COMPRAS') && (
                                                            <Dropdown>
                                                                <DropdownTrigger>
                                                                    <Button size="sm" variant="light">
                                                                        ⋮
                                                                    </Button>
                                                                </DropdownTrigger>
                                                                <DropdownMenu>
                                                                    <DropdownItem
                                                                        key="edit"
                                                                        startContent={<PencilIcon className="w-4 h-4"/>}
                                                                    >
                                                                        Editar
                                                                    </DropdownItem>
                                                                    <DropdownItem
                                                                        key="delete"
                                                                        color="danger"
                                                                        startContent={<TrashIcon className="w-4 h-4"/>}
                                                                    >
                                                                        Eliminar
                                                                    </DropdownItem>
                                                                </DropdownMenu>
                                                            </Dropdown>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Tab>

                    <Tab key="reportes" title="Reportes y Análisis">
                        <div className="text-center py-12">
                            <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Reportes y Análisis</h3>
                            <p className="text-gray-500">
                                Próximamente: Gráficos de tendencias, comparativas y reportes detallados
                            </p>
                        </div>
                    </Tab>
                </Tabs>

                {/* Modales */}
                <ModalDetalles/>
            </div>
        </Dashboard>
    );
};

export default Evaluaciones;