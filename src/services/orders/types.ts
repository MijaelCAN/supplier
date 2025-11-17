// ENTIDADES DE CONSUMO DE API
export interface OrderItem {
    DocEntry: string;
    ItemCode: string;
    Description: string;
    EstadoLinea: string;
    LineNum: number;
    LineTotal: string;
    QtyPend: string;
    Quantity: string;
    PrecioUnitario: string;
}

export interface Order {
    DocEntry: string;
    DocNum: string;
    CardCode: string;
    CardName: string
    CondicionPago: string;
    EstadoDocumento: string;
    EncargadoCompras: string;
    Direccion_Facturacion: string;
    AvanceRecepcion: string
    TaxDate: string;
    DocCur: string;
    Total: string;
    Detalle: OrderItem[]
}

export interface OrdersApiResponse {
    statusCode: number;
    message: string;
    data: Order[];
}

// CONSTRUCCION DE LA RUTA:


