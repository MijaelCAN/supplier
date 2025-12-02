export interface InvoiceItem {
    Dscription: string;
    ItemCode?: string;
    LineTotal: string;
}

export interface InvoicePayment {
    DocDate: string;
    DocEntry: string;
    SumApplied: string;
}

export interface Invoice {
    DocEntry: string;
    DocNum: string;
    NumAtCard: string;
    CardCode: string;
    CardName: string;
    Direccion_Destino: string;
    Direccion_Facturacion: string;
    EstadoDocumento: string;
    DocDate: string;
    DocDueDate: string;
    TaxDate: string;
    CondicionPago: string;
    DocCur: string;
    Retencion: string;
    Impuesto: string;
    SubTotal: string;
    Saldo: string;
    Total: string;
    Detalle: InvoiceItem[];
    Pagos: InvoicePayment[] | null;
}
export interface InvoiceApiResponse {
    statusCode: number;
    message: string;
    data: Invoice[];
}