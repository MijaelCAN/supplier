import {XCircleIcon} from "@heroicons/react/24/outline";
import {getStatusColor, getStatusIcon, getStatusText} from "@/components/OrdenCompra/Utils/orderStatus.tsx";
import {OrderCardProps} from "@/components/OrdenCompra/Types/orderTypes.ts";
import {FC} from "react";


const OrderDetail: FC<OrderCardProps> = ({order,userRole,onClose}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{order.id}</h2>
                            <p className="text-gray-600">{order.supplier}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div
                                className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                <span>{getStatusText(order.status)}</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                                <XCircleIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fecha:</span>
                                    <span className="font-medium">{order.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Entrega:</span>
                                    <span className="font-medium">{order.deliveryDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-medium">S/ {order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Progreso de Recepción</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Items:</span>
                                    <span className="font-medium">{order.items.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Recibidos:</span>
                                    <span
                                        className="font-medium">{order.items.filter(item => item.received > 0).length}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{width: `${(order.items.filter(item => item.received === item.quantity).length / order.items.length) * 100}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Acciones</h3>
                            <div className="space-y-2">
                                {userRole === 'admin' && (
                                    <>
                                        <button
                                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm">
                                            Marcar como Recibido
                                        </button>
                                        <button
                                            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm">
                                            Generar Factura
                                        </button>
                                    </>
                                )}
                                {userRole === 'supplier' && (
                                    <>
                                        <button
                                            className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm">
                                            Actualizar Envío
                                        </button>
                                        <button
                                            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm">
                                            Subir Guía
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Detalle de Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cantidad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Precio Unit.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Recibido
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    {userRole === 'admin' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {order.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            S/ {item.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.received} / {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.received === item.quantity
                                ? 'bg-green-100 text-green-800'
                                : item.received > 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.received === item.quantity ? 'Completado' :
                              item.received > 0 ? 'Parcial' : 'Pendiente'}
                        </span>
                                        </td>
                                        {userRole === 'admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button className="text-blue-600 hover:text-blue-900 mr-2">
                                                    Recibir
                                                </button>
                                                <button className="text-green-600 hover:text-green-900">
                                                    Editar
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {order.notes && (
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2">Notas Especiales</h4>
                            <p className="text-yellow-700">{order.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export {OrderDetail};