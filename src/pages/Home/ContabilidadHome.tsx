import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Avatar
} from "@heroui/react";
import {
    BookOpenIcon,
    DocumentTextIcon,
    EyeIcon,
    ArrowRightIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const ContabilidadHome = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    return (
        <Dashboard>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            ¡Bienvenido, {currentUser?.firstName}!
                        </h1>
                        <p className="text-gray-600">
                            Panel de Contabilidad — Consulta de Documentos
                        </p>
                    </div>
                    <Avatar
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        size="lg"
                    />
                </div>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    isPressable
                    onPress={() => navigate('/agenda')}
                >
                    <CardBody className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <BookOpenIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">Agenda - Citas</p>
                            <p className="text-sm text-gray-600">
                                Ver las citas de entrega y descargar los documentos que carga el proveedor en cada una
                            </p>
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                    </CardBody>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    isPressable
                    onPress={() => navigate('/factura')}
                >
                    <CardBody className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">Facturas</p>
                            <p className="text-sm text-gray-600">
                                Ver y descargar las facturas cargadas por los proveedores
                            </p>
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Accesos Disponibles</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <EyeIcon className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">Visualizar citas y sus documentos</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <ArrowDownTrayIcon className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-700">Descargar documentos</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            className="mt-4"
                            color="primary"
                            variant="flat"
                            endContent={<ArrowRightIcon className="h-4 w-4" />}
                            onPress={() => navigate('/agenda')}
                        >
                            Ir a Agenda - Citas
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </Dashboard>
    );
};

export default ContabilidadHome;
