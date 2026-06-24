import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, Video, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { fetchProfilMedecin } from '../../services/medecinService';
  import { creerRendezVous, preautoriserPaiement } from '../../services/rendezVousService';
          import PaymentForm from '../../components/PaymentForm';


export default function ProfilMedecin({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
// Ajoute ces états
const [methodePaiement, setMethodePaiement] = useState(null);
const [fournisseur, setFournisseur] = useState(null);
const [loading, setLoading] = useState(false);
const [erreurRdv, setErreurRdv] = useState(null);
  const [medecin, setMedecin] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [favori, setFavori] = useState(false);
  const [etape, setEtape] = useState(null);
  const [pourQui, setPourQui] = useState(null);
  const [motif, setMotif] = useState("");
  const [mode, setMode] = useState(null);
  const [creneauChoisi, setCreneauChoisi] = useState(null);
  const [confirme, setConfirme] = useState(false);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchProfilMedecin(id);
        setMedecin(data);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);






// Remplace handleConfirmer par :
const handleConfirmer = async () => {
  if (!methodePaiement || !fournisseur) {
    setErreurRdv("Veuillez choisir un mode de paiement");
    return;
  }
  
  try {
    setLoading(true);
    setErreurRdv(null);
    
    // 1. Créer le RDV
    const rdv = await creerRendezVous({
      medecin_id: medecin.id,
      date_heure_debut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // demain même heure
      date_heure_fin: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // +30min
      type: mode === "Vidéo" ? "video" : "presentiel",
      motif_consultation: motif,
    });
    
    // 2. Pré-autoriser le paiement
    await preautoriserPaiement(rdv.id, methodePaiement, fournisseur);
    
    // 3. Succès
    setEtape(null);
    setConfirme(true);
    setTimeout(() => setConfirme(false), 5000);
  } catch (err) {
    setErreurRdv(err.message);
  } finally {
    setLoading(false);
  }
};



  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erreur || !medecin) return (
    <div className="p-8 text-center text-gray-400">{erreur || "Médecin introuvable"}</div>
  );

  return (
    <div className={`p-9 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft size={18} />
        Retour à l'annuaire
      </button>

      {/* Toast confirmation */}
      {confirme && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle size={18} />
          Rendez-vous confirmé !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Carte profil */}
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex flex-col sm:flex-row gap-5">

              <div className="relative flex-shrink-0">
                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center
                  ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <User size={52} className="text-blue-300" />
                </div>
                <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${medecin.disponible ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                  {medecin.disponible ? "Disponible" : "Indisponible"}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {medecin.nom}
                    </h1>
                    <p className="text-blue-500 font-medium">{medecin.specialite}</p>
                  </div>
                  <button onClick={() => setFavori(!favori)}>
                    <Heart size={22} className={favori ? "text-red-500 fill-red-500" : "text-gray-400"} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= Math.round(medecin.note) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                  <span className="text-sm font-semibold">{medecin.note.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({medecin.nombre_avis} avis)</span>
                </div>

                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : ""}`}>
                      {medecin.experience} d'expérience
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400" />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : ""}`}>
                      {medecin.lieu_exercice}{medecin.ville ? ` • ${medecin.ville}` : ""}
                    </span>
                  </div>
                </div>

                {medecin.biographie && (
                  <p className={`text-sm mt-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {medecin.biographie}
                  </p>
                )}

                {/* Modes de consultation */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {medecin.teleconsultation && (
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                      ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-600"}`}>
                      <Video size={11} /> Téléconsultation
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                    ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                    <User size={11} /> Présentiel
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Disponibilités */}
          {medecin.disponibilites.length > 0 && (
            <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Créneaux disponibles
              </h2>
              <div className="flex flex-col gap-2">
                {medecin.disponibilites.map((d, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-xl
                      ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <span className={`text-sm font-medium capitalize ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {d.jour}
                    </span>
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {d.heure_debut.slice(0,5)} – {d.heure_fin.slice(0,5)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${d.type === "video"
                        ? darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-50 text-blue-600"
                        : darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"
                      }`}>
                      {d.type === "video" ? "Vidéo" : "Présentiel"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avis */}
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Avis des patients
            </h2>

            {medecin.avis.length === 0 ? (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucun avis pour ce médecin.
              </p>
            ) : (
              medecin.avis.map((a, i) => (
                <div key={i} className={`p-4 rounded-xl mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {a.nom}
                    </p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          className={s <= a.note ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {a.commentaire}
                  </p>
                  {a.reponse_medecin && (
                    <p className={`text-xs mt-2 italic border-l-2 border-blue-400 pl-2
                      ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                      Dr. : {a.reponse_medecin}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{a.date}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne réservation */}
        <div className="flex flex-col gap-4">

          {/* Tarif */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Tarif consultation</p>
            <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-800"}`}>
              {medecin.tarif.toLocaleString()}
              <span className="text-sm font-normal ml-1">{medecin.devise}</span>
            </p>
          </div>

          {/* Réservation */}
          {!etape && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Prendre rendez-vous
              </h2>
              <button
                onClick={() => setEtape("pourQui")}
                disabled={!medecin.disponible}
                className={`w-full py-3 rounded-xl font-semibold text-sm
                  ${medecin.disponible
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                Réserver une consultation
              </button>
            </div>
          )}

          {etape === "pourQui" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Pour qui ?
              </h2>
              {["Pour moi", "Pour un proche"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setPourQui(opt); setEtape("motif"); }}
                  className={`w-full text-left px-4 py-3 border rounded-xl mb-2 text-sm
                    ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {etape === "motif" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Motif de consultation
              </h2>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Décrivez brièvement votre motif..."
                rows={3}
                className={`w-full border rounded-xl p-3 text-sm outline-none resize-none
                  ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "border-gray-200"}`}
              />
              <button
                onClick={() => setEtape("mode")}
                disabled={!motif.trim()}
                className="w-full mt-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          )}

          {etape === "mode" && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Mode de consultation
              </h2>
              {["Présentiel", medecin.teleconsultation && "Vidéo"].filter(Boolean).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setMode(opt); setEtape("confirmer"); }}
                  className={`w-full text-left px-4 py-3 border rounded-xl mb-2 text-sm
                    ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}



{etape === "confirmer" && (
  <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
    <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
      Paiement sécurisé
    </h2>
    
    {/* Récapitulatif */}
    <div className={`text-sm space-y-1 mb-4 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
      <p><span className="font-medium">Médecin :</span> {medecin.nom}</p>
      <p><span className="font-medium">Pour :</span> {pourQui}</p>
      <p><span className="font-medium">Motif :</span> {motif}</p>
      <p><span className="font-medium">Mode :</span> {mode}</p>
    </div>
    
    <PaymentForm
      montant={medecin.tarif}
      devise={medecin.devise}
      darkMode={darkMode}
      onSubmit={async (paymentData) => {
        try {
          // 1. Créer le RDV
          const rdv = await creerRendezVous({
            medecin_id: medecin.id,
            date_heure_debut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            date_heure_fin: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            type: mode === "Vidéo" ? "video" : "presentiel",
            motif_consultation: motif,
          });
          
          // 2. Pré-autoriser le paiement
          await preautoriserPaiement(rdv.id, paymentData.methode, paymentData.fournisseur, paymentData.phone_number, paymentData.card_number, paymentData.card_holder);
          
          // 3. Succès
          setEtape(null);
          setConfirme(true);
          setTimeout(() => setConfirme(false), 5000);
        } catch (err) {
          throw err; // PaymentForm gère l'affichage
        }
      }}
    />
  </div>
)}
        </div>
      </div>
    </div>
  );
}