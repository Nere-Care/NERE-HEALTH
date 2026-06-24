import { useState } from 'react';
import { Phone, Mail, MapPin, Droplet, Weight, Ruler } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

/* ===================== INFORMATIONS PERSONNELLES ===================== */
function InformationsPersonnelles({ darkMode }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6">

      <div className={`rounded-2xl shadow p-6 flex items-center gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500
          ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>
          P
        </div>

        <div>
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            {t.nomPatient}
          </h2>
          <p className="text-sm text-gray-400">
            {t.patientId}
          </p>

          <span className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">
            {t.actif}
          </span>
        </div>
      </div>

      {/* CONTACT + MEDICAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CONTACT */}
        <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            {t.coordonnees}
          </h3>

          {[
            { icon: Phone, label: t.telephone, value: "+237 691 234 567", bg: "bg-blue-50" },
            { icon: Mail, label: "Email", value: "jean.dupont@email.com", bg: "bg-blue-50" },
            { icon: MapPin, label: t.adresse, value: "Douala, Cameroun", bg: "bg-blue-50" },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : item.bg}`}>
                  <Icon size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* MEDICAL */}
        <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            {t.infosMedicales}
          </h3>

          {[
            { icon: Droplet, label: t.groupeSanguin, value: "O+", bg: "bg-red-50", color: "text-red-500" },
            { icon: Weight, label: t.poids, value: "72 kg", bg: "bg-green-50", color: "text-green-500" },
            { icon: Ruler, label: t.taille, value: "175 cm", bg: "bg-purple-50", color: "text-purple-500" },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : item.bg}`}>
                  <Icon size={16} className={item.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INFOS PERSONNELLES */}
      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className={`text-sm font-bold border-b pb-2 mb-4 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
          {t.infosPersonnelles}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: t.naissance, value: "15/06/1990" },
            { label: t.age, value: "35 ans" },
            { label: t.sexe, value: "Masculin" },
            { label: t.famille, value: "Marié(e)" },
            { label: t.profession, value: "Ingénieur" },
            { label: t.nationalite, value: "Camerounaise" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ===================== DOCUMENTS ===================== */
function DocumentsMedicaux({ darkMode }) {
  const { t } = useLanguage();

  const documents = [
    { id: 1, nom: "Ordonnance générale", type: "PDF", date: "12/03/2026", taille: "245 KB" },
    { id: 2, nom: "Résultat prise de sang", type: "PDF", date: "05/03/2026", taille: "1.2 MB" },
    { id: 3, nom: "Radio pulmonaire", type: "Image", date: "28/02/2026", taille: "3.4 MB" },
  ];

  return (
    <div className="flex flex-col gap-4">

      <div className="flex justify-end">
        <button className="bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600">
          {t.ajouterDocument}
        </button>
      </div>

      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {[t.nomDoc, t.type, t.date, t.taille, t.actions].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4">{doc.nom}</td>
                <td className="px-6 py-4">{doc.type}</td>
                <td className="px-6 py-4">{doc.date}</td>
                <td className="px-6 py-4">{doc.taille}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-500 text-xs">{t.voir}</button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}

/* ===================== MAIN ===================== */
export default function DossierPatient({ darkMode }) {
  const { t } = useLanguage();

  const onglets = [
    t.infoPerso,
    t.docsMedicaux,
    t.prescriptions,
    t.examens
  ];

  const [ongletActif, setOngletActif] = useState(onglets[0]);

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-4">
        {t.dossierTitre}
      </h1>

      {/* TABS */}
      <div className="flex gap-2 border-b mb-6">
        {onglets.map((onglet) => (
          <button
            key={onglet}
            onClick={() => setOngletActif(onglet)}
            className={`px-4 py-2 text-sm ${
              ongletActif === onglet
                ? "bg-blue-500 text-white"
                : "text-gray-500"
            } rounded-t-lg`}
          >
            {onglet}
          </button>
        ))}
      </div>

      {ongletActif === t.infoPerso && <InformationsPersonnelles darkMode={darkMode} />}
      {ongletActif === t.docsMedicaux && <DocumentsMedicaux darkMode={darkMode} />}

    </div>
  );
}