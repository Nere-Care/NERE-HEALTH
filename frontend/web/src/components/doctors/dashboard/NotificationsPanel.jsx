import { notifications } from "../../../constants/doctors/DasboardData";
import { Bell, FlaskConical, CalendarCheck, CreditCard } from "lucide-react";

export default function NotificationsPanel({ darkMode }) {

  const getIcon = (text) => {
    if (text.includes("lab")) return FlaskConical;
    if (text.includes("appointment")) return CalendarCheck;
    if (text.includes("payment")) return CreditCard;
    return Bell;
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition
      ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">
          Notifications
        </h2>

        <span className="text-xs text-gray-400">
          {notifications.length}
        </span>
      </div>

      {/* LIST */}
      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {notifications.map((n, i) => {
          const Icon = getIcon(n);

          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border transition hover:shadow-sm
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700 hover:bg-gray-800"
                  : "bg-gray-50 border-gray-200 hover:bg-white"
              }`}
            >
              {/* ICON */}
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0
                ${
                  n.includes("payment")
                    ? "bg-purple-100 text-purple-600"
                    : n.includes("lab")
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* TEXT */}
              <p className="text-xs sm:text-sm flex-1 leading-relaxed">
                {n}
              </p>

            </div>
          );
        })}
      </div>
    </div>
  );
}