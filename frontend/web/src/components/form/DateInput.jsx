import { CalendarDays } from "lucide-react";

export default function DateInput() {
  return (
    <div className="
      relative
      border border-gray-200
      rounded-2xl
      bg-white
      overflow-hidden
      shadow-sm
      hover:border-[#2F80ED]
      transition-all
    ">
      <input
        type="date"
        className="
          w-full
          px-4
          py-4
          pr-14
          bg-transparent
          outline-none
          text-gray-700
        "
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

      <div className="
        absolute top-0 right-0
        h-full w-14
        bg-[#27AE60]
        flex items-center justify-center
        pointer-events-none
      ">
        <CalendarDays className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}