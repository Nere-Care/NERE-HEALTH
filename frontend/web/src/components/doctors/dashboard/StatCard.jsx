export default function StatCard({ item, darkMode }) {
  const Icon = item.icon;

  const colorStyles = {
    green: {
      light: "bg-green-100 border-green-200 text-green-600",
      dark: "bg-green-900/30 border-green-700 text-green-400",
      glow: "shadow-green-500/20",
    },
    blue: {
      light: "bg-blue-100 border-blue-200 text-blue-600",
      dark: "bg-blue-900/30 border-blue-700 text-blue-400",
      glow: "shadow-blue-500/20",
    },
    purple: {
      light: "bg-purple-100 border-purple-200 text-purple-600",
      dark: "bg-purple-900/30 border-purple-700 text-purple-400",
      glow: "shadow-purple-500/20",
    },
    orange: {
      light: "bg-orange-100 border-orange-200 text-orange-600",
      dark: "bg-orange-900/30 border-orange-700 text-orange-400",
      glow: "shadow-orange-500/20",
    },
  };

  const styles = colorStyles[item.color];

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 group
      ${
        darkMode
          ? "bg-gray-800/80 border-gray-700 text-white hover:bg-gray-800"
          : "bg-white border-gray-200 text-black hover:shadow-lg"
      }`}
    >
      <div className="flex justify-between items-start">
        {/* LEFT */}
        <div className="space-y-1">
          <p
            className={`text-xs sm:text-sm font-medium tracking-wide
            ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {item.title}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
            {item.value}
          </h2>

          <p
            className={`text-[11px] sm:text-xs
            ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            {item.subtitle}
          </p>
        </div>

        {/* RIGHT ICON */}
        <div
          className={`
            w-10 h-10 rounded-xl border flex items-center justify-center shrink-0
            transition-all duration-300
            group-hover:scale-105
            ${
              darkMode
                ? styles.dark
                : styles.light
            }
            ${styles.glow} shadow-md
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-4">
        <p
          className={`text-xs sm:text-sm font-medium flex items-center gap-1
          ${
            item.growth.includes("+")
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {item.growth}
          <span className="text-[10px] text-gray-400">
            vs yesterday
          </span>
        </p>
      </div>
    </div>
  );
}