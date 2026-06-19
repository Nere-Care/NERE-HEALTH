import {
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

export default function PatientsTable({
  patients,
  darkMode,
  onView,
  onEdit,
  onDelete,
}) {
  if (patients.length === 0) {
    return (
      <div
        className={`
          rounded-3xl
          border
          p-10
          text-center
          ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-gray-200"
          }
        `}
      >
        <p className="text-gray-400">
          Aucun patient trouvé avec ces filtres
        </p>
      </div>
    );
  }

  const getStatusStyle = (statut) => {
    const styles = {
      Actif: "bg-green-500/10 text-green-500",
      Inactif: "bg-gray-500/10 text-gray-500",
      "En attente":
        "bg-yellow-500/10 text-yellow-500",
      Suspendu: "bg-red-500/10 text-red-500",
    };

    return (
      styles[statut] ||
      "bg-gray-500/10 text-gray-500"
    );
  };

  return (
    <div
      className={`
        rounded-3xl
        border
        overflow-hidden
        ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-gray-200"
        }
      `}
    >
      {/* MOBILE CARDS */}
      <div className="block xl:hidden p-4 space-y-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`
              rounded-2xl
              border
              p-4
              ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                  {patient.nom?.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold truncate">
                    {patient.nom}
                  </h3>

                  <p className="text-sm text-gray-400">
                    {patient.sexe} • {patient.age} ans
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(
                  patient.statut
                )}`}
              >
                {patient.statut}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">
                  Téléphone
                </p>
                <p>{patient.telephone}</p>
              </div>

              <div>
                <p className="text-gray-400">
                  Médecin
                </p>
                <p>{patient.medecin}</p>
              </div>

              <div>
                <p className="text-gray-400">
                  Groupe
                </p>
                <p>{patient.groupe}</p>
              </div>

              <div>
                <p className="text-gray-400">
                  Assurance
                </p>
                <p>{patient.assurance}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => onView(patient)}
                className="p-2.5 rounded-xl hover:bg-blue-500/10 text-blue-500 transition"
              >
                <Eye size={18} />
              </button>

              <button
                onClick={() => onEdit(patient)}
                className="p-2.5 rounded-xl hover:bg-yellow-500/10 text-yellow-500 transition"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() => onDelete(patient)}
                className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead
            className={`${
              darkMode
                ? "bg-slate-800"
                : "bg-gray-100"
            }`}
          >
            <tr>
              {[
                "Patient",
                "Téléphone",
                "Médecin",
                "Groupe",
                "Assurance",
                "Statut",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="p-4 text-left text-sm font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className={`
                  border-t transition
                  ${
                    darkMode
                      ? "border-slate-800 hover:bg-slate-800/50"
                      : "border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {patient.nom
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {patient.nom}
                      </h3>

                      <p className="text-sm text-gray-400">
                        {patient.sexe} •{" "}
                        {patient.age} ans
                      </p>
                    </div>
                  </div>
                </td>

                <td className="p-4 text-sm whitespace-nowrap">
                  {patient.telephone}
                </td>

                <td className="p-4 text-sm whitespace-nowrap">
                  {patient.medecin}
                </td>

                <td className="p-4">
                  <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium">
                    {patient.groupe}
                  </span>
                </td>

                <td className="p-4 text-sm whitespace-nowrap">
                  {patient.assurance}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(
                      patient.statut
                    )}`}
                  >
                    {patient.statut}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(patient)}
                      className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-500 transition"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => onEdit(patient)}
                      className="p-2 rounded-xl hover:bg-yellow-500/10 text-yellow-500 transition"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => onDelete(patient)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`
          px-4 py-3
          border-t
          text-sm
          text-gray-400
          ${
            darkMode
              ? "border-slate-800"
              : "border-gray-200"
          }
        `}
      >
        {patients.length} patient
        {patients.length > 1 ? "s" : ""} affiché
        {patients.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}