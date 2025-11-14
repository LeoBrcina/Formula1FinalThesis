"use client";

interface SeasonSelectorProps {
  value: number;
  onChange: (year: number) => void;
  startYear?: number;
  endYear?: number;
}

export function SeasonSelector({
  value,
  onChange,
  startYear = 1950,
  endYear = new Date().getFullYear(),
}: SeasonSelectorProps) {
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => endYear - i
  );

  return (
    <select
      id="season-select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="ml-2 bg-gray-900 text-white border border-gray-700 rounded px-2 py-0 text-sm
                 hover:border-red-500 focus:border-red-500 transition-all duration-300 align-middle"
      style={{
        height: '3rem',           // matches text line height
        width: '10rem',
        lineHeight: '1.6rem',       // keeps year text aligned with header
        fontSize: '0.9rem',         // slightly smaller than header
        transform: 'translateY(-2px)', // fine-tune vertical alignment
      }}
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
