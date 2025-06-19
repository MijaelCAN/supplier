import DefaultLayout from "@/layouts/default";
import {
    Card,
    CardBody,
    CardHeader, Chip, ChipProps,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow, Tooltip, User
} from "@heroui/react";
import {DeleteIcon, EditIcon, EyeIcon} from "@/components/icons.tsx";
import { useCallback, useEffect, useState} from "react";



const API_URL = "http://192.168.254.27:8085/api/Documentos/OrdenCompra?CardCode=P20608168673&FechaInicio=20200101&FechaFin=20250318";
export const columns = [
    {name: "N° OC", uid: "num_oc"},
    {name: "PROVEEDOR", uid: "proveedor"},
    {name: "FECHA", uid: "fecha"},
    {name: "MONEDA", uid: "moneda"},
    {name: "MONTO TOTAL", uid: "monto"},
    {name: "STATUS", uid: "status"},
    {name: "CONDICION PAGO", uid: "cond_pago"},
    {name: "ACTIONS", uid: "actions"},
];

export const users = [
    /*{
        id: 1,
        num_oc: "20254875",
        proveedor: "Corporacion PRIMAX S.A",
        fecha: "2025-03-10",
        moenda: "S/.",
        monto: "25000",
        status: "active",
        cond_pago: "CREDITO 90",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        direccion: "MZA. B1 LOTE 01 PQUE. IND. DE ANCÓN ",
    },*/
    {
        docEntry: 84839,
        cardCode: "P20608168673",
        cardName: "CONSTRUCTORA RICRA S.A.C.",
        direccion_Destino: "MZA. B1 LOTE 01 PQUE. IND. DE ANCÓN - ACOMPIA (ALT. KM.46.5 PAN.NORTE) ANCÓN-ANCÓN-LIMA\\rLIMA",
        direccion_Facturacion: "CAL.LOS INCAS MZA. A1 LOTE. 2 A.H. LOS OLIVOS DE LA PAZ PROV. CONST. DEL CALLAO - PROV. CONST. DEL C-VENTANILLA-PROV. CONST. DEL CALLAO\\rCALLAO",
        docDate: "6/3/2025 12:00:00 a. m.",
        docCur: "S/",
        total: 1770,
    },
];
const statusColorMap: Record<string, ChipProps["color"]> = {
    active: "success",
    paused: "danger",
    vacation: "warning",
};

export default function Proveedores() {
    const [listProveedores , setListProveedores ] = useState([]);

    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                if (data.statusCode === 200) {
                    const formatted = data.data.map((item: any, index: number) => ({
                        id: index + 1,
                        num_oc: item.docEntry,
                        proveedor: item.cardName,
                        fecha: item.docDate.split(" ")[0],
                        moneda: item.docCur,
                        monto: item.total,
                        status: "active",
                        cond_pago: "CREDITO 90",
                        avatar: `https://i.pravatar.cc/150?u=${item.cardCode}`,
                        direccion: item.direccion_Destino,
                    }));
                    setListProveedores(formatted);
                }
            });
    }, []);


    const renderCell = useCallback((proveedor: any, columnKey: React.Key) => {
        const cellValue = proveedor[columnKey as keyof typeof proveedor];

        switch (columnKey) {
            case "proveedor":
                return (
                    <User
                        avatarProps={{radius: "lg", src: proveedor.avatar}}
                        description={proveedor.direccion}
                        name={cellValue}
                    >
                        {proveedor.direccion}
                    </User>
                );
            case "monto":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize">S/. {cellValue}</p>
                        <p className="text-bold text-sm capitalize text-default-400">{proveedor.monto}</p>
                    </div>
                );
            case "status":
                return (
                    <Chip className="capitalize" color={statusColorMap[proveedor.status]} size="sm" variant="flat">
                        {cellValue}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip content="Details">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <EyeIcon />
              </span>
                        </Tooltip>
                        <Tooltip content="Edit user">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <EditIcon />
              </span>
                        </Tooltip>
                        <Tooltip color="danger" content="Delete user">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <DeleteIcon />
              </span>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, []);

  return (
    <DefaultLayout>
        <Card className="py-4">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <p className="text-tiny uppercase font-bold">Dashboard</p>
                <small className="text-default-500">Lista de proveedores</small>
                <h4 className="font-bold text-large">Órdenes de Compra</h4>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
                <Table aria-label="Example table with custom cells">
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={listProveedores}>
                        {(item) => (
                            <TableRow key={item}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardBody>
        </Card>
    </DefaultLayout>
  );
}
