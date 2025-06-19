import type {Supplier} from "@/store/extendedStore";
import {Key, ReactNode} from "react";
import {SortDescriptor} from "@heroui/react";
import {PurchaseOrder} from "@/components/OrdenCompra/Types/orderTypes.ts";

export interface Column {
    name: string;
    uid: string;
    sortable: boolean;
}

export interface Row {}


export interface TableProps {
    headerColumns: Column[];
    sortedItems: PurchaseOrder[];
    topContent: ReactNode;
    bottomContent:ReactNode;
    selectedKeys:Selection;
    setSelectedKeys: (selectedKey: Selection) => void;
    sortDescriptor: SortDescriptor;
    setSortDescriptor: (sortDescriptor: SortDescriptor) => void;
    renderCell: (order: PurchaseOrder, columnKey: Key) => ReactNode;
    messageEmpty?: ReactNode;
    // aqui
}