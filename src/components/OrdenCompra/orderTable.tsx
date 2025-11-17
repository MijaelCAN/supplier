import {
    Card,
    CardBody,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/react";
import { Key, useMemo } from "react";
import { TableProps } from "@/components/OrdenCompra/Types/tableTyps.ts";
import { Selection } from "@react-types/shared";

const OrderTable = <T extends object>({
    headerColumns,
    items,
    renderCell,
    topContent,
    bottomContent,
    selectedKeys,
    setSelectedKeys,
    sortDescriptor,
    setSortDescriptor,
    messageEmpty,
    getRowKey
}: TableProps<T>) => {
    const normalizedSelection = useMemo<"all" | Set<Key>>(() => {
        if (selectedKeys === "all") {
            return "all";
        }
        return new Set(selectedKeys as Iterable<Key>);
    }, [selectedKeys]);

    return (
        <Card>
            <CardBody className="p-6">
                <Table
                    aria-label="Tabla de proveedores"
                    isHeaderSticky
                    bottomContent={bottomContent}
                    bottomContentPlacement="outside"
                    classNames={{
                        wrapper: "max-h-[400px]",
                    }}
                    selectedKeys={normalizedSelection}
                    selectionMode="multiple"
                    sortDescriptor={sortDescriptor}
                    topContent={topContent}
                    topContentPlacement="outside"
                    onSelectionChange={(keys) => setSelectedKeys(keys as Selection)}
                    onSortChange={setSortDescriptor}
                >
                    <TableHeader columns={headerColumns}>
                        {(column) => (
                            <TableColumn
                                key={column.uid}
                                align={column.uid === "actions" ? "center" : "start"}
                                allowsSorting={column.sortable}
                            >
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody emptyContent={messageEmpty} items={items}>
                        {(item) => (
                            <TableRow key={getRowKey(item)}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardBody>
        </Card>
    );
};

export default OrderTable;