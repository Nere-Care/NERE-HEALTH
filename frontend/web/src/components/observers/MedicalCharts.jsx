export default function MedicalCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Disease Evolution
        </h3>
        <div className="h-60 flex items-center justify-center text-gray-400">
          Chart placeholder
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Regional Distribution
        </h3>
        <div className="h-60 flex items-center justify-center text-gray-400">
          Map / Chart placeholder
        </div>
      </div>

    </div>
  );
}