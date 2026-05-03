import { useState } from 'react';
import { Phone, Mail, MapPin, Droplet, Weight, Ruler } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

function InformationsPersonnelles({ darkMode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-2xl shadow p-6 flex items-center gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500
          ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>
          P
        </div>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Jean Dupont</h2>
          <p className="text-sm text-gray-400">Patient • ID : #00123</p>
          <span className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">
            Actif
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            Coordonnées
          </h3>
          {[
            { icon: Phone, label: "Téléphone", value: "+237 691 234 567", bg: "bg-blue-50" },
            { icon: Mail, label: "Email", value: "jean.dupont@email.com", bg: "bg-blue-50" },
            { icon: MapPin, label: "Adresse", value: "Douala, Cameroun", bg: "bg-blue-50" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : item.bg}`}>
                  <Icon size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            Informations médicales
          </h3>
          {[
            { icon: Droplet, label: "Groupe sanguin", value: "O+", bg: "bg-red-50", color: "text-red-500" },
            { icon: Weight, label: "Poids", value: "72 kg", bg: "bg-green-50", color: "text-green-500" },
            { icon: Ruler, label: "Taille", value: "175 cm", bg: "bg-purple-50", color: "text-purple-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : item.bg}`}>
                  <Icon size={16} className={item.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className={`text-sm font-bold border-b pb-2 mb-4 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
          Informations personnelles
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Date de naissance", value: "15/06/1990" },
            { label: "Âge", value: "35 ans" },
            { label: "Sexe", value: "Masculin" },
            { label: "Situation familiale", value: "Marié(e)" },
            { label: "Profession", value: "Ingénieur" },
            { label: "Nationalité", value: "Camerounaise" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsMedicaux({ darkMode }) {
  const documents = [
    { id: 1, nom: "Ordonnance générale", type: "PDF", date: "12/03/2026", taille: "245 KB" },
    { id: 2, nom: "Résultat prise de sang", type: "PDF", date: "05/03/2026", taille: "1.2 MB" },
    { id: 3, nom: "Radio pulmonaire", type: "Image", date: "28/02/2026", taille: "3.4 MB" },
    { id: 4, nom: "Compte rendu consultation", type: "PDF", date: "15/02/2026", taille: "180 KB" },
    { id: 5, nom: "Carnet de vaccination", type: "PDF", date: "01/01/2026", taille: "520 KB" },
    { id: 6, nom: "Echo abdominale", type: "Image", date: "20/12/2025", taille: "2.8 MB" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button className="bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600">
          + Ajouter un document
        </button>
      </div>
      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {["NOM DU DOCUMENT", "TYPE", "DATE", "TAILLE", "ACTIONS"].map((h) => (
                <th key={h} className={`text-left px-6 py-3 text-xs font-semibold
                  ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={doc.id} className={
                darkMode
                  ? index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                  : index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold
                      ${doc.type === "PDF" ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}>
                      {doc.type === "PDF" ? "PDF" : "IMG"}
                    </div>
                    <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{doc.nom}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${doc.type === "PDF" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                    {doc.type}
                  </span>
                </td>
                <td className={`px-6 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{doc.date}</td>
                <td className={`px-6 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{doc.taille}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-lg hover:bg-blue-100">Voir</button>
                    <button className={`text-xs px-3 py-1 rounded-lg
                      ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                      Télécharger
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

function Prescriptions({ darkMode }) {
  const medicaments = [
    { id: 1, nom: "Amoxiceline", dosage: "250ml", duree: "2mois", medecin: "Dr. Ngassa Pierre", date: "12/03/2026" },
    { id: 2, nom: "Paracétamol", dosage: "500mg", duree: "1mois", medecin: "Dr. Ngassa Pierre", date: "12/03/2026" },
    { id: 3, nom: "Ibuprofène", dosage: "400mg", duree: "2semaines", medecin: "Dr. Ngassa Pierre", date: "05/03/2026" },
    { id: 4, nom: "Doliprane", dosage: "1g", duree: "10jours", medecin: "Dr. Ngassa Pierre", date: "01/03/2026" },
    { id: 5, nom: "Vitamine C", dosage: "1g", duree: "3mois", medecin: "Dr. Ngassa Pierre", date: "28/02/2026" },
    { id: 6, nom: "Zinc", dosage: "15mg", duree: "2mois", medecin: "Dr. Ngassa Pierre", date: "20/02/2026" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {medicaments.map((med) => (
        <div key={med.id} className={`rounded-2xl shadow p-4 flex flex-col gap-3
          ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400">Médicament</p>
              <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{med.nom}</p>
            </div>
            <span className="text-gray-400">•••</span>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400">Dosage</p>
              <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{med.dosage}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Durée</p>
              <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{med.duree}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            <div>
              <p className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{med.medecin}</p>
              <p className="text-xs text-gray-400">{med.date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className={`flex-1 border text-xs py-1.5 rounded-lg
              ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              Détails
            </button>
            <button className={`flex-1 border text-xs py-1.5 rounded-lg
              ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              Renouveler
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Examens({ darkMode }) {
  const examens = [
    { id: 1, nom: "Prise de sang", type: "Biologie", date: "10/03/2026", statut: "Normal", medecin: "Dr. Ngassa Pierre" },
    { id: 2, nom: "Radio thorax", type: "Radiologie", date: "05/03/2026", statut: "Anormal", medecin: "Dr. Ngassa Pierre" },
    { id: 3, nom: "Echographie abdominale", type: "Imagerie", date: "28/02/2026", statut: "Normal", medecin: "Dr. Ngassa Pierre" },
    { id: 4, nom: "Electrocardiogramme", type: "Cardiologie", date: "20/02/2026", statut: "Normal", medecin: "Dr. Ngassa Pierre" },
    { id: 5, nom: "Glycémie à jeun", type: "Biologie", date: "15/02/2026", statut: "Anormal", medecin: "Dr. Ngassa Pierre" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600">
          + Ajouter un examen
        </button>
      </div>
      {examens.map((examen) => (
        <div key={examen.id} className={`rounded-2xl shadow p-4 flex items-center justify-between
          ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs
              ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-500"}`}>
              {examen.type.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{examen.nom}</p>
              <p className="text-xs text-gray-400">{examen.type} • {examen.medecin}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">{examen.date}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${examen.statut === "Normal" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
              {examen.statut}
            </span>
            <button className={`text-xs px-3 py-1.5 rounded-lg
              ${darkMode ? "bg-gray-700 text-blue-400 hover:bg-gray-600" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}>
              Voir résultat
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DossierPatient({ darkMode }) {
  const { t } = useLanguage();
  const onglets = [t.infoPerso, t.docsMedicaux, t.prescriptions, t.examens];
  const [ongletActif, setOngletActif] = useState(t.infoPerso);

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className="text-lg font-bold text-blue-600 mb-2">{/*t.dossierTitre*/}</h1>
      <button className={`flex items-center gap-1 text-sm font-semibold mb-4
        ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
      </button>

      {/* Onglets */}
      <div className={`flex flex-wrap gap-2 border-b mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        {onglets.map((onglet) => (
          <button
            key={onglet}
            onClick={() => setOngletActif(onglet)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-all
              ${ongletActif === onglet
                ? "bg-blue-500 text-white font-semibold"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {onglet}
          </button>
        ))}
      </div>

      {ongletActif === t.infoPerso && <InformationsPersonnelles darkMode={darkMode} />}
      {ongletActif === t.docsMedicaux && <DocumentsMedicaux darkMode={darkMode} />}
      {ongletActif === t.prescriptions && <Prescriptions darkMode={darkMode} />}
      {ongletActif === t.examens && <Examens darkMode={darkMode} />}
    </div>
  );
}