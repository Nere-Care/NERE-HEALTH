import { Wallet, CreditCard, Landmark, TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCards({ stats, darkMode }) {
  const icons = {
    "Withdrawn Amount": { Icon: Wallet, color: "text-purple-500", bg: "bg-purple-100", darkBg: "bg-purple-900/30" },
    "Ready To Withdraw": { Icon: CreditCard, color: "text-green-500", bg: "bg-green-100", darkBg: "bg-green-900/30" },
    "Settlements": { Icon: Landmark, color: "text-blue-500", bg: "bg-blue-100", darkBg: "bg-blue-900/30" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const config = icons[stat.title] || icons["Settlements"];
        const Icon = config.Icon;

        return (
          <div
            key={stat.title}
            className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:scale-[1.01]
              ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {stat.title}
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold break-words">
                  {stat.amount}
                </h2>
                {stat.trend && (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-medium
                    ${stat.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                    {stat.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{Math.abs(stat.trend)}% ce mois</span>
                  </div>
                )}
              </div>

              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
                ${darkMode ? config.darkBg : config.bg}`}>
                <Icon className={`w-5 h-5 ${darkMode ? config.color.replace("500", "400") : config.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}