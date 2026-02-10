import { httpClient, buildSecureUrl } from "@/services/http/httpClient";
import { DeliveryEvaluation, EvaluationScore, EvaluationFile, EVALUATION_WEIGHTS, EVALUATION_RANGES } from "@/store/types";
import { getApiBaseUrl } from "@/config/api.ts";

const DEFAULT_API_BASE_URL = getApiBaseUrl();
const EVALUATIONS_ENDPOINT = '/api/Evaluacion';

// Códigos de criterios de evaluación
export const EVALUATION_CRITERIA_CODES = {
    PUNTUALIDAD: 'PUNTUALIDAD',
    DOCUMENTACION: 'DOCUMENTACION',
    ESTADO_MERCADERIA: 'ESTADO_MERCADERIA',
    CANTIDAD_CORRECTA: 'CANTIDAD_CORRECTA',
} as const;

// Estados de evaluación
export type EvaluationEstado = 'BORRADOR' | 'COMPLETADO' | 'CERRADO';

// Niveles de evaluación
export type EvaluationNivel = 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'DEFICIENTE';

/**
 * Interfaz para un criterio de evaluación en el request
 */
export interface EvaluationCriterioRequest {
    criterioCodigo: string; // 'PUNTUALIDAD', 'DOCUMENTACION', 'ESTADO_MERCADERIA', 'CANTIDAD_CORRECTA'
    calificacion: number; // 1-5 (o 0 si no se ha evaluado)
    comentario?: string;
    archivoBase64?: string; // Base64 del archivo si aplica
}

/**
 * Interfaz para la petición de crear/actualizar evaluación (nuevo formato)
 */
export interface CreateEvaluationRequest {
    criterios: EvaluationCriterioRequest[];
}

/**
 * Interfaz para la respuesta del API (nuevo formato)
 */
interface EvaluationApiResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Interfaz para un criterio de evaluación en la respuesta del GET
 */
export interface EvaluationCriterioResponse {
    criterioCodigo: string;
    calificacion: number | string; // Puede venir como string desde el API
    comentario?: string;
    archivoUrl?: string;
}

/**
 * Interfaz para obtener evaluación desde el API (nuevo formato)
 */
export interface EvaluationApiRecord {
    codCita: string;
    estado: EvaluationEstado;
    puntajeTotal: number | string; // Puede venir como string desde el API
    nivel: EvaluationNivel | string; // Puede venir como "Regular" en lugar de "REGULAR"
    criterios: EvaluationCriterioResponse[];
    evaluador?: string;
    fechaEvaluacion?: string;
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
 * Convierte un valor a número (maneja strings)
 */
const toNumber = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Convierte EvaluationApiRecord (nuevo formato) a DeliveryEvaluation
 */
export const mapApiRecordToEvaluation = (record: EvaluationApiRecord): DeliveryEvaluation => {

    console.log('record', record);

    const evaluation: DeliveryEvaluation = {
        codCita: record.codCita,
        puntajeTotal: toNumber(record.puntajeTotal),
        badge: mapNivelToBadge(record.nivel),
        estado: record.estado as 'BORRADOR' | 'COMPLETADO' | 'CERRADO',
        evaluador: record.evaluador,
        fechaEvaluacion: record.fechaEvaluacion,
    };

    // Mapear criterios a las propiedades de DeliveryEvaluation
    record.criterios.forEach((criterio) => {
        const puntaje = toNumber(criterio.calificacion);
        const score: EvaluationScore = {
            puntaje: puntaje,
            comentario: criterio.comentario,
            peso: getWeightForCriterio(criterio.criterioCodigo),
        };

        // Manejar tanto "CANTIDAD" como "CANTIDAD_CORRECTA"
        const criterioCodigo = criterio.criterioCodigo === 'CANTIDAD' 
            ? EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA 
            : criterio.criterioCodigo;

        switch (criterioCodigo) {
            case EVALUATION_CRITERIA_CODES.PUNTUALIDAD:
                evaluation.puntualidad = score;
                break;
            case EVALUATION_CRITERIA_CODES.DOCUMENTACION:
                evaluation.documentacion = score;
                break;
            case EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA:
                // Para estadoMercaderia, determinar el estado desde el puntaje
                evaluation.estadoMercaderia = {
                    ...score,
                    estado: determineEstadoMercaderia(puntaje, criterio.comentario),
                };
                // Agregar archivos si existen
                if (criterio.archivoUrl && criterio.archivoUrl.trim() !== '') {
                    if (!evaluation.archivos) evaluation.archivos = [];
                    evaluation.archivos.push({
                        nombre: criterio.archivoUrl.split('/').pop() || 'archivo',
                        url: criterio.archivoUrl,
                        tipo: 'calidad',
                    });
                }
                break;
            case EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA:
                evaluation.cantidadCorrecta = score;
                // Agregar archivos si existen
                if (criterio.archivoUrl && criterio.archivoUrl.trim() !== '') {
                    if (!evaluation.archivos) evaluation.archivos = [];
                    // Extraer el nombre del archivo de la URL
                    const urlParts = criterio.archivoUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1] || `archivo_${Date.now()}`;
                    evaluation.archivos.push({
                        nombre: fileName.includes('?') ? fileName.split('?')[0] : fileName,
                        url: criterio.archivoUrl,
                        tipo: 'almacen',
                    });
                }
                break;
        }
    });

