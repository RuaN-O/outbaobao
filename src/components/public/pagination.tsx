import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  q: string;
  tag: string;
};

function buildHref(page: number, q: string, tag: string) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (q) {
    params.set("q", q);
  }

  if (tag) {
    params.set("tag", tag);
  }

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

export function Pagination({ currentPage, totalPages, q, tag }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination">
      {currentPage > 1 ? <Link href={buildHref(currentPage - 1, q, tag)}>上一页</Link> : <span>上一页</span>}
      <span>
        第 {currentPage} / {totalPages} 页
      </span>
      {currentPage < totalPages ? <Link href={buildHref(currentPage + 1, q, tag)}>下一页</Link> : <span>下一页</span>}
    </nav>
  );
}
