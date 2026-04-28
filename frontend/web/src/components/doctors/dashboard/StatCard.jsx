export default function StatCard({ item, darkMode }) {
  return (
    <div className={`rounded-2xl shadow-sm p-4 sm:p-5 border transition-colors
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border text-black"}
    `}>
      <div className="flex justify-between items-center">
        <div>
          <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            {item.title}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {item.value}
          </h2>
        </div>

        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.color}`} />
      </div>

      <p className="text-green-600 text-xs sm:text-sm mt-3 sm:mt-4">
        {item.growth}
      </p>
    </div>
  );
}