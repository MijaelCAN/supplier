import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image
} from '@react-pdf/renderer';
import {Supplier} from "@/store/types.ts";

// Estilos profesionales y compactos
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
    supplierInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 0,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
    },
    supplierName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    supplierDetail: {
        fontSize: 8,
        color: '#475569',
    },
    // Secciones
    section: {
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 5,
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: '#f1f5f9',
        //borderLeft: '3pt solid #1e293b',
    },
    // Grid de 4 columnas para info compacta en una sola fila
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 0,
    },
    infoItem: {
        width: '23%',
        marginBottom: 0,
    },
    infoLabel: {
        fontSize: 6.5,
        color: '#64748b',
        marginBottom: 0,
    },
    infoValue: {
        fontSize: 7.5,
        color: '#1e293b',
    },
    // Tablas compactas
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
    // Direcciones en línea
    addressLine: {
        fontSize: 7,
        color: '#475569',
        marginBottom: 3,
        paddingLeft: 8,
    },
    // Características SUNAT en línea
    characteristicsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    characteristic: {
        fontSize: 7,
        color: '#475569',
        backgroundColor: '#f8fafc',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 2,
    },
    // Footer minimalista
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
    // Documentos como tabla
    documentTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 1,
        paddingHorizontal: 4,
    },
    documentName: {
        fontSize: 7,
        color: '#1e293b',
        width: '85%',
    },
    documentCheck: {
        fontSize: 8,
        color: '#1b2f4c',
        width: '15%',
        textAlign: 'center',
    },
    // Dos columnas solo para secciones cortas
    twoColumns: {
        flexDirection: 'row',
        gap: 12,
    },
    column: {
        flex: 1,
    },
    // Texto compacto
    compactText: {
        fontSize: 7,
        color: '#475569',
        lineHeight: 1.2,
    },
});

interface SupplierPDFProps {
    supplier: Supplier;
    completionPercentage: number;
}

