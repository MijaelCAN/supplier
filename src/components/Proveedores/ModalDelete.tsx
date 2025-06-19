import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {Supplier} from "@/store";
import {FC} from "react";

interface ModalDeleteProps {
    isDeleteOpen: boolean;
    onDeleteClose: () => void;
    selectedSupplier: Supplier | null;
    deleteSupplier: ( id: string ) => void;
}

const ModalDelete: FC<ModalDeleteProps> = ({ isDeleteOpen, onDeleteClose, selectedSupplier, deleteSupplier }) => {
    return (
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <h3 className="text-xl font-bold text-red-600">Confirmar Eliminación</h3>
                        </ModalHeader>
                        <ModalBody>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600"/>
                                </div>
                                <div>
                                    <p className="font-semibold">¿Estás seguro de que deseas eliminar este
                                        proveedor?</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Esta acción no se puede deshacer. Se eliminará permanentemente
                                        a <strong>{selectedSupplier?.cardName}</strong> del sistema.
                                    </p>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                color="danger"
                                onPress={() => {
                                    if (selectedSupplier) {
                                        deleteSupplier(selectedSupplier.docEntry);
                                    }
                                    onClose();
                                }}
                            >
                                Eliminar Proveedor
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export { ModalDelete }