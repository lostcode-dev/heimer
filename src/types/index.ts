export interface ICommon {
  [key: string]: any;
}

export interface IColumns<T = any> {
  label: string;
  field: string;
  sortable?: boolean;

  align?: "left" | "center" | "right";
  sort?: (a: any, b: any, rowA: T, rowB: T) => any;
  format?: (val: any, row: T) => string;
  style?: string | ((row: T) => string | any[] | ICommon);
  classes?: string | ((row: T) => string);
  headerStyle?: string;
  headerClasses?: string;
  colSpan?: number;

  component?: React.ComponentType<{ row: T }>;
}

export interface IPagination {
  sortField: string;
  sortOrder: 'ASC' | 'DESC';

  search?: string;

  currentPage: number;
  itemsPerPage: number;

  currentTotalItems: number;
  totalItems: number;
  totalPages: number;
}