    return evaluation;
};

/**
 * Mapea el nivel del API al badge (maneja tanto mayúsculas como capitalizado)
 */
const mapNivelToBadge = (nivel: EvaluationNivel | string): 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente' => {
    const nivelUpper = String(nivel).toUpperCase();
    switch (nivelUpper) {
        case 'EXCELENTE':
            return 'Excelente';
        case 'BUENO':
            return 'Bueno';
        case 'REGULAR':
            return 'Regular';
        case 'DEFICIENTE':
            return 'Deficiente';
        default:
            // Si viene capitalizado como "Regular", también funciona
            if (String(nivel) === 'Regular') return 'Regular';
            if (String(nivel) === 'Bueno') return 'Bueno';
            if (String(nivel) === 'Excelente') return 'Excelente';
            if (String(nivel) === 'Deficiente') return 'Deficiente';
            return 'Regular';
    }
};

/**
 * Obtiene el peso para un criterio
 */
const getWeightForCriterio = (criterioCodigo: string): number => {
    switch (criterioCodigo) {
        case EVALUATION_CRITERIA_CODES.PUNTUALIDAD:
            return EVALUATION_WEIGHTS.puntualidad;
        case EVALUATION_CRITERIA_CODES.DOCUMENTACION:
            return EVALUATION_WEIGHTS.documentacion;
        case EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA:
            return EVALUATION_WEIGHTS.estadoMercaderia;
        case EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA:
            return EVALUATION_WEIGHTS.cantidadCorrecta;
        default:
            return 0;
    }
};

/**
 * Determina el estado de mercadería basado en el puntaje (escala 1-10)
 * >= 9.0 -> ACEPTADO
 * >= 5.0 y < 9.0 -> OBSERVADO  
 * < 5.0 -> RECHAZADO
 */
const determineEstadoMercaderia = (
    calificacion: number | string,
    comentario?: string
): 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO' | undefined => {
    console.log('comentario', comentario);
    const puntaje = toNumber(calificacion);
    if (puntaje >= 9.0) return 'ACEPTADO';
    if (puntaje >= 5.0) return 'OBSERVADO';
    if (puntaje >= 0) return 'RECHAZADO';
    return undefined;
};

/**
 * Obtiene la evaluación de una cita (nuevo endpoint)
 */
export const fetchEvaluationByCodCita = async (codCita: string): Promise<DeliveryEvaluation | null> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, `${EVALUATIONS_ENDPOINT}/Evaluacion`, {
        codCita: codCita,
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
    console.log('json', json);

    if (!json || !json.success) {
        console.log('json no success1', json);
        return null;
    }

    if (!json.data) {
        console.log('json no data2', json);
        return null;
    }

    const record = json.data as EvaluationApiRecord;
    return mapApiRecordToEvaluation(record);
};

