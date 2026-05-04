import { news } from "../../../constants/doctors/DasboardData";
import { Bell, ShieldCheck, CreditCard } from "lucide-react";

export default function NewsPanel({ darkMode }) {
  const getIcon = (type) => {
    switch (type) {
      case "update":
        return Bell;
      case "policy":
        return ShieldCheck;
      case "payment":
        return CreditCard;
      default:
        return Bell;
    }
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
          News & Updates
        </h2>

        <span className="text-xs text-gray-400">
          {news.length} updates
        </span>
      </div>

      {/* LIST */}
      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {news.map((item) => {
          const Icon = getIcon(item.type);

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition hover:shadow-sm
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700 hover:bg-gray-800"
                  : "bg-gray-50 border-gray-200 hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">

                {/* ICON */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${
                    item.type === "update"
                      ? "bg-blue-100 text-blue-600"
                      : item.type === "policy"
                      ? "bg-green-100 text-green-600"
                      : "bg-purple-100 text-purple-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {item.title}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  <p className="text-[10px] text-gray-400 mt-1">
                    {item.date}
                  </p>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}