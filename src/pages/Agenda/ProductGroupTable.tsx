// src/pages/Agenda/ProductGroupTable.tsx
// Vista Lista agrupada por cita: una fila por cita y, al hacer clic, sus productos.
// Tabla propia (HeroUI no permite filas desplegables con celdas que ocupen varias columnas).
import React from 'react';
import { Button, Chip } from '@heroui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ProductApiRecord } from '@/services/agenda/packingListApi';
import {
    DocumentationStatus,
    formatCobertura,
    formatDateFromAPI,
    formatDocumentation,
    formatHorario,
    formatInvoiceSummary,
    formatOrders,
    formatStatusCita,
    formatStatusFactura,
    getCodCita,
    getStatusCitaConfig,
    parseStatusFactura,
    ProductGroup,
    summarizeDocumentation,
} from './productList';

interface ProductGroupTableProps {
    groups: ProductGroup[];
    expandedKeys: Set<string>;
    onToggle: (key: string) => void;
    onViewAppointment: (product: ProductApiRecord) => void;
    /** Documentación completa del producto (OC, Guía, Factura y Parte de Ingreso); null si no se ubicó la cita */
    getDocumentation: (product: ProductApiRecord) => DocumentationStatus | null;
}

const GROUP_COLUMNS = ['', 'Fecha', 'Horario', 'Proveedor', 'OC', 'Estado cita', 'N° Cita', 'Adjuntos', 'Status SAP', 'Documentación', ''];
const PRODUCT_COLUMNS = ['OC', 'Código', 'Descripción', 'Cantidad', 'Confirmación PCP', 'Cobertura actual', 'Cobertura con ingresos', 'Comentario PCP', 'Parte de ingreso', 'Status SAP', 'Documentación'];

const Empty = () => <span className="text-gray-400 text-sm">-</span>;

/** Completa / Incompleta, con los faltantes al pasar el cursor */
const DocumentationChip: React.FC<{ status: DocumentationStatus | null }> = ({ status }) => {
    if (!status) return <Empty />;
    return (
        <span title={status.complete || status.missing.length === 0 ? undefined : `Falta: ${status.missing.join(', ')}`}>
            <Chip size="sm" variant="flat" color={status.complete ? 'success' : 'warning'}>
                {formatDocumentation(status)}
            </Chip>
        </span>
    );
};

/** Factura SAP de un producto, según su packing list */
const InvoiceChip: React.FC<{ value: ProductApiRecord['status_factura'] }> = ({ value }) => {
    const hasInvoice = parseStatusFactura(value);
    if (hasInvoice === null) return <Empty />;
    return (
        <Chip size="sm" variant="flat" color={hasInvoice ? 'success' : 'default'}>
            {formatStatusFactura(value)}
        </Chip>
    );
};

const ProductGroupTable: React.FC<ProductGroupTableProps> = ({ groups, expandedKeys, onToggle, onViewAppointment, getDocumentation }) => (
    // Único contenedor con scroll: la barra horizontal queda visible y la cabecera fija al bajar
    <div className="h-full min-h-[222px] overflow-auto rounded-large shadow-small bg-content1">
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    {GROUP_COLUMNS.map((column, index) => (
                        <th
                            key={index}
                            className="sticky top-0 z-10 bg-default-100 px-3 h-10 text-left text-tiny font-semibold uppercase text-default-500 whitespace-nowrap"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {groups.map((group) => {
                    const { first, invoice } = group;
                    const isExpanded = expandedKeys.has(group.key);
                    return (
                        <React.Fragment key={group.key}>
                            <tr
                                className={`border-b border-default-100 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                onClick={(e) => {
                                    // "Ver cita" abre la cita sin desplegar la fila
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    onToggle(group.key);
                                }}
                                aria-expanded={isExpanded}
                            >
                                <td className="pl-3 pr-1 py-2 w-8">
                                    {isExpanded
                                        ? <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                                        : <ChevronRightIcon className="w-4 h-4 text-gray-600" />}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatDateFromAPI(first.u_fecha)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatHorario(first.horario)}</td>
                                <td className="px-3 py-2 max-w-[280px]">
                                    <div className="truncate font-medium" title={first.u_razon_social}>{first.u_razon_social}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap" title={group.orders.join(', ')}>{formatOrders(group.orders)}</td>
                                <td className="px-3 py-2">
                                    {first.status_cita ? (
                                        <Chip size="sm" variant="flat" color={getStatusCitaConfig(first.status_cita)?.color ?? 'default'}>
                                            {formatStatusCita(first.status_cita)}
                                        </Chip>
                                    ) : <Empty />}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">{getCodCita(first) || <Empty />}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{first.cantidad_adjuntos ?? '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    {!invoice.hasData ? <Empty /> : (
                                        <Chip size="sm" variant="flat" color={invoice.missing === 0 ? 'success' : 'warning'}>
                                            {formatInvoiceSummary(invoice)}
                                        </Chip>
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <DocumentationChip status={summarizeDocumentation(group.products.map(getDocumentation))} />
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <Button size="sm" variant="flat" color="primary" onPress={() => onViewAppointment(first)}>
                                        Ver cita
                                    </Button>
                                </td>
                            </tr>
                            {isExpanded && (
                                <tr className="border-b border-default-200 bg-gray-50">
                                    <td />
                                    <td colSpan={GROUP_COLUMNS.length - 1} className="px-3 py-3">
                                        <table className="min-w-full text-sm bg-white rounded-lg border border-gray-200">
                                            <thead>
                                                <tr>
                                                    {PRODUCT_COLUMNS.map((column) => (
                                                        <th key={column} className="px-3 py-2 text-left text-tiny font-semibold uppercase text-default-500 bg-default-50 whitespace-nowrap">
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.products.map((product, index) => (
                                                    <tr key={`${product.number}-${product.item_code}-${index}`} className="border-t border-gray-100">
                                                        <td className="px-3 py-2 whitespace-nowrap">{product.number}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap">{product.item_code}</td>
                                                        <td className="px-3 py-2 max-w-[320px]">
                                                            <div className="truncate" title={product.item_name}>{product.item_name}</div>
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-right">{product.quantity}</td>
                                                        <td className="px-3 py-2">
                                                            {product.confirmacion_pcp ? (
                                                                <Chip size="sm" variant="flat" color={product.confirmacion_pcp === 'CONFORME' ? 'success' : 'danger'}>
                                                                    {product.confirmacion_pcp}
                                                                </Chip>
                                                            ) : <Empty />}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-right">{formatCobertura(product.cobertura_actual)}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-right">{formatCobertura(product.cobertura_ingreso)}</td>
                                                        <td className="px-3 py-2 max-w-[220px]">
                                                            {product.comentario
                                                                ? <div className="truncate" title={product.comentario}>{product.comentario}</div>
                                                                : <Empty />}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap">{product.num_parte_ingreso || <Empty />}</td>
                                                        <td className="px-3 py-2">
                                                            <InvoiceChip value={product.status_factura} />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <DocumentationChip status={getDocumentation(product)} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default ProductGroupTable;
