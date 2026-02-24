import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image
} from '@react-pdf/renderer';
import { SupplierClaim } from '@/store/types';

// Estilos profesionales y compactos (mismo formato que SupplierPDF)
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 9,
        backgroundColor: '#ffffff',
        lineHeight: 1.3,
    },
    // Header corporativo
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '1pt solid #1e293b',
    },
    logo: {
        width: 120,
        height: 45,
        objectFit: 'contain',
        marginRight: 15,
    },
    headerRight: {
        flex: 1,
    },
    documentTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'left',
    },
    headerInfoRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#1e293b',
        marginBottom: 2,
    },
    headerCell: {
        borderRightWidth: 1,
        borderRightColor: '#1e293b',
        paddingVertical: 0,
        paddingHorizontal: 6,
    },
    headerCellLabel: {
        fontSize: 7,
        color: '#64748b',
        marginBottom: 0,
    },
    headerCellValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    // Secciones
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 5,
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: '#f1f5f9',
    },
    // Grid de datos de cabecera - Dos columnas
    headerDataGrid: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    headerDataColumn: {
        width: '50%',
        paddingRight: 8,
    },
    headerDataRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 3,
        paddingHorizontal: 4,
    },
    dataLabel: {
        fontSize: 7,
        color: '#64748b',
        width: '45%',
    },
    dataValue: {
        fontSize: 8,
        color: '#1e293b',
        fontWeight: 'bold',
        width: '55%',
        textAlign: 'right',
    },
    // Campos de texto
    textField: {
        marginBottom: 6,
    },
    textFieldLabel: {
        fontSize: 7,
        color: '#64748b',
        marginBottom: 2,
        fontWeight: 'bold',
    },
    textFieldValue: {
        fontSize: 8,
        color: '#1e293b',
        padding: 4,
        //backgroundColor: '#f8fafc',
        //borderWidth: 0.5,
        //borderColor: '#cbd5e1',
        minHeight: 20,
    },
    // Tabla de acciones
    table: {
        marginTop: 5,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottom: '1pt solid #cbd5e1',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #e2e8f0',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    tableCell: {
        fontSize: 7,
        color: '#1e293b',
    },
    tableCellHeader: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#475569',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 7,
        paddingTop: 8,
        borderTop: '0.5pt solid #e2e8f0',
    },
    // Dos columnas
    twoColumns: {
        flexDirection: 'row',
        gap: 12,
    },
    column: {
        flex: 1,
    },
});

interface ReclamoPDFProps {
    claim: SupplierClaim;
}

