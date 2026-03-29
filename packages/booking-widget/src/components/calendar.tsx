import {
  cn,
  formatDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  isPastDate,
} from "../lib/utils";

interface CalendarProps {
  className?: string;
  month: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
  selectedDate: Date | null;
}

export function Calendar({
  selectedDate,
  month,
  onDateSelect,
  onMonthChange,
  className,
}: CalendarProps) {
  const daysInMonth = getDaysInMonth(month);
  const firstDayOfMonth = getFirstDayOfMonth(month);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = month.toLocaleString("default", { month: "long" });
  const year = month.getFullYear();

  const handlePrevMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    onDateSelect(date);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <button
          aria-label="Previous month"
          className="rounded px-3 py-2 font-medium text-sm hover:bg-gray-100"
          onClick={handlePrevMonth}
          type="button"
        >
          ←
        </button>
        <h2 className="font-semibold text-lg">
          {monthName} {year}
        </h2>
        <button
          aria-label="Next month"
          className="rounded px-3 py-2 font-medium text-sm hover:bg-gray-100"
          onClick={handleNextMonth}
          type="button"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            className="text-center font-semibold text-gray-600 text-xs"
            key={day}
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          if (day === null) {
            return (
              <div key={`empty-${month.getFullYear()}-${month.getMonth()}`} />
            );
          }

          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const isSelected =
            selectedDate && formatDate(selectedDate) === formatDate(date);
          const isPast = isPastDate(date);

          return (
            <button
              aria-label={`${monthName} ${day}`}
              className={cn(
                "aspect-square rounded py-2 font-medium text-sm transition",
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-50 text-gray-900 hover:bg-gray-100",
                isPast && "cursor-not-allowed text-gray-400"
              )}
              disabled={isPast}
              key={`${month.getFullYear()}-${month.getMonth()}-${day}`}
              onClick={() => handleDateClick(day)}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
