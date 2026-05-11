import { Eye, Pencil, Trash2 } from "lucide-react";

export default function PatientsTable({
  patients,
  darkMode,
  onView,
  onEdit,
}) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        darkMode
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={`${darkMode ? "bg-slate-800" : "bg-gray-100"}`}
          >
            <tr>
              <th className="text-left p-4">Patient</th>
              <th className="text-left p-4">Téléphone</th>
              <th className="text-left p-4">Médecin</th>
              <th className="text-left p-4">Groupe</th>
              <th className="text-left p-4">Assurance</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="border-t border-gray-700/20"
              >
                <td className="p-4">
                  <div>
                    <h3 className="font-semibold">{patient.nom}</h3>
                    <p className="text-sm text-gray-400">
                      {patient.sexe} • {patient.age} ans
                    </p>
                  </div>
                </td>

                <td className="p-4">{patient.telephone}</td>
                <td className="p-4">{patient.medecin}</td>
                <td className="p-4">{patient.groupe}</td>
                <td className="p-4">{patient.assurance}</td>

                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-500">
                    {patient.statut}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex gap-3">
                    <button onClick={() => onView(patient)}>
                      <Eye size={18} />
                    </button>

                    <button onClick={() => onEdit(patient)}>
                      <Pencil size={18} />
                    </button>

                    <button>
                      <Trash2 size={18} className="text-red-500" />
                   </button>
                  </div>
                </td>  
                              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 