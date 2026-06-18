import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@heroui/react';
import { 
  PlusIcon,
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { parseDate, CalendarDate, getLocalTimeZone, today, startOfMonth, endOfMonth, DateValue } from '@internationalized/date';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Card,
  CardBody,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination
} from '@heroui/react';
import { useInvoices } from '@/store/extendedStore';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { fetchScheduledInvoices } from '@/services/invoices/invoicesApi';
import { Invoice } from '@/store/types';
import { DateInput } from '@/components/DateInput';

interface Payment {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'scheduled';
  title: string;
  type: 'income' | 'expense';
  date: string;
  invoiceId?: string; // ID de la factura relacionada
}

interface PaymentData {
  [key: string]: Payment[];
}

const PaymentCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isProvider = currentUser?.role === UserRole.PROVEEDOR;
  const providerId = isProvider ? currentUser?.userCode : null;
  
  const todayDate = today(getLocalTimeZone());
  const [currentMonth, setCurrentMonth] = useState<CalendarDate>(todayDate);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(todayDate);
  const dateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showNoPaymentsMessage, setShowNoPaymentsMessage] = useState(false);
  
  const { invoices } = useInvoices();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
  
  // Estado para visualizar documentos
  const [selectedDocument, setSelectedDocument] = useState<{ name: string; url: string; type: string } | null>(null);
  const { isOpen: isDocumentViewerOpen, onOpen: onDocumentViewerOpen, onClose: onDocumentViewerClose } = useDisclosure();
  
  const handleDocumentClick = (doc: { name: string; url: string; type: string }) => {
    setSelectedDocument(doc);
    onDocumentViewerOpen();
  };
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentData, setPaymentData] = useState<PaymentData>({});
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [scheduledInvoices, setScheduledInvoices] = useState<(Invoice & { scheduledPaymentDate?: string; importePagar?: number })[]>([]);
  
  // Estados para vista de tabla (usuarios internos)
  const [tablePage, setTablePage] = useState(1);
  const [filterNumFactura, setFilterNumFactura] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterFechaEmision, setFilterFechaEmision] = useState<string>('');
  const [filterFechaVenc, setFilterFechaVenc] = useState<string>('');
  const [filterFechaProgramada, setFilterFechaProgramada] = useState<string>('');
  const [filterTotalPagar, setFilterTotalPagar] = useState('');
  const [tableStartDate, setTableStartDate] = useState<string>(
    `${startOfMonth(todayDate).year}-${String(startOfMonth(todayDate).month).padStart(2, '0')}-${String(startOfMonth(todayDate).day).padStart(2, '0')}`
  );
  const [tableEndDate, setTableEndDate] = useState<string>(
    `${endOfMonth(todayDate).year}-${String(endOfMonth(todayDate).month).padStart(2, '0')}-${String(endOfMonth(todayDate).day).padStart(2, '0')}`
  );
  const rowsPerPage = 100;



  const getDateKey = (date: CalendarDate): string => {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  };

  // Parsea "YYYY-MM-DD" o "DD/MM/YYYY" como medianoche local (sin conversión UTC)
  const parseLocalDate = (dateStr: string): Date => {
    const datePart = dateStr.split(/[ T]/)[0];
    if (datePart.includes('-')) {
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const [day, month, year] = datePart.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Función para determinar el estado del pago basado en fechas
  const determinePaymentStatus = (invoice: Invoice & { scheduledPaymentDate?: string; importePagar?: number }): Payment['status'] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const scheduledDate = invoice.scheduledPaymentDate ? parseLocalDate(invoice.scheduledPaymentDate) : null;
    const dueDate = invoice.dueDate ? parseLocalDate(invoice.dueDate) : null;

    // Si la factura está pagada
    if (invoice.status === 'Pagada') {
      return 'paid';
    }

    // Si tiene fecha programada
    if (scheduledDate) {
      // Si la fecha programada es futura
      if (scheduledDate > today) {
        return 'scheduled';
      }
      // Si la fecha programada es pasada pero no está pagada
      if (scheduledDate < today) {
        // Verificar si está vencida
        if (dueDate && dueDate < today) {
          return 'overdue';
        }
        return 'pending';
      }
    }

    // Si no tiene fecha programada pero tiene fecha de vencimiento
    if (dueDate) {
      if (dueDate < today) {
        return 'overdue';
      }
      return 'pending';
    }

    // Por defecto
    return 'pending';
  };

  // Función para convertir Invoice a Payment
  const invoiceToPayment = (invoice: Invoice & { scheduledPaymentDate?: string; importePagar?: number }): Payment => {
    const scheduledDate = invoice.scheduledPaymentDate || invoice.dueDate || '';
    const status = determinePaymentStatus(invoice);
    
    return {
      id: invoice.id,
      amount: invoice.importePagar || invoice.amount || 0,
      status: status,
      title: `${invoice.invoiceNumber} - ${invoice.supplierName}`,
      type: 'expense', // Los pagos a proveedores son gastos
      date: scheduledDate,
      invoiceId: invoice.id
    };
  };

  // Función para cargar facturas programadas del mes actual
  const loadScheduledPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    setPaymentsError(null);
    
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      // Formatear fechas para el API (YYYYMMDD)
      const startDateStr = `${monthStart.year}${String(monthStart.month).padStart(2, '0')}${String(monthStart.day).padStart(2, '0')}`;
      const endDateStr = `${monthEnd.year}${String(monthEnd.month).padStart(2, '0')}${String(monthEnd.day).padStart(2, '0')}`;
      
      // Obtener código de proveedor si es proveedor
      const codigoProveedor = isProvider && providerId ? providerId.replace('P', '') : undefined;
      
      const scheduledInvoices = await fetchScheduledInvoices(startDateStr, endDateStr, codigoProveedor);
      
      console.log('Facturas programadas recibidas:', scheduledInvoices);
      
      if (scheduledInvoices && scheduledInvoices.length > 0) {
        // Guardar las facturas programadas para usar en el modal
        setScheduledInvoices(scheduledInvoices);
        
        // Agrupar pagos por fecha
        const groupedPayments: PaymentData = {};
        
        scheduledInvoices.forEach((invoice) => {
          const payment = invoiceToPayment(invoice);
          const dateKey = payment.date;
          
          const invoiceWithScheduled = invoice as Invoice & { scheduledPaymentDate?: string; importePagar?: number };
          console.log('Agrupando pago - Factura:', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            supplierId: invoice.supplierId,
            scheduledPaymentDate: invoiceWithScheduled.scheduledPaymentDate,
            paymentDate: payment.date,
            dateKey: dateKey,
            currentMonth: currentMonth.toString()
          });
          
          if (dateKey) {
            if (!groupedPayments[dateKey]) {
              groupedPayments[dateKey] = [];
            }
            groupedPayments[dateKey].push(payment);
          } else {
            console.warn('Payment sin fecha:', payment);
          }
        });
        
        console.log('PaymentData agrupado (total de fechas):', Object.keys(groupedPayments).length, groupedPayments);
        setPaymentData(groupedPayments);
      } else {
        setPaymentData({});
        setScheduledInvoices([]);
      }
    } catch (error) {
      console.error('Error al cargar pagos programados:', error);
      setPaymentsError('Error al cargar los pagos programados. Por favor, intenta nuevamente.');
      setPaymentData({});
    } finally {
      setIsLoadingPayments(false);
    }
  }, [currentMonth, isProvider, providerId]);

  // Cargar pagos cuando cambia el mes o cuando se monta el componente (solo para proveedores)
  useEffect(() => {
    if (isProvider) {
      loadScheduledPayments();
    }
  }, [loadScheduledPayments, isProvider]);

  // Función para cargar facturas programadas para la tabla (usuarios internos)
  const loadScheduledInvoicesForTable = useCallback(async () => {
    setIsLoadingPayments(true);
    setPaymentsError(null);
    
    try {
      // Formatear fechas para el API (YYYYMMDD)
      const startDateStr = tableStartDate.replace(/-/g, '');
      const endDateStr = tableEndDate.replace(/-/g, '');
      
      const invoices = await fetchScheduledInvoices(startDateStr, endDateStr);
      
      if (invoices && invoices.length > 0) {
        setScheduledInvoices(invoices);
      } else {
        setScheduledInvoices([]);
      }
    } catch (error) {
      console.error('Error al cargar facturas programadas:', error);
      setPaymentsError('Error al cargar las facturas programadas. Por favor, intenta nuevamente.');
      setScheduledInvoices([]);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [tableStartDate, tableEndDate]);

  // Cargar facturas programadas para tabla cuando cambian las fechas (solo para usuarios internos)
  useEffect(() => {
    if (!isProvider) {
      loadScheduledInvoicesForTable();
    }
  }, [loadScheduledInvoicesForTable, isProvider]);

  // Función helper para normalizar fechas
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    let normalized = dateStr.trim();
    
    if (normalized.includes('T')) {
      normalized = normalized.split('T')[0];
    }
    if (normalized.includes(' ')) {
      normalized = normalized.split(' ')[0];
    }
    
    if (normalized.includes('-')) {
      const parts = normalized.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(day))) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    if (normalized.includes('/')) {
      const parts = normalized.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        if (!isNaN(Number(year)) && !isNaN(Number(month)) && !isNaN(Number(day))) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    return normalized;
  };

  // Filtrar facturas programadas para la tabla
  const filteredTableInvoices = useMemo(() => {
    let filtered = [...scheduledInvoices];
    
    if (filterNumFactura.trim()) {
      filtered = filtered.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(filterNumFactura.toLowerCase())
      );
    }
    
    if (filterProveedor.trim()) {
      filtered = filtered.filter(inv => 
        inv.supplierName?.toLowerCase().includes(filterProveedor.toLowerCase())
      );
    }
    
    if (filterFechaEmision) {
      const normalizedFilter = normalizeDate(filterFechaEmision);
      filtered = filtered.filter(inv => {
        const normalizedDate = normalizeDate(inv.receivedDate || '');
        return normalizedDate === normalizedFilter;
      });
    }
    
    if (filterFechaVenc) {
      const normalizedFilter = normalizeDate(filterFechaVenc);
      filtered = filtered.filter(inv => {
        const normalizedDate = normalizeDate(inv.dueDate || '');
        return normalizedDate === normalizedFilter;
      });
    }
    
    if (filterFechaProgramada) {
      const normalizedFilter = normalizeDate(filterFechaProgramada);
      filtered = filtered.filter(inv => {
        const normalizedDate = normalizeDate((inv as Invoice & { scheduledPaymentDate?: string }).scheduledPaymentDate || '');
        return normalizedDate === normalizedFilter;
      });
    }
    
    if (filterTotalPagar.trim()) {
      const filterValue = parseFloat(filterTotalPagar.replace(/[^\d.-]/g, ''));
      if (!isNaN(filterValue)) {
        filtered = filtered.filter(inv => {
          const totalPagar = (inv as Invoice & { importePagar?: number }).importePagar || inv.amount || 0;
          return totalPagar >= filterValue;
        });
      }
    }
    
    return filtered;
  }, [scheduledInvoices, filterNumFactura, filterProveedor, filterFechaEmision, filterFechaVenc, filterFechaProgramada, filterTotalPagar]);

  // Paginación para tabla
  const tablePages = Math.ceil(filteredTableInvoices.length / rowsPerPage);
  const tableItems = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredTableInvoices.slice(start, end);
  }, [tablePage, filteredTableInvoices]);


  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'overdue':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'scheduled':
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'PEN'): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency === 'PEN' ? 'PEN' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = parseLocalDate(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Get invoice related to selected payment
  const selectedInvoice = useMemo(() => {
    if (!selectedPayment?.invoiceId) return null;
    // Primero buscar en las facturas programadas cargadas
    const scheduledInvoice = scheduledInvoices.find(inv => inv.id === selectedPayment.invoiceId);
    if (scheduledInvoice) return scheduledInvoice;
    // Si no está en las programadas, buscar en el store general
    return invoices.find(inv => inv.id === selectedPayment.invoiceId) || null;
  }, [selectedPayment, scheduledInvoices, invoices]);

  // Get all dates with payments in current month, filtered by status and provider
  const datesWithPayments = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const dates: string[] = [];
    
    console.log('datesWithPayments - paymentData:', paymentData);
    console.log('datesWithPayments - scheduledInvoices:', scheduledInvoices);
    console.log('datesWithPayments - isProvider:', isProvider, 'providerId:', providerId);
    
    for (let date = monthStart; date.compare(monthEnd) <= 0; date = date.add({ days: 1 })) {
      const dateKey = getDateKey(date);
      if (paymentData[dateKey] && paymentData[dateKey].length > 0) {
        let filteredPayments = paymentData[dateKey];
        
        // Filter by provider if is provider
        // Como las facturas ya vienen filtradas del API cuando es proveedor, 
        // solo necesitamos verificar que las facturas programadas pertenezcan al proveedor
        if (isProvider && providerId) {
          filteredPayments = filteredPayments.filter(p => {
            // If payment has invoiceId, check if invoice belongs to provider
            if (p.invoiceId) {
              // Primero buscar en scheduledInvoices (ya filtradas del API)
              const scheduledInvoice = scheduledInvoices.find(inv => inv.id === p.invoiceId);
              if (scheduledInvoice) {
                return scheduledInvoice.supplierId === providerId;
              }
              // Si no está en scheduledInvoices, buscar en el store general
              const invoice = invoices.find(inv => inv.id === p.invoiceId);
              return invoice && invoice.supplierId === providerId;
            }
            // If no invoiceId, include it (for sample data)
            return true;
          });
        }
        
        // Filter payments by status if filter is not 'all'
        if (statusFilter !== 'all') {
          filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
        }
        
        console.log(`datesWithPayments - ${dateKey}:`, filteredPayments.length, 'payments after filtering');
        
        // Only add date if there are payments after filtering
        if (filteredPayments.length > 0) {
          dates.push(dateKey);
        }
      }
    }
    
    console.log('datesWithPayments - final dates:', dates);
    return dates;
  }, [currentMonth, statusFilter, paymentData, isProvider, providerId, invoices, scheduledInvoices]);


  const handleCalendarChange = (value: DateValue) => {
    if (value && 'month' in value && 'year' in value) {
      const dateValue = value as CalendarDate;
      setSelectedDate(dateValue);
      
      // Update current month if navigating to different month
      if (dateValue.month !== currentMonth.month || dateValue.year !== currentMonth.year) {
        setCurrentMonth(dateValue);
      }
      
      // Check if there are payments for this date
      const dateKey = getDateKey(dateValue);
      const hasPayments = paymentData[dateKey] && paymentData[dateKey].length > 0;
      
      if (hasPayments) {
        // Scroll to the selected date
        setTimeout(() => {
          const element = dateRefs.current[dateKey];
          if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the selected date
            element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
            }, 2000);
          }
        }, 100);
        setShowNoPaymentsMessage(false);
      } else {
        setShowNoPaymentsMessage(true);
        // Hide message after 3 seconds
        setTimeout(() => setShowNoPaymentsMessage(false), 3000);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)]">
      <div className="flex-shrink-0 mb-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cronograma de Pagos</h1>
            <p className="text-gray-600 mt-1">
              {isProvider ? 'Visualiza tus pagos programados' : 'Visualiza y gestiona tus pagos programados'}
            </p>
          </div>
          {!isProvider && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => {
                const monthStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(currentMonth.day).padStart(2, '0')}`;
                navigate(`/cronograma/programar-facturas?month=${monthStr}`);
              }}
            >
              Programar Facturas
            </Button>
          )}
        </div>
      </div>

      {/* Vista condicional: Calendario para Proveedores, Tabla para Usuarios Internos */}
      {isProvider ? (
        /* Calendar Section - Solo para Proveedores */
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 min-h-0">
            {/* Left Side - Calendar */}
            <div className="flex flex-col w-fit">
              {/* Status Filter */}
              <div className="mb-4">
                <Select
                  label="Filtrar por estado"
                  selectedKeys={[statusFilter]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setStatusFilter(selected || 'all');
                  }}
                  size="sm"
                  className="w-full"
                >
                  <SelectItem key="all">Todos</SelectItem>
                  <SelectItem key="scheduled">Programado</SelectItem>
                  <SelectItem key="pending">Pendiente</SelectItem>
                  <SelectItem key="paid">Pagado</SelectItem>
                  <SelectItem key="overdue">Vencido</SelectItem>
                </Select>
              </div>
              
              <Calendar
                aria-label="Payment Calendar"
                value={selectedDate as any}
                onChange={handleCalendarChange}
              />
              
              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Leyenda de Estados</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-300"></div>
                    <span className="text-sm text-slate-600">Programado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-rose-100 border-2 border-rose-300"></div>
                    <span className="text-sm text-slate-600">Vencido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-300"></div>
                    <span className="text-sm text-slate-600">Pagado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-300"></div>
                    <span className="text-sm text-slate-600">Pendiente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Events List */}
            <div className="flex flex-col min-h-0">
              <div className="flex-shrink-0 flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Pagos en {currentMonth.toDate(getLocalTimeZone()).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                </h3>
                {selectedDate && (
                  <div className="text-sm text-slate-600">
                    Seleccionado: {selectedDate.day}/{selectedDate.month}/{selectedDate.year}
                  </div>
                )}
              </div>
              
              {/* Message when no payments on selected date */}
              {showNoPaymentsMessage && selectedDate && (
                <div className="flex-shrink-0 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    No hay pagos programados para el {selectedDate.day}/{selectedDate.month}/{selectedDate.year}
                  </p>
                </div>
              )}
              
              {isLoadingPayments ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    <Spinner size="lg" />
                    <p className="text-slate-500 mt-4">Cargando pagos programados...</p>
                  </div>
                </div>
              ) : paymentsError ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                    <p className="text-rose-600">{paymentsError}</p>
                    <Button 
                      color="primary" 
                      variant="flat" 
                      className="mt-4"
                      onPress={loadScheduledPayments}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : datesWithPayments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay pagos programados este mes</p>
                  </div>
                </div>
              ) : (
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 space-y-4 overflow-y-auto p-2 min-h-0"
                >
                  {datesWithPayments.map((dateKey) => {
                    // Filter payments by status and provider
                    let allPayments = paymentData[dateKey];
                    
                    // Filter by provider if is provider
                    // Como las facturas ya vienen filtradas del API cuando es proveedor,
                    // solo verificamos por seguridad
                    if (isProvider && providerId) {
                      allPayments = allPayments.filter(p => {
                        // If payment has invoiceId, check if invoice belongs to provider
                        if (p.invoiceId) {
                          // Primero buscar en scheduledInvoices (ya filtradas del API)
                          const scheduledInvoice = scheduledInvoices.find(inv => inv.id === p.invoiceId);
                          if (scheduledInvoice) {
                            return scheduledInvoice.supplierId === providerId;
                          }
                          // Si no está en scheduledInvoices, buscar en el store general
                          const invoice = invoices.find(inv => inv.id === p.invoiceId);
                          return invoice && invoice.supplierId === providerId;
                        }
                        // If no invoiceId, include it (for sample data)
                        return true;
                      });
                    }
                    
                    // Filter by status
                    const payments = statusFilter === 'all' 
                      ? allPayments
                      : allPayments.filter(p => p.status === statusFilter);
                    const date = parseDate(dateKey);
                    const isSelected = selectedDate && getDateKey(selectedDate) === dateKey;
                    
                    return (
                      <div 
                        key={dateKey} 
                        ref={(el) => { dateRefs.current[dateKey] = el; }}
                        className={`border rounded-xl p-4 bg-white hover:shadow-md transition-all ${
                          isSelected ? 'border-blue-300 shadow-md bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-blue-200' : 'bg-blue-100'
                          }`}>
                            <span className={`text-lg font-bold ${
                              isSelected ? 'text-blue-800' : 'text-blue-700'
                            }`}>{date.day}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              {date.toDate(getLocalTimeZone()).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h4>
                            <p className="text-sm text-slate-500">{payments.length} {payments.length === 1 ? 'pago' : 'pagos'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {payments.map((payment) => (
                            <div
                              key={payment.id}
                              onClick={() => {
                                setSelectedPayment(payment);
                                onDetailOpen();
                              }}
                              className={`flex items-center justify-between p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getStatusColor(payment.status)}`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(payment.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-sm truncate">{payment.title}</h5>
                                  <p className="text-xs opacity-90 capitalize">{payment.status}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm">
                                  {payment.type === 'income' ? '+' : '-'}{formatCurrency(payment.amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Table Section - Para Usuarios Internos */
        <Card className="flex-1 flex flex-col min-h-0 rounded-none -m-6">
          <CardBody className="flex-1 flex flex-col min-h-0 p-6">
            {/* Filtros de búsqueda */}
            <div className="flex-shrink-0 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                <Input
                  size="sm"
                  label="N° Factura"
                  placeholder="Buscar por número"
                  value={filterNumFactura}
                  onValueChange={setFilterNumFactura}
                  classNames={{ base: "w-full" }}
                />
                <Input
                  size="sm"
                  label="Proveedor"
                  placeholder="Buscar proveedor"
                  value={filterProveedor}
                  onValueChange={setFilterProveedor}
                  classNames={{ base: "w-full" }}
                />
                <DateInput
                  size="sm"
                  label="Fecha Emisión"
                  value={filterFechaEmision}
                  onValueChange={setFilterFechaEmision}
                />
                <DateInput
                  size="sm"
                  label="Fecha Venc."
                  value={filterFechaVenc}
                  onValueChange={setFilterFechaVenc}
                />
                <DateInput
                  size="sm"
                  label="Fecha Programada"
                  value={filterFechaProgramada}
                  onValueChange={setFilterFechaProgramada}
                />
                <Input
                  size="sm"
                  label="Total a Pagar"
                  placeholder="Monto mínimo"
                  type="number"
                  value={filterTotalPagar}
                  onValueChange={setFilterTotalPagar}
                  classNames={{ base: "w-full" }}
                />
              </div>
              
              {/* Rango de fechas para cargar datos */}
              <div className="flex items-end gap-4 mb-4">
                <DateInput
                  size="sm"
                  label="Fecha Inicio"
                  value={tableStartDate}
                  onValueChange={setTableStartDate}
                />
                <DateInput
                  size="sm"
                  label="Fecha Fin"
                  value={tableEndDate}
                  onValueChange={setTableEndDate}
                />
                <Button
                  color="primary"
                  onPress={loadScheduledInvoicesForTable}
                  isLoading={isLoadingPayments}
                >
                  Buscar
                </Button>
              </div>
            </div>

            {/* Tabla de facturas programadas */}
            <div className="flex-1 flex flex-col min-h-0">
              {isLoadingPayments ? (
                <div className="flex-1 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : paymentsError ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                    <p className="text-rose-600 mb-4">{paymentsError}</p>
                    <Button 
                      color="primary" 
                      variant="flat" 
                      onPress={loadScheduledInvoicesForTable}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : filteredTableInvoices.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay facturas programadas</p>
                  </div>
                </div>
              ) : (
                <>
                  <Table 
                    aria-label="Tabla de facturas programadas"
                    className="flex-1"
                    bottomContent={
                      tablePages > 1 ? (
                        <div className="flex w-full justify-center">
                          <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={tablePage}
                            total={tablePages}
                            onChange={setTablePage}
                          />
                        </div>
                      ) : null
                    }
                  >
                    <TableHeader>
                      <TableColumn>N° Factura</TableColumn>
                      <TableColumn>Proveedor</TableColumn>
                      <TableColumn>RUC</TableColumn>
                      <TableColumn>Fecha Emisión</TableColumn>
                      <TableColumn>Fecha Venc.</TableColumn>
                      <TableColumn>Fecha Programada</TableColumn>
                      <TableColumn>Retención</TableColumn>
                      <TableColumn>Importe Factura</TableColumn>
                      <TableColumn>Importe a Pagar</TableColumn>
                      <TableColumn>Total a Pagar</TableColumn>
                      <TableColumn>Estado</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No hay facturas programadas">
                      {tableItems.map((invoice) => {
                        const scheduledDate = (invoice as Invoice & { scheduledPaymentDate?: string }).scheduledPaymentDate;
                        const importePagar = (invoice as Invoice & { importePagar?: number }).importePagar;
                        const supplierRUC = (invoice as Invoice & { supplierRUC?: string }).supplierRUC;
                        const status = determinePaymentStatus(invoice);
                        
                        return (
                          <TableRow 
                            key={invoice.id}
                            className="cursor-pointer"
                            onClick={() => {
                              const payment = invoiceToPayment(invoice);
                              setSelectedPayment(payment);
                              onDetailOpen();
                            }}
                          >
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="truncate">{invoice.supplierName}</p>
                              </div>
                            </TableCell>
                            <TableCell>{supplierRUC || invoice.supplierId?.replace('P', '') || '-'}</TableCell>
                            <TableCell>{formatDate(invoice.receivedDate)}</TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                            <TableCell>{formatDate(scheduledDate)}</TableCell>
                            <TableCell>
                              {formatCurrency(invoice.retention || 0, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(invoice.amount || 0, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(importePagar || invoice.amount || 0, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(invoice.saldo || invoice.amount || 0, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  status === 'paid' ? 'success' :
                                  status === 'pending' ? 'warning' :
                                  status === 'overdue' ? 'danger' :
                                  'primary'
                                }
                              >
                                {status === 'paid' ? 'Pagado' :
                                 status === 'pending' ? 'Pendiente' :
                                 status === 'overdue' ? 'Vencido' :
                                 'Programado'}
                              </Chip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal para visualizar documentos */}
      <Modal 
        isOpen={isDocumentViewerOpen} 
        onClose={onDocumentViewerClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold">
                {selectedDocument?.name || 'Documento'}
              </h3>
            </div>
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedDocument && (() => {
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(selectedDocument.type.toLowerCase());
              const isPdf = selectedDocument.type.toLowerCase() === 'pdf';
              
              return (
                <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg">
                  {isImage ? (
                    <img 
                      src={selectedDocument.url} 
                      alt={selectedDocument.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError al cargar imagen%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : isPdf ? (
                    <iframe
                      src={selectedDocument.url}
                      className="w-full h-full border-0 rounded-lg"
                      title={selectedDocument.name}
                    />
                  ) : (
                    <div className="text-center p-8">
                      <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">
                        Tipo de archivo: {selectedDocument.type.toUpperCase()}
                      </p>
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => window.open(selectedDocument.url, '_blank')}
                        startContent={<DocumentTextIcon className="w-5 h-5" />}
                      >
                        Abrir en nueva ventana
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Detalle de Pago/Factura */}
      <Modal 
        isOpen={isDetailOpen} 
        onOpenChange={onDetailOpenChange}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-baseline justify-left w-full">
                  <div>
                    <h3 className="text-xl font-semibold">Detalle de Pago Programado</h3>
                    {selectedPayment && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedPayment.title}
                      </p>
                    )}
                  </div>
                  {selectedPayment && (
                    <Chip 
                      size="sm" 
                      variant="flat"
                      color={
                        selectedPayment.status === 'paid' ? 'success' :
                        selectedPayment.status === 'pending' ? 'warning' :
                        selectedPayment.status === 'overdue' ? 'danger' :
                        'primary'
                      }
                    >
                      {selectedPayment.status === 'paid' ? 'Pagado' :
                       selectedPayment.status === 'pending' ? 'Pendiente' :
                       selectedPayment.status === 'overdue' ? 'Vencido' :
                       'Programado'}
                    </Chip>
                  )}
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                {selectedPayment && (
                  <div className="space-y-4">
                    {/* Información del Pago */}
                    <Card className="border border-slate-200">
                      <CardBody className="py-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Información del Pago</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Título</span>
                            <span className="font-medium text-right">{selectedPayment.title}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Fecha Programada</span>
                            <span className="text-right">{formatDate(selectedPayment.date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Monto</span>
                            <span className="font-semibold text-right">
                              {selectedPayment.type === 'income' ? '+' : '-'}{formatCurrency(selectedPayment.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Tipo</span>
                            <span className="text-right capitalize">
                              {selectedPayment.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Información de la Factura si existe */}
                    {selectedInvoice ? (
                      <Card className="border border-slate-200">
                        <CardBody className="py-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Información de la Factura</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">N° Factura</span>
                              <span className="font-medium text-right">{selectedInvoice.invoiceNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Proveedor</span>
                              <span className="font-medium text-right">{selectedInvoice.supplierName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">N° Orden de Compra</span>
                              <span className="text-right">{selectedInvoice.purchaseOrderId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Monto Total</span>
                              <span className="font-semibold text-right">
                                {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Subtotal</span>
                              <span className="text-right">
                                {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Impuestos</span>
                              <span className="text-right">
                                {formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Saldo</span>
                              <span className="text-right">
                                {formatCurrency(selectedInvoice.saldo, selectedInvoice.currency)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Fecha Recibida</span>
                              <span className="text-right">{formatDate(selectedInvoice.receivedDate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Fecha Vencimiento</span>
                              <span className="text-right">{formatDate(selectedInvoice.dueDate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Estado</span>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  selectedInvoice.status === 'Pagada' ? 'success' :
                                  selectedInvoice.status === 'Recibida' ? 'warning' :
                                  'default'
                                }
                              >
                                {selectedInvoice.status}
                              </Chip>
                            </div>
                            {selectedInvoice.paymentTerm && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Condición de Pago</span>
                                <span className="text-right">{selectedInvoice.paymentTerm}</span>
                              </div>
                            )}
                          </div>

                          {selectedInvoice.notes && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-xs text-gray-500 mb-1">Notas</p>
                              <p className="text-sm">{selectedInvoice.notes}</p>
                            </div>
                          )}

                          {/* Detalle de Factura */}
                          {selectedInvoice.detalle && selectedInvoice.detalle.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-xs text-gray-500 mb-3 font-semibold">Detalle de Factura</p>
                              <Table aria-label="Detalle de factura" removeWrapper>
                                <TableHeader>
                                  <TableColumn>DOC. ENTRY</TableColumn>
                                  <TableColumn>CÓDIGO</TableColumn>
                                  <TableColumn>DESCRIPCIÓN</TableColumn>
                                  <TableColumn className="text-right">CANTIDAD</TableColumn>
                                  <TableColumn className="text-right">TOTAL</TableColumn>
                                </TableHeader>
                                <TableBody>
                                  {selectedInvoice.detalle.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{item.docEntry || '-'}</TableCell>
                                      <TableCell>{item.itemCode || '-'}</TableCell>
                                      <TableCell>
                                        <div className="max-w-[300px] truncate" title={item.description}>
                                          {item.description}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">{item.quantity || '0'}</TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(item.lineTotal, selectedInvoice.currency)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Sección de Documentos - Solo para Proveedores */}
                          {isProvider && selectedInvoice && (() => {
                            // Obtener documentos si existen (pueden venir en diferentes formatos)
                            const invoiceDocs = (selectedInvoice as any).documents || [];
                            const hasDocuments = invoiceDocs && invoiceDocs.length > 0;
                            
                            if (!hasDocuments) return null;
                            
                            return (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Documentos de la Factura</h4>
                                <div className="space-y-2">
                                  {invoiceDocs.map((doc: any, index: number) => {
                                    // Manejar diferentes formatos de documentos
                                    const docName = doc.name || doc.U_nameFile || doc.fileName || `Documento ${index + 1}`;
                                    const docUrl = doc.url || doc.U_LinkDocumento || doc.link || '';
                                    const docType = doc.type || docName.split('.').pop()?.toLowerCase() || 'unknown';
                                    
                                    if (!docUrl) return null;
                                    
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                        onClick={() => handleDocumentClick({ name: docName, url: docUrl, type: docType })}
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <DocumentTextIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                          <span className="text-sm font-medium text-gray-900 truncate" title={docName}>
                                            {docName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="text-xs text-gray-500 uppercase">{docType}</span>
                                          <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </CardBody>
                      </Card>
                    ) : (
                      <Card className="border border-slate-200">
                        <CardBody className="py-4">
                          <p className="text-sm text-gray-500 text-center">
                            No hay información de factura asociada a este pago
                          </p>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PaymentCalendar;
