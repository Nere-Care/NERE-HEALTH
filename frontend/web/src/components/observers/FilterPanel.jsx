export default function FilterPanel({ filters, setFilters }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 space-y-3">

      <h3 className="font-semibold text-gray-900 dark:text-white">
        Filters
      </h3>

      <select
        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        onChange={(e) =>
          setFilters({ ...filters, region: e.target.value })
        }
      >
        <option value="all">All Regions</option>
        <option value="douala">Douala</option>
        <option value="yaounde">Yaoundé</option>
      </select>

      <select
        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        onChange={(e) =>
          setFilters({ ...filters, period: e.target.value })
        }
      >
        <option value="month">Monthly</option>
        <option value="year">Yearly</option>
      </select>

    </div>
  );
}