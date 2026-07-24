export default function PatientsFilters({ darkMode, filters, setFilters }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const inputClass = `p-3 rounded-xl border outline-none transition w-full ${
    darkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-gray-400 focus:border-blue-500" 
      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
  }`;

  return (
    <div className={`rounded-2xl p-5 border grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 ${
      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
    }`}>
      <input type="text" name="nom" value={filters.nom} onChange={handleChange} placeholder=" Nom, code patient..." className={inputClass} />
      <input type="text" name="telephone" value={filters.telephone} onChange={handleChange} placeholder="Téléphone..." className={inputClass} />
      
      <select name="sexe" value={filters.sexe} onChange={handleChange} className={inputClass}>
        <option value="">Sexe</option>
        <option value="Masculin">Masculin</option>
        <option value="Féminin">Féminin</option>
      </select>

      <select name="groupe" value={filters.groupe} onChange={handleChange} className={inputClass}>
        <option value="">Groupe sanguin</option>
        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select name="statut" value={filters.statut} onChange={handleChange} className={inputClass}>
        <option value="">Statut</option>
        <option value="Actif">Actif</option>
        <option value="Inactif">Inactif</option>
        <option value="En attente">En attente</option>
      </select>

      <button onClick={() => setFilters({ nom: "", telephone: "", sexe: "", groupe: "", statut: "" })}
        className="bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition shadow">
         Réinitialiser
      </button>
    </div>
  );
}