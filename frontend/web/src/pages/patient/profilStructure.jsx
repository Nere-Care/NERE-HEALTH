import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Star, Share2, Heart, Navigation, Users, Shield, Calendar, MessageCircle, Stethoscope, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const allData = [
  { id: 1, nom: "Hôpital Général de Yaoundé", ville: "Yaoundé", quartier: "Ahala", bp: "B.P: 5408", tel: "+237 658 648 394", email: "contact@hgy.cm", horaire: "24h/24", statut: "Ouvert", note: 4.5, type: "Hôpital", description: "Hôpital de référence nationale spécialisé dans les soins de haute technologie. Équipé des dernières innovations médicales, notre établissement offre une prise en charge complète avec plus de 45 médecins spécialistes.", services: ["Urgences 24/7", "Chirurgie générale", "Maternité", "Pédiatrie", "Cardiologie", "Imagerie médicale", "Laboratoire d'analyses"], medecins: 45, lits: 250, assurance: ["CNPS", "Chanas Assurances", "Activa"], langues: ["Français", "Anglais"], equipements: ["Scanner", "IRM", "Bloc opératoire", "USI"], avis: [{ nom: "Marie K.", note: 5, texte: "Excellent accueil et professionnels compétents", date: "Il y a 2 jours" }, { nom: "Paul M.", note: 4, texte: "Bonne prise en charge mais temps d'attente un peu long", date: "Il y a 1 semaine" }] },
  { id: 2, nom: "Hôpital Central de Yaoundé", ville: "Yaoundé", quartier: "Centre", bp: "B.P: 1234", tel: "+237 658 648 395", email: "contact@hcy.cm", horaire: "24h/24", statut: "Ouvert", note: 4.2, type: "Hôpital", description: "L'un des plus anciens et grands hôpitaux du Cameroun, offrant des soins de qualité depuis plus de 50 ans.", services: ["Urgences", "Cardiologie", "Neurologie", "Orthopédie"], medecins: 38, lits: 180, assurance: ["CNPS"], langues: ["Français"], equipements: ["Scanner", "Laboratoire"], avis: [] },
  { id: 5, nom: "Clinique du Wouri", ville: "Douala", quartier: "Akwa", bp: "B.P: 2021", tel: "+237 691 234 567", email: "contact@cliniquewouri.cm", horaire: "07h - 22h", statut: "Ouvert", note: 4.7, type: "Clinique", description: "Établissement privé offrant des soins personnalisés de qualité dans un cadre moderne et accueillant.", services: ["Consultations spécialisées", "Analyses médicales", "Imagerie", "Chirurgie ambulatoire"], medecins: 15, lits: 30, assurance: ["CNPS", "Activa", "Chanas"], langues: ["Français", "Anglais"], equipements: ["Échographie", "Laboratoire"], avis: [] },
  { id: 9, nom: "Pharmacie du Marché Central", ville: "Yaoundé", quartier: "Centre", bp: "B.P: 1001", tel: "+237 677 123 456", email: "pharmacie.mc@gmail.com", horaire: "08h - 22h", statut: "Ouvert", note: 4.8, type: "Pharmacie", description: "Vaste choix de produits pharmaceutiques et parapharmaceutiques avec conseil personnalisé.", services: ["Médicaments sur ordonnance", "Parapharmacie", "Conseils pharmaceutiques", "Livraison à domicile"], medecins: 3, assurance: [], langues: ["Français"], equipements: [], avis: [] },
  { id: 13, nom: "Laboratoire du Marché Central", ville: "Yaoundé", quartier: "Centre", bp: "B.P: 1001", tel: "+237 677 123 456", email: "labo.mc@gmail.com", horaire: "08h - 22h", statut: "Ouvert", note: 4.8, type: "Laboratoire", description: "Analyses médicales fiables et rapides avec résultats disponibles en ligne.", services: ["Analyses sanguines", "Biologie médicale", "Sérologie", "Bactériologie"], medecins: 5, assurance: ["CNPS"], langues: ["Français"], equipements: ["Automates d'analyses", "Microscopes"], avis: [] },
];

