import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Star, Share2, Heart, Navigation, Users, Shield, Calendar, MessageCircle, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchStructureProfil } from '../../services/structureSante';

export default function ProfilStructure({ darkMode, userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [favori, setFavori] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("infos");

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchStructureProfil(id);
        setStructure(data);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erreur || !structure) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
        <p className="text-center font-bold text-lg">{erreur || "Structure introuvable"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-semibold">
          Retourner à la liste
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "infos", label: "Informations" },
    { id: "services", label: "Services" },
    { id: "avis", label: `Avis (${structure.avis?.length || 0})` },
  ];

  const statutLabel = structure.statut_verification === "verifie" ? "Vérifié" : "En attente";
  const statutColor = structure.statut_verification === "verifie" 
    ? "bg-green-100 text-green-600" 
    : "bg-yellow-100 text-yellow-600";

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
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: structure.nom,
                  text: structure.description,
                  url: window.location.href,
                });
              }
            }}
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
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${statutColor}`}>
              {statutLabel}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-blue-500">{structure.nom}</h1>
          
          <div className="flex items-center gap-1.5 mt-2 mb-4">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm">{structure.note_moyenne} / 5</span>
            <span className={`text-xs ml-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              ({structure.avis?.length || 0} avis)
            </span>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Users size={18} className="mx-auto mb-1 text-blue-500" />
              <p className="text-xs font-bold">{structure.nb_medecins}</p>
              <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médecins</p>
            </div>
            {structure.capacite_lits && (
              <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <Shield size={18} className="mx-auto mb-1 text-green-500" />
                <p className="text-xs font-bold">{structure.capacite_lits}</p>
                <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Lits</p>
              </div>
            )}
            <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <Star size={18} className="mx-auto mb-1 text-yellow-500" />
              <p className="text-xs font-bold">{structure.note_moyenne}</p>
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
                {structure.description || "Aucune description disponible."}
              </p>

              {/* Contacts */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Localisation</p>
                    <p className="text-sm font-medium">{structure.ville}, {structure.region}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{structure.adresse}</p>
                  </div>
                  {(structure.latitude && structure.longitude) && (
                    <button
                      onClick={() => window.open(`https://maps.google.com/?q=${structure.latitude},${structure.longitude}`, '_blank')}
                      className="p-2 rounded-lg bg-blue-500 text-white"
                    >
                      <Navigation size={16} />
                    </button>
                  )}
                </div>

                {structure.telephone && (
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      <Phone size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Téléphone</p>
                      <p className="text-sm font-medium">{structure.telephone}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(structure.telephone)}
                      className="p-2 rounded-lg bg-gray-200 text-gray-600"
                    >
                      {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                )}

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
                    <p className="text-sm font-medium">{structure.horaire_texte}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">Services proposés</h3>
              {structure.services && structure.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {structure.services.map((service, i) => (
                    <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Aucun service renseigné
                </p>
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
                  {structure.telephone && (
                    <button 
                      onClick={() => window.open(`tel:${structure.telephone}`)}
                      className="bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                    >
                      <Phone size={16} />
                      Appeler
                    </button>
                  )}
                  <button className="bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <MessageCircle size={16} />
                    Message
                  </button>
                </div>
              </>
            ) : (
              <>
                {structure.telephone && (
                  <button 
                    onClick={() => window.open(`tel:${structure.telephone}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                  >
                    <Phone size={18} />
                    Contacter
                  </button>
                )}
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