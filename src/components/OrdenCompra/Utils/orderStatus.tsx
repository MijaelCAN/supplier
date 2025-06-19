import {OrderStatus} from "@/components/OrdenCompra/Types/orderTypes.ts";
import {CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, TruckIcon, XCircleIcon} from "@heroicons/react/24/outline";

export const getStatusColor = (status: OrderStatus) => {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
        partially_received: 'bg-orange-100 text-orange-800 border-orange-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getStatusText = (status: OrderStatus): string => {
    const texts: Record<OrderStatus, string> = {
        pending: 'Pendiente',
        in_transit: 'En Tránsito',
        partially_received: 'Parcialmente Recibido',
        completed: 'Completado',
        cancelled: 'Cancelado'
    };
    return texts[status] || 'Desconocido';
};

export const getStatusIcon = (status: OrderStatus) => {
    const icons = {
        pending: <ClockIcon className="w-4 h-4" />,
        in_transit: <TruckIcon className="w-4 h-4" />,
        partially_received: <ExclamationTriangleIcon className="w-4 h-4" />,
        completed: <CheckCircleIcon className="w-4 h-4" />,
        cancelled: <XCircleIcon className="w-4 h-4" />
    };
    return icons[status] || <ClockIcon className="w-4 h-4" />;
};