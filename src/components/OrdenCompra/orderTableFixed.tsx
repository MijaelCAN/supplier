// import React from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Card,
    CardBody
} from "@heroui/react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { usePurchaseOrders } from '@/store/extendedStore';

const OrderTableFixed = () => {
    const { purchaseOrders } = usePurchaseOrders();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprobada': return 'success';
            case 'Pendiente': return 'warning';
            case 'En Proceso': return 'primary';
            case 'Completada': return 'success';
            case 'Cancelada': return 'danger';
            default: return 'default';
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: currency === 'PEN' ? 'PEN' : 'USD'
        }).format(amount);
    };

    return (
        <Card>
            <CardBody>
                <Table aria-label="Tabla de órdenes de compra">
                    <TableHeader>
                        <TableColumn>N° ORDEN</TableColumn>
                        <TableColumn>PROVEEDOR</TableColumn>
                        <TableColumn>MONTO</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn>FECHA</TableColumn>
                        <TableColumn>ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {purchaseOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-bold">{order.orderNumber}</p>
                                        <p className="text-xs text-gray-500">{order.department}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p>{order.supplierName}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="font-bold">
                                        {formatCurrency(order.totalAmount, order.currency)}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        color={getStatusColor(order.status) as any} 
                                        variant="flat"
                                        size="sm"
                                    >
                                        {order.status}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm">{order.createdDate}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button isIconOnly size="sm" variant="light">
                                            <EyeIcon className="h-4 w-4" />
                                        </Button>
                                        <Button isIconOnly size="sm" variant="light">
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button isIconOnly size="sm" variant="light" color="danger">
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardBody>
        </Card>
    );
};

export default OrderTableFixed;
