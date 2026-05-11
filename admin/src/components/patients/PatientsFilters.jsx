export default function PatientsFilters({ darkMode }) {
  return (
    <div
      className={`rounded-2xl p-5 border grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 ${
        darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-gray-200"
      }`}
    >
      <input
        type="text"
        placeholder="Nom du patient"
        className="p-3 rounded-xl border bg-transparent"
      />

      <input
        type="text"
        placeholder="Téléphone"
        className="p-3 rounded-xl border bg-transparent"
      />

      <select className="p-3 rounded-xl border bg-transparent">
        <option>Sexe</option>
        <option>Masculin</option>
        <option>Féminin</option>
      </select>

      <select className="p-3 rounded-xl border bg-transparent">
        <option>Groupe sanguin</option>
        <option>A+</option>
        <option>O+</option>
      </select>

      <select className="p-3 rounded-xl border bg-transparent">
        <option>Statut</option>
        <option>Actif</option>
        <option>Suspendu</option>
        <option>En attente</option>
      </select>

      <button className="bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold">
        Filtrer
      </button>
    </div>
  );
}