export default function ProfilStructure({ darkMode, userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [favori, setFavori] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("infos");

  const structure = allData.find(s => s.id === Number(id));

  if (!structure) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
        <p className="text-center font-bold text-lg">Structure introuvable</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-semibold">
          Retourner à la liste
        </button>
      </div>
    );
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: "infos", label: "Informations" },
    { id: "services", label: "Services" },
    { id: "avis", label: `Avis (${structure.avis?.length || 0})` },
  ];

  return (
    <div className={`px-4 pt-2 pb-6 min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      
      {/* Bouton retour + Actions */}
      <div className="flex items-center justify-between mb-3">
        <button 
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-medium
            ${darkMode ? "text-blue-400 hover:text-white" : "text-blue-600 hover:text-blue-800"}`}
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavori(!favori)}
            className={`p-2 rounded-full transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Heart size={20} className={favori ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
          <button
            onClick={() => {/* Partager */}}
            className={`p-2 rounded-full transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Share2 size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-blue-700 to-blue-400 rounded-t-3xl"></div>

      {/* Carte de Profil */}
      <div className="px-2 sm:px-4 -mt-12 pb-10">
        <div className={`rounded-3xl shadow-2xl p-5 sm:p-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
          
          {/* Badge Statut & Type */}
          <div className="flex justify-between items-center mb-4">
            <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-lg ${darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              {structure.type}
            </span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${structure.statut === "Ouvert" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
              {structure.statut}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-blue-500">{structure.nom}</h1>
          
          <div className="flex items-center gap-1.5 mt-2 mb-4">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm">{structure.note} / 5</span>
            <span className={`text-xs ml-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              ({structure.avis?.length || 0} avis)
            </span>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Users size={18} className="mx-auto mb-1 text-blue-500" />
              <p className="text-xs font-bold">{structure.medecins}</p>
              <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médecins</p>
            </div>
            {structure.lits && (
              <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <Shield size={18} className="mx-auto mb-1 text-green-500" />
                <p className="text-xs font-bold">{structure.lits}</p>
                <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Lits</p>
              </div>
            )}
            <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Star size={18} className="mx-auto mb-1 text-yellow-500" />
              <p className="text-xs font-bold">{structure.note}</p>
              <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Note</p>
            </div>
          </div>

          {/* Onglets */}
          <div className={`flex gap-1 p-1 rounded-xl mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition
                  ${activeTab === tab.id
                    ? "bg-blue-500 text-white shadow"
                    : darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenu des onglets */}
          {activeTab === "infos" && (
            <div className="space-y-5">
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {structure.description}
              </p>

              {/* Contacts */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Localisation</p>
                    <p className="text-sm font-medium">{structure.ville}, {structure.quartier}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{structure.bp}</p>
                  </div>
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${structure.nom} ${structure.ville}`, '_blank')}
                    className="p-2 rounded-lg bg-blue-500 text-white"
                  >
                    <Navigation size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Phone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Téléphone</p>
                    <p className="text-sm font-medium">{structure.tel}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(structure.tel)}
                    className="p-2 rounded-lg bg-gray-200 text-gray-600"
                  >
                    {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>

                {structure.email && (
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      <MessageCircle size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                      <p className="text-sm font-medium">{structure.email}</p>
                    </div>
                  </div>
                )}

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

              {/* Assurances acceptées */}
              {structure.assurance && structure.assurance.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2">Assurances acceptées</h3>
                  <div className="flex flex-wrap gap-2">
                    {structure.assurance.map((ass, i) => (
                      <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-green-50 text-green-600"}`}>
                        {ass}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">Services proposés</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {structure.services?.map((service, i) => (
                  <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">{service}</span>
                  </div>
                ))}
              </div>

              {structure.equipements && structure.equipements.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold mb-2">Équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {structure.equipements.map((eq, i) => (
                      <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-600"}`}>
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {structure.langues && structure.langues.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold mb-2">Langues parlées</h3>
                  <div className="flex flex-wrap gap-2">
                    {structure.langues.map((langue, i) => (
                      <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-purple-50 text-purple-600"}`}>
                        {langue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "avis" && (
            <div className="space-y-4">
              {structure.avis && structure.avis.length > 0 ? (
                structure.avis.map((avis, i) => (
                  <div key={i} className={`p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{avis.nom}</p>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold">{avis.note}</span>
                      </div>
                    </div>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{avis.texte}</p>
                    <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{avis.date}</p>
                  </div>
                ))
              ) : (
                <p className={`text-center py-8 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Aucun avis pour le moment
                </p>
              )}
            </div>
          )}

          {/* Boutons d'action selon le rôle */}
          <div className="mt-8 space-y-3">
            {userRole === "patient" ? (
              <>
                <button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                  <Calendar size={18} />
                  Prendre rendez-vous
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <Phone size={16} />
                    Appeler
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <MessageCircle size={16} />
                    Message
                  </button>
                </div>
              </>
            ) : (
              <>
              <button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                  <Phone size={18} />
                  contacter
                </button>
                <button className="w-full bg-gray-600 hover:bg-gray-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                  <Users size={16} />
                  Voir les médecins
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}