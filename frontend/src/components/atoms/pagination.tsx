import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
}: PaginationProps) => {
  const MAX_VISIBLE_PAGES = 5;

  let startPage = 1;
  let endPage = Math.min(totalPages, MAX_VISIBLE_PAGES);

  if (currentPage > MAX_VISIBLE_PAGES) {
    startPage = currentPage;
    endPage = Math.min(currentPage + MAX_VISIBLE_PAGES - 1, totalPages);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
      {/* Limit Dropdown */}
      {onLimitChange && limit !== undefined && (
        <select
          value={limit.toString()}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-8 w-[85px] rounded-md border border-input bg-background px-3 text-xs appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
        >
          {[12, 25, 50, 100].map((v) => (
            <option key={v} value={v.toString()}>
              {v}
            </option>
          ))}
        </select>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </Button>

      <div className="flex gap-1.5">
        {pages.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === currentPage ? "default" : "outline"}
            onClick={() => onPageChange(p)}
            className="w-9 h-8"
          >
            {p}
          </Button>
        ))}

        {endPage < totalPages && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(endPage + 1)}
            className="w-9 h-8 px-0"
          >
            ...
          </Button>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => onPageChange(currentPage + 1)}
        className="gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};