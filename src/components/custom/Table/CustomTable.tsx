import * as React from "react";
import { Table } from "@/components/ui/table";
import type { IColumns, IPagination } from "src/types";
import CustomTableHeader from "./TableHeader";
import CustomTableBody from "./TableBody";
import TablePagination from "./TablePagination";
import CustomInput from "../Input/CustomInput";
import { useState } from "react";
import { Search, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomTable({
  data,
  columns,
  pagination,
  selected,
  loading = false,
  actions,
  actionsLabels,
  actionsIcons,
  onRowSelectionChange,
  onRequest,
  onAddItem,
  onRemoveItens,
  extraActions,
}: {
  data: Record<string, any>[];
  columns: IColumns[];
  pagination: IPagination;
  selected?: unknown[];
  loading: boolean;
  actions?: {
    view?: (row: Record<string, any>) => void;
    update: (updatedData: Record<string, any>[]) => void;
    delete: (row: Record<string, any>) => void;
  };
  actionsLabels?: { view?: string; update?: string; delete?: string };
  actionsIcons?: { view?: React.ReactNode; update?: React.ReactNode; delete?: React.ReactNode };
  onRowSelectionChange?: any;
  onRequest: (updatedPagination: IPagination) => void;
  onAddItem?: () => void;
  onRemoveItens?: (selectedRows: unknown[]) => void;
  extraActions?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");

  const handleSortChange = (field: string, order: 'ASC' | 'DESC') => {
    onRequest({
      ...pagination,
      sortField: field,
      sortOrder: order,
    });
  };

  const handlePageChange = (pageIndex: number, pageSize: number) => {
    onRequest({
      ...pagination,
      currentPage: pageIndex,
      itemsPerPage: pageSize,
    });
  };

  const handleSearchSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onRequest({
        ...pagination,
        search,
      });
    }
  };

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="flex items-center justify-between gap-4">
          <CustomInput
            name="search"
            value={search || ""}
            placeholder={`Buscar...`}
            onChange={setSearch}
            onKeyDown={handleSearchSubmit}
            disabled={loading}
            icon={<Search size={16} />}
          />
          <div className="flex gap-2">
            {extraActions}

            {onRemoveItens && (
              <Button
                variant="outline"
                className="size-9"
                size="icon"
                onClick={() => onRemoveItens(selected as unknown[])}
                disabled={loading || !selected || selected.length === 0}
              >
                <Trash size={16} />
                <span className="sr-only">Remover itens</span>
              </Button>
            )}

            {onAddItem && (
              <Button
                variant="outline"
                className="size-9"
                size="icon"
                onClick={() => onAddItem()}
                disabled={loading}
              >
                <Plus size={16} />
                <span className="sr-only">Adicionar item</span>
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <CustomTableHeader
              columns={columns}
              pagination={pagination}
              selected={selected}
              data={data}
              onRowSelectionChange={onRowSelectionChange}
              onSortChange={handleSortChange}
              disabled={loading}
              actions={actions}
            />
            <CustomTableBody
              columns={columns}
              data={data}
              selected={selected}
              loading={loading}
              actions={actions}
              actionsLabels={actionsLabels}
              actionsIcons={actionsIcons}
              onRowSelectionChange={onRowSelectionChange}
            />
          </Table>
        </div>
        <TablePagination
          pagination={pagination}
          onPageChange={handlePageChange}
          disabled={loading}
        />
      </div>
    </div>
  );
}
