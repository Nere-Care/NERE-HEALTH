export default function Prescriptions({ darkMode }) {
  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className="text-lg font-bold text-blue-600">Prescriptions</h1>
    </div>
  );
}