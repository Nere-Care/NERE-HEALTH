import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Video, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchNotification, marquerLue } from '../../services/notificationService';
import { getConfig, tempsRelatif } from '../../constants/notificationConfig';

export default function DetailNotification({ darkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchNotification(id);
        if (!data) {
          setErreur("Notification introuvable");
          return;
        }
        setNotification(data);
        if (data.statut !== "lu") {
          await marquerLue(id).catch(() => {});
        }
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erreur || !notification) return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <ArrowLeft size={18} /> Retour
      </button>
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl
        ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
        <span className="text-sm">{erreur || "Notification introuvable"}</span>
      </div>
    </div>
  );

  const { icon: Icon, couleur } = getConfig(notification.type);
  const extras = notification.donnees_supplementaires || {};
  const estTeleconsultation = extras.type === "teleconsultation_demarree" && extras.lien_video;
  const estAvisAccepte = extras.type === "demande_avis_acceptee" && extras.conversation_id;
  const estAvisRefuse = extras.type === "demande_avis_refusee";

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>

      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium transition-all
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-500"}`}
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <div className={`rounded-3xl shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${couleur}`}>
            <Icon size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{notification.titre}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {notification.created_at
                ? new Date(notification.created_at).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : ""}
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className={`rounded-2xl p-5 mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-blue-500" />
            <p className="font-semibold">Details</p>
          </div>
          <p className={`leading-relaxed text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {notification.contenu}
          </p>
        </div>

        // Dans DetailNotification.jsx, dans la section extras, ajoute ce bloc après le contenu principal :

{/* Détails d'un RDV reçu (côté médecin) */}
{extras.type === "nouvelle_demande_rdv" && (
  <div className={`mt-4 p-4 rounded-xl space-y-3 ${darkMode ? "bg-gray-700" : "bg-blue-50 border border-blue-100"}`}>
    <p className="font-semibold text-sm text-blue-500">Détails du rendez-vous</p>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs text-gray-400">Patient</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.patient_nom || "N/A"}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Téléphone</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.patient_telephone || "N/A"}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Date</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.date || "N/A"} à {extras.heure || ""}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Type</p>
        <p className={`font-medium capitalize ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.type_rdv === "video" ? "Téléconsultation" : "Présentiel"}
        </p>
      </div>
      <div className="col-span-2">
        <p className="text-xs text-gray-400">Motif de consultation</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.motif || "Non précisé"}
        </p>
      </div>
      {extras.montant > 0 && (
        <div>
          <p className="text-xs text-gray-400">Montant</p>
          <p className="font-semibold text-green-600">
            {extras.montant?.toLocaleString()} {extras.devise || "XAF"}
          </p>
        </div>
      )}
    </div>

    {/* Boutons d'action depuis la notification */}
    {extras.rdv_id && (
      <div className="flex gap-2 pt-2">
        <button
          onClick={async () => {
            try {
              const { changerStatutRdv } = await import("../../services/rendezVousService");
              await changerStatutRdv(extras.rdv_id, "confirme");
              navigate("/doctor/appointments");
            } catch (err) {
              alert(err.message);
            }
          }}
          className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          Accepter
        </button>
        <button
          onClick={async () => {
            try {
              const { changerStatutRdv } = await import("../../services/rendezVousService");
              await changerStatutRdv(extras.rdv_id, "annule_medecin");
              navigate("/doctor/appointments");
            } catch (err) {
              alert(err.message);
            }
          }}
          className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
        >
          <XCircle size={16} />
          Refuser
        </button>
      </div>
    )}
  </div>
)}

{/* Détails d'un RDV confirmé (côté patient) */}
{extras.type === "rdv_confirme" && (
  <div className={`mt-4 p-4 rounded-xl space-y-2 ${darkMode ? "bg-gray-700" : "bg-green-50 border border-green-200"}`}>
    <p className="font-semibold text-sm text-green-600">Rendez-vous confirmé</p>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs text-gray-400">Médecin</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.medecin_nom || "N/A"}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Date</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.date || "N/A"} à {extras.heure || ""}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Référence</p>
        <p className={`text-xs font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {extras.numero_rdv || extras.rdv_id?.slice(0, 8) || "N/A"}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Type</p>
        <p className={`font-medium capitalize ${darkMode ? "text-white" : "text-gray-800"}`}>
          {extras.type_rdv === "video" ? "Téléconsultation" : "Présentiel"}
        </p>
      </div>
    </div>
    {extras.conversation_id && (
      <button
        onClick={() => navigate("/messages")}
        className="w-full mt-2 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
      >
        Ouvrir la conversation
      </button>
    )}
  </div>
)}

        {/* Action : Teleconsultation */}
        {estTeleconsultation && (
          <a
            href={extras.lien_video}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition"
          >
            <Video size={18} />
            Rejoindre la teleconsultation
          </a>
        )}

        {/* Action : Demande d'avis acceptee */}
        {estAvisAccepte && (
          <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${
            darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"
          }`}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-600 mb-1">Demande acceptee</p>
              <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {extras.medecin_nom} a accepte votre demande.
                {extras.mode && ` Mode : ${extras.mode}.`}
                {extras.date_rdv && ` RDV planifie le ${new Date(extras.date_rdv).toLocaleString('fr-FR', {
                  day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
                })}.`}
              </p>
            </div>
          </div>
        )}

        {/* Action : Demande d'avis refusee */}
        {estAvisRefuse && (
          <div className={`mb-4 p-4 rounded-xl ${
            darkMode ? "bg-red-900/20 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            <p className="text-sm font-semibold mb-1">Demande refusee</p>
            {extras.motif_refus && (
              <p className="text-xs">{extras.motif_refus}</p>
            )}
          </div>
        )}

        {/* Temps relatif */}
        <div className="flex justify-end">
          <span className={`text-xs px-3 py-1 rounded-full
            ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-500"}`}>
            {tempsRelatif(notification.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}