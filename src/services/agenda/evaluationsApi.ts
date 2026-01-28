import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { DeliveryEvaluation, EvaluationScore, EvaluationFile, EVALUATION_WEIGHTS, EVALUATION_RANGES } from "@/store/types";

const DEFAULT_API_BASE_URL = 'http://192.168.254.27:8082';
const EVALUATIONS_ENDPOINT = '/api/Documentos/Evaluaciones';

/**
 * Interfaz para la petición de crear/actualizar evaluación
 */
export interface CreateEvaluationRequest {
    u_CodCita: string;
    u_Puntualidad?: number; // 1-5
    u_ComentarioPuntualidad?: string;
    u_Documentacion?: number; // 1-5
    u_ComentarioDocumentacion?: string;
    u_EstadoMercaderia?: number; // 1-5
    u_ComentarioEstadoMercaderia?: string;
    u_CantidadCorrecta?: number; // 1-5
    u_ComentarioCantidadCorrecta?: string;
    u_ComentarioGeneral?: string;
    u_RolEvaluador?: string; // 'seguridad' | 'calidad' | 'almacen' | 'compras'
}

/**
 * Interfaz para la respuesta del API
 */
interface EvaluationApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Interfaz para obtener evaluación desde el API
 */
export interface EvaluationApiRecord {
    Id?: string;
    U_CodCita: string;
    U_Puntualidad?: number;
    U_ComentarioPuntualidad?: string;
    U_Documentacion?: number;
    U_ComentarioDocumentacion?: string;
    U_EstadoMercaderia?: number;
    U_ComentarioEstadoMercaderia?: string;
    U_CantidadCorrecta?: number;
    U_ComentarioCantidadCorrecta?: string;
    U_ComentarioGeneral?: string;
    U_PuntajeTotal?: number;
    U_Badge?: string;
    U_RolEvaluador?: string;
    CreateAt?: string;
    UpdateAt?: string;
}

/**
 * Calcula el puntaje total ponderado
 */
export const calculateTotalScore = (evaluation: Partial<DeliveryEvaluation>): number => {
    let total = 0;
    let totalWeight = 0;

    if (evaluation.puntualidad?.puntaje) {
        total += evaluation.puntualidad.puntaje * EVALUATION_WEIGHTS.puntualidad;
        totalWeight += EVALUATION_WEIGHTS.puntualidad;
    }
    if (evaluation.documentacion?.puntaje) {
        total += evaluation.documentacion.puntaje * EVALUATION_WEIGHTS.documentacion;
        totalWeight += EVALUATION_WEIGHTS.documentacion;
    }
    if (evaluation.estadoMercaderia?.puntaje) {
        total += evaluation.estadoMercaderia.puntaje * EVALUATION_WEIGHTS.estadoMercaderia;
        totalWeight += EVALUATION_WEIGHTS.estadoMercaderia;
    }
    if (evaluation.cantidadCorrecta?.puntaje) {
        total += evaluation.cantidadCorrecta.puntaje * EVALUATION_WEIGHTS.cantidadCorrecta;
        totalWeight += EVALUATION_WEIGHTS.cantidadCorrecta;
    }

    return totalWeight > 0 ? total / totalWeight : 0;
};

/**
 * Obtiene el badge según el puntaje
 */
export const getBadgeFromScore = (score: number): 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente' => {
    if (score >= EVALUATION_RANGES.Excelente.min) return 'Excelente';
    if (score >= EVALUATION_RANGES.Bueno.min) return 'Bueno';
    if (score >= EVALUATION_RANGES.Regular.min) return 'Regular';
    return 'Deficiente';
};

/**
 * Convierte EvaluationApiRecord a DeliveryEvaluation
 */
export const mapApiRecordToEvaluation = (record: EvaluationApiRecord): DeliveryEvaluation => {
    const evaluation: DeliveryEvaluation = {
        id: record.Id,
        codCita: record.U_CodCita,
        comentario: record.U_ComentarioGeneral,
        puntajeTotal: record.U_PuntajeTotal,
        badge: record.U_Badge as any,
        createdDate: record.CreateAt,
        updatedDate: record.UpdateAt,
    };

    if (record.U_Puntualidad) {
        evaluation.puntualidad = {
            puntaje: record.U_Puntualidad,
            comentario: record.U_ComentarioPuntualidad,
            peso: EVALUATION_WEIGHTS.puntualidad,
        };
    }

    if (record.U_Documentacion) {
        evaluation.documentacion = {
            puntaje: record.U_Documentacion,
            comentario: record.U_ComentarioDocumentacion,
            peso: EVALUATION_WEIGHTS.documentacion,
        };
    }

    if (record.U_EstadoMercaderia) {
        evaluation.estadoMercaderia = {
            puntaje: record.U_EstadoMercaderia,
            comentario: record.U_ComentarioEstadoMercaderia,
            peso: EVALUATION_WEIGHTS.estadoMercaderia,
        };
    }

    if (record.U_CantidadCorrecta) {
        evaluation.cantidadCorrecta = {
            puntaje: record.U_CantidadCorrecta,
            comentario: record.U_ComentarioCantidadCorrecta,
            peso: EVALUATION_WEIGHTS.cantidadCorrecta,
        };
    }

    // Calcular puntaje total si no viene del API
    if (!evaluation.puntajeTotal) {
        evaluation.puntajeTotal = calculateTotalScore(evaluation);
        evaluation.badge = getBadgeFromScore(evaluation.puntajeTotal);
    }

    return evaluation;
};

