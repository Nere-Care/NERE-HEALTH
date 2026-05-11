import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Droplet,
  Weight,
  Ruler,
  FileText,
  Eye,
  Download,
} from "lucide-react";

/* ===================== INFOS PERSONNELLES ===================== */
function InformationsPersonnelles({ darkMode }) {
  return (
    <div className="space-y-6">

      {/* HEADER CARD */}
      <div className={`rounded-2xl p-6 flex items-center gap-5 shadow-sm border transition
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
          P
        </div>

        <div className="flex-1">
          <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
            Jean Dupont
          </h2>

          <p className="text-xs text-gray-400">
            Patient ID: PT-2026-001
          </p>

          <span className="inline-flex mt-2 text-[11px] px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">
            Actif
          </span>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CONTACT */}
        <div className={`rounded-2xl p-5 border shadow-sm space-y-4
          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>

          <h3 className="text-xs font-semibold text-gray-400 uppercase">
            Contact
          </h3>

          <div className="space-y-4">

            <div className="flex items-center gap-3">
              <Phone size={16} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Téléphone</p>
                <p className="text-sm font-medium">+237 691 234 567</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={16} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium">jean@email.com</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Adresse</p>
                <p className="text-sm font-medium">Douala, Cameroun</p>
              </div>
            </div>

          </div>
        </div>

        {/* MEDICAL */}
        <div className={`rounded-2xl p-5 border shadow-sm space-y-4
          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>

          <h3 className="text-xs font-semibold text-gray-400 uppercase">
            Informations médicales
          </h3>

          <div className="space-y-4">

            <div className="flex items-center gap-3">
              <Droplet size={16} className="text-red-500" />
              <div>
                <p className="text-xs text-gray-400">Groupe sanguin</p>
                <p className="text-sm font-medium">O+</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Weight size={16} className="text-green-500" />
              <div>
                <p className="text-xs text-gray-400">Poids</p>
                <p className="text-sm font-medium">72 kg</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Ruler size={16} className="text-purple-500" />
              <div>
                <p className="text-xs text-gray-400">Taille</p>
                <p className="text-sm font-medium">175 cm</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== DOCUMENTS ===================== */
function DocumentsMedicaux({ darkMode }) {
  const docs = [
    { name: "Ordonnance générale", date: "12/03/2026", type: "PDF" },
    { name: "Analyse sanguine", date: "05/03/2026", type: "PDF" },
    { name: "Radio pulmonaire", date: "28/02/2026", type: "Image" },
  ];

  return (
    <div className="space-y-4">

      <div className="flex justify-end">
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
          Ajouter un document
        </button>
      </div>

      <div className="grid gap-3">

        {docs.map((doc, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm transition
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
          >

            <div className="flex items-center gap-3">
              <FileText className="text-blue-500" size={18} />

              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.date} • {doc.type}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500">
                <Eye size={16} />
              </button>
              <button className="p-2 rounded-lg hover:bg-green-500/10 text-green-500">
                <Download size={16} />
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

/* ===================== MAIN ===================== */
export default function DossierPatient({ darkMode }) {
  const tabs = ["Infos", "Documents", "Prescriptions", "Examens"];
  const [active, setActive] = useState("Infos");

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-xl font-semibold mb-6">
        Dossier Patient
      </h1>

      {/* TABS MODERNES */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-2 text-sm rounded-xl transition
              ${active === t
                ? "bg-blue-600 text-white"
                : darkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-white shadow-sm"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {active === "Infos" && <InformationsPersonnelles darkMode={darkMode} />}
      {active === "Documents" && <DocumentsMedicaux darkMode={darkMode} />}

    </div>
  );
}