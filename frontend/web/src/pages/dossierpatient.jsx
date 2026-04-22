import { useState } from 'react';
import { Phone, Mail, MapPin, Droplet, Weight, Ruler } from 'lucide-react';

const onglets = ["Informations personnelles", "Documents Medicaux", "Prescriptions", "Examens"];

function InformationsPersonnelles() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-500">
          P
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Jean Dupont</h2>
          <p className="text-sm text-gray-400">Patient • ID : #00123</p>
          <span className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">
            Actif
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Coordonnées</h3>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><Phone size={16} className="text-blue-500" /></div>
            <div>
              <p className="text-xs text-gray-400">Téléphone</p>
              <p className="text-sm font-semibold text-gray-700">+237 691 234 567</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><Mail size={16} className="text-blue-500" /></div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-semibold text-gray-700">jean.dupont@email.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><MapPin size={16} className="text-blue-500" /></div>
            <div>
              <p className="text-xs text-gray-400">Adresse</p>
              <p className="text-sm font-semibold text-gray-700">Douala, Cameroun</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Informations médicales</h3>
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg"><Droplet size={16} className="text-red-500" /></div>
            <div>
              <p className="text-xs text-gray-400">Groupe sanguin</p>
              <p className="text-sm font-semibold text-gray-700">O+</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg"><Weight size={16} className="text-green-500" /></div>
            <div>
              <p className="text-xs text-gray-400">Poids</p>
              <p className="text-sm font-semibold text-gray-700">72 kg</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg"><Ruler size={16} className="text-purple-500" /></div>
            <div>
              <p className="text-xs text-gray-400">Taille</p>
              <p className="text-sm font-semibold text-gray-700">175 cm</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mb-4">Informations personnelles</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400">Date de naissance</p>
            <p className="text-sm font-semibold text-gray-700">15/06/1990</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Âge</p>
            <p className="text-sm font-semibold text-gray-700">35 ans</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Sexe</p>
            <p className="text-sm font-semibold text-gray-700">Masculin</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Situation familiale</p>
            <p className="text-sm font-semibold text-gray-700">Marié(e)</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Profession</p>
            <p className="text-sm font-semibold text-gray-700">Ingénieur</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Nationalité</p>
            <p className="text-sm font-semibold text-gray-700">Camerounaise</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsMedicaux() {
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
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-semibold">NOM DU DOCUMENT</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-semibold">TYPE</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-semibold">DATE</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-semibold">TAILLE</th>
              <th className="text-left px-6 py-3 text-xs text-gray-500 font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={doc.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${doc.type === "PDF" ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}>
                      {doc.type === "PDF" ? "PDF" : "IMG"}
                    </div>
                    <span className="font-medium text-gray-700">{doc.nom}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${doc.type === "PDF" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{doc.date}</td>
                <td className="px-6 py-4 text-gray-500">{doc.taille}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-lg hover:bg-blue-100">Voir</button>
                    <button className="text-xs bg-gray-50 text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100">Télécharger</button>
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

function Prescriptions() {
  const medicaments = [
    { id: 1, nom: "Amoxiceline", dosage: "250ml", duree: "2mois", medecin: "Dr. Ngassa Pierre", date: "12/03/2026" },
    { id: 2, nom: "Paracétamol", dosage: "500mg", duree: "1mois", medecin: "Dr. Ngassa Pierre", date: "12/03/2026" },
    { id: 3, nom: "Ibuprofène", dosage: "400mg", duree: "2semaines", medecin: "Dr. Ngassa Pierre", date: "05/03/2026" },
    { id: 4, nom: "Doliprane", dosage: "1g", duree: "10jours", medecin: "Dr. Ngassa Pierre", date: "01/03/2026" },
    { id: 5, nom: "Vitamine C", dosage: "1g", duree: "3mois", medecin: "Dr. Ngassa Pierre", date: "28/02/2026" },
    { id: 6, nom: "Zinc", dosage: "15mg", duree: "2mois", medecin: "Dr. Ngassa Pierre", date: "20/02/2026" },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {medicaments.map((med) => (
        <div key={med.id} className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400">Médicament</p>
              <p className="text-lg font-bold text-gray-800">{med.nom}</p>
            </div>
            <span className="text-gray-300">•••</span>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400">Dosage</p>
              <p className="text-sm font-semibold text-gray-700">{med.dosage}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Durée</p>
              <p className="text-sm font-semibold text-gray-700">{med.duree}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div>
              <p className="text-xs text-gray-600 font-medium">{med.medecin}</p>
              <p className="text-xs text-gray-400">{med.date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50">Détails</button>
            <button className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50">Renouveler</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Examens() {
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
        <div key={examen.id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">
              {examen.type.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{examen.nom}</p>
              <p className="text-xs text-gray-400">{examen.type} • {examen.medecin}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-sm text-gray-400">{examen.date}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold
              ${examen.statut === "Normal" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
              {examen.statut}
            </span>
            <button className="text-xs bg-blue-50 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-100">
              Voir résultat
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DossierPatient() {
  const [ongletActif, setOngletActif] = useState("Informations personnelles");

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-blue-600 mb-2"></h1>
      <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-4">
      </button>
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {onglets.map((onglet) => (
          <button
            key={onglet}
            onClick={() => setOngletActif(onglet)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-all
              ${ongletActif === onglet
                ? "bg-blue-500 text-white font-semibold"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {onglet}
          </button>
        ))}
      </div>
      {ongletActif === "Informations personnelles" && <InformationsPersonnelles />}
      {ongletActif === "Documents Medicaux" && <DocumentsMedicaux />}
      {ongletActif === "Prescriptions" && <Prescriptions />}
      {ongletActif === "Examens" && <Examens />}
    </div>
  );
}