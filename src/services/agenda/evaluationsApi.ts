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
    criterio_codigo: string; // 'PUNTUALIDAD', 'DOCUMENTACION', 'ESTADO_MERCADERIA', 'CANTIDAD_CORRECTA'
    calificacion: number; // 0-10
    comentario?: string;
    archivo_base64?: string; // Base64 del archivo si aplica
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
    status_code: number;
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Interfaz RAW para un criterio de evaluación en la respuesta del API (snake_case)
 * Esta es la estructura exacta que viene del API
 */
export interface EvaluationCriterioResponseRaw {
    criterio_codigo: string;
    calificacion: number | string;
    comentario?: string;
    archivo_url?: string;
}

/**
 * Interfaz RAW para obtener evaluación desde el API (snake_case)
 * Esta es la estructura exacta que viene del API
 */
export interface EvaluationApiRecordRaw {
    cod_cita: string;
    estado: EvaluationEstado;
    puntaje_total: number | string;
    nivel: EvaluationNivel | string;
    criterios: EvaluationCriterioResponseRaw[];
    evaluador?: string;
    fecha_evaluacion?: string;
}

/**
 * Interfaz para un criterio de evaluación en formato interno (camelCase)
 * Esta es la estructura que usa la aplicación internamente
 */
export interface EvaluationCriterioResponse {
    criterioCodigo: string;
    calificacion: number | string;
    comentario?: string;
    archivoUrl?: string;
}

/**
 * Interfaz para obtener evaluación en formato interno (camelCase)
 * Esta es la estructura que usa la aplicación internamente
 */
export interface EvaluationApiRecord {
    codCita: string;
    estado: EvaluationEstado;
    puntajeTotal: number | string;
    nivel: EvaluationNivel | string;
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

    if (evaluation.puntualidad?.puntaje !== undefined) {
        total += evaluation.puntualidad.puntaje * EVALUATION_WEIGHTS.puntualidad;
        totalWeight += EVALUATION_WEIGHTS.puntualidad;
    }
    if (evaluation.documentacion?.puntaje !== undefined) {
        total += evaluation.documentacion.puntaje * EVALUATION_WEIGHTS.documentacion;
        totalWeight += EVALUATION_WEIGHTS.documentacion;
    }
    if (evaluation.estadoMercaderia?.puntaje !== undefined) {
        total += evaluation.estadoMercaderia.puntaje * EVALUATION_WEIGHTS.estadoMercaderia;
        totalWeight += EVALUATION_WEIGHTS.estadoMercaderia;
    }
    if (evaluation.cantidadCorrecta?.puntaje !== undefined) {
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

const normalizeBinaryScore = (value: number): number => {
    return value > 0 ? 10 : 0;
};

/**
 * Mapea la respuesta RAW del API (snake_case) al formato interno (camelCase)
 * Este es el único lugar donde se debe modificar si cambia la estructura del API
 * 
 * @param rawRecord - Respuesta raw del API con snake_case
 * @returns Record en formato camelCase para uso interno
 */
export const mapApiResponseToEvaluationApiRecord = (
    rawRecord: EvaluationApiRecordRaw
): EvaluationApiRecord => {
    return {
        codCita: rawRecord.cod_cita,
        estado: rawRecord.estado,
        puntajeTotal: rawRecord.puntaje_total,
        nivel: rawRecord.nivel,
        evaluador: rawRecord.evaluador,
        fechaEvaluacion: rawRecord.fecha_evaluacion,
        criterios: rawRecord.criterios.map((criterioRaw): EvaluationCriterioResponse => ({
            criterioCodigo: criterioRaw.criterio_codigo,
            calificacion: criterioRaw.calificacion,
            comentario: criterioRaw.comentario,
            archivoUrl: criterioRaw.archivo_url,
        })),
    };
};

/**
 * Convierte EvaluationApiRecord (nuevo formato) a DeliveryEvaluation
 */
export const mapApiRecordToEvaluation = (record: EvaluationApiRecord): DeliveryEvaluation => {
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

        // Normalizar el código del criterio (puede venir en diferentes formatos)
        let criterioCodigo = criterio.criterioCodigo.toUpperCase().trim();
        
        // Manejar variaciones de nomenclatura
        if (criterioCodigo === 'CANTIDAD' || criterioCodigo === 'CANTIDAD_CORRECTA') {
            criterioCodigo = EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA;
        } else if (criterioCodigo === 'PUNTUALIDAD') {
            criterioCodigo = EVALUATION_CRITERIA_CODES.PUNTUALIDAD;
        } else if (criterioCodigo === 'DOCUMENTACION' || criterioCodigo === 'DOCUMENTACIÓN') {
            criterioCodigo = EVALUATION_CRITERIA_CODES.DOCUMENTACION;
        } else if (criterioCodigo === 'ESTADO_MERCADERIA' || criterioCodigo === 'ESTADO_MERCADERÍA') {
            criterioCodigo = EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA;
        }

        switch (criterioCodigo) {
            case EVALUATION_CRITERIA_CODES.PUNTUALIDAD:
                evaluation.puntualidad = {
                    ...score,
                    puntaje: normalizeBinaryScore(puntaje),
                };
                appendEvaluationFile(evaluation, criterio.archivoUrl, 'puntualidad');
                break;
            case EVALUATION_CRITERIA_CODES.DOCUMENTACION:
                evaluation.documentacion = {
                    ...score,
                    puntaje: normalizeBinaryScore(puntaje),
                };
                appendEvaluationFile(evaluation, criterio.archivoUrl, 'documentacion');
                break;
            case EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA:
                // Para estadoMercaderia, determinar el estado desde el puntaje
                evaluation.estadoMercaderia = {
                    ...score,
                    estado: determineEstadoMercaderia(puntaje, criterio.comentario),
                };
                appendEvaluationFile(evaluation, criterio.archivoUrl, 'calidad');
                break;
            case EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA:
                evaluation.cantidadCorrecta = {
                    ...score,
                    puntaje: normalizeBinaryScore(puntaje),
                    estado: normalizeBinaryScore(puntaje) === 10 ? 'ACEPTADO' : 'RECHAZADO',
                };
                appendEvaluationFile(evaluation, criterio.archivoUrl, 'almacen');
                break;
        }
    });