export const ReclamoPDF = ({ claim }: ReclamoPDFProps) => {
    const formatDate = (date?: string) => {
        if (!date) return '—';
        try {
            return new Date(date).toLocaleDateString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return date;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Corporativo */}
                <View style={styles.header}>
                    {/* Logo a la izquierda */}
                    <Image style={styles.logo} src={"/logo-vistony.png"} />
                    
                    {/* Título y datos a la derecha */}
                    <View style={styles.headerRight}>
                        <Text style={styles.documentTitle}>
                            RECLAMO A PROVEEDORES
                        </Text>
                        
                        {/* Fila de 3 datos */}
                        <View style={styles.headerInfoRow}>
                            <View style={[styles.headerCell, { width: '30%' }]}>
                                <Text style={styles.headerCellLabel}>Código</Text>
                                <Text style={styles.headerCellValue}>VIS-COM-FC-011</Text>
                            </View>
                            <View style={[styles.headerCell, { width: '30%' }]}>
                                <Text style={styles.headerCellLabel}>Versión</Text>
                                <Text style={styles.headerCellValue}>01</Text>
                            </View>
                            <View style={[styles.headerCell, { width: '40%', borderRightWidth: 0 }]}>
                                <Text style={styles.headerCellLabel}>Fecha de Aprobación</Text>
                                <Text style={styles.headerCellValue}>12.06.2023</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Datos de Cabecera */}
                <View style={styles.section}>
                    <View style={styles.headerDataGrid}>
                        {/* Columna Izquierda */}
                        <View style={styles.headerDataColumn}>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Fecha de Reclamo:</Text>
                                <Text style={styles.dataValue}>{formatDate(claim.fechaReclamo)}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Número de Reclamo:</Text>
                                <Text style={styles.dataValue}>{claim.numeroReclamo || '—'}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Área que Emite el Reclamo:</Text>
                                <Text style={styles.dataValue}>{claim.areaEmite || '—'}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>N° Lote:</Text>
                                <Text style={styles.dataValue}>{claim.nLote || '—'}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Responsable:</Text>
                                <Text style={styles.dataValue}>{claim.responsable || '—'}</Text>
                            </View>
                        </View>
                        {/* Columna Derecha */}
                        <View style={styles.headerDataColumn}>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Cantidad:</Text>
                                <Text style={styles.dataValue}>{claim.cantidad || '—'}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Proveedor:</Text>
                                <Text style={styles.dataValue}>{claim.proveedor || '—'}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Orden Compra/Factura:</Text>
                                <Text style={styles.dataValue}>
                                    {claim.ordenCompra || claim.factura ? `${claim.ordenCompra || ''}${claim.ordenCompra && claim.factura ? ' / ' : ''}${claim.factura || ''}` : '—'}
                                </Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Insumo/Material:</Text>
                                <Text style={styles.dataValue}>{claim.insumoMaterial || '—'}</Text>
                            </View>
                            <View style={styles.headerDataRow}>
                                <Text style={styles.dataLabel}>Fecha de Arribo del Insumo:</Text>
                                <Text style={styles.dataValue}>{formatDate(claim.fechaArribo)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Sección 1: Datos del Registro de Inspección o Análisis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        1. DATOS DEL REGISTRO DE INSPECCIÓN O ANÁLISIS
                    </Text>
                    {/*<View style={styles.textField}>*/}
                        <Text style={styles.textFieldValue}>
                            {claim.datosRegistroInspeccion || '—'}
                        </Text>
                    {/*</View>*/}
                </View>

                {/* Sección 2: Motivo del Reclamo e Impacto */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        2. MOTIVO DEL RECLAMO E IMPACTO
                    </Text>
                    <View style={styles.textField}>
                        <Text style={styles.textFieldLabel}>Motivo</Text>
                        <Text style={styles.textFieldValue}>
                            {claim.motivoReclamo || '—'}
                        </Text>
                    </View>
                    <View style={styles.textField}>
                        <Text style={styles.textFieldLabel}>Impacto</Text>
                        <Text style={styles.textFieldValue}>
                            {claim.impacto || '—'}
                        </Text>
                    </View>
                </View>

                {/* Sección 3: Respuesta Inmediata del Proveedor */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        3. RESPUESTA INMEDIATA DEL PROVEEDOR (Para ser llenado por el proveedor)
                    </Text>
                    <View style={styles.twoColumns}>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>Fecha de Respuesta</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.respuestaInmediata?.fechaRespuesta ? formatDate(claim.respuestaInmediata.fechaRespuesta) : '—'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>Responsable</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.respuestaInmediata?.responsable || '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.textField}>
                        <Text style={styles.textFieldLabel}>Respuesta</Text>
                        <Text style={styles.textFieldValue}>
                            {claim.respuestaInmediata?.respuesta || '—'}
                        </Text>
                    </View>
                </View>

                {/* Sección 4: Evaluación del Reclamo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        4. EVALUACIÓN DEL RECLAMO (Para ser llenado por el proveedor)
                    </Text>
                    <View style={styles.twoColumns}>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>Fecha de Evaluación</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.evaluacionReclamo?.fechaEvaluacion ? formatDate(claim.evaluacionReclamo.fechaEvaluacion) : '—'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>Evaluado Por</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.evaluacionReclamo?.evaluadoPor || '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.twoColumns}>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>¿Reclamo Procede?</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.evaluacionReclamo?.reclamoProcede || '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.textField}>
                        <Text style={styles.textFieldLabel}>Descripción</Text>
                        <Text style={styles.textFieldValue}>
                            {claim.evaluacionReclamo?.descripcion || '—'}
                        </Text>
                    </View>
                </View>

                {/* Sección 5: Plan de Acciones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        5. PLAN DE ACCIONES (Para ser llenado por el proveedor)
                    </Text>
                    {claim.planAcciones && claim.planAcciones.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { width: '60%' }]}>Acción</Text>
                                <Text style={[styles.tableCellHeader, { width: '20%' }]}>Fecha</Text>
                                <Text style={[styles.tableCellHeader, { width: '20%' }]}>Estado</Text>
                            </View>
                            {claim.planAcciones.map((accion, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { width: '60%' }]}>{accion.accion}</Text>
                                    <Text style={[styles.tableCell, { width: '20%' }]}>{formatDate(accion.fecha)}</Text>
                                    <Text style={[styles.tableCell, { width: '20%' }]}>{accion.estado || 'Abierto'}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.textFieldValue}>—</Text>
                    )}
                </View>

                {/* Sección 6: Cierre del Reclamo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        6. CIERRE DEL RECLAMO (Para ser llenado por el área que presentó el reclamo)
                    </Text>
                    <View style={styles.twoColumns}>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>¿Las acciones tomadas han sido efectivas?</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.cierreReclamo?.accionesEfectivas || '—'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.column}>
                            <View style={styles.textField}>
                                <Text style={styles.textFieldLabel}>Fecha de Cierre</Text>
                                <Text style={styles.textFieldValue}>
                                    {claim.cierreReclamo?.fechaCierre ? formatDate(claim.cierreReclamo.fechaCierre) : '—'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.textField}>
                        <Text style={styles.textFieldLabel}>Responsable de Cierre</Text>
                        <Text style={styles.textFieldValue}>
                            {claim.cierreReclamo?.responsableCierre || '—'}
                        </Text>
                    </View>
                    <View style={styles.textField}>
                        <Text style={styles.textFieldLabel}>Observación</Text>
                        <Text style={styles.textFieldValue}>
                            {claim.cierreReclamo?.observacion || '—'}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Documento generado el {new Date().toLocaleDateString('es-PE')}
                </Text>
            </Page>
        </Document>
    );
};