export const SupplierPDF = ({ supplier, completionPercentage }: SupplierPDFProps) => {
    const formatDate = (date?: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Document>
            {/* Página 1: Información Completa */}
            <Page size="A4" style={styles.page}>
                {/* Header Corporativo Mejorado */}
                <View style={styles.header}>
                    {/* Logo a la izquierda */}
                    <Image style={styles.logo} src={"/logo-vistony.png"} />
                    
                    {/* Título y datos a la derecha */}
                    <View style={styles.headerRight}>
                        <Text style={styles.documentTitle}>
                            INFORMACIÓN PARA EVALUACIÓN DE PROVEEDORES - SERVICIOS
                        </Text>
                        
                        {/* Fila de 3 datos con el último más grande */}
                        <View style={styles.headerInfoRow}>
                            <View style={[styles.headerCell, { width: '30%' }]}>
                                <Text style={styles.headerCellLabel}>Código</Text>
                                <Text style={styles.headerCellValue}>VIS-COM-FC-010</Text>
                            </View>
                            <View style={[styles.headerCell, { width: '30%' }]}>
                                <Text style={styles.headerCellLabel}>Versión</Text>
                                <Text style={styles.headerCellValue}>03</Text>
                            </View>
                            <View style={[styles.headerCell, { width: '40%', borderRightWidth: 0 }]}>
                                <Text style={styles.headerCellLabel}>Fecha de Aprobación</Text>
                                {/*<Text style={styles.headerCellValue}>{formatDate(supplier.registrationDate || new Date().toISOString())}</Text>*/}
                                <Text style={styles.headerCellValue}>12.06.2023</Text>
                            </View>
                        </View>

                        {/* Información del proveedor en dos columnas */}
                        <View style={styles.supplierInfo}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.supplierName}>{supplier.cardName}</Text>
                                <Text style={styles.supplierDetail}>RUC: { supplier.RUC || '—'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.supplierDetail}>Código: {supplier.cardCode}</Text>
                                <Text style={styles.supplierDetail}>Estado: {supplier.status}</Text>
                                <Text style={styles.supplierDetail}>Completitud: {completionPercentage}%</Text>
                            </View>
                        </View>
                    </View>
                </View>


                {/* 1. INFORMACIÓN GENERAL - Una sola columna */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. INFORMACIÓN GENERAL</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Tipo Persona</Text>
                            <Text style={styles.infoValue}>{supplier.personType || '—'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{supplier.email || '—'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Teléfono</Text>
                            <Text style={styles.infoValue}>{supplier.phone || '—'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Sitio Web</Text>
                            <Text style={styles.infoValue}>{supplier.website || '—'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Fecha Registro</Text>
                            <Text style={styles.infoValue}>{formatDate(supplier.registrationDate)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Última Actualización</Text>
                            <Text style={styles.infoValue}>{formatDate(supplier.lastProfileUpdate)}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. PRINCIPALES EJECUTIVOS - Una sola columna */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. PRINCIPALES EJECUTIVOS DE LA EMPRESA</Text>
                    {supplier.contactPerson && supplier.contactPerson.length > 0 ? (
                        <View style={styles.infoGrid}>
                            {supplier.contactPerson.slice(0, 4).map((contact, index) => (
                                <View key={index} style={[styles.infoItem, { width: '48%' }]}>
                                    <Text style={styles.infoLabel}>{contact.position || `Ejecutivo ${index + 1}`}</Text>
                                    <Text style={styles.infoValue}>{contact.name}</Text>
                                    <Text style={[styles.compactText, { fontSize: 6.5 }]}>
                                        {contact.email}
                                    </Text>
                                    <Text style={[styles.compactText, { fontSize: 6.5 }]}>
                                        Tel: {contact.phone}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.compactText}>No registrados</Text>
                    )}
                </View>

                {/* 3. DIRECCIONES Y CARACTERÍSTICAS SUNAT - Dos columnas */}
                <View style={styles.twoColumns}>
                    {/* Direcciones */}
                    <View style={[styles.column, styles.section]}>
                        <Text style={styles.sectionTitle}>3. DIRECCIONES</Text>
                        {supplier.addresses && supplier.addresses.length > 0 ? (
                            supplier.addresses.map((address, index) => (
                                <Text key={index} style={styles.addressLine}>
                                    • {address.address}, {address.city}, {address.province}
                                </Text>
                            ))
                        ) : (
                            <Text style={styles.compactText}>No registradas</Text>
                        )}
                    </View>

                    {/* Características SUNAT */}
                    <View style={[styles.column, styles.section]}>
                        <Text style={styles.sectionTitle}>4. CARACTERÍSTICAS SUNAT</Text>
                        {(supplier.goodContributor || supplier.agentePercepcion || supplier.exoneradoPercepcion) ? (
                            <View style={{ gap: 3 }}>
                                {supplier.goodContributor && (
                                    <Text style={styles.compactText}>• Buen Contribuyente</Text>
                                )}
                                {supplier.agentePercepcion && (
                                    <Text style={styles.compactText}>• Agente de Percepción</Text>
                                )}
                                {supplier.exoneradoPercepcion && (
                                    <Text style={styles.compactText}>• Exonerado de Percepción</Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.compactText}>Sin características especiales</Text>
                        )}
                    </View>
                </View>

                {/* 5. LISTA DE CONTACTOS - Una sola columna */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. LISTA DE CONTACTOS</Text>
                    {supplier.contactPerson && supplier.contactPerson.length > 0 ? (
                        <View style={styles.infoGrid}>
                            {supplier.contactPerson.map((contact, index) => (
                                <View key={index} style={[styles.infoItem, { width: '31%' }]}>
                                    <Text style={styles.infoLabel}>{contact.name}</Text>
                                    <Text style={[styles.infoValue, { fontSize: 6.5 }]}>{contact.position || '—'}</Text>
                                    <Text style={[styles.compactText, { fontSize: 6 }]}>{contact.email}</Text>
                                    <Text style={[styles.compactText, { fontSize: 6 }]}>{contact.phone}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.compactText}>No hay contactos registrados</Text>
                    )}
                </View>

                {/* 6. REFERENCIAS BANCARIAS - Una sola columna */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. REFERENCIAS BANCARIAS</Text>
                    {supplier.bankReferences && supplier.bankReferences.length > 0 ? (
                        <View style={styles.infoGrid}>
                            {supplier.bankReferences.map((bank, index) => (
                                <View key={index} style={[styles.infoItem, { width: '31%' }]}>
                                    <Text style={styles.infoLabel}>{bank.bankName}</Text>
                                    <Text style={[styles.infoValue, { fontSize: 6.5 }]}>Cta: {bank.accountNumber}</Text>
                                    <Text style={[styles.compactText, { fontSize: 6 }]}>
                                        Tipo: {bank.accountType || '—'} | {bank.currency || '—'}
                                    </Text>
                                    <Text style={[styles.compactText, { fontSize: 6 }]}>
                                        Sectorista: {bank.sectorista || '—'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.compactText}>No hay referencias bancarias</Text>
                    )}
                </View>

                {/* 7. REFERENCIAS COMERCIALES - Tabla */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. REFERENCIAS COMERCIALES</Text>
                    {supplier.commercialReferences && supplier.commercialReferences.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCellHeader, { width: '45%' }]}>Razón Social</Text>
                                <Text style={[styles.tableCellHeader, { width: '30%' }]}>Contacto</Text>
                                <Text style={[styles.tableCellHeader, { width: '25%' }]}>Teléfono</Text>
                            </View>
                            {supplier.commercialReferences.slice(0, 5).map((ref, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { width: '45%' }]}>{ref.U_RazonSocial || '—'}</Text>
                                    <Text style={[styles.tableCell, { width: '30%' }]}>{ref.U_Contacto || '—'}</Text>
                                    <Text style={[styles.tableCell, { width: '25%' }]}>{ref.U_Telefonos || '—'}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.compactText}>No hay referencias comerciales registradas</Text>
                    )}
                </View>

                {/* 8. DOCUMENTACIÓN - Tabla con checkmarks */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. DOCUMENTACIÓN REQUERIDA</Text>
                    {supplier.Documentos ? (
                        <View>
                            <View style={[styles.tableHeader, { marginBottom: 2 }]}>
                                <Text style={[styles.tableCellHeader, { width: '85%' }]}>Documento</Text>
                                <Text style={[styles.tableCellHeader, { width: '15%', textAlign: 'center' }]}>Estado</Text>
                            </View>
                            {Object.entries(supplier.Documentos).map(([key, value], index) => (
                                <View key={index} style={styles.documentTableRow}>
                                    <Text style={styles.documentName}>
                                        {index + 1}. {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </Text>
                                    <Text style={styles.documentCheck}>
                                        {/*value ? '✓' : '✗'*/}
                                        {value ? 'SI' : 'NO'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.compactText}>Sin información de documentación</Text>
                    )}
                </View>

                {/* Footer Minimalista */}
                <View style={styles.footer}>
                    <Text>
                        Portal de Proveedores | Documento generado el {new Date().toLocaleDateString('es-PE')} | 
                        © {new Date().getFullYear()} - Confidencial
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default SupplierPDF;

