import {
    Avatar, Button,
    Card,
    CardBody,
    CardHeader,
    Chip, Modal,
    ModalBody,
    ModalContent, ModalFooter,
    ModalHeader,
    Progress,
    Tab,
    Tabs
} from "@heroui/react";
import {DocumentTextIcon, EyeIcon, ShieldCheckIcon} from "@heroicons/react/24/outline";
import {Supplier} from "@/store";
import {FC} from "react";

interface ModalDetailProps {
    isViewOpen: boolean;
    onViewClose: () => void;
    selectedSupplier: Supplier | null;
    onEditOpen: () => void;
}

const ModalDetail: FC<ModalDetailProps> = ({isViewOpen, onViewClose, selectedSupplier, onEditOpen}) => {
    return (
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={selectedSupplier?.avatar}
                                    name={selectedSupplier?.cardName}
                                    size="lg"
                                />
                                <div>
                                    <h3 className="text-xl font-bold">{selectedSupplier?.cardName}</h3>
                                    <p className="text-sm text-gray-500">{selectedSupplier?.businessType}</p>
                                </div>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {selectedSupplier && (
                                <Tabs aria-label="Información del proveedor">
                                    <Tab key="general" title="Información General">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Certificaciones</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedSupplier.certifications.map((cert, index) => (
                                                            <Chip
                                                                key={index}
                                                                size="sm"
                                                                variant="bordered"
                                                                startContent={<ShieldCheckIcon
                                                                    className="h-3 w-3"/>}
                                                            >
                                                                {cert}
                                                            </Chip>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab>

                                    <Tab key="financial" title="Información Financiera">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Resumen de Órdenes</h4>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Total de Órdenes:</span>
                                                            <span
                                                                className="font-semibold">{selectedSupplier.totalOrders}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                                    <span
                                                                        className="text-sm text-gray-600">Monto Total:</span>
                                                            <span
                                                                className="font-semibold text-green-600">S/ {selectedSupplier.totalAmount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Promedio por Orden:</span>
                                                            <span
                                                                className="font-semibold">S/ {(selectedSupplier.totalAmount / selectedSupplier.totalOrders).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Términos de Pago</h4>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                                    <span
                                                                        className="text-sm text-gray-600">Términos:</span>
                                                            <span
                                                                className="font-semibold">{selectedSupplier.paymentTerms}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Fecha de Registro:</span>
                                                            <span
                                                                className="font-semibold">{new Date(selectedSupplier.registrationDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Última Orden:</span>
                                                            <span
                                                                className="font-semibold">{new Date(selectedSupplier.lastOrderDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </Tab>

                                    <Tab key="performance" title="Rendimiento">
                                        <div className="space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Evaluación de Rendimiento</h4>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <div
                                                                className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium">Calidad de Productos</span>
                                                                <span
                                                                    className="text-sm font-bold">{selectedSupplier.rating}/5</span>
                                                            </div>
                                                            <Progress
                                                                value={(selectedSupplier.rating / 5) * 100}
                                                                color="success"
                                                                className="max-w-md"
                                                            />
                                                        </div>

                                                        <div>
                                                            <div
                                                                className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium">Puntualidad en Entregas</span>
                                                                <span className="text-sm font-bold">4.2/5</span>
                                                            </div>
                                                            <Progress
                                                                value={84}
                                                                color="primary"
                                                                className="max-w-md"
                                                            />
                                                        </div>

                                                        <div>
                                                            <div
                                                                className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium">Servicio al Cliente</span>
                                                                <span className="text-sm font-bold">4.5/5</span>
                                                            </div>
                                                            <Progress
                                                                value={90}
                                                                color="secondary"
                                                                className="max-w-md"
                                                            />
                                                        </div>

                                                        <div>
                                                            <div
                                                                className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium">Competitividad de Precios</span>
                                                                <span className="text-sm font-bold">3.8/5</span>
                                                            </div>
                                                            <Progress
                                                                value={76}
                                                                color="warning"
                                                                className="max-w-md"
                                                            />
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Estadísticas de
                                                        Colaboración</h4>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 36) + 12}</p>
                                                            <p className="text-sm text-gray-600">Meses
                                                                colaborando</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-green-600">98%</p>
                                                            <p className="text-sm text-gray-600">Tasa de
                                                                cumplimiento</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 5) + 1}</p>
                                                            <p className="text-sm text-gray-600">Reclamos
                                                                abiertos</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-orange-600">{Math.floor(Math.random() * 10) + 3}</p>
                                                            <p className="text-sm text-gray-600">Días promedio
                                                                entrega</p>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </Tab>

                                    <Tab key="documents" title="Documentos">
                                        <div className="space-y-4">
                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Documentos Legales</h4>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="space-y-3">
                                                        <div
                                                            className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <DocumentTextIcon
                                                                    className="h-5 w-5 text-blue-600"/>
                                                                <div>
                                                                    <p className="font-medium">Registro Único de
                                                                        Contribuyente (RUC)</p>
                                                                    <p className="text-sm text-gray-500">Actualizado
                                                                        el 15/01/2024</p>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="light" color="primary">
                                                                <EyeIcon className="h-4 w-4"/>
                                                            </Button>
                                                        </div>

                                                        <div
                                                            className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <DocumentTextIcon
                                                                    className="h-5 w-5 text-green-600"/>
                                                                <div>
                                                                    <p className="font-medium">Certificado ISO
                                                                        9001</p>
                                                                    <p className="text-sm text-gray-500">Válido
                                                                        hasta 30/12/2025</p>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="light" color="primary">
                                                                <EyeIcon className="h-4 w-4"/>
                                                            </Button>
                                                        </div>

                                                        <div
                                                            className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <DocumentTextIcon
                                                                    className="h-5 w-5 text-purple-600"/>
                                                                <div>
                                                                    <p className="font-medium">Póliza de
                                                                        Seguros</p>
                                                                    <p className="text-sm text-gray-500">Vigente
                                                                        hasta 15/08/2024</p>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="light" color="primary">
                                                                <EyeIcon className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <h4 className="font-semibold">Contratos y Acuerdos</h4>
                                                </CardHeader>
                                                <CardBody>
                                                    <div className="space-y-3">
                                                        <div
                                                            className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <DocumentTextIcon
                                                                    className="h-5 w-5 text-red-600"/>
                                                                <div>
                                                                    <p className="font-medium">Contrato Marco de
                                                                        Servicios</p>
                                                                    <p className="text-sm text-gray-500">Firmado
                                                                        el 10/03/2023</p>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="light" color="primary">
                                                                <EyeIcon className="h-4 w-4"/>
                                                            </Button>
                                                        </div>

                                                        <div
                                                            className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <DocumentTextIcon
                                                                    className="h-5 w-5 text-orange-600"/>
                                                                <div>
                                                                    <p className="font-medium">Acuerdo de
                                                                        Confidencialidad</p>
                                                                    <p className="text-sm text-gray-500">Vigente
                                                                        desde 01/01/2023</p>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="light" color="primary">
                                                                <EyeIcon className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </Tab>
                                </Tabs>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                            <Button color="primary" onPress={() => {
                                onClose();
                                onEditOpen();
                            }}>
                                Editar Proveedor
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
export { ModalDetail }