// ENTIDADES DE CONSUMO DE API
export interface OrderItem {
    doc_entry: string;
    item_code: string;
    description: string;
    estado_linea: string;
    line_num: number;
    line_total: string;
    qty_pend: string;
    quantity: string;
    precio_unitario: string;
}

export interface Order {
    doc_entry: string;
    doc_num: string;
    card_code: string;
    card_name: string;
    direccion_destino: string;
    condicion_pago: string;
    estado_documento: string;
    encargado_compras: string;
    direccion_facturacion: string;
    avance_recepcion: string
    tax_date: string;
    doc_cur: string;
    total: string;
    detalle: OrderItem[]
}

export interface OrdersApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: Order[];
}

// CONSTRUCCION DE LA RUTA:


