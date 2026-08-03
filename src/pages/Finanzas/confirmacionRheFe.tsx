import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Pagination,
  Radio,
  RadioGroup,
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
  EllipsisVerticalIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { DateInput } from "@/components/DateInput";
import type { Selection } from "@react-types/shared";

interface ComprobanteSunat {
  id: string;
  numero: string;
  rucEmisor: string;
  emisor: string;
  rucAdquirente: string;
  adquirente: string;
  fechaEmision: string;
  formaPago: string;
  fechaPuestaDisposicion: string;
  plazoPendiente: number;
  fechaPagoAcordado: string;
  montoPendiente: number;
  moneda: string;
  importeTotal: number;
  marcaConformidad: string;
  condicionConformidad: string;
  estado: string;
  inconsistencias: number;
}

interface CuotaSunatApi {
  numero: string;
  monto: number;
  fechaVencimiento: string | null;
}

interface ComprobanteSunatApi {
  rucEmisor: string;
  rucAdquirente: string;
  razonSocialAdquirente: string;
  codigoTipoComprobante: string;
  serie: string;
  numeroComprobante: number;
  fechaEmision: string;
  fechaPuestaDisposicion: string;
  fechaPlazoPago: string;
  plazoPendiente: number;
  montoPendientePago: number;
  codigoMoneda: string;
  importeTotalFactura: number;
  montoTotalRhe: number;
  montoRetencionRhe: number;
  montoNetoRhe: number;
  cuotas: CuotaSunatApi[];
}

interface ComprobantesPendientesResponse {
  totalRegistros: number;
  numeroPagina: number;
  registrosPorPagina: number;
  resumen: ResumenComprobantesApi;
  comprobantes: ComprobanteSunatApi[];
}

interface ResumenComprobantesApi {
  vencidos: number;
  venceHoyOMañana: number;
  venceEnDosDias: number;
  masDeDosDias: number;
}

type EstadoPlazo = "dentro-plazo" | "por-vencer" | "vencido";

const obtenerEstadoPlazo = (dias: number): EstadoPlazo => {
  if (dias <= 0) {
    return "vencido";
  }

  if (dias <= 2) {
    return "por-vencer";
  }

  return "dentro-plazo";
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));
};

const formatearFechaHora = (fecha?: string | null) => {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
};

const separarFechaHora = (
  valor: string,
): { fecha: string; hora: string } => {
  if (!valor || valor === "-") {
    return {
      fecha: "-",
      hora: "",
    };
  }

  const partes = valor.split(",");

  return {
    fecha: partes[0]?.trim() ?? valor,
    hora: partes.slice(1).join(",").trim(),
  };
};

const SUNAT_API_URL = import.meta.env.VITE_SUNAT_API_URL;

const ConfirmacionRheFe = () => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [tipoFecha, setTipoFecha] = useState("emision");
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [estado, setEstado] = useState("01");
  const [moneda, setMoneda] = useState("todos");
  const [tipoComprobante, setTipoComprobante] = useState("todos");
  const [rucEmisor, setRucEmisor] = useState("");
  const [serieNumero, setSerieNumero] = useState("");
  const [tipoInconsistencia, setTipoInconsistencia] = useState("todos");
  const [comprobantesSeleccionados, setComprobantesSeleccionados] = useState<Selection>(new Set());
  const [comprobantes, setComprobantes] = useState<ComprobanteSunat[]>([]);
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina] = useState(50);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [resumen, setResumen] = useState<ResumenComprobantesApi>({
    vencidos: 0,
    venceHoyOMañana: 0,
    venceEnDosDias: 0,
    masDeDosDias: 0,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuscar = async (paginaSolicitada = 1) => {
    try {
      setCargando(true);
      setError(null);
      setComprobantesSeleccionados(new Set());

      const rucEmisorNormalizado = rucEmisor.trim();
      const serieNumeroNormalizado = serieNumero.trim();

      if (
        rucEmisorNormalizado &&
        rucEmisorNormalizado.length !== 11
      ) {
        throw new Error(
          "El RUC emisor debe contener exactamente 11 dígitos."
        );
      }

      const codigoTipoComprobante = tipoComprobante
        .trim()
        .toLowerCase();

      const parametros = new URLSearchParams({
        codigoTipoComprobante,
        fechaInicio: fechaDesde,
        fechaFin: fechaHasta,
        tipoPedido: "C",
        codigoEstado: estado,
        numeroPagina: String(paginaSolicitada),
        registrosPorPagina: String(registrosPorPagina),
      });

      if (rucEmisorNormalizado) {
        parametros.set("rucEmisor", rucEmisorNormalizado);
      }

      if (serieNumeroNormalizado) {
        parametros.set("serieNumero", serieNumeroNormalizado);
      }

      console.log("tipoComprobante state:", JSON.stringify(tipoComprobante));
      console.log("query enviada:", parametros.toString());

      /*const response = await fetch(
        `https://localhost:7258/api/sunat/comprobantes-pendientes?${parametros.toString()}`
      );*/

      const response = await fetch(
        `${SUNAT_API_URL}/api/sunat/comprobantes/consultar-pendientes?${parametros.toString()}`
      );

      if (!response.ok) {
        const detalleTexto = await response.text();

        let mensaje = `No se pudieron consultar los comprobantes. Código HTTP: ${response.status}`;

        try {
          const detalleJson = JSON.parse(detalleTexto) as {
            message?: string;
            title?: string;
          };

          mensaje =
            detalleJson.message ??
            detalleJson.title ??
            mensaje;
        } catch {
          if (detalleTexto.trim()) {
            mensaje = detalleTexto;
          }
        }

        throw new Error(mensaje);
      }

      const data: ComprobantesPendientesResponse = await response.json();

      const comprobantesMapeados: ComprobanteSunat[] =
        data.comprobantes.map((item) => ({
          id: `${item.rucEmisor}-${item.codigoTipoComprobante}-${item.serie}-${item.numeroComprobante}`,
          numero: `${item.serie}-${item.numeroComprobante}`,
          rucEmisor: item.rucEmisor,
          emisor: "Razón social no disponible",
          rucAdquirente: item.rucAdquirente || "-",
          adquirente: item.razonSocialAdquirente || "Adquirente no disponible",
          fechaEmision: formatearFecha(item.fechaEmision),
          formaPago: item.cuotas?.length ? "Crédito" : "Contado",
          fechaPuestaDisposicion: formatearFechaHora(item.fechaPuestaDisposicion),
          plazoPendiente: item.plazoPendiente,
          fechaPagoAcordado: formatearFecha(item.fechaPlazoPago),
          montoPendiente:
            item.codigoTipoComprobante === "02"
              ? item.montoNetoRhe
              : item.montoPendientePago,
          moneda: item.codigoMoneda,
          importeTotal:
            item.codigoTipoComprobante === "02"
              ? item.montoTotalRhe
              : item.importeTotalFactura,
          marcaConformidad: "Sin evaluación",
          condicionConformidad: "Sin datos",
          estado: "Pendiente",
          inconsistencias: 0,
        }));

      setComprobantes(comprobantesMapeados);
      setTotalRegistros(data.totalRegistros);
      setResumen(data.resumen);
      setPagina(data.numeroPagina);
    } catch (errorConsulta) {
      console.error(errorConsulta);

      setResumen({
        vencidos: 0,
        venceHoyOMañana: 0,
        venceEnDosDias: 0,
        masDeDosDias: 0,
      });

      setComprobantes([]);
      setTotalRegistros(0);
      setPagina(1);

      setError(
        errorConsulta instanceof Error
          ? errorConsulta.message
          : "Ocurrió un error consultando los comprobantes."
      );
    } finally {
      setCargando(false);
    }
  };

  const formatearImporte = (monto: number) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  };

  const totalPaginas = Math.max(1,
    Math.ceil(totalRegistros / registrosPorPagina)
  );

  const cantidadSeleccionada =
    comprobantesSeleccionados === "all"
      ? comprobantes.length
      : comprobantesSeleccionados.size;

  const porVencer =
    resumen.venceHoyOMañana + resumen.venceEnDosDias;

  return (
    <Dashboard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión General
          </h1>

          <p className="text-gray-600">
            Plataforma de Confirmación del RHE y de la FE
          </p>
        </div>

        <Card>
          <CardBody className="space-y-6 p-6">
            <RadioGroup
              orientation="horizontal"
              value={tipoFecha}
              onValueChange={setTipoFecha}
            >
              <Radio value="emision">Fecha de emisión</Radio>
              <Radio value="puesta-disposicion">
                Fecha de puesta a disposición
              </Radio>
            </RadioGroup>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6 [&>*]:min-w-0">
              <DateInput
                label="Desde"
                value={fechaDesde}
                size="sm"
                isClearable={false}
                onValueChange={setFechaDesde}
                className="w-full"
              />

              <DateInput
                label="Hasta"
                value={fechaHasta}
                size="sm"
                isClearable={false}
                onValueChange={setFechaHasta}
                className="w-full"
              />
              <Select
                label="Estado"
                size="sm"
                selectedKeys={[estado]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];

                  if (value) {
                    setEstado(String(value));
                  }
                }}
              >
                <SelectItem key="todos">Todos</SelectItem>
                <SelectItem key="01">Pendiente</SelectItem>
                <SelectItem key="03">Subsanado</SelectItem>
                <SelectItem key="06">Pendiente por reinicio</SelectItem>
              </Select>

              <Select
                label="Moneda"
                size="sm"
                selectedKeys={[moneda]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];

                  if (value) {
                    setMoneda(String(value));
                  }
                }}
              >
                <SelectItem key="todos">Todos</SelectItem>
                <SelectItem key="PEN">PEN</SelectItem>
                <SelectItem key="USD">USD</SelectItem>
              </Select>

              <Select
                label="Tipo de comprobante"
                size="sm"
                selectedKeys={[tipoComprobante]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];

                  if (value) {
                    setTipoComprobante(String(value));
                  }
                }}
              >
                <SelectItem key="todos">Todos</SelectItem>
                <SelectItem key="01">Factura</SelectItem>
                <SelectItem key="02">Recibo por honorarios</SelectItem>
              </Select>

              <Input
                label="RUC emisor"
                size="sm"
                value={rucEmisor}
                maxLength={11}
                inputMode="numeric"
                onValueChange={(valor) => {
                  setRucEmisor(valor.replace(/\D/g, "").slice(0, 11));
                }}
              />

              <Input
                label="Serie y número de comprobante"
                size="sm"
                value={serieNumero}
                placeholder=""
                onValueChange={(valor) => {
                  setSerieNumero(
                    valor.toUpperCase().replace(/\s/g, "")
                  );
                }}
              />

              <Select
                label="Tipo de inconsistencia"
                size="sm"
                selectedKeys={[tipoInconsistencia]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];

                  if (value) {
                    setTipoInconsistencia(String(value));
                  }
                }}
              >
                <SelectItem key="todos">Todos</SelectItem>
              </Select>

              <div className="flex items-end justify-end md:col-span-2 xl:col-span-1 xl:col-start-6">
                <Button
                  color="primary"
                  size="sm"
                  isLoading={cargando}
                  startContent={
                    !cargando ? <MagnifyingGlassIcon className="h-5 w-5" /> : undefined
                  }
                  onPress={() => handleBuscar(1)}
                >
                  Buscar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {totalRegistros > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardBody className="flex min-h-[118px] flex-row items-center justify-between p-5">
                <div>
                  <p className="text-sm text-gray-600">
                    Total pendientes
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {totalRegistros}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Documentos encontrados
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <span className="text-xl font-bold text-primary">
                    {totalRegistros}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex min-h-[118px] flex-row items-center justify-between p-5">
                <div>
                  <p className="text-sm text-gray-600">
                    Dentro del plazo
                  </p>

                  <p className="mt-2 text-3xl font-bold text-success">
                    {resumen.masDeDosDias}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Más de 2 días
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100">
                  <span className="h-5 w-5 rounded bg-success" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex min-h-[118px] flex-row items-center justify-between p-5">
                <div>
                  <p className="text-sm text-gray-600">
                    Por vencer
                  </p>

                  <p className="mt-2 text-3xl font-bold text-warning">
                    {porVencer}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Hoy, mañana o en 2 días
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100">
                  <span className="h-5 w-5 rounded bg-warning" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex min-h-[118px] flex-row items-center justify-between p-5">
                <div>
                  <p className="text-sm text-gray-600">
                    Vencidos
                  </p>

                  <p className="mt-2 text-3xl font-bold text-danger">
                    {resumen.vencidos}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Requieren atención inmediata
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-100">
                  <span className="h-5 w-5 rounded bg-danger" />
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <Card>
          <CardBody className="space-y-3 p-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-lg font-bold">
                  {totalRegistros}
                </span>

                <span className="ml-2 text-sm text-gray-600">
                  Comprobantes pendientes
                </span>
              </div>

              {/*
              <div className="flex flex-wrap gap-3">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
                >
                  Carga masiva
                </Button>

                <Button
                  color="primary"
                  startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
                >
                  Exportar a Excel
                </Button>
              </div>
              */}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-default-200 bg-default-50 px-3 py-2">
              <span className="text-sm font-semibold text-gray-700">
                Plazo de atención:
              </span>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="h-3.5 w-7 rounded bg-success" />
                <span>Dentro del plazo (mayor a dos días)</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="h-3.5 w-7 rounded bg-warning" />
                <span>Por vencer (1 o 2 días)</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="h-3.5 w-7 rounded bg-danger" />
                <span>Vencido</span>
              </div>
            </div>

            <div id="tabla-comprobantes-sunat"></div>

            <Table
              aria-label="Comprobantes pendientes de SUNAT"
              selectionMode="multiple"
              selectedKeys={comprobantesSeleccionados}
              onSelectionChange={setComprobantesSeleccionados}
              classNames={{
                base: "w-full overflow-x-auto",
                wrapper: "min-h-[300px] p-0",
                table: "min-w-[1280px] table-fixed",
                th: [
                  "px-2",
                  "py-3",
                  "text-[11px]",
                  "font-semibold",
                  "text-center",
                  "leading-tight",
                  "whitespace-normal",

                  // Columna automática del checkbox
                  "first:w-[44px]",
                  "first:min-w-[44px]",
                  "first:max-w-[44px]",
                  "first:px-2",
                ],
                td: [
                  "px-2",
                  "py-3",
                  "text-xs",
                  "leading-tight",
                  "align-middle",

                  // Columna automática del checkbox
                  "first:w-[44px]",
                  "first:min-w-[44px]",
                  "first:max-w-[44px]",
                  "first:px-2",
                ],
              }}
            >
              <TableHeader>
                <TableColumn className="w-[82px] text-center">
                  NÚMERO
                </TableColumn>

                <TableColumn className="w-[175px] text-left">
                  EMISOR
                </TableColumn>

                <TableColumn className="w-[165px] text-left">
                  ADQUIRENTE
                </TableColumn>

                <TableColumn className="w-[72px] text-center">
                  <span className="block leading-tight">
                    FECHA
                    <br />
                    EMISIÓN
                  </span>
                </TableColumn>

                <TableColumn className="w-[70px] text-center">
                  <span className="block leading-tight">
                    FORMA
                    <br />
                    DE PAGO
                  </span>
                </TableColumn>

                <TableColumn className="w-[92px] text-center">
                  <span className="block leading-tight">
                    FECHA PUESTA
                    <br />
                    A DISPOSICIÓN
                  </span>
                </TableColumn>

                <TableColumn className="w-[72px] text-center">
                  <span className="block leading-tight">
                    PLAZO
                    <br />
                    PENDIENTE
                  </span>
                </TableColumn>

                <TableColumn className="w-[78px] text-center">
                  <span className="block leading-tight">
                    PLAZO PAGO
                    <br />
                    ACORDADO
                  </span>
                </TableColumn>

                <TableColumn className="w-[92px] text-center">
                  <span className="block leading-tight">
                    MONTO NETO
                    <br />
                    PENDIENTE
                    <br />
                    PAGO
                  </span>
                </TableColumn>

                <TableColumn className="w-[55px] text-center">
                  MONEDA
                </TableColumn>

                <TableColumn className="w-[82px] text-center">
                  <span className="block leading-tight">
                    IMPORTE
                    <br />
                    TOTAL
                  </span>
                </TableColumn>

                <TableColumn className="w-[96px] text-center">
                  <span className="block leading-tight">
                    MARCA DE
                    <br />
                    CONF./DISCONF.
                  </span>
                </TableColumn>

                <TableColumn className="w-[92px] text-center">
                  <span className="block leading-tight">
                    CONDICIÓN
                    <br />
                    CONFORMIDAD
                  </span>
                </TableColumn>

                <TableColumn className="w-[72px] text-center">
                  ESTADO
                </TableColumn>

                <TableColumn className="w-[64px] text-center">
                  <span className="block leading-tight">
                    INCONSIS-
                    <br />
                    TENCIAS
                  </span>
                </TableColumn>

                <TableColumn className="w-[52px] text-center">
                  ACCIONES
                </TableColumn>
              </TableHeader>

              <TableBody emptyContent="No se encontraron comprobantes">
                {comprobantes.map((comprobante) => {
                  const puestaDisposicion = separarFechaHora(
                    comprobante.fechaPuestaDisposicion
                  );

                  const estadoPlazo = obtenerEstadoPlazo(
                    comprobante.plazoPendiente
                  );


                  return (
                    <TableRow key={comprobante.id}>
                      <TableCell>
                        <span className="font-medium">
                          {comprobante.numero}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="w-full min-w-0 leading-tight">
                          <p className="whitespace-nowrap text-[10px] text-gray-500">
                            {comprobante.rucEmisor}
                          </p>

                          <p
                            className="mt-1 truncate text-xs font-medium"
                            title={comprobante.emisor}
                          >
                            {comprobante.emisor}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="w-full min-w-0 leading-tight">
                          <p className="whitespace-nowrap text-[10px] text-gray-500">
                            RUC: {comprobante.rucAdquirente}
                          </p>

                          <p
                            className="mt-1 truncate text-xs font-medium"
                            title={comprobante.adquirente}
                          >
                            {comprobante.adquirente}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center text-xs leading-tight">
                          {comprobante.fechaEmision}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center">
                          {comprobante.formaPago}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center leading-tight">
                          <div className="whitespace-nowrap text-xs font-medium">
                            {puestaDisposicion.fecha}
                          </div>

                          {puestaDisposicion.hora && (
                            <div className="mt-1 whitespace-nowrap text-[10px] text-gray-500">
                              {puestaDisposicion.hora}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center">
                          <Chip
                            size="sm"
                            variant="solid"
                            color={
                              estadoPlazo === "vencido"
                                ? "danger"
                                : estadoPlazo === "por-vencer"
                                  ? "warning"
                                  : "success"
                            }
                            className="min-w-[58px] justify-center px-1"
                          >
                            {estadoPlazo === "vencido"
                              ? "VENCIDO"
                              : `${comprobante.plazoPendiente} ${comprobante.plazoPendiente === 1 ? "DÍA" : "DÍAS"
                              }`}
                          </Chip>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center text-xs leading-tight">
                          {comprobante.fechaPagoAcordado}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="whitespace-nowrap text-right text-xs tabular-nums">
                          {formatearImporte(comprobante.montoPendiente)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center text-xs">
                          {comprobante.moneda}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="whitespace-nowrap text-right text-xs tabular-nums">
                          {formatearImporte(comprobante.importeTotal)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center">
                          {comprobante.marcaConformidad}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-center">
                          {comprobante.condicionConformidad}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center">
                          <Chip color="warning" size="sm" variant="flat">
                            {comprobante.estado}
                          </Chip>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="min-w-[26px] justify-center px-1"
                          >
                            {comprobante.inconsistencias}
                          </Chip>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </Button>
                            </DropdownTrigger>

                            <DropdownMenu aria-label="Acciones del comprobante">
                              <DropdownItem
                                key="detalle"
                                startContent={<EyeIcon className="h-4 w-4" />}
                              >
                                Ver detalle
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalRegistros > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  Página {pagina} de {totalPaginas} · {totalRegistros} registros
                </p>

                <Pagination
                  page={pagina}
                  total={totalPaginas}
                  size="sm"
                  showControls
                  onChange={(nuevaPagina) => {
                    void handleBuscar(nuevaPagina);
                  }}
                />
              </div>
            )}


            <div className="flex flex-col gap-3 border-t border-default-200 pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                {cantidadSeleccionada} comprobante(s) seleccionado(s)
              </p>

             {/*
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  color="primary"
                  isDisabled={cantidadSeleccionada === 0}
                >
                  Conformidad
                </Button>

                <Button
                  color="primary"
                  variant="bordered"
                  isDisabled={cantidadSeleccionada === 0}
                >
                  Disconformidad
                </Button>
              </div>
              */}

            </div>
          </CardBody>
        </Card>
      </div>
    </Dashboard>
  );
};

export default ConfirmacionRheFe;