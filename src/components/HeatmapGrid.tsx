import type { HeatmapCell } from "../domain/progress";
import { cn } from "@/lib/utils";

interface HeatmapGridProps {
  cells: HeatmapCell[];
}

const LEVEL_COLORS: Record<HeatmapCell["level"], string> = {
  0: "bg-gray-100",
  1: "bg-green-200",
  2: "bg-green-400",
  3: "bg-green-500",
  4: "bg-green-700",
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function getWeekdayIndex(dateStamp: string): number {
  const [year, month, day] = dateStamp.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function HeatmapGrid({ cells }: HeatmapGridProps) {
  if (cells.length === 0) return null;

  const firstDayIndex = getWeekdayIndex(cells[0].date);
  const paddedCells: (HeatmapCell | null)[] = [
    ...Array.from<null>({ length: firstDayIndex }).fill(null),
    ...cells,
  ];

  const totalCols = Math.ceil(paddedCells.length / 7);

  return (
    <div className="flex gap-1">
      {/* Day labels column */}
      <div className="flex flex-col gap-1 mr-1 shrink-0">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="w-4 h-[14px] flex items-center justify-center text-[9px] text-gray-400"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid columns */}
      {Array.from({ length: totalCols }, (_, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-1">
          {Array.from({ length: 7 }, (__, rowIndex) => {
            const cellIndex = colIndex * 7 + rowIndex;
            const cell = paddedCells[cellIndex] ?? null;

            if (!cell) {
              return (
                <div
                  key={rowIndex}
                  className="w-[14px] h-[14px] rounded-[3px] bg-transparent"
                />
              );
            }

            return (
              <div
                key={cell.date}
                className={cn(
                  "w-[14px] h-[14px] rounded-[3px] transition-colors",
                  LEVEL_COLORS[cell.level]
                )}
                title={`${cell.date}: ${cell.count}회 체크인`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
