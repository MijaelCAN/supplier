export interface InvoiceItem {
    doc_entry: string;
    dscription: string;
    item_code: string;
    line_total: string;
    quantity: string;
}

export interface InvoicePayment {
    doc_date: string;
    doc_entry: string;
    sum_applied: string;
}

export interface Invoice {
    doc_entry: string;
    doc_num: string;
    num_at_card: string;
    card_code: string;
    card_name: string;
    direccion_destino: string;
    direccion_facturacion: string;
    estado_documento: string;
    doc_date: string;
    doc_due_date: string;
    tax_date: string;
    condicion_pago: string;
    doc_cur: string;
    retencion: string;
    impuesto: string;
    sub_total: string;
    saldo: string;
    total: string;
    estado: string;
    detalle: InvoiceItem[];
    pagos: InvoicePayment[] | null;
}
export interface InvoiceApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: Invoice[];
}