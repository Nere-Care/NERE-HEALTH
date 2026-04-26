import { CalendarDays } from "lucide-react";

export default function DateInput() {
  return (
    <div className="relative border border-gray-300 rounded-lg bg-[rgba(217,218,220,0.1)] overflow-hidden">
      <input
        type="date"
        className="w-full px-4 py-3 pr-14 bg-transparent outline-none text-gray-700"
      />

      <style>
        {`
          input[type="date"]::-webkit-calendar-picker-indicator{
            opacity:0;
            position:absolute;
            right:0;
            width:48px;
            height:100%;
            cursor:pointer;
          }
        `}
      </style>

      <div className="absolute top-0 right-0 h-full w-12 bg-[#27AE60] flex items-center justify-center pointer-events-none">
        <CalendarDays className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}