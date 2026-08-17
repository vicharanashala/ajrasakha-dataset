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
    startPage = Math.max(1, currentPage - 2);
    endPage = Math.min(totalPages, currentPage + 2);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Limit Dropdown */}
      {onLimitChange && limit !== undefined && (
        <select
          value={limit.toString()}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-8 w-full sm:w-[85px] rounded-md border border-input bg-background px-3 text-xs appearance-none cursor-pointer hover:bg-accent/50 transition-colors text-center sm:text-left"
        >
          {[12, 25, 50, 100].map((v) => (
            <option key={v} value={v.toString()}>
              {v}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="gap-1 flex-shrink-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* First page + ellipsis */}
        {startPage > 1 && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(1)}
              className="w-8 h-8 flex-shrink-0"
            >
              1
            </Button>
            {startPage > 2 && (
              <span className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                ...
              </span>
            )}
          </>
        )}

        {pages.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === currentPage ? "default" : "outline"}
            onClick={() => onPageChange(p)}
            className="w-8 h-8 flex-shrink-0"
          >
            {p}
          </Button>
        ))}

        {/* Ellipsis + last page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                ...
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 flex-shrink-0"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="gap-1 flex-shrink-0"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};