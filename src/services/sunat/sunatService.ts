import { httpClient } from '@/services/http/httpClient';
import type {
  ConsultaComprobantesSunatParams,
  ConsultaComprobantesSunatResponse,
} from '@/types/sunat';

const SUNAT_API_URL = (
  import.meta.env.VITE_SUNAT_API_URL || 'https://localhost:7258'
).replace(/\/$/, '');

const COMPROBANTES_PENDIENTES_ENDPOINT =
  '/api/sunat/comprobantes-pendientes';

export async function consultarComprobantesPendientes(
  params: ConsultaComprobantesSunatParams,
  signal?: AbortSignal,
): Promise<ConsultaComprobantesSunatResponse> {
  const url = new URL(
    COMPROBANTES_PENDIENTES_ENDPOINT,
    SUNAT_API_URL,
  );

  url.searchParams.set(
    'codigoTipoComprobante',
    params.codigoTipoComprobante,
  );
  url.searchParams.set('fechaInicio', params.fechaInicio);
  url.searchParams.set('fechaFin', params.fechaFin);
  url.searchParams.set(
    'numeroPagina',
    String(params.numeroPagina ?? 1),
  );
  url.searchParams.set(
    'registrosPorPagina',
    String(params.registrosPorPagina ?? 50),
  );

  const response = await httpClient(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
    skipObfuscation: true,
  });

  if (!response.ok) {
    let message = 'No se pudieron consultar los comprobantes de SUNAT.';

    try {
      const error = (await response.json()) as {
        message?: string;
      };

      if (error.message) {
        message = error.message;
      }
    } catch {
      // La respuesta no contenía JSON válido.
    }

    throw new Error(message);
  }

  return response.json() as Promise<ConsultaComprobantesSunatResponse>;
}