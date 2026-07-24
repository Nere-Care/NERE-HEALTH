const filters = ["All", "Unread", "Doctors", "Patients"];

export default function ChatFilters({ active, setActive, darkMode }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition
          ${
            active === f
              ? "bg-blue-600 text-white"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
