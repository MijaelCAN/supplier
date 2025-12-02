export interface ReceptionItem {
    Dscription: string;
    LineTotal: string;
}

export interface Reception {
    DocEntry: string;
    CardCode: string;
    CardName: string;
    Direccion_Destino: string;
    Direccion_Facturacion: string;
    DocDate: string;
    DocCur: string;
    Total: string;
    Detalle: ReceptionItem[];
}

export interface ReceptionApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: Reception[];
}

