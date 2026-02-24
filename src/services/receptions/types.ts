export interface ReceptionItem {
    doc_entry: string;
    dscription: string;
    item_code: string;
    line_total: string;
    quantity: string;
}

export interface Reception {
    doc_entry: string;
    card_code: string;
    card_name: string;
    direccion_destino: string;
    direccion_facturacion: string;
    doc_date: string;
    doc_cur: string;
    estado: string;
    fecha_entrega: string;
    total: string;
    detalle: ReceptionItem[];
}

export interface ReceptionApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: Reception[];
}









