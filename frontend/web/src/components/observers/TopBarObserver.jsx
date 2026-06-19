export default function TopBarObserver() {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 flex justify-between items-center">

      <h2 className="font-semibold text-gray-900 dark:text-white">
        Observer Dashboard (State / NGO / Sponsors)
      </h2>

      <span className="text-xs text-gray-500 dark:text-gray-400">
        Read-only analytics access
      </span>

    </div>
  );
}