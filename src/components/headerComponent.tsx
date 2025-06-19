import {Button} from "@heroui/react";
import {DocumentTextIcon, PlusIcon} from "@heroicons/react/24/outline";
import {FC} from "react";
import {HeaderCompProps} from "@/components/OrdenCompra/Types/headerTyps.ts";

const HeaderComponent: FC<HeaderCompProps> = ({title, subtitle, isOptions, onRegisterOpen}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle} </p>
            </div>
            {isOptions && (
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Button variant="bordered" startContent={<DocumentTextIcon className="h-4 w-4"/>}>
                        Exportar
                    </Button>
                    <Button color="primary" startContent={<PlusIcon className="h-4 w-4"/>} onPress={onRegisterOpen}>
                        Nuevo Proveedor
                    </Button>
                </div>
            )}
        </div>
    );
}
export default HeaderComponent;