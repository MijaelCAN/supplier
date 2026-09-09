import { useMemo, useState } from "react";
import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";

import {
    MagnifyingGlassIcon,
    DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

import Dashboard from "@/layouts/Dashboard";
import { DateInput } from "@/components/DateInput";

const SUNAT_API_URL = import.meta.env.VITE_SUNAT_API_URL;

type TipoOperacionFiltro = | "todos" | "conformidad" | "disconformidad";

interface EnvioSunat {
    operacion_id: number;
    ruc_emisor: string;
    codigo_tipo_comprobante: string;
    serie: string;
    numero_comprobante: number;
    tipo_operacion: "CONFORMITY" | "DISCONFORMITY";
    tipo_envio_codigo: string;
    tipo_envio_descripcion: string;
    estado_operacion: string;
    numero_ticket: string | null;
    nombre_archivo: string;
    codigo_estado_proceso: string | null;
    descripcion_estado_proceso: string | null;
    motivos?: string | null;
    sustento?: string | null;
    registros_enviados: number;
    registros_correctos: number;
    registros_con_error: number;
    fecha_envio: string | null;
    fecha_finalizacion: string | null;
    mensaje?: string | null;
}

interface ConsultarEnviosData {
    total_registros: number;
    numero_pagina: number;
    registros_por_pagina: number;
    envios: EnvioSunat[];
}

interface ConsultarEnviosResponse {
    success: boolean;
    message?: string;
    data: ConsultarEnviosData;
}

interface ConsultarEstadoData {
    exitoso: boolean;
    operacion_id: number;
    tipo_operacion: "CONFORMITY" | "DISCONFORMITY";
    estado_operacion: string;
    numero_ticket: string | null;
    nombre_archivo: string;
    codigo_estado_proceso: string | null;
    descripcion_estado_proceso: string | null;
    registros_enviados: number;
    registros_correctos: number;
    registros_con_error: number;
    fecha_envio: string | null;
    fecha_finalizacion: string | null;
    mensaje?: string;
}

interface ConsultarEstadoResponse {
    success: boolean;
    message?: string;
    data: ConsultarEstadoData;
}

const ConsultaEnviosSunat = () => {
    const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [tipoOperacion, setTipoOperacion] = useState<TipoOperacionFiltro>("todos");
    const [numeroTicket, setNumeroTicket] = useState("");
    const [estadoOperacion, setEstadoOperacion] = useState("todos");
    const [fechaDesde, setFechaDesde] = useState(hoy);
    const [fechaHasta, setFechaHasta] = useState(hoy);
    const [envios, setEnvios] = useState<EnvioSunat[]>([]);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [registrosPorPagina] = useState(20);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [constanciaSeleccionada, setConstanciaSeleccionada] = useState<EnvioSunat | null>(null);
    const [modalConstanciaAbierto, setModalConstanciaAbierto] = useState(false);
    const [operacionConsultando, setOperacionConsultando] = useState<string | null>(null);
    const construirParametros = (numeroPagina: number, cantidadRegistros: number) => {
        const parametros = new URLSearchParams();
        if (fechaDesde) { parametros.append("fechaInicio", fechaDesde); }
        if (fechaHasta) { parametros.append("fechaFin", fechaHasta); }
        if (numeroTicket.trim()) { parametros.append("numeroTicket", numeroTicket.trim()); }
        if (estadoOperacion !== "todos") { parametros.append("estadoOperacion", estadoOperacion); }

        parametros.append("numeroPagina", String(numeroPagina));
        parametros.append("registrosPorPagina", String(cantidadRegistros));
        return parametros;
    };

    const consultarTipoOperacion = async (tipo: "conformidad" | "disconformidad", numeroPagina: number, cantidadRegistros: number): Promise<ConsultarEnviosResponse> => {
        const parametros = construirParametros(numeroPagina, cantidadRegistros);
        const endpoint = tipo === "conformidad" ? "/api/sunat/comprobantes/conformidad/consultar-envios" : "/api/sunat/comprobantes/disconformidad/consultar-envios";
        const response = await fetch(`${SUNAT_API_URL}${endpoint}?${parametros.toString()}`, { headers: { Accept: "*/*", }, });
        const data: ConsultarEnviosResponse = await response.json();

        if (!response.ok || !data.success) { throw new Error(data.message || `No se pudieron consultar los envíos. Código HTTP: ${response.status}`); }

        return data;
    };

    const consultarTodosLosEnviosTipo = async (
        tipo: "conformidad" | "disconformidad"
    ): Promise<EnvioSunat[]> => {
        const registrosPorConsulta = 100;
        const primeraPagina = await consultarTipoOperacion(tipo, 1, registrosPorConsulta);
        const todosLosEnvios = [...primeraPagina.data.envios,];
        const totalPaginas = Math.ceil(primeraPagina.data.total_registros / registrosPorConsulta);

        for (
            let paginaActual = 2;
            paginaActual <= totalPaginas;
            paginaActual++
        ) {
            const siguientePagina = await consultarTipoOperacion(tipo, paginaActual, registrosPorConsulta);
            todosLosEnvios.push(...siguientePagina.data.envios);
        }

        return todosLosEnvios;
    };

    const consultarEstadoRealSunat = async (envio: EnvioSunat): Promise<EnvioSunat> => {
        if (!envio.numero_ticket) {
            throw new Error("El envío no tiene número de ticket SUNAT.");
        }

        const endpoint =
            envio.tipo_operacion === "DISCONFORMITY"
                ? "/api/sunat/comprobantes/disconformidad/consultar-estado"
                : "/api/sunat/comprobantes/conformidad/consultar-estado";

        const parametros = new URLSearchParams();
        parametros.append("numeroTicket", envio.numero_ticket);

        const response = await fetch(
            `${SUNAT_API_URL}${endpoint}?${parametros.toString()}`,
            {
                method: "GET",
                headers: {
                    Accept: "*/*",
                },
            }
        );

        const data: ConsultarEstadoResponse = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                `No se pudo consultar el estado real de SUNAT. Código HTTP: ${response.status}`
            );
        }

        return {
            ...envio,
            operacion_id: data.data.operacion_id,
            tipo_operacion: data.data.tipo_operacion,
            estado_operacion: data.data.estado_operacion,
            numero_ticket: data.data.numero_ticket,
            nombre_archivo: data.data.nombre_archivo || envio.nombre_archivo,
            codigo_estado_proceso: data.data.codigo_estado_proceso,
            descripcion_estado_proceso: data.data.descripcion_estado_proceso,
            registros_enviados: data.data.registros_enviados,
            registros_correctos: data.data.registros_correctos,
            registros_con_error: data.data.registros_con_error,
            fecha_envio: data.data.fecha_envio,
            fecha_finalizacion: data.data.fecha_finalizacion,
            mensaje: data.data.mensaje || data.message || null,
        };
    };

    const handleBuscar = async (
        nuevaPagina = 1
    ) => {
        try {
            setCargando(true);
            setError(null);

            if (
                tipoOperacion === "conformidad"
            ) {
                const resultado = await consultarTipoOperacion("conformidad", nuevaPagina, registrosPorPagina);
                setEnvios(resultado.data.envios);
                setTotalRegistros(resultado.data.total_registros);
                setPagina(resultado.data.numero_pagina);
                return;
            }

            if (
                tipoOperacion === "disconformidad"
            ) {
                const resultado = await consultarTipoOperacion("disconformidad", nuevaPagina, registrosPorPagina
                );

                setEnvios(resultado.data.envios);
                setTotalRegistros(resultado.data.total_registros);
                setPagina(resultado.data.numero_pagina);
                return;
            }

            /*
             * TODOS:
             * Como backend tiene dos endpoints separados,
             * consultamos ambos y unimos los resultados.
             *
             * Por ahora pedimos hasta 1000 registros
             * de cada operación para poder ordenar y
             * paginar conjuntamente en frontend.
             */
            const [
                conformidades,
                disconformidades,
            ] = await Promise.all([
                consultarTodosLosEnviosTipo("conformidad"),
                consultarTodosLosEnviosTipo("disconformidad"),
            ]);

            const todos = [...conformidades, ...disconformidades,].sort((a, b) => {
                const fechaA = a.fecha_envio ? new Date(a.fecha_envio).getTime() : 0;
                const fechaB = b.fecha_envio ? new Date(b.fecha_envio).getTime() : 0;

                return fechaB - fechaA;
            });

            const inicio = (nuevaPagina - 1) * registrosPorPagina;
            const fin = inicio + registrosPorPagina;

            setEnvios(todos.slice(inicio, fin));
            setTotalRegistros(todos.length);
            setPagina(nuevaPagina);
        } catch (err) {
            console.error(err);

            setEnvios([]);
            setTotalRegistros(0);
            setPagina(1);

            setError(err instanceof Error ? err.message : "Ocurrió un error al consultar los envíos.");
        } finally {
            setCargando(false);
        }
    };

    const abrirConstancia = (envio: EnvioSunat) => {
        setConstanciaSeleccionada(envio);
        setModalConstanciaAbierto(true);
    };

    const handleVerConstancia = async (envio: EnvioSunat) => {
        const operacionKey = `${envio.tipo_operacion}-${envio.operacion_id}`;

        try {
            setError(null);
            setOperacionConsultando(operacionKey);

            const envioActualizado = await consultarEstadoRealSunat(envio);

            setEnvios((actuales) =>
                actuales.map((item) =>
                    `${item.tipo_operacion}-${item.operacion_id}` === operacionKey
                        ? envioActualizado
                        : item
                )
            );

            abrirConstancia(envioActualizado);
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Ocurrió un error al consultar el estado real de SUNAT."
            );
        } finally {
            setOperacionConsultando(null);
        }
    };

    const formatearFechaHora = (
        fecha: string | null
    ) => {
        if (!fecha) {
            return "-";
        }

        const valor = new Date(fecha);

        if (
            Number.isNaN(valor.getTime())
        ) {
            return "-";
        }

        return valor.toLocaleString(
            "es-PE",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    const obtenerNombreOperacion = (
        tipo: string
    ) => {
        return tipo === "DISCONFORMITY"
            ? "Disconformidad"
            : "Conformidad";
    };

    const obtenerColorEstado = (
        estado: string
    ):
        | "success"
        | "warning"
        | "danger"
        | "default"
        | "primary" => {
        switch (estado) {
            case "COMPLETED":
                return "success";

            case "SUBMITTED":
            case "PROCESSING":
            case "PENDING":
                return "warning";

            case "FAILED":
            case "ERROR":
                return "danger";

            default:
                return "default";
        }
    };

    const obtenerDescripcionEstado = (
        envio: EnvioSunat
    ) => {
        if (
            envio.descripcion_estado_proceso
        ) {
            return envio
                .descripcion_estado_proceso;
        }

        switch (
        envio.estado_operacion
        ) {
            case "COMPLETED": return "PROCESADO";
            case "SUBMITTED": return "ENVIADO";
            case "PROCESSING": return "PROCESANDO";
            case "PENDING": return "PENDIENTE";
            case "FAILED": return "FALLIDO";
            case "ERROR": return "ERROR";
            default: return envio.estado_operacion;
        }
    };

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            totalRegistros /
            registrosPorPagina
        )
    );

    const cerrarConstancia = () => {
        setModalConstanciaAbierto(false);
        setConstanciaSeleccionada(null);
    };

    const formatearFechaHoraConstancia = (fecha?: string | null) => {
        if (!fecha) return "-";

        const date = new Date(fecha);

        return new Intl.DateTimeFormat("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(date);
    };

    const obtenerMensajeConstancia = (envio: EnvioSunat) => {
        if (envio.mensaje) {
            return envio.mensaje;
        }

        if (envio.estado_operacion === "COMPLETED") {
            if ((envio.registros_con_error ?? 0) > 0) {
                return "El archivo procesado presenta inconsistencias.";
            }

            return "El archivo fue procesado correctamente.";
        }

        if (
            envio.estado_operacion === "FAILED" ||
            envio.estado_operacion === "ERROR"
        ) {
            return "No fue posible procesar el archivo enviado.";
        }

        return "El envío se encuentra pendiente de procesamiento.";
    };
    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900"> Consulta de Envíos SUNAT </h1>
                    <p className="text-gray-600"> Seguimiento de conformidades y disconformidades enviadas a SUNAT </p>
                </div>

                <Card>
                    <CardBody className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <Select label="Tipo de operación" size="sm" selectedKeys={[tipoOperacion,]} onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0];
                                if (value) {
                                    setTipoOperacion(
                                        String(value) as TipoOperacionFiltro
                                    );
                                }
                            }}
                            >
                                <SelectItem key="todos"> Todos </SelectItem>
                                <SelectItem key="conformidad"> Conformidad </SelectItem>
                                <SelectItem key="disconformidad">  Disconformidad </SelectItem>
                            </Select>
                            <Input label="Número de ticket" size="sm" value={numeroTicket} onValueChange={setNumeroTicket} />

                            <Select label="Estado" size="sm" selectedKeys={[estadoOperacion,]} onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0];
                                if (value) { setEstadoOperacion(String(value)); }
                            }} >
                                <SelectItem key="todos"> Todos </SelectItem>
                                <SelectItem key="PENDING">  Pendiente </SelectItem>
                                <SelectItem key="SUBMITTED"> Enviado </SelectItem>
                                <SelectItem key="PROCESSING">  Procesando </SelectItem>
                                <SelectItem key="COMPLETED">  Procesado  </SelectItem>
                                <SelectItem key="FAILED"> Fallido  </SelectItem>
                                <SelectItem key="ERROR"> Error </SelectItem>
                            </Select>
                        </div>

                        <div>
                            <p className="mb-3 text-sm font-medium text-gray-700"> Fecha de envío </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <DateInput label="Desde" value={fechaDesde} size="sm" isClearable onValueChange={setFechaDesde} className="w-full" />
                                <DateInput label="Hasta" value={fechaHasta} size="sm" isClearable onValueChange={setFechaHasta} className="w-full" />

                                <div className="flex items-end">
                                    <Button
                                        color="primary"
                                        size="sm"
                                        isLoading={cargando}
                                        startContent={
                                            !cargando ? (
                                                <MagnifyingGlassIcon className="h-5 w-5" />
                                            ) : undefined
                                        }
                                        onPress={() => {
                                            void handleBuscar(
                                                1
                                            );
                                        }}
                                    >
                                        Buscar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <Card>
                    <CardBody className="space-y-4 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span className="text-lg font-bold">
                                    {totalRegistros}
                                </span>

                                <span className="ml-2 text-sm text-gray-600">
                                    registro(s) encontrado(s)
                                </span>
                            </div>
                        </div>

                        <Table
                            aria-label="Envíos SUNAT"
                            classNames={{
                                base: "w-full overflow-x-auto",
                                wrapper:
                                    "min-h-[300px] p-0",
                                table:
                                    "min-w-[900px]",
                                th: [
                                    "text-[11px]",
                                    "font-semibold",
                                    "text-center",
                                ],
                                td: [
                                    "text-xs",
                                    "align-middle",
                                ],
                            }}
                        >
                            <TableHeader>
                                <TableColumn> NÚMERO DE TICKET </TableColumn>
                                <TableColumn> FECHA DE ENVÍO </TableColumn>
                                <TableColumn> NOMBRE DE ARCHIVO </TableColumn>
                                <TableColumn> TIPO DE ENVÍO </TableColumn>
                                <TableColumn> ESTADO DE PROCESO </TableColumn>
                                <TableColumn> CONSTANCIA </TableColumn>
                            </TableHeader>

                            <TableBody emptyContent="No se encontraron envíos">
                                {envios.map(
                                    (envio) => (
                                        <TableRow key={`${envio.tipo_operacion}-${envio.operacion_id}`}>
                                            <TableCell>
                                                {envio.numero_ticket ?? "-"}
                                            </TableCell>

                                            <TableCell>
                                                {formatearFechaHora(envio.fecha_envio)}
                                            </TableCell>

                                            <TableCell>
                                                <span
                                                    className="block max-w-[320px] truncate"
                                                    title={envio.nombre_archivo}
                                                >
                                                    {envio.nombre_archivo}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-sm text-gray-800">
                                                    {envio.tipo_envio_descripcion || "-"}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-sm text-gray-800">
                                                    {obtenerDescripcionEstado(envio)}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    aria-label="Ver constancia"
                                                    title="Ver constancia"
                                                    isDisabled={!envio.numero_ticket}
                                                    isLoading={
                                                        operacionConsultando === `${envio.tipo_operacion}-${envio.operacion_id}`
                                                    }
                                                    onPress={() => {
                                                        void handleVerConstancia(envio);
                                                    }}
                                                >
                                                    <DocumentDuplicateIcon className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            </TableBody>
                        </Table>

                        {totalRegistros > 0 && (
                            <div className="flex flex-col gap-2 border-t border-default-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-gray-600"> Página {pagina} de{" "} {totalPaginas} </p>

                                <Pagination page={pagina} total={totalPaginas} size="sm" showControls onChange={(nuevaPagina) => { void handleBuscar(nuevaPagina); }} />
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Modal
                    isOpen={modalConstanciaAbierto}
                    onClose={cerrarConstancia}
                    size="3xl"
                    scrollBehavior="inside"
                    classNames={{
                        base: "max-h-[90vh]",
                        header: "border-b border-default-200",
                        footer: "border-t border-default-200",
                    }}
                >
                    <ModalContent>
                        {() => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Constancia de procesamiento SUNAT
                                        </h2>

                                        <p className="mt-1 text-sm font-normal text-gray-500">
                                            Consulta del resultado del envío masivo
                                        </p>
                                    </div>
                                </ModalHeader>

                                <ModalBody className="py-6">
                                    {constanciaSeleccionada && (
                                        <div className="space-y-6">

                                            {/* CABECERA SUNAT */}
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Número de ticket
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                                            {constanciaSeleccionada.numero_ticket ?? "-"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Tipo de operación
                                                        </p>

                                                        <div className="mt-1">
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                color={
                                                                    constanciaSeleccionada.tipo_operacion ===
                                                                        "DISCONFORMITY"
                                                                        ? "warning"
                                                                        : "primary"
                                                                }
                                                            >
                                                                {obtenerNombreOperacion(
                                                                    constanciaSeleccionada.tipo_operacion
                                                                )}
                                                            </Chip>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Fecha de envío
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {formatearFechaHoraConstancia(
                                                                constanciaSeleccionada.fecha_envio
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Fecha de finalización
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {formatearFechaHoraConstancia(
                                                                constanciaSeleccionada.fecha_finalizacion
                                                            )}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* DATOS DEL ARCHIVO */}
                                            <div>
                                                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                    Información del archivo
                                                </h3>

                                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                                    <div className="grid grid-cols-1 border-b border-gray-200 md:grid-cols-[220px_1fr]">
                                                        <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                                            Nombre de archivo
                                                        </div>

                                                        <div className="break-all px-4 py-3 text-sm text-gray-900">
                                                            {constanciaSeleccionada.nombre_archivo || "-"}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 border-b border-gray-200 md:grid-cols-[220px_1fr]">
                                                        <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                                            Tipo de envío
                                                        </div>

                                                        <div className="px-4 py-3 text-sm text-gray-900">
                                                            {constanciaSeleccionada.tipo_envio_descripcion || "-"}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 border-b border-gray-200 md:grid-cols-[220px_1fr]">
                                                        <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                                            Código de envío
                                                        </div>

                                                        <div className="px-4 py-3 text-sm text-gray-900">
                                                            {constanciaSeleccionada.tipo_envio_codigo || "-"}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                                                        <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                                            Estado
                                                        </div>

                                                        <div className="px-4 py-3">
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                color={obtenerColorEstado(
                                                                    constanciaSeleccionada.estado_operacion
                                                                )}
                                                            >
                                                                {obtenerDescripcionEstado(
                                                                    constanciaSeleccionada
                                                                )}
                                                            </Chip>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* COMPROBANTE */}
                                            <div>
                                                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                    Información del comprobante
                                                </h3>

                                                <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-3">

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            RUC emisor
                                                        </p>

                                                        <p className="mt-1 text-sm font-medium text-gray-900">
                                                            {constanciaSeleccionada.ruc_emisor}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Tipo comprobante
                                                        </p>

                                                        <p className="mt-1 text-sm font-medium text-gray-900">
                                                            {constanciaSeleccionada.codigo_tipo_comprobante}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Comprobante
                                                        </p>

                                                        <p className="mt-1 text-sm font-medium text-gray-900">
                                                            {constanciaSeleccionada.serie}-
                                                            {constanciaSeleccionada.numero_comprobante}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* RESULTADOS */}
                                            <div>
                                                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                    Resultado del procesamiento
                                                </h3>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                                                        <p className="text-xs font-medium uppercase text-gray-500">
                                                            Enviados
                                                        </p>

                                                        <p className="mt-2 text-2xl font-bold text-gray-900">
                                                            {constanciaSeleccionada.registros_enviados}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                                                        <p className="text-xs font-medium uppercase text-green-700">
                                                            Correctos
                                                        </p>

                                                        <p className="mt-2 text-2xl font-bold text-green-700">
                                                            {constanciaSeleccionada.registros_correctos}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                                                        <p className="text-xs font-medium uppercase text-red-700">
                                                            Con error
                                                        </p>

                                                        <p className="mt-2 text-2xl font-bold text-red-700">
                                                            {constanciaSeleccionada.registros_con_error}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* MOTIVO / SUSTENTO SOLO PARA DISCONFORMIDAD */}
                                            {constanciaSeleccionada.tipo_operacion ===
                                                "DISCONFORMITY" && (
                                                    <div>
                                                        <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                            Información de la disconformidad
                                                        </h3>

                                                        <div className="overflow-hidden rounded-lg border border-gray-200">

                                                            <div className="grid grid-cols-1 border-b border-gray-200 md:grid-cols-[220px_1fr]">
                                                                <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                                                    Motivo
                                                                </div>

                                                                <div className="px-4 py-3 text-sm text-gray-900">
                                                                    {constanciaSeleccionada.motivos || "-"}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                                                                <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                                                                    Sustento
                                                                </div>

                                                                <div className="whitespace-pre-wrap px-4 py-3 text-sm text-gray-900">
                                                                    {constanciaSeleccionada.sustento || "-"}
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                )}

                                            {/* MENSAJE SUNAT */}
                                            <div
                                                className={`rounded-lg border px-5 py-4 ${constanciaSeleccionada.estado_operacion ===
                                                    "COMPLETED" &&
                                                    constanciaSeleccionada.registros_con_error === 0
                                                    ? "border-green-200 bg-green-50"
                                                    : constanciaSeleccionada.estado_operacion ===
                                                        "FAILED" ||
                                                        constanciaSeleccionada.estado_operacion ===
                                                        "ERROR"
                                                        ? "border-red-200 bg-red-50"
                                                        : "border-yellow-200 bg-yellow-50"
                                                    }`}
                                            >
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Resultado SUNAT
                                                </p>

                                                <p className="mt-2 text-sm text-gray-700">
                                                    {obtenerMensajeConstancia(
                                                        constanciaSeleccionada
                                                    )}
                                                </p>
                                            </div>

                                        </div>
                                    )}
                                </ModalBody>

                                <ModalFooter>
                                    <Button
                                        color="primary"
                                        variant="light"
                                        onPress={cerrarConstancia}
                                    >
                                        Cerrar
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

            </div>
        </Dashboard>
    );
};

export default ConsultaEnviosSunat;