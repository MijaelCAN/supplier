import { Key, ReactNode } from "react";
import { SortDescriptor } from "@heroui/react";
import { Selection } from "@react-types/shared";

export interface Column {
    name: string;
    uid: string;
    sortable: boolean;
}

export interface Row {}


export interface TableProps<T extends object> {
    headerColumns: Column[];
    items: T[];
    topContent: ReactNode;
    bottomContent:ReactNode;
    selectedKeys: Selection;
    setSelectedKeys: (selectedKey: Selection) => void;
    sortDescriptor: SortDescriptor;
    setSortDescriptor: (sortDescriptor: SortDescriptor) => void;
    renderCell: (item: T, columnKey: Key) => ReactNode;
    getRowKey: (item: T) => Key;
    messageEmpty?: ReactNode;
    // aqui
}