export type PaginationParams = {
  page: number;
  pageSize: number;
};

export function getPaginationOffset({ page, pageSize }: PaginationParams): number {
  return Math.max(page - 1, 0) * pageSize;
}
