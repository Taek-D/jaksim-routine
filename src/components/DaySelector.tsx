import type { DayOfWeek } from "../domain/models";
import { cn } from "@/lib/utils";

const ALL_DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABEL: Record<DayOfWeek, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

interface DaySelectorProps {
  days: DayOfWeek[];
  onToggle: (day: DayOfWeek) => void;
}

export default function DaySelector({ days, onToggle }: DaySelectorProps) {
  return (
    <div>
      <div className="flex justify-between items-center px-1">
        {ALL_DAYS.map((day) => {
          const isSelected = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggle(day)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-medium transition-all active:scale-90",
                isSelected
                  ? "bg-[#111827] text-white font-semibold shadow-md shadow-gray-900/10"
                  : "bg-[#f2f4f7] text-[#344054] hover:bg-gray-200"
              )}
            >
              {DAY_LABEL[day]}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[14px] text-gray-500 text-center">
        매주 <span className="text-[#101828] font-semibold">{days.length}일</span> 실천해요
      </p>
    </div>
  );
}
