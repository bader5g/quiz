import React from 'react';

interface PageSizeSelectorProps {
  pageSize: number;
  setPageSize: (size: number) => void;
  totalItems: number;
  currentPage: number;
}

export function PageSizeSelector({ 
  pageSize, 
  setPageSize, 
  totalItems, 
  currentPage 
}: PageSizeSelectorProps) {
  const firstItemIndex = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItemIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">عدد الأسئلة في الصفحة:</span>
        <select
          className="w-24 p-1 border rounded-md"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      <div className="text-sm">
        {totalItems > 0 ? (
          <>عرض {firstItemIndex} إلى {lastItemIndex} من إجمالي {totalItems} سؤال</>
        ) : (
          <>لا توجد أسئلة</>
        )}
      </div>
    </div>
  );
}