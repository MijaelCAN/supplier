import React, {useState} from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Slider,
    Progress,
    Divider,
    Chip,
    RadioGroup,
    Radio,
    Checkbox,
    CheckboxGroup,
    Avatar,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@heroui/react";
import {
    StarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    TruckIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    GlobeAltIcon,
    DocumentCheckIcon,
    BeakerIcon,
    HandThumbUpIcon,
    CalendarIcon,
    BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import {StarIcon as StarIconSolid} from "@heroicons/react/24/solid";
import Dashboard from "@/layouts/Dashboard";
import SupplierProfileCard from "@/pages/Proveedores/Profile/CardProfile.tsx";
import ProveedorInfo from "@/components/Proveedores/Evaluations/CardInfo.tsx";

// Criterios de evaluación estructurados
interface CriterioEvaluacion {
    id: string;
    categoria: string;
    nombre: string;
    descripcion: string;
    peso: number;
    tipo: 'escala' | 'boolean' | 'multiple';
    opciones?: string[];
    valor: number;
    observaciones?: string;
}

interface FormularioEvaluacionProps {
    rol: 'ADMIN' | 'COMPRAS' | 'PROVEEDOR' | 'FINANZAS';
}

const FormularioEvaluacion: React.FC<FormularioEvaluacionProps> = ({rol}) => {
    /*const [datosProveedor, setDatosProveedor] = useState({
        nombre: '',
        ruc: '',
        contacto: '',
        email: '',
        telefono: ''
    });*/
    const [datosProveedor, setDatosProveedor] = useState({
        id: 1,
        categoria: "SERVICIOS",
        logo: "https://i.pravatar.cc/150?u=medicos",
        nombre: "Servicios Médicos Integrales",
        ruc: "20789123456",
        contacto: "Dra. Patricia Lopez",
        email: "serviciosmedicos@miempresa.com",
        telefono: "+51 956875468",
    })

    const [datosEvaluacion, setDatosEvaluacion] = useState({
        periodo: '',
        fechaEvaluacion: new Date().toISOString().split('T')[0],
        evaluador: '',
        tipoEvaluacion: 'trimestral'
    });

    const [criterios, setCriterios] = useState<CriterioEvaluacion[]>([
        // 1. CALIDAD DEL PRODUCTO/SERVICIO
        {
            id: 'cal_001',
            categoria: 'Calidad',
            nombre: 'Conformidad del Producto/Servicio',
            descripcion: 'El producto/servicio cumple con las especificaciones técnicas acordadas',
            peso: 20,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cal_002',
            categoria: 'Calidad',
            nombre: 'Consistencia en la Calidad',
            descripcion: 'Mantiene estándares de calidad uniformes en todas las entregas',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cal_003',
            categoria: 'Calidad',
            nombre: 'Certificaciones de Calidad',
            descripcion: 'Cuenta con certificaciones ISO, HACCP u otras relevantes',
            peso: 10,
            tipo: 'boolean',
            valor: 0
        },
        {
            id: 'cal_004',
            categoria: 'Calidad',
            nombre: 'Control de Calidad',
            descripcion: 'Implementa procesos efectivos de control de calidad',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },

        // 2. CUMPLIMIENTO Y PUNTUALIDAD
        {
            id: 'cum_001',
            categoria: 'Cumplimiento',
            nombre: 'Puntualidad en Entregas',
            descripcion: 'Cumple con los plazos de entrega acordados',
            peso: 20,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cum_002',
            categoria: 'Cumplimiento',
            nombre: 'Cumplimiento de Cantidades',
            descripcion: 'Entrega las cantidades exactas solicitadas',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cum_003',
            categoria: 'Cumplimiento',
            nombre: 'Cumplimiento Contractual',
            descripcion: 'Respeta términos y condiciones del contrato',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cum_004',
            categoria: 'Cumplimiento',
            nombre: 'Flexibilidad ante Cambios',
            descripcion: 'Capacidad de adaptación a cambios urgentes o modificaciones',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },

        // 3. SERVICIO AL CLIENTE
        {
            id: 'ser_001',
            categoria: 'Servicio',
            nombre: 'Tiempo de Respuesta',
            descripcion: 'Rapidez en responder consultas, cotizaciones y reclamos',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'ser_002',
            categoria: 'Servicio',
            nombre: 'Atención Personalizada',
            descripcion: 'Brinda atención dedicada y personalizada',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'ser_003',
            categoria: 'Servicio',
            nombre: 'Resolución de Problemas',
            descripcion: 'Eficiencia en la resolución de problemas y reclamos',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'ser_004',
            categoria: 'Servicio',
            nombre: 'Comunicación Proactiva',
            descripcion: 'Informa proactivamente sobre el estado de pedidos y posibles inconvenientes',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },

        // 4. COMPETITIVIDAD DE PRECIOS
        {
            id: 'pre_001',
            categoria: 'Precios',
            nombre: 'Competitividad de Precios',
            descripcion: 'Sus precios son competitivos en el mercado',
            peso: 20,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'pre_002',
            categoria: 'Precios',
            nombre: 'Estabilidad de Precios',
            descripcion: 'Mantiene estabilidad en sus precios durante el período acordado',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'pre_003',
            categoria: 'Precios',
            nombre: 'Transparencia en Costos',
            descripcion: 'Claridad y transparencia en la estructura de costos',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },

        // 5. CAPACIDAD TÉCNICA Y LOGÍSTICA
        {
            id: 'cap_001',
            categoria: 'Capacidad',
            nombre: 'Capacidad de Producción',
            descripcion: 'Tiene capacidad suficiente para atender nuestros volúmenes',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cap_002',
            categoria: 'Capacidad',
            nombre: 'Infraestructura Logística',
            descripcion: 'Cuenta con infraestructura logística adecuada',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cap_003',
            categoria: 'Capacidad',
            nombre: 'Tecnología y Equipamiento',
            descripcion: 'Utiliza tecnología moderna y equipamiento actualizado',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'cap_004',
            categoria: 'Capacidad',
            nombre: 'Personal Técnico Calificado',
            descripcion: 'Cuenta con personal técnico competente y calificado',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },

        // 6. RESPONSABILIDAD SOCIAL Y AMBIENTAL
        {
            id: 'rsa_001',
            categoria: 'RSA',
            nombre: 'Prácticas Ambientales',
            descripcion: 'Implementa prácticas sostenibles y respetuosas con el medio ambiente',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'rsa_002',
            categoria: 'RSA',
            nombre: 'Responsabilidad Social',
            descripción: 'Desarrolla programas de responsabilidad social corporativa',
            peso: 5,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'rsa_003',
            categoria: 'RSA',
            nombre: 'Certificaciones Ambientales',
            descripcion: 'Posee certificaciones ambientales (ISO 14001, etc.)',
            peso: 5,
            tipo: 'boolean',
            valor: 0
        },

        // 7. ESTABILIDAD FINANCIERA
        {
            id: 'fin_001',
            categoria: 'Financiera',
            nombre: 'Solidez Financiera',
            descripcion: 'Demuestra estabilidad y solidez financiera',
            peso: 15,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'fin_002',
            categoria: 'Financiera',
            nombre: 'Historial de Pagos',
            descripcion: 'Cumple puntualmente con sus obligaciones financieras',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },

        // 8. INNOVACIÓN Y MEJORA CONTINUA
        {
            id: 'inn_001',
            categoria: 'Innovación',
            nombre: 'Capacidad de Innovación',
            descripcion: 'Propone mejoras e innovaciones en productos/servicios',
            peso: 10,
            tipo: 'escala',
            valor: 0
        },
        {
            id: 'inn_002',
            categoria: 'Innovación',
            nombre: 'Mejora Continua',
            descripcion: 'Implementa procesos de mejora continua',
            peso: 10,
            tipo: 'escala',
            valor: 0
        }
    ]);

    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [recomendaciones, setRecomendaciones] = useState('');

    const {isOpen, onOpen, onClose} = useDisclosure();

    // Funciones auxiliares
    const getCategoriaIcon = (categoria: string) => {
        switch (categoria) {
            case 'Calidad':
                return <BeakerIcon className="w-5 h-5"/>;
            case 'Cumplimiento':
                return <CheckCircleIcon className="w-5 h-5"/>;
            case 'Servicio':
                return <UserGroupIcon className="w-5 h-5"/>;
            case 'Precios':
                return <CurrencyDollarIcon className="w-5 h-5"/>;
            case 'Capacidad':
                return <WrenchScrewdriverIcon className="w-5 h-5"/>;
            case 'RSA':
                return <GlobeAltIcon className="w-5 h-5"/>;
            case 'Financiera':
                return <ChartBarIcon className="w-5 h-5"/>;
            case 'Innovación':
                return <StarIcon className="w-5 h-5"/>;
            default:
                return <DocumentCheckIcon className="w-5 h-5"/>;
        }
    };

    const getCategoriaColor = (categoria: string) => {
        switch (categoria) {
            case 'Calidad':
                return 'text-blue-600';
            case 'Cumplimiento':
                return 'text-green-600';
            case 'Servicio':
                return 'text-purple-600';
            case 'Precios':
                return 'text-yellow-600';
            case 'Capacidad':
                return 'text-red-600';
            case 'RSA':
                return 'text-emerald-600';
            case 'Financiera':
                return 'text-orange-600';
            case 'Innovación':
                return 'text-pink-600';
            default:
                return 'text-gray-600';
        }
    };

    const updateCriterio = (id: string, valor: number, observaciones?: string) => {
        setCriterios(prev => prev.map(criterio =>
            criterio.id === id
                ? {...criterio, valor, observaciones}
                : criterio
        ));
    };

    const calcularPuntuacionTotal = () => {
        const totalPeso = criterios.reduce((sum, c) => sum + c.peso, 0);
        const puntuacionPonderada = criterios.reduce((sum, c) => sum + (c.valor * c.peso), 0);
        return totalPeso > 0 ? (puntuacionPonderada / totalPeso) : 0;
    };

    const calcularPuntuacionCategoria = (categoria: string) => {
        const criteriosCategoria = criterios.filter(c => c.categoria === categoria);
        const totalPeso = criteriosCategoria.reduce((sum, c) => sum + c.peso, 0);
        const puntuacionPonderada = criteriosCategoria.reduce((sum, c) => sum + (c.valor * c.peso), 0);
        return totalPeso > 0 ? (puntuacionPonderada / totalPeso) : 0;
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
                stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400"/>);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarIcon key={i} className="w-4 h-4 text-yellow-400"/>);
            } else {
                stars.push(<StarIcon key={i} className="w-4 h-4 text-gray-300"/>);
            }
        }
        return stars;
    };

    const categorias = [...new Set(criterios.map(c => c.categoria))];

    const handleSubmit = () => {
        // Aquí iría la lógica para guardar la evaluación
        console.log('Datos del proveedor:', datosProveedor);
        console.log('Datos de evaluación:', datosEvaluacion);
        console.log('Criterios evaluados:', criterios);
        console.log('Observaciones:', observacionesGenerales);
        console.log('Recomendaciones:', recomendaciones);
        console.log('Puntuación total:', calcularPuntuacionTotal());
        onOpen();
    };

    const data = {
        nombre: "Inversiones Metalica SAC",
        ruc: "20565879645",
        contacto: "963852741",
        email: "inversiones@gmail.com.pe",
        telefono: "555-66666"
    }

    return (
        <Dashboard>
            <div className="w-full space-y-6">
                {/* Header */}
                {/*<div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluación de Proveedor</h1>
                        <p className="text-gray-600">
                            Complete todos los criterios de evaluación para generar una calificación integral del
                            proveedor
                        </p>
                    </div>*/}

                {/* Información del Proveedor */}
                <div className="flex flex-col">
                    <ProveedorInfo datosProveedor={datosProveedor} />
                    <Card className="shadow-lg border-0" radius="none">

                        <CardBody>
                            <div className="grid grid-cols-1 items-center md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                                        <div className="text-center">
                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-gray-800 mb-2">Puntuación General</h3>
                                                <p className="text-sm text-gray-500">Resultado consolidado de la evaluación</p>
                                            </div>

                                            {/* Círculo de puntuación animado */}
                                            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
                                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-gray-200"
                                                        d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    />
                                                    <path
                                                        className={`${getPuntuacionColor(calcularPuntuacionTotal())} transition-all duration-1000`}
                                                        d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeDasharray={`${calcularPuntuacionTotal() * 10}, 100`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className={`text-4xl font-bold ${getPuntuacionColor(calcularPuntuacionTotal())}`}>
                                                            {calcularPuntuacionTotal().toFixed(1)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">de 10.0</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Estrellas con animación */}
                                            <div className="flex justify-center gap-1 mb-4">
                                                {renderStars(calcularPuntuacionTotal())}
                                            </div>

                                            {/* Badge de clasificación */}
                                            <div className="inline-flex items-center gap-2">
                                                <Chip
                                                    color={calcularPuntuacionTotal() >= 8.5 ? 'success' :
                                                        calcularPuntuacionTotal() >= 7 ? 'warning' : 'danger'}
                                                    variant="solid"
                                                    size="lg"
                                                    className="font-bold px-4"
                                                >
                                                    {calcularPuntuacionTotal() >= 8.5 ? 'Excelente' :
                                                        calcularPuntuacionTotal() >= 7 ? 'Bueno' : 'Requiere Mejora'}
                                                </Chip>
                                            </div>

                                            {/* Estadísticas adicionales */}
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    <div>
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {categorias.filter(cat => calcularPuntuacionCategoria(cat) >= 7).length}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Categorías Aprobadas</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {categorias.length}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Total Evaluadas</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Puntuación por Categorías</h3>
                                    <div className="space-y-3">
                                        {categorias.map(categoria => {
                                            const puntuacion = calcularPuntuacionCategoria(categoria);
                                            return (
                                                <div key={categoria} className="flex items-center gap-3">
                                                    <div className="bg-gray-200 rounded-lg">
                                                        {getCategoriaIcon(categoria)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-medium">{categoria}</span>
                                                            <span
                                                                className={`font-semibold ${getPuntuacionColor(puntuacion)}`}>
                            {puntuacion.toFixed(1)}
                          </span>
                                                        </div>
                                                        <Progress
                                                            value={puntuacion * 10}
                                                            color={puntuacion >= 8.5 ? 'success' : puntuacion >= 7 ? 'warning' : 'danger'}
                                                            size="sm"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>


                {/* Información de la Evaluación */}
                {/*<Card className="mb-6" radius="none">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-6 h-6 text-green-500"/>
                            <h2 className="text-xl font-semibold">Datos de la Evaluación</h2>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Input
                                label="Período"
                                placeholder="2024-Q1"
                                value={datosEvaluacion.periodo}
                                onChange={(e) => setDatosEvaluacion(prev => ({...prev, periodo: e.target.value}))}
                                isRequired
                            />
                            <Input
                                label="Fecha de Evaluación"
                                type="date"
                                value={datosEvaluacion.fechaEvaluacion}
                                onChange={(e) => setDatosEvaluacion(prev => ({
                                    ...prev,
                                    fechaEvaluacion: e.target.value
                                }))}
                                isRequired
                            />
                            <Input
                                label="Evaluador"
                                placeholder="Nombre del evaluador"
                                value={datosEvaluacion.evaluador}
                                onChange={(e) => setDatosEvaluacion(prev => ({...prev, evaluador: e.target.value}))}
                                isRequired
                            />
                            <Select
                                label="Tipo de Evaluación"
                                selectedKeys={[datosEvaluacion.tipoEvaluacion]}
                                onSelectionChange={(keys) => setDatosEvaluacion(prev => ({
                                    ...prev,
                                    tipoEvaluacion: Array.from(keys)[0] as string
                                }))}
                            >
                                <SelectItem key="mensual" value="mensual">Mensual</SelectItem>
                                <SelectItem key="trimestral" value="trimestral">Trimestral</SelectItem>
                                <SelectItem key="semestral" value="semestral">Semestral</SelectItem>
                                <SelectItem key="anual" value="anual">Anual</SelectItem>
                            </Select>
                        </div>
                    </CardBody>
                </Card>*/}

                {/* Resumen de Puntuación */}

                {/*<Card className="mb-8 shadow-xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 overflow-hidden">
                    {/* Header con diseño mejorado *
                    <CardHeader className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">Resumen Ejecutivo de Evaluación</h2>
                                    <p className="text-blue-100 text-sm mt-1">Dashboard completo de resultados</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative elements *
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                    </CardHeader>

                    <CardBody className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Puntuación Total - Sección Principal *
                            <div className="relative">
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                                    <div className="text-center">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Puntuación General</h3>
                                            <p className="text-sm text-gray-500">Resultado consolidado de la evaluación</p>
                                        </div>

                                        {/* Círculo de puntuación animado *
                                        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
                                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    className="text-gray-200"
                                                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    className={`${getPuntuacionColor(calcularPuntuacionTotal())} transition-all duration-1000`}
                                                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeDasharray={`${calcularPuntuacionTotal() * 10}, 100`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className={`text-4xl font-bold ${getPuntuacionColor(calcularPuntuacionTotal())}`}>
                                                        {calcularPuntuacionTotal().toFixed(1)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">de 10.0</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Estrellas con animación *
                                        <div className="flex justify-center gap-1 mb-4">
                                            {renderStars(calcularPuntuacionTotal())}
                                        </div>

                                        {/* Badge de clasificación *
                                        <div className="inline-flex items-center gap-2">
                                            <Chip
                                                color={calcularPuntuacionTotal() >= 8.5 ? 'success' :
                                                    calcularPuntuacionTotal() >= 7 ? 'warning' : 'danger'}
                                                variant="solid"
                                                size="lg"
                                                className="font-bold px-4"
                                            >
                                                {calcularPuntuacionTotal() >= 8.5 ? 'Excelente' :
                                                    calcularPuntuacionTotal() >= 7 ? 'Bueno' : 'Requiere Mejora'}
                                            </Chip>
                                        </div>

                                        {/* Estadísticas adicionales *
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {categorias.filter(cat => calcularPuntuacionCategoria(cat) >= 7).length}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Categorías Aprobadas</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {categorias.length}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Total Evaluadas</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Puntuación por Categorías - Sección Detallada *
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Análisis por Categorías</h3>
                                    <p className="text-sm text-gray-500">Desglose detallado del rendimiento</p>
                                </div>

                                <div className="space-y-4">
                                    {categorias.map((categoria, index) => {
                                        const puntuacion = calcularPuntuacionCategoria(categoria);
                                        const porcentaje = (puntuacion / 10) * 100;

                                        return (
                                            <div key={categoria} className="group">
                                                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-center gap-4">
                                                        {/* Icono de categoría *
                                                        <div className={`flex-shrink-0 p-3 rounded-xl shadow-sm ${getCategoriaColor(categoria)}`}>
                                                            {getCategoriaIcon(categoria)}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            {/* Header de categoría *
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 truncate">{categoria}</h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              #{index + 1} de {categorias.length}
                            </span>
                                                                        <span className="text-xs text-gray-300">•</span>
                                                                        <span className={`text-sm font-bold ${getPuntuacionColor(puntuacion)}`}>
                              {puntuacion.toFixed(1)}/10
                            </span>
                                                                    </div>
                                                                </div>

                                                                {/* Badge de rendimiento *
                                                                <Chip
                                                                    color={puntuacion >= 8.5 ? 'success' : puntuacion >= 7 ? 'warning' : 'danger'}
                                                                    variant="flat"
                                                                    size="sm"
                                                                    className="font-medium"
                                                                >
                                                                    {porcentaje.toFixed(0)}%
                                                                </Chip>
                                                            </div>

                                                            {/* Barra de progreso mejorada *
                                                            <div className="space-y-2">
                                                                <Progress
                                                                    value={porcentaje}
                                                                    color={puntuacion >= 8.5 ? 'success' : puntuacion >= 7 ? 'warning' : 'danger'}
                                                                    size="md"
                                                                    className="w-full"
                                                                    classNames={{
                                                                        track: "bg-gray-100",
                                                                        indicator: "transition-all duration-500"
                                                                    }}
                                                                />

                                                                {/* Etiquetas de rendimiento *
                                                                <div className="flex justify-between text-xs text-gray-400">
                                                                    <span>Deficiente</span>
                                                                    <span>Regular</span>
                                                                    <span>Bueno</span>
                                                                    <span>Excelente</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Resumen final *
                                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="font-semibold text-blue-900">Resumen Ejecutivo</h4>
                                    </div>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        {calcularPuntuacionTotal() >= 8.5
                                            ? "Excelente desempeño general. La evaluación muestra resultados sobresalientes en la mayoría de categorías."
                                            : calcularPuntuacionTotal() >= 7
                                                ? "Buen desempeño general con oportunidades de mejora identificadas en algunas áreas específicas."
                                                : "Se han identificado áreas significativas de mejora. Se recomienda un plan de acción detallado."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>*/}

                {/* Criterios de Evaluación por Categoría */}
                {categorias.map(categoria => (
                    <Card key={categoria}
                          className="mb-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader className="flex justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between space-x-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-sm ${getCategoriaColor(categoria)}`}>
                                        {getCategoriaIcon(categoria)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{categoria}</h2>
                                        <p className="text-sm text-gray-500 mt-1">Evaluación por criterios</p>
                                    </div>
                                </div>
                                <div className="xs:hidden flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Puntuación
                                        </div>
                                        <Chip
                                            color={calcularPuntuacionCategoria(categoria) >= 8.5 ? 'success' :
                                                calcularPuntuacionCategoria(categoria) >= 7 ? 'warning' : 'danger'}
                                            variant="solid"
                                            size="lg"
                                            className="font-bold text-base px-4"
                                        >
                                            {calcularPuntuacionCategoria(categoria).toFixed(1)}/10
                                        </Chip>
                                    </div>
                                </div>
                            </div>

                            {/* Barra de progreso visual */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">Progreso general</span>
                                    <span className="text-xs text-gray-500">
          {calcularPuntuacionCategoria(categoria).toFixed(1)}% completado
        </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            calcularPuntuacionCategoria(categoria) >= 8.5 ? 'bg-success' :
                                                calcularPuntuacionCategoria(categoria) >= 7 ? 'bg-warning' : 'bg-danger'
                                        }`}
                                        style={{width: `${(calcularPuntuacionCategoria(categoria) / 10) * 100}%`}}
                                    />
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <div className="space-y-8">
                                {criterios.filter(c => c.categoria === categoria).map((criterio, index) => (
                                    <div key={criterio.id} className="group">
                                        <div
                                            className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200">

                                            {/* Header del criterio */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div
                                                            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                                                            {index + 1}
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-gray-900">{criterio.nombre}</h4>
                                                    </div>
                                                    <p className="text-gray-600 leading-relaxed mb-3">{criterio.descripcion}</p>
                                                    <div className="flex items-center gap-4 text-xs">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Peso: {criterio.peso}%
                  </span>
                                                        <span className="text-gray-400">
                    Tipo: {criterio.tipo === 'escala' ? 'Evaluación por escala' : 'Sí/No'}
                  </span>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <div
                                                        className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Puntuación
                                                    </div>
                                                    <div
                                                        className={`text-3xl font-bold ${getPuntuacionColor(criterio.valor)}`}>
                                                        {criterio.valor.toFixed(1)}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">de 10.0</div>
                                                </div>
                                            </div>

                                            {/* Control de evaluación */}
                                            <div className="mb-6">
                                                {criterio.tipo === 'escala' && (
                                                    <div className="space-y-4">
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <Slider
                                                                size="md"
                                                                step={0.5}
                                                                maxValue={10}
                                                                minValue={0}
                                                                value={criterio.valor}
                                                                onChange={(value) => updateCriterio(criterio.id, value as number)}
                                                                className="w-full"
                                                                color={criterio.valor >= 8.5 ? 'success' : criterio.valor >= 7 ? 'warning' : 'danger'}
                                                                marks={[
                                                                    {value: 0, label: "0"},
                                                                    {value: 2.5, label: "2.5"},
                                                                    {value: 5, label: "5.0"},
                                                                    {value: 7.5, label: "7.5"},
                                                                    {value: 10, label: "10"}
                                                                ]}
                                                            />
                                                            <div
                                                                className="flex justify-between text-xs text-gray-500 mt-3 px-1">
                                                                <span className="font-medium">Deficiente</span>
                                                                <span className="font-medium">Regular</span>
                                                                <span className="font-medium">Bueno</span>
                                                                <span className="font-medium">Muy Bueno</span>
                                                                <span className="font-medium">Excelente</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {criterio.tipo === 'boolean' && (
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <RadioGroup
                                                            orientation="horizontal"
                                                            value={criterio.valor.toString()}
                                                            onValueChange={(value) => updateCriterio(criterio.id, parseFloat(value))}
                                                            className="gap-6"
                                                        >
                                                            <Radio
                                                                value="10"
                                                                className="text-green-700"
                                                                classNames={{
                                                                    base: "bg-green-50 border-green-200 hover:bg-green-100",
                                                                    wrapper: "group-data-[selected=true]:border-green-500"
                                                                }}
                                                            >
                                                                <span className="font-semibold text-green-700">Sí</span>
                                                                <span className="text-green-600 ml-2">(10 puntos)</span>
                                                            </Radio>
                                                            <Radio
                                                                value="0"
                                                                className="text-red-700"
                                                                classNames={{
                                                                    base: "bg-red-50 border-red-200 hover:bg-red-100",
                                                                    wrapper: "group-data-[selected=true]:border-red-500"
                                                                }}
                                                            >
                                                                <span className="font-semibold text-red-700">No</span>
                                                                <span className="text-red-600 ml-2">(0 puntos)</span>
                                                            </Radio>
                                                        </RadioGroup>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Área de observaciones */}
                                            <div className="space-y-2">
                                                <label
                                                    className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                         viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                    </svg>
                                                    Observaciones específicas
                                                </label>
                                                <Textarea
                                                    placeholder="Agregue comentarios, observaciones o detalles específicos para este criterio..."
                                                    value={criterio.observaciones || ''}
                                                    onChange={(e) => updateCriterio(criterio.id, criterio.valor, e.target.value)}
                                                    minRows={3}
                                                    size="md"
                                                    classNames={{
                                                        input: "bg-white border-gray-200 focus:border-blue-400",
                                                        inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-blue-400"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Separador entre criterios */}
                                        {index < criterios.filter(c => c.categoria === categoria).length - 1 && (
                                            <div className="flex items-center justify-center my-6">
                                                <div className="flex-1 border-t border-gray-200"></div>
                                                <div className="px-4">
                                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                </div>
                                                <div className="flex-1 border-t border-gray-200"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                ))}

                {/* Observaciones Generales */}
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Observaciones y Recomendaciones</h2>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Textarea
                            label="Observaciones Generales"
                            placeholder="Comentarios generales sobre el desempeño del proveedor..."
                            value={observacionesGenerales}
                            onChange={(e) => setObservacionesGenerales(e.target.value)}
                            minRows={4}
                        />

                        <Textarea
                            label="Recomendaciones"
                            placeholder="Recomendaciones para mejorar la relación comercial..."
                            value={recomendaciones}
                            onChange={(e) => setRecomendaciones(e.target.value)}
                            minRows={4}
                        />
                    </CardBody>
                </Card>

                {/* Botones de Acción */}
                <div className="flex justify-end gap-4">
                    <Button variant="bordered" size="sm">
                        Guardar Borrador
                    </Button>
                    <Button
                        color="primary"
                        size="sm"
                        onPress={handleSubmit}
                        startContent={<HandThumbUpIcon className="w-5 h-5"/>}
                    >
                        Finalizar Evaluación
                    </Button>
                </div>

                {/* Modal de Confirmación */}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        <ModalHeader>
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-6 h-6 text-green-500"/>
                                Evaluación Completada
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="text-center space-y-4">
                                <div
                                    className={`text-4xl font-bold ${getPuntuacionColor(calcularPuntuacionTotal())}`}>
                                    {calcularPuntuacionTotal().toFixed(1)}
                                </div>
                                <div className="flex justify-center gap-1">
                                    {renderStars(calcularPuntuacionTotal())}
                                </div>
                                <p className="text-gray-600">
                                    La evaluación ha sido guardada exitosamente.
                                    El proveedor <strong>{datosProveedor.nombre}</strong> ha obtenido una
                                    puntuación de <strong>{calcularPuntuacionTotal().toFixed(1)}</strong> puntos.
                                </p>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                            <Button color="primary" onPress={onClose}>
                                Ver Reporte
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </Dashboard>
    );
};

export default FormularioEvaluacion;