    return evaluation;
};

/**
 * Mapea el nivel del API al badge (maneja diferentes formatos: mayúsculas, capitalizado, etc.)
 */
const mapNivelToBadge = (nivel: EvaluationNivel | string): 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente' => {
    const nivelStr = String(nivel).trim();
    const nivelUpper = nivelStr.toUpperCase();
    
    switch (nivelUpper) {
        case 'EXCELENTE':
            return 'Excelente';
        case 'BUENO':
            return 'Bueno';
        case 'REGULAR':
            return 'Regular';
        case 'DEFICIENTE':
        case 'MALO': // Manejar "Malo" como "Deficiente"
            return 'Deficiente';
        default:
            // Si viene capitalizado
            if (nivelStr === 'Regular') return 'Regular';
            if (nivelStr === 'Bueno') return 'Bueno';
            if (nivelStr === 'Excelente') return 'Excelente';
            if (nivelStr === 'Deficiente' || nivelStr === 'Malo') return 'Deficiente';
            // Por defecto retornar "Regular"
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
    _comentario?: string
): 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO' | undefined => {
    const puntaje = toNumber(calificacion);
    if (puntaje >= 9.0) return 'ACEPTADO';
    if (puntaje >= 5.0) return 'OBSERVADO';
    if (puntaje >= 0) return 'RECHAZADO';
    return undefined;
};

const appendEvaluationFile = (
    evaluation: DeliveryEvaluation,
    archivoUrl: string | undefined,
    tipo: EvaluationFile['tipo']
): void => {
    if (!archivoUrl || archivoUrl.trim() === '') return;

    if (!evaluation.archivos) {
        evaluation.archivos = [];
    }

    const urlParts = archivoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || `archivo_${Date.now()}`;

    evaluation.archivos.push({
        nombre: fileName.includes('?') ? fileName.split('?')[0] : fileName,
        url: archivoUrl,
        tipo,
    });
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

    if (!json || !json.success) {
        return null;
    }

    if (!json.data) {
        return null;
    }

    // Mapear la respuesta RAW del API (snake_case) al formato interno (camelCase)
    const rawRecord = json.data as EvaluationApiRecordRaw;
    const record = mapApiResponseToEvaluationApiRecord(rawRecord);
    
    // Convertir el record interno a DeliveryEvaluation
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
    if (!evaluation.codCita) {
        console.log("ROL: ", rolEvaluador);
        throw new Error('El código de cita es requerido');
    }

    // Construir array de criterios
    const criterios: EvaluationCriterioRequest[] = [];

    // Puntualidad
    if (evaluation.puntualidad?.puntaje !== undefined) {
        const fileForPuntualidad = files?.find(f => f.criterioCodigo === EVALUATION_CRITERIA_CODES.PUNTUALIDAD);
        let archivoBase64: string | undefined;

        if (fileForPuntualidad) {
            archivoBase64 = await fileToBase64(fileForPuntualidad.file);
        }

        criterios.push({
            criterio_codigo: EVALUATION_CRITERIA_CODES.PUNTUALIDAD,
            calificacion: evaluation.puntualidad.puntaje,
            comentario: evaluation.puntualidad.comentario,
            archivo_base64: archivoBase64,
        });
    }

    // Documentación
    if (evaluation.documentacion?.puntaje !== undefined) {
        const fileForDocumentacion = files?.find(f => f.criterioCodigo === EVALUATION_CRITERIA_CODES.DOCUMENTACION);
        let archivoBase64: string | undefined;

        if (fileForDocumentacion) {
            archivoBase64 = await fileToBase64(fileForDocumentacion.file);
        }

        criterios.push({
            criterio_codigo: EVALUATION_CRITERIA_CODES.DOCUMENTACION,
            calificacion: evaluation.documentacion.puntaje,
            comentario: evaluation.documentacion.comentario,
            archivo_base64: archivoBase64,
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
            criterio_codigo: EVALUATION_CRITERIA_CODES.ESTADO_MERCADERIA,
            calificacion: evaluation.estadoMercaderia.puntaje,
            comentario: evaluation.estadoMercaderia.comentario,
            archivo_base64: archivoBase64,
        });
    }

    // Cantidad Correcta
    if (evaluation.cantidadCorrecta?.puntaje !== undefined) {
        const fileForCantidad = files?.find(f => f.criterioCodigo === EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA);
        let archivoBase64: string | undefined;
        
        if (fileForCantidad) {
            archivoBase64 = await fileToBase64(fileForCantidad.file);
        }

        criterios.push({
            criterio_codigo: EVALUATION_CRITERIA_CODES.CANTIDAD_CORRECTA,
            calificacion: evaluation.cantidadCorrecta.puntaje,
            comentario: evaluation.cantidadCorrecta.comentario,
            archivo_base64: archivoBase64,
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
        cod_cita: codCita.trim(),
        name_file: file.name,
        base64: base64,
        tipo: tipo,
        rol_evaluador: rolEvaluador,
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
