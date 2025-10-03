import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { IColumns } from "src/types";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";

const renderTableCell = (column: IColumns, row: Record<string, any>) => {
  if (column.component) {
    return React.createElement(column.component, { row });
  }
  if (column.format) {
    return column.format(row[column.field], row);
  }
  return row[column.field] || "-";
};

const renderSkeletonRow = (
  columns: IColumns[],
  selected?: boolean,
  actions?: {
    update: (updatedData: Record<string, any>[]) => void;
    delete: (row: Record<string, any>) => void;
  }
) => {
  return (
    <TableRow key={`skeleton-row-${Math.random()}`}>
      {selected && (
        <TableCell>
          <Skeleton className="h-4 w-4 rounded-md ml-1" />
        </TableCell>
      )}
      {columns.map((column) => (
        <TableCell key={column.field}>
          <Skeleton className="h-4 w-full rounded-md" />
        </TableCell>
      ))}
      {actions && (
        <TableCell>
          <Skeleton className="h-4 w-full rounded-md pr-3" />
        </TableCell>
      )}
    </TableRow>
  );
};

const handleRowSelection = (
  row: unknown,
  isSelected: boolean,
  selected: unknown[],
  onRowSelectionChange?: (selectedRows: unknown[]) => void
) => {
  const updatedSelected = isSelected
    ? [...selected, row]
    : selected.filter((item) => item !== row);
  onRowSelectionChange?.(updatedSelected);
};

const renderActionCell = (
  row: Record<string, any>,
  actions: any,
  labels?: { view?: string; update?: string; delete?: string },
  icons?: { view?: React.ReactNode; update?: React.ReactNode; delete?: React.ReactNode }
) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted text-muted-foreground flex size-8 mx-auto"
          size="icon"
        >
          <IconDotsVertical />
          <span className="sr-only">Abrir menu</span>{" "}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {actions.view && (
          <DropdownMenuItem
            onClick={() => actions.view(row)}
            className="cursor-pointer flex items-center gap-2"
          >
            {icons?.view ?? <IconEdit size={16} />}
            {labels?.view ?? 'Detalhes'}
          </DropdownMenuItem>
        )}
        {actions.update && (
          <DropdownMenuItem
            onClick={() => actions.update(row)}
            className="cursor-pointer flex items-center gap-2"
          >
            {icons?.update ?? <IconEdit size={16} />}
            {labels?.update ?? 'Editar'}
          </DropdownMenuItem>
        )}
        {actions.delete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => actions.delete(row)}
            className="cursor-pointer flex items-center gap-2"
          >
            {icons?.delete ?? <IconTrash size={16} />}
            {labels?.delete ?? 'Excluir'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function CustomTableBody({
  data,
  columns,
  selected,
  loading = false,
  actions,
  actionsLabels,
  actionsIcons,
  onRowSelectionChange,
}: {
  data: Record<string, any>[];
  columns: IColumns[];
  selected?: unknown[];
  loading: boolean;
  actions?: {
    update: (updatedData: Record<string, any>[]) => void;
    delete: (row: Record<string, any>) => void;
  };
  actionsLabels?: { update?: string; delete?: string };
  actionsIcons?: { update?: React.ReactNode; delete?: React.ReactNode };
  onRowSelectionChange?: (selectedRows: unknown[]) => void;
}) {

  const renderContent = () => {
    if (loading) {
      return Array.from({ length: data.length || 10 }).map(() =>
        renderSkeletonRow(columns, !!selected, actions)
      );
    }

    if (data.length) {
      return (
        <SortableContext
          items={data.map((item) => item.id || item.name)}
          strategy={verticalListSortingStrategy}
        >
          {data.map((row) => (
            <TableRow
              key={row.id || row.name}
              className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            >
              {selected && (
                <TableCell>
                  <Checkbox
                    className="ml-1"
                    checked={selected.includes(row)}
                    onCheckedChange={(value: boolean) =>
                      handleRowSelection(
                        row,
                        value,
                        selected,
                        onRowSelectionChange
                      )
                    }
                    aria-label="Select row"
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={column.field}>
                  {renderTableCell(column, row)}
                </TableCell>
              ))}
              {actions && (
                <TableCell>{renderActionCell(row, actions, actionsLabels, actionsIcons)}</TableCell>
              )}
            </TableRow>
          ))}
        </SortableContext>
      );
    }

    const colSpan = columns.length + (selected ? 1 : 0) + (actions ? 1 : 0);

    return (
      <TableRow key="no-results">
        <TableCell colSpan={colSpan} className="h-24 text-center">
          Nenhum registro encontrado
        </TableCell>
      </TableRow>
    );
  };

  return (
    <TableBody className="**:data-[slot=table-cell]:first:w-8">
      {renderContent()}
    </TableBody>
  );
}
