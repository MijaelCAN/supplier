interface Item {
    id: number;
    name: string;
    quantity: number;
    price: number;
    received: number;
}

export type OrderStatus =
    | 'pending'
    | 'in_transit'
    | 'partially_received'
    | 'completed'
    | 'cancelled';
 // Puedes agregar más estados si los hay

export interface PurchaseOrder {
    id: string;
    supplier: string;
    date: string; // Podrías usar Date si parseas las fechas
    deliveryDate: string;
    total: number;
    status: OrderStatus;
    items: Item[];
    notes?: string; // Opcional si no siempre está presente
}
export interface OrderCardProps {
    key?: string;
    userRole?: string;
    order: PurchaseOrder;
    setSelectedOrder?: (order: PurchaseOrder) => void;
    onClose?: () => void;
}


