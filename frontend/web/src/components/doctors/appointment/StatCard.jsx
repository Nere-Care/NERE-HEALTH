// components/doctors/appointment/StatCard.jsx

const colorMap = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    darkBg: "bg-blue-900/30",
    darkText: "text-blue-400",
  },

  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    darkBg: "bg-yellow-900/30",
    darkText: "text-yellow-400",
  },

  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    darkBg: "bg-green-900/30",
    darkText: "text-green-400",
  },

  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    darkBg: "bg-purple-900/30",
    darkText: "text-purple-400",
  },
};

export default function StatCard({
  icon,
  label,
  value,
  color,
  darkMode,
  alert,
}) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`
        relative
        w-full
        min-w-0
        rounded-xl
        sm:rounded-2xl
        p-3
        sm:p-4
        md:p-5
        border
        transition-all
        duration-300
        hover:-translate-y-1
        ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-100 shadow-sm"
        }
      `}
    >
      {alert && (
        <span
          className="
            absolute
            top-2
            right-2
            sm:top-3
            sm:right-3
            w-2
            h-2
            sm:w-2.5
            sm:h-2.5
            bg-red-500
            rounded-full
            animate-pulse
          "
        />
      )}

      <div
        className={`
          w-8 h-8
          sm:w-10 sm:h-10
          md:w-12 md:h-12
          rounded-lg
          sm:rounded-xl
          flex
          items-center
          justify-center
          mb-2
          sm:mb-3
          flex-shrink-0
          ${darkMode ? colors.darkBg : colors.bg}
          ${darkMode ? colors.darkText : colors.text}
        `}
      >
        <div className="scale-90 sm:scale-100">
          {icon}
        </div>
      </div>

      <p
        className={`
          text-[10px]
          sm:text-xs
          md:text-sm
          leading-tight
          break-words
          ${
            darkMode
              ? "text-gray-400"
              : "text-gray-500"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          font-bold
          leading-none
          break-words
          text-lg
          sm:text-2xl
          md:text-3xl
          ${
            darkMode
              ? "text-white"
              : "text-gray-800"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}