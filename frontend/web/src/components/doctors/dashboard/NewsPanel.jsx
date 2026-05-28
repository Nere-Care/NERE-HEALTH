import { useState } from "react";
import { news } from "../../../constants/doctors/DasboardData";
import {
  Bell,
  ShieldCheck,
  CreditCard,
  X,
} from "lucide-react";

export default function NewsPanel({ darkMode }) {

  // ================= POPUP STATE =================
  const [selectedNews, setSelectedNews] = useState(null);

  // ================= ICON =================
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

  // ================= FULL CONTENT =================
const getFullContent = (item) => {
  return item.fullContent || item.description;
};

  return (
    <>
      {/* ================= PANEL ================= */}
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
        <div
          className="
            space-y-3
            max-h-[260px]
            overflow-y-auto
            pr-1

            scrollbar-thin
            scrollbar-thumb-blue-500
            scrollbar-track-transparent
          "
        >

          {news.map((item) => {

            const Icon = getIcon(item.type);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className={`p-3 rounded-xl border transition hover:shadow-sm cursor-pointer
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

      {/* ================= POPUP ================= */}
      {selectedNews && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          <div
            className={`
              relative
              w-full
              max-w-2xl
              rounded-3xl
              border
              p-6
              max-h-[85vh]
              overflow-y-auto
              animate-in
              fade-in
              zoom-in-95
              duration-300

              ${
                darkMode
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-white border-gray-200 text-black"
              }
            `}
          >

            {/* CLOSE */}
            <button
              onClick={() => setSelectedNews(null)}
              className={`
                absolute top-4 right-4
                w-9 h-9 rounded-full
                flex items-center justify-center
                transition

                ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-gray-100 hover:bg-gray-200"
                }
              `}
            >
              <X className="w-4 h-4" />
            </button>

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-5">

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center
                ${
                  selectedNews.type === "update"
                    ? "bg-blue-100 text-blue-600"
                    : selectedNews.type === "policy"
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {(() => {
                  const Icon = getIcon(selectedNews.type);
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {selectedNews.title}
                </h2>

                <p className="text-sm text-gray-400">
                  {selectedNews.date}
                </p>
              </div>

            </div>

            {/* CONTENT */}
            <div
              className={`
                whitespace-pre-line
                leading-relaxed
                text-sm
                ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-600"
                }
              `}
            >
              {getFullContent(selectedNews)}
            </div>

          </div>
        </div>
      )}
    </>
  );
}