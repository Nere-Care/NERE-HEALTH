import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Mail, 
  Phone, MoreVertical, Trash2, Edit 
} from 'lucide-react';

const personnelInitial = [
  { id: 1, nom: "Dr. Jean Dupont", role: "Médecin Généraliste", email: "jean.dupont@email.com", tel: "+237 600 00 00 01", statut: "Actif" },
  { id: 2, nom: "Mme. Sarah Lobe", role: "Infirmière Chef", email: "sarah.lobe@email.com", tel: "+237 600 00 00 02", statut: "Actif" },
  { id: 3, nom: "Dr. Marc Owona", role: "Chirurgien", email: "marc.owona@email.com", tel: "+237 600 00 00 03", statut: "En congé" },
];

export default function PersonnelStructure({ darkMode }) {
  const [personnel, setPersonnel] = useState(personnelInitial);
  const [recherche, setRecherche] = useState("");

  // UTILISATION DE SETPERSONNEL : Fonction pour supprimer un membre
  const supprimerMembre = (id) => {
    if (window.confirm("Voulez-vous vraiment retirer ce membre du personnel ?")) {
      const nouvelleListe = personnel.filter(membre => membre.id !== id);
      setPersonnel(nouvelleListe); // <--- L'erreur disparaît ici car on l'utilise
    }
  };

  const membresFiltrés = personnel.filter(p => 
    p.nom.toLowerCase().includes(recherche.toLowerCase()) || 
    p.role.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-blue-500" />
            Gestion du Personnel
          </h1>
          <p className="text-sm text-gray-500">Gérez les membres de votre équipe médicale.</p>
        </div>
        
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md">
          <UserPlus size={18} />
          <span>Ajouter</span>
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Rechercher..."
          className={`w-full pl-10 p-2.5 rounded-xl border ${
            darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 shadow-sm"
          }`}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {membresFiltrés.map((membre) => (
          <div 
            key={membre.id} 
            className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"
            }`}
          >

            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                {membre.nom.charAt(0)}
              </div>
              <button className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                <MoreVertical size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-lg">{membre.nom}</h3>
              <p className="text-blue-500 text-sm font-medium">{membre.role}</p>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 italic">
                <Mail size={14} /> {membre.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> {membre.tel}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                membre.statut === "Actif" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              }`}>
                {membre.statut}
              </span>
              <div className="flex gap-1">
                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <Edit size={16} />
                </button>
                {/* Appel de la fonction de suppression au clic */}
                <button 
                  onClick={() => supprimerMembre(membre.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {membresFiltrés.length === 0 && (
        <div className="text-center py-20 opacity-40 italic">
          Aucun résultat pour cette recherche.
        </div>
      )}
    </div>
  );
}