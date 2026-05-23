import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { parseDate, getLocalTimeZone, today, startOfMonth, endOfMonth } from '@internationalized/date';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
  Checkbox,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalBody,
  Spinner,
  addToast,
} from '@heroui/react';
import { useInvoices } from '@/store/extendedStore';
import { Invoice } from '@/store/types';
import { DateInput } from '@/components/DateInput';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { fetchInvoicesForPaymentSchedule, schedulePaymentInvoices } from '@/services/invoices/invoicesApi';

const ScheduleInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const isProvider = currentUser?.role === UserRole.PROVEEDOR;
  const providerId = isProvider ? currentUser?.userCode : null;
  
  const todayDate = today(getLocalTimeZone());
  
  // Get month from URL params or use current month
  const monthParam = searchParams.get('month');
  const initialMonth = monthParam 
    ? parseDate(monthParam) 
    : todayDate;
  
  const monthStart = startOfMonth(initialMonth);
  const monthEnd = endOfMonth(initialMonth);
  
  const { invoices, setInvoices } = useInvoices();
  const [invoicePage, setInvoicePage] = useState(1);
  // Filtros
  const [filterNumFactura, setFilterNumFactura] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterFechaEmision, setFilterFechaEmision] = useState<string>('');
  const [filterFechaVenc, setFilterFechaVenc] = useState<string>('');
  const [filterTotalPagar, setFilterTotalPagar] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [editedImportePagar, setEditedImportePagar] = useState<Record<string, string>>({});
  const [editableInvoices, setEditableInvoices] = useState<Set<string>>(new Set());
  const [scheduleDate, setScheduleDate] = useState<string>(todayDate.toDate(getLocalTimeZone()).toISOString().split('T')[0]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  
  // Date range for invoice search
  const [invoiceStartDate, setInvoiceStartDate] = useState<string>(
    `${monthStart.year}-${String(monthStart.month).padStart(2, '0')}-${String(monthStart.day).padStart(2, '0')}`
  );
  const [invoiceEndDate, setInvoiceEndDate] = useState<string>(
    `${monthEnd.year}-${String(monthEnd.month).padStart(2, '0')}-${String(monthEnd.day).padStart(2, '0')}`
  );
  const [codigoProveedor, setCodigoProveedor] = useState<string>('');
  const rowsPerPage = 100;

  // Format date for API (YYYYMMDD)
  const formatDateForApi = (dateStr: string): string => {
    return dateStr.replace(/-/g, '');
  };

  // Load invoices function
  const loadInvoicesForSchedule = useCallback(async () => {
    if (!isProvider) {
      setIsLoadingInvoices(true);
      setInvoicesError(null);
      
      try {
        const startDateStr = formatDateForApi(invoiceStartDate);
        const endDateStr = formatDateForApi(invoiceEndDate);
        const codigoProveedorParam = codigoProveedor.trim() !== '' ? codigoProveedor.trim() : undefined;
        
        const fetchedInvoices = await fetchInvoicesForPaymentSchedule(
          startDateStr,
          endDateStr,
          codigoProveedorParam
        );
        
        if (fetchedInvoices) {
          setInvoices(fetchedInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error al cargar facturas:', error);
        setInvoicesError(error instanceof Error ? error.message : 'Error al cargar facturas');
        setInvoices([]);
      } finally {
        setIsLoadingInvoices(false);
      }
    }
  }, [invoiceStartDate, invoiceEndDate, codigoProveedor, isProvider, setInvoices]);

  // Load invoices on mount
  useEffect(() => {
    if (!isProvider) {
      loadInvoicesForSchedule();
    }
  }, [isProvider, loadInvoicesForSchedule]);

  // Función helper para normalizar fechas a formato YYYY-MM-DD sin problemas de zona horaria
  // NUNCA usa new Date() para evitar problemas de zona horaria
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    let normalized = dateStr.trim();
    
    // Remover parte de tiempo si existe
    if (normalized.includes('T')) {
      normalized = normalized.split('T')[0];
    }
    if (normalized.includes(' ')) {
      normalized = normalized.split(' ')[0];
    }
    
    // Si ya está en formato YYYY-MM-DD, asegurar padding correcto
    if (normalized.includes('-')) {
      const parts = normalized.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        // Validar que sean números válidos
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(day))) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // Si está en formato DD/MM/YYYY, convertir
    if (normalized.includes('/')) {
      const parts = normalized.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        // Validar que sean números válidos
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(day))) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    return normalized;
  };
  
  // Función helper para formatear fecha para mostrar (sin usar new Date para evitar problemas de zona horaria)
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    const normalized = normalizeDate(dateStr);
    if (!normalized || normalized.length !== 10) return dateStr;
    
    // Convertir YYYY-MM-DD a DD/MM/YYYY para mostrar
    const parts = normalized.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Filter invoices - filter by provider if is provider
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    
    // If user is provider, only show their invoices
    if (isProvider && providerId) {
      filtered = filtered.filter(inv => inv.supplierId === providerId);
    }
    
    // Apply filters
    if (filterNumFactura) {
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(filterNumFactura.toLowerCase()) ||
        inv.purchaseOrderId.toLowerCase().includes(filterNumFactura.toLowerCase())
      );
    }
    
    if (filterProveedor) {
      filtered = filtered.filter(inv =>
        inv.supplierName.toLowerCase().includes(filterProveedor.toLowerCase())
      );
    }
    
    if (filterFechaEmision) {
      const filterDate = normalizeDate(filterFechaEmision);
      filtered = filtered.filter(inv => {
        if (!inv.receivedDate) return false;
        const invDate = normalizeDate(inv.receivedDate);
        return invDate === filterDate;
      });
    }
    
    if (filterFechaVenc) {
      const filterDate = normalizeDate(filterFechaVenc);
      filtered = filtered.filter(inv => {
        if (!inv.dueDate) return false;
        const invDate = normalizeDate(inv.dueDate);
        return invDate === filterDate;
      });
    }
    
    if (filterTotalPagar) {
      const totalPagarValue = parseFloat(filterTotalPagar.replace(/[^\d.-]/g, '')) || 0;
      filtered = filtered.filter(inv => {
        const totalPagar = inv.saldo || inv.amount;
        return totalPagar >= totalPagarValue;
      });
    }
    
    return filtered;
  }, [invoices, filterNumFactura, filterProveedor, filterFechaEmision, filterFechaVenc, filterTotalPagar, isProvider, providerId]);

  const invoicePages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const invoiceItems = useMemo(() => {
    const start = (invoicePage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredInvoices.slice(start, end);
  }, [invoicePage, filteredInvoices, rowsPerPage]);

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(invoiceItems.map(inv => inv.id));
      setSelectedInvoices(allIds);
      setEditableInvoices(allIds);
      // Inicializar valores editados con los valores por defecto
      const initialValues: Record<string, string> = {};
      invoiceItems.forEach(inv => {
        const importePagar = (inv as Invoice & { importePagar?: number }).importePagar || 0;
        initialValues[inv.id] = String(importePagar);
      });
      setEditedImportePagar(prev => ({ ...prev, ...initialValues }));
    } else {
      setSelectedInvoices(new Set());
      setEditableInvoices(new Set());
      // Limpiar valores editados de las facturas deseleccionadas
      setEditedImportePagar(prev => {
        const newValues = { ...prev };
        invoiceItems.forEach(inv => {
          delete newValues[inv.id];
        });
        return newValues;
      });
    }
  };

  const handleScheduleInvoices = async () => {
    if (selectedInvoices.size === 0) {
      addToast({ title: 'Selecciona al menos una factura', color: 'warning' });
      return;
    }

    if (!scheduleDate) {
      addToast({ title: 'Selecciona una fecha de pago', color: 'warning' });
      return;
    }

    const invoicesToSchedule = invoiceItems
      .filter(inv => selectedInvoices.has(inv.id))
      .map(inv => ({
        invoice: inv,
        scheduleDate: scheduleDate,
        editedImportePagar: editedImportePagar[inv.id]
      }));

    setIsScheduling(true);
    try {
      const response = await schedulePaymentInvoices(invoicesToSchedule);

      if (response.success) {
        addToast({
          title: 'Facturas programadas',
          description: response.message || `${selectedInvoices.size} factura(s) programada(s) exitosamente`,
          color: 'success',
        });
        navigate('/cronograma');
      } else {
        addToast({
          title: 'No se pudieron programar las facturas',
          description: response.message || 'Ocurrió un error en el servidor',
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('Error al programar facturas:', error);
      addToast({
        title: 'Error al programar facturas',
        description: error instanceof Error ? error.message : 'Error desconocido',
        color: 'danger',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0rem)] -m-6">
      <Card className="flex-1 flex flex-col min-h-0 border-none bg-transparent h-full rounded-none">
        <CardBody className="flex-1 flex flex-col min-h-0 p-6 h-full">
          {/* Header */}
          <div className="flex-shrink-0 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                isIconOnly
                variant="light"
                onPress={() => navigate('/cronograma')}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Facturas para Programar</h1>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Selecciona facturas para programar pagos
                </p>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-3 mt-4">
              <DateInput
                size="sm"
                label="Fecha Inicio"
                value={invoiceStartDate}
                onValueChange={setInvoiceStartDate}
                className="flex-1"
              />
              <DateInput
                size="sm"
                label="Fecha Fin"
                value={invoiceEndDate}
                onValueChange={setInvoiceEndDate}
                className="flex-1"
              />
              <Input
                size="sm"
                label="Código Proveedor"
                placeholder="Opcional"
                value={codigoProveedor}
                onValueChange={setCodigoProveedor}
                className="flex-1"
                isClearable
                onClear={() => setCodigoProveedor('')}
              />
              <Button
                color="primary"
                size="md"
                onPress={loadInvoicesForSchedule}
                isDisabled={isLoadingInvoices || !invoiceStartDate || !invoiceEndDate}
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {invoicesError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{invoicesError}</p>
              </div>
            )}
            
            {isLoadingInvoices ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">Cargando facturas...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="grid grid-cols-6 gap-3 items-end">
                    <Input
                      isClearable
                      size="sm"
                      label="N° Factura"
                      placeholder="Buscar..."
                      value={filterNumFactura}
                      onClear={() => setFilterNumFactura("")}
                      onValueChange={setFilterNumFactura}
                    />
                    <Input
                      isClearable
                      size="sm"
                      label="Proveedor"
                      placeholder="Buscar..."
                      value={filterProveedor}
                      onClear={() => setFilterProveedor("")}
                      onValueChange={setFilterProveedor}
                    />
                    <DateInput
                      size="sm"
                      label="Fecha Emisión"
                      value={filterFechaEmision}
                      onValueChange={setFilterFechaEmision}
                      isClearable
                    />
                    <DateInput
                      size="sm"
                      label="Fecha Venc."
                      value={filterFechaVenc}
                      onValueChange={setFilterFechaVenc}
                      isClearable
                    />
                    <Input
                      isClearable
                      size="sm"
                      label="Total a Pagar"
                      placeholder="Monto mínimo..."
                      type="number"
                      value={filterTotalPagar}
                      onClear={() => setFilterTotalPagar("")}
                      onValueChange={setFilterTotalPagar}
                      startContent={
                        <span className="text-gray-400 text-sm">S/</span>
                      }
                    />
                    <div className="flex items-center gap-2 h-full pb-1">
                      <Checkbox
                        isSelected={selectedInvoices.size === invoiceItems.length && invoiceItems.length > 0}
                        isIndeterminate={selectedInvoices.size > 0 && selectedInvoices.size < invoiceItems.length}
                        onValueChange={handleSelectAll}
                      >
                        <span className="text-sm">Seleccionar todas</span>
                      </Checkbox>
                    </div>
                  </div>
                </div>
                
                {selectedInvoices.size > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedInvoices.size}</strong> factura(s) seleccionada(s) para programar
                    </p>
                  </div>
                )}
                
                <div 
                  className="flex-1 overflow-auto min-h-0"
                  onClick={(e) => {
                    // Interceptar TODOS los clics para prevenir selección por fila
                    const target = e.target as HTMLElement;
                    const inputTarget = target as HTMLInputElement;
                    
                    const isCheckbox = target.tagName === 'INPUT' && inputTarget.type === 'checkbox';
                    const isInCheckbox = target.closest('input[type="checkbox"]') !== null;
                    
                    if (!isCheckbox && !isInCheckbox) {
                      const row = target.closest('tr[data-key]');
                      if (row && !target.closest('input[type="number"]')) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    // CRÍTICO: Interceptar mousedown antes de que HeroUI lo procese
                    const target = e.target as HTMLElement;
                    const inputTarget = target as HTMLInputElement;
                    
                    const isCheckbox = target.tagName === 'INPUT' && inputTarget.type === 'checkbox';
                    const isInCheckbox = target.closest('input[type="checkbox"]') !== null;
                    
                    if (!isCheckbox && !isInCheckbox) {
                      const row = target.closest('tr[data-key]');
                      if (row && !target.closest('input[type="number"]')) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                      }
                    }
                  }}
                >
                  <Table
                    aria-label="Tabla de facturas"
                    removeWrapper
                    classNames={{
                      base: "max-h-full",
                      table: "min-h-[400px]",
                    }}
                    bottomContent={
                      invoicePages > 0 ? (
                        <div className="flex w-full justify-center">
                          <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={invoicePage}
                            total={invoicePages}
                            onChange={setInvoicePage}
                          />
                        </div>
                      ) : null
                    }
                  >
                    <TableHeader>
                      <TableColumn width={50}>
                        <Checkbox
                          isSelected={selectedInvoices.size === invoiceItems.length && invoiceItems.length > 0}
                          isIndeterminate={selectedInvoices.size > 0 && selectedInvoices.size < invoiceItems.length}
                          onValueChange={handleSelectAll}
                        />
                      </TableColumn>
                      <TableColumn>N° FACTURA</TableColumn>
                      <TableColumn>PROVEEDOR</TableColumn>
                      <TableColumn>RUC</TableColumn>
                      <TableColumn>FECHA EMISIÓN</TableColumn>
                      <TableColumn>FECHA VENC.</TableColumn>
                      <TableColumn className="text-right">IMPORTE FACTURA</TableColumn>
                      <TableColumn className="text-right">RETENCIÓN</TableColumn>
                      <TableColumn className="text-right">IMPORTE A PAGAR</TableColumn>
                      <TableColumn className="text-right">TOTAL</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No se encontraron facturas">
                      {invoiceItems.map((invoice) => {
                        const isSelected = selectedInvoices.has(invoice.id);
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <Checkbox
                                isSelected={isSelected}
                                onValueChange={(checked) => {
                                  if (checked) {
                                    // Agregar a selección
                                    const newSelected = new Set(selectedInvoices);
                                    newSelected.add(invoice.id);
                                    setSelectedInvoices(newSelected);
                                    setEditableInvoices(newSelected);
                                    
                                    // Inicializar valor editado
                                    const importePagar = (invoice as Invoice & { importePagar?: number }).importePagar || 0;
                                    setEditedImportePagar(prev => ({
                                      ...prev,
                                      [invoice.id]: String(importePagar)
                                    }));
                                  } else {
                                    // Remover de selección
                                    const newSelected = new Set(selectedInvoices);
                                    newSelected.delete(invoice.id);
                                    setSelectedInvoices(newSelected);
                                    setEditableInvoices(newSelected);
                                    
                                    // Limpiar valor editado
                                    setEditedImportePagar(prev => {
                                      const newValues = { ...prev };
                                      delete newValues[invoice.id];
                                      return newValues;
                                    });
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                            <p className="font-semibold">{invoice.invoiceNumber || invoice.purchaseOrderId}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[200px]" title={invoice.supplierName}>
                              {invoice.supplierName}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-gray-600">
                              {(invoice as Invoice & { supplierRUC?: string }).supplierRUC || invoice.supplierId?.replace('P', '') || 'N/A'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {formatDateForDisplay(invoice.receivedDate)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {formatDateForDisplay(invoice.dueDate)}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-semibold">
                              {new Intl.NumberFormat('es-PE', {
                                style: 'currency',
                                currency: invoice.currency === 'PEN' ? 'PEN' : 'USD'
                              }).format(invoice.amount)}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="text-sm">
                              {new Intl.NumberFormat('es-PE', {
                                style: 'currency',
                                currency: invoice.currency === 'PEN' ? 'PEN' : 'USD'
                              }).format(invoice.retention || 0)}
                            </p>
                          </TableCell>
                          <TableCell 
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {editableInvoices.has(invoice.id) ? (
                              <div 
                                className="flex justify-end w-full"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <Input
                                  type="number"
                                  size="sm"
                                  value={editedImportePagar[invoice.id] ?? String((invoice as Invoice & { importePagar?: number }).importePagar || 0)}
                                  onValueChange={(value) => {
                                    setEditedImportePagar(prev => ({
                                      ...prev,
                                      [invoice.id]: value
                                    }));
                                  }}
                                  
                                  classNames={{
                                    base: "w-full flex justify-end",
                                    input: "text-right",
                                    inputWrapper: "w-40 ml-auto"
                                  }}
                                  startContent={
                                    <span className="text-gray-400 text-xs">S/</span>
                                  }
                                />
                              </div>
                            ) : (
                              <p className="text-sm">
                                {new Intl.NumberFormat('es-PE', {
                                  style: 'currency',
                                  currency: invoice.currency === 'PEN' ? 'PEN' : 'USD'
                                }).format((invoice as Invoice & { importePagar?: number }).importePagar || 0)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-semibold text-blue-600">
                              {new Intl.NumberFormat('es-PE', {
                                style: 'currency',
                                currency: invoice.currency === 'PEN' ? 'PEN' : 'USD'
                              }).format(invoice.saldo || invoice.amount)}
                            </p>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className=" flex items-center justify-between gap-3 pt-4 border-t border-gray-200 mt-4">
            <DateInput
              size="sm"
              label="Fecha de pago programado"
              value={scheduleDate}
              onValueChange={setScheduleDate}
              className='w-[250px]'
            />
            <div className="flex gap-3">
              <Button 
                color="danger" 
                variant="light" 
                onPress={() => navigate('/cronograma')}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleScheduleInvoices}
                isDisabled={selectedInvoices.size === 0 || !scheduleDate || isScheduling}
                isLoading={isScheduling}
              >
                Programar {selectedInvoices.size > 0 ? `${selectedInvoices.size} ` : ''}Factura(s)
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Modal de carga bloqueante */}
      <Modal
        isOpen={isScheduling}
        isDismissable={false}
        hideCloseButton
        size="sm"
        classNames={{ backdrop: 'bg-black/60' }}
      >
        <ModalContent>
          <ModalBody className="flex flex-col items-center gap-4 py-8">
            <Spinner size="lg" color="primary" />
            <p className="text-sm font-medium text-gray-700">
              Programando {selectedInvoices.size} factura(s)...
            </p>
            <p className="text-xs text-gray-400">Por favor espera, no cierres esta ventana</p>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ScheduleInvoices;