/**
 * Convierte un archivo a base64
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
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
};

/**
 * Crea o actualiza una evaluación (nuevo endpoint)
 * @param evaluation - Evaluación parcial con los criterios a guardar
 * @param rolEvaluador - Rol del usuario que está evaluando
 * @param files - Archivos opcionales para los criterios que los requieren
 */
export const saveEvaluation = async (
    evaluation: Partial<DeliveryEvaluation>,
    rolEvaluador: string,
    files?: { criterioCodigo: string; file: File }[]
): Promise<DeliveryEvaluation> => {
    console.log('rolEvaluador', rolEvaluador);
    if (!evaluation.codCita) {
        throw new Error('El código de cita es requerido');
    }

    // Construir array de criterios
    const criterios: EvaluationCriterioRequest[] = [];

    // Puntualidad
    if (evaluation.puntualidad?.puntaje !== undefined && evaluation.puntualidad.puntaje > 0) {
        criterios.push({
            criterioCodigo: EVALUATION_CRITERIA_CODES.PUNTUALIDAD,
            calificacion: evaluation.puntualidad.puntaje,
            comentario: evaluation.puntualidad.comentario,
        });
    }

    // Documentación
    if (evaluation.documentacion?.puntaje !== undefined && evaluation.documentacion.puntaje > 0) {
        criterios.push({
            criterioCodigo: EVALUATION_CRITERIA_CODES.DOCUMENTACION,
            calificacion: evaluation.documentacion.puntaje,
            comentario: evaluation.documentacion.comentario,
        });
    }

    // Estado de Mercadería
    if (evaluation.estadoMercaderia?.puntaje !== undefined && evaluation.estadoMercaderia.puntaje > 0) {
        const fileForEstado = files?.find(f => f.criterioCodigo === EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA);
        let archivoBase64: string | undefined;
        
        if (fileForEstado) {
            archivoBase64 = await fileToBase64(fileForEstado.file);
        }

        criterios.push({
            criterioCodigo: EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA,
            calificacion: evaluation.estadoMercaderia.puntaje,
            comentario: evaluation.estadoMercaderia.comentario,
            archivoBase64,
        });
    }

    // Cantidad Correcta
    if (evaluation.cantidadCorrecta?.puntaje !== undefined && evaluation.cantidadCorrecta.puntaje > 0) {
        const fileForCantidad = files?.find(f => f.criterioCodigo === EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA);
        let archivoBase64: string | undefined;
        
        if (fileForCantidad) {
            archivoBase64 = await fileToBase64(fileForCantidad.file);
        }

        criterios.push({
            criterioCodigo: EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA,
            calificacion: evaluation.cantidadCorrecta.puntaje,
            comentario: evaluation.cantidadCorrecta.comentario,
            archivoBase64,
        });
    }

    if (criterios.length === 0) {
        throw new Error('Debe proporcionar al menos un criterio de evaluación');
    }

    const requestBody: CreateEvaluationRequest = {
        criterios,
    };

    const url = buildSecureUrl(DEFAULT_API_BASE_URL, `${EVALUATIONS_ENDPOINT}/EvaluacionCita`, {
        codCita: evaluation.codCita,
    });

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

    // Recargar la evaluación desde el API para obtener los datos actualizados
    const updatedEvaluation = await fetchEvaluationByCodCita(evaluation.codCita);
    if (!updatedEvaluation) {
        throw new Error('Error al obtener la evaluación actualizada');
    }

    return updatedEvaluation;
};

/**
 * Actualiza el estado de una evaluación
 */
export const updateEvaluationEstado = async (
    codCita: string,
    estado: EvaluationEstado
): Promise<void> => {
    const url = buildSecureUrl(DEFAULT_API_BASE_URL, `${EVALUATIONS_ENDPOINT}/ActualirEstado`, {
        codCita: codCita,
        estado: estado,
    });

    const response = await httpClient(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al actualizar estado (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as EvaluationApiResponse;

    if (!json || !json.success) {
        throw new Error(json.message || 'Error al actualizar el estado');
    }
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
