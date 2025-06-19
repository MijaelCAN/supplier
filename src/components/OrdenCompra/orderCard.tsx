import {
    ArrowDownTrayIcon,
    BuildingOfficeIcon,
    CalendarIcon, ChatBubbleLeftRightIcon,
    CurrencyDollarIcon,
    DocumentTextIcon, EyeIcon, PencilIcon,
    TruckIcon
} from "@heroicons/react/24/outline";
import {OrderCardProps } from "@/components/OrdenCompra/Types/orderTypes.ts";
import {FC} from "react";
import {getStatusColor, getStatusIcon, getStatusText} from "@/components/OrdenCompra/Utils/orderStatus.tsx";

const OrderCard: FC<OrderCardProps> = ({userRole, order,setSelectedOrder}) => {

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DocumentTextIcon className="w-5 h-5 text-blue-600"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{order.id}</h3>
                            <p className="text-sm text-gray-600">{order.supplier}</p>
                        </div>
                    </div>
                    <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{getStatusText(order.status)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400"/>
                        <div>
                            <p className="text-xs text-gray-500">Fecha</p>
                            <p className="text-sm font-medium">{order.date}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <TruckIcon className="w-4 h-4 text-gray-400"/>
                        <div>
                            <p className="text-xs text-gray-500">Entrega</p>
                            <p className="text-sm font-medium">{order.deliveryDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400"/>
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-medium">S/ {order.total.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400"/>
                        <div>
                            <p className="text-xs text-gray-500">Items</p>
                            <p className="text-sm font-medium">{order.items.length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setSelectedOrder?.(order)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                            <EyeIcon className="w-4 h-4 mr-1"/>
                            Ver Detalles
                        </button>
                        {userRole === 'admin' && (
                            <button
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
                                <PencilIcon className="w-4 h-4 mr-1"/>
                                Editar
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1"/>
                            PDF
                        </button>
                        <button
                            className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200">
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1"/>
                            Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderCard;