import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IColumns, IPagination } from "src/types";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export default function CustomTableHeader({
  columns,
  pagination,
  selected,
  data,
  disabled = false,
  actions,
  onSortChange,
  onRowSelectionChange,
}: {
  columns: IColumns[];
  pagination: IPagination;
  selected?: unknown[];
  data: Record<string, any>[];
  disabled: boolean;
  actions?: {
    update: (updatedData: Record<string, any>[]) => void;
    delete: (row: Record<string, any>) => void;
  };
  onSortChange: (field: string, order: 'ASC' | 'DESC') => void;
  onRowSelectionChange?: (selectedRows: unknown[]) => void;
}) {

  const handleSort = (field: string) => {
    const newOrder =
      pagination.sortField === field && pagination.sortOrder === 'ASC'
        ? 'DESC'
        : 'ASC';
    onSortChange(field, newOrder);
  };

  const handleSelectAll = (isSelected: boolean) => {
    const updatedSelection = isSelected ? [...data] : [];
    if (onRowSelectionChange) onRowSelectionChange(updatedSelection);
  };

  return (
    <TableHeader className="bg-muted sticky top-0 z-10">
      <TableRow>
        {typeof selected !== "undefined" && (
          <TableHead colSpan={1}>
            <div className="flex items-center justify-center w-6">
              <Checkbox
                checked={selected.length === data.length && data.length > 0}
                onCheckedChange={(value) => handleSelectAll(!!value)}
                aria-label="Select all"
                disabled={disabled}
              />
            </div>
          </TableHead>
        )}

        {columns.map((column) => (
          <TableHead key={column.field} colSpan={column.colSpan}>
            <div className="flex items-center">
              {column.label}
              {column?.sortable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-muted-foreground size-7 hover:bg-transparent ${
                    pagination.sortField !== column.field ? "opacity-50" : ""
                  }`}
                  disabled={disabled}
                  onClick={() => handleSort(column.field)}
                >
                  {pagination.sortField === column.field &&
                  pagination.sortOrder === 'ASC' ? (
                    <IconChevronUp className="size-4 cursor-pointer" />
                  ) : (
                    <IconChevronDown className="size-4 cursor-pointer" />
                  )}
                </Button>
              )}
            </div>
          </TableHead>
        ))}

        {actions && (
          <TableHead colSpan={1}>
            <div className="flex items-center justify-center">
              Ações
            </div>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
