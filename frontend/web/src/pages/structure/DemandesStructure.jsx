import React, { useState } from 'react';
// Imports limités aux icônes de base pour éviter les erreurs
import { Inbox, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

export default function DemandesStructure({ darkMode }) {
  // Remplaçons le contexte par une variable fixe pour le test
  const langue = 'fr'; 
  const [ongletActif, setOngletActif] = useState('ouvert');

  // Données de test directement dans le fichier
  const demandes = [
    { id: 1, patient: "Amina Bella", type: "Consultation", statut: "En attente", urgence: "Haute" },
    { id: 2, patient: "anne", type: "Analyse Labo", statut: "En attente", urgence: "Normale" },
    { id: 3, patient: "anne marie", type: "Analyse Labo", statut: "En attente", urgence: "Normale" },
    { id: 4, patient: "anne yolande", type: "consultation", statut: "En attente", urgence: "Normale" },
    { id: 5, patient: "annie", type: "Analyse Labo", statut: "En attente", urgence: "Normale" },
    { id: 6, patient: "anneuneu", type: "cardiologie", statut: "En attente", urgence: "Haute" },
    { id: 7, patient: "anestasie", type: "Analyse Labo", statut: "En attente", urgence: "Normale" },

    { id: 8, patient: "Lucie Ngo", type: "Radiologie", statut: "Traitée", urgence: "Basse" },
  ];

  const demandesFiltrees = demandes.filter(d => 
    ongletActif === 'ouvert' ? d.statut === "En attente" : d.statut !== "En attente"
  );

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="text-blue-500" />
          {langue === 'fr' ? "Demandes de rendez-vous" : "Appointment Requests"}
        </h1>
      </div>

      {/* Onglets Simples */}
      <div className="flex gap-6 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setOngletActif('ouvert')}
          className={`pb-3 px-2 text-sm font-semibold transition-all ${ongletActif === 'ouvert' ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          Nouvelles
        </button>
        <button 
          onClick={() => setOngletActif('fermé')}
          className={`pb-3 px-2 text-sm font-semibold transition-all ${ongletActif === 'fermé' ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
        >
          Traitées
        </button>
      </div>

      {/* Liste des demandes */}
      <div className={`rounded-2xl shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        {demandesFiltrees.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {demandesFiltrees.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="font-bold">{d.patient}</p>
                  <p className="text-xs text-gray-500">{d.type}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${d.urgence === 'Haute' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {d.urgence}
                  </span>
                  
                  {ongletActif === 'ouvert' ? (
                    <div className="flex gap-2">
                      <button className="p-2 text-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle size={18} />
                      </button>
                      <button className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <XCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <button className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Eye size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400">
            Aucune demande pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}