import {
  Wallet,
  CreditCard,
  Landmark,
} from "lucide-react";

export default function StatsCards({
  stats,
  darkMode,
}) {

  const icons = {
    "Withdrawn Amount": Wallet,
    "Ready To Withdraw": CreditCard,
    "Settlements": Landmark,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

      {stats.map((stat) => {

        const Icon =
          icons[stat.title] || Wallet;

        return (

          <div
            key={stat.title}
            className={`
              rounded-2xl
              border
              p-4 sm:p-5
              transition-all duration-300
              hover:scale-[1.01]
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }
            `}
          >

            {/* HEADER */}
            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">
                <p
                  className={`
                    text-sm
                    truncate
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  `}
                >
                  {stat.title}
                </p>

                <h2 className="mt-2 text-xl sm:text-2xl font-bold break-words">
                  {stat.amount}
                </h2>
              </div>

              {/* ICON */}
              <div
                className={`
                  w-11 h-11
                  rounded-2xl
                  flex items-center justify-center
                  flex-shrink-0
                  ${
                    darkMode
                      ? "bg-gray-800"
                      : "bg-white"
                  }
                `}
              >
                <Icon
                  className={`
                    w-5 h-5
                    ${
                      darkMode
                        ? "text-blue-400"
                        : "text-blue-600"
                    }
                  `}
                />
              </div>

            </div>

          </div>

        );
      })}
    </div>
  );
}