/**
 * Obtiene la evaluación de una cita
 */
export const fetchEvaluationByCodCita = async (codCita: string): Promise<DeliveryEvaluation | null> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, EVALUATIONS_ENDPOINT, {
        CodCita: codCita,
    });

    const response = await httpClient(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            return null; // No existe evaluación
        }
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al consultar evaluación (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as EvaluationApiResponse;

    if (!json || !json.success) {
        return null;
    }

    if (!json.data) {
        return null;
    }

    const record = Array.isArray(json.data) ? json.data[0] : json.data;
    return mapApiRecordToEvaluation(record as EvaluationApiRecord);
};

/**
 * Crea o actualiza una evaluación
 */
export const saveEvaluation = async (
    evaluation: Partial<DeliveryEvaluation>,
    rolEvaluador: string
): Promise<DeliveryEvaluation> => {
    if (!evaluation.codCita) {
        throw new Error('El código de cita es requerido');
    }

    // Calcular puntaje total
    const puntajeTotal = calculateTotalScore(evaluation);
    const badge = getBadgeFromScore(puntajeTotal);

    const requestBody: CreateEvaluationRequest = {
        u_CodCita: evaluation.codCita,
        u_Puntualidad: evaluation.puntualidad?.puntaje,
        u_ComentarioPuntualidad: evaluation.puntualidad?.comentario,
        u_Documentacion: evaluation.documentacion?.puntaje,
        u_ComentarioDocumentacion: evaluation.documentacion?.comentario,
        u_EstadoMercaderia: evaluation.estadoMercaderia?.puntaje,
        u_ComentarioEstadoMercaderia: evaluation.estadoMercaderia?.comentario,
        u_CantidadCorrecta: evaluation.cantidadCorrecta?.puntaje,
        u_ComentarioCantidadCorrecta: evaluation.cantidadCorrecta?.comentario,
        u_ComentarioGeneral: evaluation.comentario,
        u_RolEvaluador: rolEvaluador,
    };

    const url = `${DEFAULT_API_BASE_URL}${EVALUATIONS_ENDPOINT}`;

    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al guardar evaluación (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as EvaluationApiResponse;

    if (!json || !json.success) {
        throw new Error(json.message || 'Error al guardar la evaluación');
    }

    // Retornar la evaluación con los datos calculados
    return {
        ...evaluation,
        codCita: evaluation.codCita!,
        puntajeTotal,
        badge,
    } as DeliveryEvaluation;
};

/**
 * Sube un archivo de evaluación (solo Calidad y Almacén)
 */
export const uploadEvaluationFile = async (
    codCita: string,
    file: File,
    tipo: 'calidad' | 'almacen',
    rolEvaluador: string
): Promise<EvaluationFile> => {
    if (!codCita || codCita.trim() === '') {
        throw new Error('El código de cita es requerido');
    }

    if (!file) {
        throw new Error('El archivo es requerido');
    }

    // Convertir archivo a base64
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1] || reader.result;
                resolve(base64);
            } else {
                reject(new Error('Error al convertir archivo a base64'));
            }
        };
        reader.onerror = (error) => reject(error);
    });

    const requestBody = {
        codCita: codCita.trim(),
        nameFile: file.name,
        base64: base64,
        tipo: tipo,
        rolEvaluador: rolEvaluador,
    };

    const url = `${DEFAULT_API_BASE_URL}${EVALUATIONS_ENDPOINT}/Archivos`;

    const response = await httpClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al subir archivo (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as any;

    if (!json || !json.success) {
        throw new Error(json.message || 'Error al subir el archivo');
    }

    return {
        id: json.data?.id,
        nombre: json.data?.nombre || file.name,
        url: json.data?.url || '',
        tipo: tipo,
        uploadedBy: rolEvaluador,
        uploadDate: new Date().toISOString(),
    };
};
