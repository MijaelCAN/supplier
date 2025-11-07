/*import { FC } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";

interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    minRequired: number;
}

interface Order {
    id: number;
    supplier: string;
    status: 'Pending' | 'Accepted' | 'In Transit' | 'Received';
}

const inventoryData: InventoryItem[] = [
    { id: 1, name: 'Tornillos', quantity: 120, minRequired: 100 },
    { id: 2, name: 'Pintura blanca', quantity: 15, minRequired: 50 },
    { id: 3, name: 'Cables eléctricos', quantity: 300, minRequired: 200 },
];

const ordersData: Order[] = [
    { id: 101, supplier: 'Proveedor ABC', status: 'In Transit' },
    { id: 102, supplier: 'Proveedor XYZ', status: 'Pending' },
];

export const AlmacenHome: FC = () => {
    return (
        <Dashboard>
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Portal de Almacén de Insumos y Materiales</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3 flex items-center">
                        <ClipboardIcon className="w-6 h-6 mr-2"/> Estado del Inventario
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {inventoryData.map((item) => (
                            <div
                                key={item.id}
                                className={`p-4 rounded shadow ${
                                    item.quantity < item.minRequired ? 'bg-red-100' : 'bg-green-100'
                                }`}
                            >
                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                <p>
                                    Cantidad: <strong>{item.quantity}</strong> unidades
                                </p>
                                {item.quantity < item.minRequired ? (
                                    <p className="text-red-600 flex items-center">
                                        <ExclamationTriangleIcon className="w-5 h-5 mr-1"/> Nivel bajo
                                    </p>
                                ) : (
                                    <p className="text-green-600 flex items-center">
                                        <CheckCircleIcon className="w-5 h-5 mr-1"/> Stock suficiente
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">Estado de Órdenes de Compra</h2>
                    <table className="min-w-full table-auto border-collapse border border-gray-300">
                        <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">ID Orden</th>
                            <th className="border border-gray-300 p-2">Proveedor</th>
                            <th className="border border-gray-300 p-2">Estado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {ordersData.map((order) => (
                            <tr key={order.id}>
                                <td className="border border-gray-300 p-2 text-center">{order.id}</td>
                                <td className="border border-gray-300 p-2 text-center">{order.supplier}</td>
                                <td className="border border-gray-300 p-2 text-center">{order.status}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </Dashboard>
    );
};
*/

// AlmacenHome.tsx
import React from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
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
                                    as={React.forwardRef((props, ref) => (
                                        <div {...props} ref={ref} role="button"/>
                                    ))}
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