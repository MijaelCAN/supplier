export type CodigoTipoComprobanteSunat = '01' | '02';

export interface CuotaComprobanteSunat {
  numero: string;
  monto: number;
  fechaVencimiento: string | null;
}

export interface ComprobantePendienteSunat {
  rucEmisor: string;
  codigoTipoComprobante: CodigoTipoComprobanteSunat;
  serie: string;
  numeroComprobante: number;
  fechaEmision: string | null;
  fechaPuestaDisposicion: string | null;
  fechaPlazoPago: string | null;
  montoPendientePago: number;
  codigoMoneda: string;
  importeTotalFactura: number;
  montoTotalRhe: number;
  montoRetencionRhe: number;
  montoNetoRhe: number;
  cuotas: CuotaComprobanteSunat[];
}

export interface ConsultaComprobantesSunatResponse {
  totalRegistros: number;
  numeroPagina: number;
  registrosPorPagina: number;
  comprobantes: ComprobantePendienteSunat[];
}

export interface ConsultaComprobantesSunatParams {
  codigoTipoComprobante: CodigoTipoComprobanteSunat;
  fechaInicio: string;
  fechaFin: string;
  numeroPagina?: number;
  registrosPorPagina?: 50 | 100;
}