import { useState } from 'react';
import { Phone, Mail, MapPin, Droplet, Weight, Ruler, Plus, Search, Download, Eye, Upload } from 'lucide-react';


const ongletsFr = ["Informations personnelles", "Documents Médicaux", "Antécédents", "Habitudes de vie", "Vaccins", "Examens", "Suivi gynécologique"];
const ongletsEn = ["Personal Information", "Medical Documents", "Medical History", "Lifestyle", "Vaccines", "Examinations", "Gynecological Follow-up"];

function InformationsPersonnelles({ darkMode }) {
  const [rempli] = useState(true);

  if (!rempli) return (
    <div className={`rounded-2xl shadow p-8 text-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus size={28} className="text-blue-500" />
      </div>
      <h3 className={`font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
      Complétez votre profil
      </h3>
      <p className="text-sm text-gray-400 mb-4">
      "Ajoutez vos informations personnelles pour un meilleur suivi
      </p>
      <button className="bg-blue-500 text-white px-6 py-2 rounded-xl text-sm hover:bg-blue-600">
        Ajouter mes informations
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Carte profil */}
      <div className={`rounded-2xl shadow p-6 flex items-center gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500
          ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>P</div>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Jean Dupont</h2>
          <p className="text-sm text-gray-400">Patient • ID : #00123</p>
          <span className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">
            Actif
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coordonnées */}
        <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            Coordonnées
          </h3>
          {[
            { icon: Phone, label: "Téléphone", value: "+237 691 234 567", bg: "bg-blue-50", color: "text-blue-500" },
            { icon: Mail, label: "Email", value: "jean.dupont@email.com", bg: "bg-blue-50", color: "text-blue-500" },
            { icon: MapPin, label: "Adresse", value: "Douala, Cameroun", bg: "bg-blue-50", color: "text-blue-500" },
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

        {/* Infos médicales */}
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

      {/* Infos personnelles */}
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

      {/* Allergies */}
      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            Allergies
          </h3>
          <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Plus size={12} /> Ajouter
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Pénicilline", "Aspirine", "Arachides"].map((a) => (
            <span key={a} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">{a}</span>
          ))}
        </div>
      </div>

      {/* Mes proches */}
      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            Mes proches
          </h3>
          <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Plus size={12} />Ajouter un proche
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { nom: "Marie Dupont", lien:  "Épouse", tel: "+237 699 111 222" },
            { nom: "Paul Dupont", lien: "Fils", tel: "+237 677 333 444" },
          ].map((p, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl
              ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {p.nom.charAt(0)}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{p.nom}</p>
                  <p className="text-xs text-gray-400">{p.lien} • {p.tel}</p>
                </div>
              </div>
              <button className="text-xs text-blue-500 hover:underline">
                RDV
              </button>
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
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 flex-1
          ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Rechercher un document..." 
            className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
          />
        </div>
        <button className="flex items-center gap-2 bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600">
          <Upload size={16} />
          Ajouter
        </button>
      </div>

      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {[
                "Document",
                "Type",
                "Date",
                "Taille",
                "Actions"
              ].map((h) => (
                <th key={h} className={`text-left px-5 py-3 text-xs font-semibold
                  ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={doc.id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold
                      ${doc.type === "PDF" ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}>
                      {doc.type === "PDF" ? "PDF" : "IMG"}
                    </div>
                    <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{doc.nom}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${doc.type === "PDF" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                    {doc.type}
                  </span>
                </td>
                <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{doc.date}</td>
                <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{doc.taille}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button className={`p-1.5 rounded-lg ${darkMode ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      <Eye size={14} />
                    </button>
                    <button className={`p-1.5 rounded-lg ${darkMode ? "bg-blue-900 text-blue-400 hover:bg-blue-800" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}>
                      <Download size={14} />
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

function Antecedents({ darkMode }) {
  const sections = [
    {
      titre:  "Antécédents médicaux" ,
      items: ["Hypertension artérielle (2018)", "Diabète type 2 (2020)", "Asthme (depuis l'enfance)"]
    },
    {
      titre:  "Antécédents familiaux" ,
      items: ["Père : Diabète, Hypertension", "Mère : Cancer du sein", "Frère : Asthme"]
    },
    {
      titre:  "Opérations chirurgicales" ,
      items: ["Appendicectomie (2015)", "Extraction dent de sagesse (2019)"]
    },
    {
      titre:  "Traitements réguliers" ,
      items: ["Metformine 500mg - 2x/jour", "Amlodipine 5mg - 1x/jour"]
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section) => (
        <div key={section.titre} className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{section.titre}</h3>
            <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {section.items.map((item, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg
                ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HabitudesDeVie({ darkMode }) {
  const habitudes = [
    { label: "Tabac", valeur: "Non fumeur", couleur: "text-green-500" },
    { label: "Alcool", valeur: "Occasionnel", couleur: "text-orange-500" },
    { label: "Chicha", valeur: "Non", couleur: "text-green-500" },
    { label: "Activité physique", valeur: "3x/semaine", couleur: "text-blue-500" },
    { label: "Profession", valeur: "Ingénieur", couleur: "text-gray-500" },
    { label: "Alimentation", valeur: "Équilibrée", couleur: "text-green-500" },
  ];

  return (
    <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
          Habitudes de vie
        </h3>
        <button className="text-xs text-blue-500 hover:underline">
          Modifier
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {habitudes.map((h) => (
          <div key={h.label} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <p className="text-xs text-gray-400 mb-1">{h.label}</p>
            <p className={`text-sm font-bold ${h.couleur}`}>{h.valeur}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Vaccins({ darkMode }) {
  const vaccins = [
    { nom: "COVID-19", date: "15/01/2022", prochain: "N/A", statut: "Complet" },
    { nom: "Hépatite B", date: "10/03/2020", prochain: "10/03/2025", statut: "À renouveler" },
    { nom: "Fièvre jaune", date: "05/06/2019", prochain: "05/06/2029", statut: "Valide" },
    { nom: "Tétanos", date: "20/09/2018", prochain: "20/09/2028", statut: "Valide" },
  ];

  return (
    <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className={`flex items-center justify-between px-5 py-4 border-b
        ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
        <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Carnet de vaccination
        </h3>
        <button className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
          <Plus size={12} /> Ajouter
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
          <tr>
            {[
               "Vaccin",
              "Date",
              "Prochain rappel",
              "Statut"
            ].map((h) => (
              <th key={h} className={`text-left px-5 py-3 text-xs font-semibold
                ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vaccins.map((v, index) => (
            <tr key={index} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
              <td className={`px-5 py-3 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{v.nom}</td>
              <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{v.date}</td>
              <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{v.prochain}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${v.statut === "Valide" || v.statut === "Complet" ? "bg-green-100 text-green-600"
                    : "bg-orange-100 text-orange-500"}`}>
                  {v.statut}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Examens({ darkMode }) {
  const examens = [
    { nom: "Prise de sang", type: "Biologie", date: "10/03/2026", statut: "Normal", medecin: "Dr. Ngassa Pierre" },
    { nom: "Radio thorax", type: "Radiologie", date: "05/03/2026", statut: "Anormal", medecin: "Dr. Ngassa Pierre" },
    { nom: "Echographie abdominale", type: "Imagerie", date: "28/02/2026", statut: "Normal", medecin: "Dr. Ngassa Pierre" },
    { nom: "Electrocardiogramme", type: "Cardiologie", date: "20/02/2026", statut: "Normal", medecin: "Dr. Ngassa Pierre" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="flex items-center gap-1 bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600">
          <Plus size={14} /> Ajouter un examen
        </button>
      </div>

      {examens.map((examen, index) => (
        <div
          key={index}
          className={`rounded-2xl shadow p-4 flex items-center justify-between
            ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs
                ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-500"}`}
            >
              {examen.type.slice(0, 3).toUpperCase()}
            </div>

            <div>
              <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {examen.nom}
              </p>
              <p className="text-xs text-gray-400">
                {examen.type} • {examen.medecin}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">{examen.date}</p>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold
                ${
                  examen.statut === "Normal"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-500"
                }`}
            >
              {examen.statut === "Normal" ? "Normal" : "Anormal"}
            </span>

            <button
              className={`text-xs px-3 py-1.5 rounded-lg
                ${
                  darkMode
                    ? "bg-gray-700 text-blue-400 hover:bg-gray-600"
                    : "bg-blue-50 text-blue-500 hover:bg-blue-100"
                }`}
            >
              Voir résultats
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SuiviGynecologique({ darkMode }) {
  const sections = [
    {
      titre: "Contraception" ,
      valeur:  "Pilule contraceptive - Depuis 2020" 
    },
    {
      titre: "Grossesses" ,
      valeur: "2 grossesses - 2 accouchements"
    },
    {
      titre: "Dernière mammographie",
      valeur: "15/01/2025"
    },
    {
      titre: "Dernier frottis",
      valeur: "20/06/2024"
    },
    {
      titre: "Ménopause",
      valeur: "Non concernée"
    },
  ];

  return (
    <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Suivi gynécologique
        </h3>
        <button className="text-xs text-blue-500 hover:underline">
          Modifier
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {sections.map((s) => (
          <div key={s.titre} className={`flex items-center justify-between p-3 rounded-xl
            ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.titre}</p>
            <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{s.valeur}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DossierPatient({ darkMode }) {
  const onglets = [
    "Informations personnelles",
    "Documents médicaux",
    "Antécédents",
    "Habitudes de vie",
    "Vaccins",
    "Examens",
    "Suivi gynécologique"
  ];

  const [ongletActif, setOngletActif] = useState(onglets[0]);
  const [recherche, setRecherche] = useState("");

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Titre + recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            Ma Santé
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Gérez votre dossier médical complet
          </p>
        </div>

        <div className={`flex items-center gap-2 border rounded-xl px-4 py-2
          ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Rechercher..."
            className={`outline-none text-sm w-40 ${
              darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""
            }`}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Onglets */}
      <div className={`flex gap-1 flex-wrap border-b mb-6 ${
        darkMode ? "border-gray-700" : "border-gray-200"
      }`}>
        {onglets.map((onglet) => (
          <button
            key={onglet}
            onClick={() => setOngletActif(onglet)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-all whitespace-nowrap
              ${
                ongletActif === onglet
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

      {/* Contenu */}
      {ongletActif === onglets[0] && <InformationsPersonnelles darkMode={darkMode} />}
      {ongletActif === onglets[1] && <DocumentsMedicaux darkMode={darkMode} />}
      {ongletActif === onglets[2] && <Antecedents darkMode={darkMode} />}
      {ongletActif === onglets[3] && <HabitudesDeVie darkMode={darkMode} />}
      {ongletActif === onglets[4] && <Vaccins darkMode={darkMode} />}
      {ongletActif === onglets[5] && <Examens darkMode={darkMode} />}
      {ongletActif === onglets[6] && <SuiviGynecologique darkMode={darkMode} />}

    </div>
  );
}