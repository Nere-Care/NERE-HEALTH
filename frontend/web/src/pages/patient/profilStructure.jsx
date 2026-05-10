import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Star, ShieldCheck, Info } from 'lucide-react';

// 1. On centralise les données (Idéalement, déportez ceci dans un fichier data.js)
const allData = [
  { id: 1, nom: "Hôpital Général de Yaoundé", ville: "Yaoundé", bp: "B.P: 5408", tel: "+237 658 648 394", horaire: "24h/24", statut: "Ouvert", note: 4.5, type: "Hôpital", description: "Hôpital de référence nationale spécialisé dans les soins de haute technologie." },
  { id: 2, nom: "Hôpital Central de Yaoundé", ville: "Yaoundé", bp: "B.P: 1234", tel: "+237 658 648 395", horaire: "24h/24", statut: "Ouvert", note: 4.2, type: "Hôpital", description: "L'un des plus anciens et grands hôpitaux du Cameroun." },
  { id: 3, nom: "Hôpital Jamot", ville: "Yaoundé", bp: "B.P: 4021", tel: "+237 658 648 396", horaire: "24h/24", statut: "Ouvert", note: 3.8, type: "Hôpital", description: "Spécialisé dans les pathologies respiratoires et psychiatriques." },
  { id: 4, nom: "Hôpital Laquintinie", ville: "Douala", bp: "B.P: 0000", tel: "+237 658 648 397", horaire: "24h/24", statut: "Ouvert", note: 4.0, type: "Hôpital", description: "Centre hospitalier historique de la ville de Douala." },
  { id: 5, nom: "Clinique du Wouri", ville: "Douala", bp: "B.P: 2021", tel: "+237 691 234 567", horaire: "07h - 22h", statut: "Ouvert", note: 4.7, type: "Clinique", description: "Établissement privé offrant des soins personnalisés de qualité." },
  { id: 6, nom: "Clinique Bastos", ville: "Yaoundé", bp: "B.P: 3045", tel: "+237 691 234 568", horaire: "08h - 20h", statut: "Ouvert", note: 4.6, type: "Clinique", description: "Située au quartier Bastos, spécialisée en soins VIP." },
  { id: 9, nom: "Pharmacie du Marché Central", ville: "Yaoundé", bp: "B.P: 1001", tel: "+237 677 123 456", horaire: "08h - 22h", statut: "Ouvert", note: 4.8, type: "Pharmacie", description: "Vaste choix de produits pharmaceutiques et parapharmaceutiques." },
  { id: 10, nom: "Pharmacie Française", ville: "Douala", bp: "B.P: 2002", tel: "+237 677 123 457", horaire: "07h - 23h", statut: "Ouvert", note: 4.5, type: "Pharmacie", description: "Service rapide et médicaments de qualité en plein centre de Douala." }
];

export default function ProfilStructure({ darkMode }) {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const navigate = useNavigate();

  // 2. Recherche dynamique de la structure correspondante
  // Number(id) est crucial car l'ID dans l'URL est un texte "1", on le veut en nombre 1.
  const structure = allData.find(s => s.id === Number(id));

  // 3. Gestion de l'erreur si la structure n'existe pas
  if (!structure) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
        <Info size={48} className="text-gray-400 mb-4" />
        <p className="text-center font-bold">Structure introuvable</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-semibold">
          Retourner à la liste
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      
      {/* Banner avec bouton retour */}
      <div className="relative h-44 bg-gradient-to-br from-blue-700 to-blue-400">
        <button 
          onClick={() => navigate(-1)} // La flèche retour
          className="absolute top-8 left-4 p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-all border border-white/30"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* Carte de Profil */}
      <div className="px-4 -mt-12 pb-10">
        <div className={`rounded-[32px] shadow-2xl p-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
          
          {/* Badge Statut & Type */}
          <div className="flex justify-between items-center mb-4">
            <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-lg ${darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              {structure.type}
            </span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${structure.statut === "Ouvert" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
              {structure.statut}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight">{structure.nom}</h1>
          
          <div className="flex items-center gap-1.5 mt-2 mb-6">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm">{structure.note} / 5</span>
            <span className="text-gray-400 text-xs ml-1">(120+ avis)</span>
          </div>

          <p className={`text-sm leading-relaxed mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {structure.description}
          </p>

          {/* Liste des contacts */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Localisation</p>
                <p className="text-sm font-medium">{structure.ville}, {structure.bp}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Téléphone</p>
                <p className="text-sm font-medium">{structure.tel}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Horaires</p>
                <p className="text-sm font-medium">{structure.horaire}</p>
              </div>
            </div>
          </div>

          {/* Bouton d'appel final */}
          <button className="w-full mt-10 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
            <Phone size={18} />
            Contacter maintenant
          </button>

        </div>
      </div>
    </div>
  );
}