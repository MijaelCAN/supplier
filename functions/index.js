// Cloud Functions del portal de proveedores.
// validarFacturaSunat: consulta el estado de una factura en SUNAT (validarcomprobante) y lo guarda
// en Firestore (colección validacionesSunat). El navegador no puede llamar a SUNAT directamente
// (validarcomprobante no permite CORS) y el client_secret no debe llegar al portal.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const SUNAT_CLIENT_ID = defineString('SUNAT_CLIENT_ID');
const SUNAT_RUC_CONSULTA = defineString('SUNAT_RUC_CONSULTA');
const SUNAT_CLIENT_SECRET = defineSecret('SUNAT_CLIENT_SECRET');
// API de Vistony accesible desde internet (la IP interna no se alcanza desde Google)
const XML_BASE_URL = defineString('XML_BASE_URL', { default: 'http://190.12.79.132:8046' });

// Orígenes del portal que pueden llamar a la función (functions/.env → ALLOWED_ORIGINS, separados por coma)
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const COLLECTION = 'validacionesSunat';
const TOKEN_SCOPE = 'https://api.sunat.gob.pe/v1/contribuyente/contribuyentes';

// El token de SUNAT dura 1 hora: se reutiliza mientras la instancia siga viva
let cachedToken = null; // { value, expiresAt }

const getSunatToken = async () => {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

    const clientId = SUNAT_CLIENT_ID.value();
    const response = await fetch(
        `https://api-seguridad.sunat.gob.pe/v1/clientesextranet/${clientId}/oauth2/token/`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                scope: TOKEN_SCOPE,
                client_id: clientId,
                client_secret: SUNAT_CLIENT_SECRET.value(),
            }),
        }
    );
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.access_token) {
        logger.error('Token SUNAT rechazado', { status: response.status, body: json });
        throw new HttpsError('unavailable', 'No se pudo obtener el token de SUNAT.');
    }
    cachedToken = {
        value: json.access_token,
        expiresAt: Date.now() + (Number(json.expires_in) || 3600) * 1000,
    };
    return cachedToken.value;
};

const consultarSunat = async (comprobante, retry = true) => {
    const token = await getSunatToken();
    const response = await fetch(
        `https://api.sunat.gob.pe/v1/contribuyente/contribuyentes/${SUNAT_RUC_CONSULTA.value()}/validarcomprobante`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(comprobante),
        }
    );
    // Token vencido o revocado antes de tiempo: se pide otro una sola vez
    if (response.status === 401 && retry) {
        cachedToken = null;
        return consultarSunat(comprobante, false);
    }
    const json = await response.json().catch(() => null);
    if (!json) {
        logger.error('Respuesta SUNAT inválida', { status: response.status });
        throw new HttpsError('unavailable', `SUNAT no respondió correctamente (${response.status}).`);
    }
    return json;
};

const PATTERNS = {
    codCita: /^[\w-]{1,50}$/,
    numRuc: /^\d{11}$/,
    codComp: /^(01|03|07|08)$/,
    numeroSerie: /^[A-Z0-9]{4}$/,
    numero: /^\d{1,8}$/,
    fechaEmision: /^\d{2}\/\d{2}\/\d{4}$/,
    monto: /^\d+(\.\d{1,2})?$/,
};

const readInput = (data) => {
    const input = {};
    for (const [field, pattern] of Object.entries(PATTERNS)) {
        const value = String(data?.[field] ?? '').trim().toUpperCase();
        if (!pattern.test(value)) {
            throw new HttpsError('invalid-argument', `Dato inválido: ${field}`);
        }
        input[field] = value;
    }
    input.archivo = String(data?.archivo ?? '').slice(0, 200);
    return input;
};

const corsOrigins = allowedOrigins.length > 0 ? allowedOrigins : true;

export const validarFacturaSunat = onCall(
    {
        secrets: [SUNAT_CLIENT_SECRET],
        cors: corsOrigins,
        maxInstances: 5,
        timeoutSeconds: 30,
    },
    async (request) => {
        const { codCita, archivo, ...comprobante } = readInput(request.data);

        // Si SUNAT falla igual se guardan los datos del XML: así "Validar" puede reintentar sin volver a leerlo
        let result;
        try {
            result = await consultarSunat(comprobante);
        } catch (error) {
            logger.error('Error consultando SUNAT', error);
            result = { success: false, message: error instanceof Error ? error.message : 'SUNAT no respondió' };
        }
        const data = result.success ? result.data ?? {} : {};

        const record = {
            codCita,
            archivo,
            ...comprobante,
            estadoCp: data.estadoCp ?? null,
            estadoRuc: data.estadoRuc ?? null,
            condDomiRuc: data.condDomiRuc ?? null,
            observaciones: Array.isArray(data.observaciones) ? data.observaciones : [],
            mensaje: result.success ? null : String(result.message ?? 'SUNAT no pudo validar el comprobante'),
        };

        const docId = `${codCita}_${comprobante.numRuc}-${comprobante.codComp}-${comprobante.numeroSerie}-${comprobante.numero}`;
        await getFirestore().collection(COLLECTION).doc(docId).set(
            { ...record, validadoEn: FieldValue.serverTimestamp() },
            { merge: true }
        );

        return { id: docId, ...record, validadoEn: new Date().toISOString() };
    }
);

// Ruta del archivo dentro del parámetro Name de /api/PackingList/Citas/Photo (ej: B1H_VIST_PE/20260921/FAC_x.xml)
const XML_NAME_PATTERN = /^[\w\-./]{1,250}\.xml$/i;
const MAX_XML_BYTES = 2 * 1024 * 1024;

/**
 * Devuelve el contenido de un XML subido a una cita. El endpoint de archivos del API no envía
 * cabeceras CORS, así que el portal no puede leerlo con fetch; la función lo descarga por la IP pública.
 */
export const obtenerXmlFactura = onCall(
    { cors: corsOrigins, maxInstances: 5, timeoutSeconds: 30 },
    async (request) => {
        const name = String(request.data?.name ?? '').trim();
        if (!XML_NAME_PATTERN.test(name) || name.includes('..')) {
            throw new HttpsError('invalid-argument', 'Nombre de archivo inválido.');
        }

        const url = `${XML_BASE_URL.value()}/api/PackingList/Citas/Photo?Name=${encodeURIComponent(name)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch((error) => {
            logger.error('No se pudo descargar el XML', { url, error: String(error) });
            throw new HttpsError('unavailable', 'No se pudo descargar el XML desde el servidor de Vistony.');
        });
        if (!response.ok) {
            throw new HttpsError('not-found', `No se pudo descargar el XML (${response.status}).`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > MAX_XML_BYTES) {
            throw new HttpsError('failed-precondition', 'El XML es demasiado grande.');
        }

        // Los CDR y algunos emisores usan iso-8859-1
        const declared = /encoding=["']([\w-]+)["']/i.exec(buffer.subarray(0, 200).toString('latin1'))?.[1]?.toLowerCase();
        const encoding = declared && /^(iso-8859-1|latin1|windows-1252)$/.test(declared) ? 'latin1' : 'utf8';
        return { xml: buffer.toString(encoding) };
    }
);
