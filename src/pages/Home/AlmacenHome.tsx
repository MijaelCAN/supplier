import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Divider,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination, Avatar
} from '@heroui/react';
import { Icon } from '@iconify/react';
import Dashboard from "@/layouts/Dashboard";
import {useAuth} from "@/store/authStore.ts";

// Mock Data
const stats = [
    { label: 'Inventario Total', value: '1,245 items', icon: 'mdi:package-variant', color: 'primary' },
    { label: 'Stock Crítico', value: '23 items', icon: 'mdi:alert-octagon', color: 'danger' },
    { label: 'Entradas (Mes)', value: '89', icon: 'mdi:truck-delivery', color: 'success' },
    { label: 'Salidas (Mes)', value: '124', icon: 'mdi:exit-to-app', color: 'warning' }
];

const recentMovements = [
    { id: 1, date: '2024-03-15', item: 'Tornillería Industrial', type: 'Entrada', quantity: 500 },
    { id: 2, date: '2024-03-14', item: 'Lámina Galvanizada', type: 'Salida', quantity: 30 },
    { id: 3, date: '2024-03-13', item: 'Cemento Portland', type: 'Entrada', quantity: 100 },
];

const quickActions = [
    { label: 'Nuevo Movimiento', icon: 'mdi:plus-circle', color: 'primary' },
    { label: 'Inventario Físico', icon: 'mdi:barcode-scan', color: 'success' },
    { label: 'Reportes', icon: 'mdi:file-chart', color: 'warning' },
    { label: 'Proveedores', icon: 'mdi:account-supplier', color: 'secondary' },
];

export default function AlmacenHome() {
    const { currentUser } = useAuth();
    return (
        <Dashboard>
            <div className="space-y-6">
                {/* Encabezado */}
                {/* Header de bienvenida */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            ¡Bienvenido, {currentUser?.firstName}!
                        </h1>
                        <p className="text-gray-600">
                            Panel de Gestión de Almacen de Insumos y Materiales
                        </p>
                    </div>
                    <Avatar
                        src={currentUser?.avatar}
                        name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        size="lg"
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat, index) => (
                        <Card key={index} className="bg-white dark:bg-gray-800">
                            <CardBody className="flex flex-row items-center gap-4">
                                <Icon
                                    icon={stat.icon}
                                    className={`text-${stat.color} text-4xl mb-2`}
                                />
                                <div className="flex-1">
                                    <h3 className="text-2xl font-semibold">{stat.value}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{stat.label}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-lg font-semibold">Acciones Rápidas</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActions.map((action, index) => (
                                <Button
                                    key={index}
                                    color={action.color as any}
                                    variant="flat"
                                    className="h-24 flex-col gap-2"
                                >
                                    <Icon icon={action.icon} className="text-2xl"/>
                                    <span>{action.label}</span>
                                </Button>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Recent Movements */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Movimientos Recientes</h2>
                            <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                endContent={<Icon icon="mdi:eye"/>}
                            >
                                Ver todos
                            </Button>
                        </div>
                    </CardHeader>
                    <Divider/>
                    <Table
                        aria-label="Movimientos recientes"
                        className="p-4"
                        bottomContent={
                            <div className="flex w-full justify-center">
                                <Pagination total={10} initialPage={1}/>
                            </div>
                        }
                    >
                        <TableHeader>
                            <TableColumn>FECHA</TableColumn>
                            <TableColumn>ARTÍCULO</TableColumn>
                            <TableColumn>TIPO</TableColumn>
                            <TableColumn>CANT.</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {recentMovements.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.item}</TableCell>
                                    <TableCell>
                                        <Chip
                                            color={item.type === 'Entrada' ? 'success' : 'warning'}
                                            className="text-xs"
                                        >
                                            {item.type}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </Dashboard>
    );
}