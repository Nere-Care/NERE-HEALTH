import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, post } from "../../services/apiClient";
import {
  ArrowLeft,
  User,
  FileText,
  Heart,
  Activity,
  Shield,
  Loader,
  AlertCircle,
  Lock,
  Ruler,
  Weight,
  Thermometer,
  Send,
  CheckCircle,
} from "lucide-react";

function parseJSON(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return raw;
  }
}

function Section({ icon: Icon, iconColor, title, children, darkMode }) {
  return (
    <div
      className={`rounded-2xl border p-5 space-y-5 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={iconColor} />
        <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function FieldBlock({ title, value, darkMode }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{value}</p>
    </div>
  );
}

function DictBlock({ title, data, darkMode }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
      <div className={`text-sm space-y-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className={`font-medium capitalize ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{k.replace(/_/g, " ")}:</span>
            <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VaccinationsBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data) return null;
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Vaccinations</p>
      <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {items.map((v, i) => (
          <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{v.nom || v.vaccin || "Vaccin"}</span>
              {v.maladie && (
                <span className={`px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700`}>
                  {v.maladie}
                </span>
              )}
            </div>
            <div className="mt-1 space-y-0.5">
              {v.date && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Date: {v.date}
                </p>
              )}
              {v.dose && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Dose: {v.dose}
                </p>
              )}
              {v.centre && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Centre: {v.centre}
                </p>
              )}
              {v.numero_lot && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Lot: {v.numero_lot}
                </p>
              )}
              {v.date_rappel && (
                <p className={`text-xs text-orange-500`}>
                  Rappel: {v.date_rappel}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraitementsBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data) return null;
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Traitements chroniques</p>
      <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {items.map((t, i) => (
          <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.nom || "Traitement"}</span>
              {t.dose && (
                <span className={`px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700`}>
                  {t.dose}
                </span>
              )}
            </div>
            <div className="mt-1 space-y-0.5">
              {t.frequence && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Frequence: {t.frequence}
                </p>
              )}
              {t.date_debut && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Depuis: {t.date_debut}
                </p>
              )}
              {t.prescripteur && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Prescripteur: {t.prescripteur}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FamiliauxBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data) return null;
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Antécédents familiaux</p>
      <div className={`text-sm space-y-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {items.map((item, i) => {
          const nom = item.nom || (typeof item === "string" ? item : "");
          const membres = Array.isArray(item.membres) ? item.membres : [];
          return (
            <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
              <p className="font-medium">{nom}</p>
              {membres.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {membres.map((m, j) => (
                    <p key={j} className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      - {m.nom || ""}{m.age ? ` (${m.age} ans)` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PersonnelsBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data) return null;
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Antécédents personnels</p>
      <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {items.map((item, i) => {
          const nom = item.nom || (typeof item === "string" ? item : "");
          const date = item.date_diagnostic || "";
          const etat = item.etat || "";
          return (
            <div key={i} className={`p-3 rounded-xl flex items-center gap-3 ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div>
                <span className="font-medium">{nom}</span>
                {date && <span className={`ml-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>({date})</span>}
                {etat && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    etat === "actif"
                      ? "bg-orange-100 text-orange-700"
                      : etat === "gueri"
                        ? "bg-green-100 text-green-700"
                        : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                  }`}>
                    {etat}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChirurgicauxBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data) return null;
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Antécédents chirurgicaux</p>
      <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {items.map((item, i) => {
          const nom = item.nom || (typeof item === "string" ? item : "");
          return (
            <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
              <p className="font-medium">{nom}</p>
              <div className="mt-1 space-y-0.5">
                {item.date && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Date: {item.date}
                  </p>
                )}
                {item.chirurgien && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Chirurgien: {item.chirurgien}
                  </p>
                )}
                {item.hopital && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Hopital: {item.hopital}
                  </p>
                )}
                {item.complications && (
                  <p className={`text-xs text-orange-500`}>
                    Complications: {item.complications}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllergiquesBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data) return null;
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Allergies</p>
      <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {items.map((item, i) => {
          const nom = item.nom || (typeof item === "string" ? item : "");
          const type = item.type || "";
          const severite = item.severite || "";
          const reaction = item.reaction || "";
          return (
            <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{nom}</span>
                {severite && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    severite === "severe" || severite === "grave"
                      ? "bg-red-100 text-red-700"
                      : severite === "moderee"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                  }`}>
                    {severite}
                  </span>
                )}
              </div>
              {type && (
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Type: {type}
                </p>
              )}
              {reaction && (
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Reaction: {reaction}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GynecoBlock({ raw, darkMode }) {
  const data = parseJSON(raw);
  if (!data || typeof data !== "object") return null;

  const fields = [
    { key: "age_menarche", label: "Age menarche", suffix: " ans" },
    { key: "cycles_reguliers", label: "Cycles reguliers" },
    { key: "duree_cycles", label: "Duree cycles", suffix: " jours" },
    { key: "contraception_type", label: "Contraception" },
    { key: "contraception_depuis", label: "Contraception depuis" },
    { key: "contraception_autre", label: "Autre contraception" },
    { key: "accouchements", label: "Accouchements" },
    { key: "cesariennes", label: "Cesariennes" },
    { key: "avortements", label: "Avortements" },
    { key: "menopause_age", label: "Age menopause", suffix: " ans" },
    { key: "menopause_thm", label: "THM" },
    { key: "menopause_thm_nom", label: "Nom THM" },
    { key: "menopause_thm_commentaires", label: "Commentaires THM" },
    { key: "menopause_peri_symptomes", label: "Symptomes perimenopause" },
    { key: "menopause_peri_autre", label: "Autre perimenopause" },
    { key: "troubles_fertilite", label: "Troubles fertilite" },
    { key: "fiv", label: "FIV" },
    { key: "pap_smear_date", label: "Dernier Pap smear" },
    { key: "pap_smear_resultat", label: "Resultat Pap smear" },
  ];

  const entries = fields.filter(f => {
    const val = data[f.key];
    if (val === null || val === undefined || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  if (entries.length === 0) return null;

  const hasGrossesses = Array.isArray(data.grossesses) && data.grossesses.length > 0;
  const hasVisites = Array.isArray(data.visites_prenatales) && data.visites_prenatales.length > 0;

  return (
    <div className="space-y-1">
      <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Antecedents gynecologiques</p>
      <div className={`text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        <div className={`p-3 rounded-xl space-y-2 ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
          {entries.map(f => {
            const val = data[f.key];
            const display = Array.isArray(val) ? val.join(", ") : String(val);
            return (
              <div key={f.key} className="flex gap-2">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.label}:</span>
                <span>{display}{f.suffix || ""}</span>
              </div>
            );
          })}
        </div>

        {hasGrossesses && (
          <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Grossesses</p>
            {data.grossesses.map((g, i) => (
              <div key={i} className={`p-3 rounded-lg mb-2 space-y-1 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Grossesse {i + 1}</span>
                  {g.issue && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      g.issue === "Grossesse en cours"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}>{g.issue}</span>
                  )}
                </div>
                {g.date_debut && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Debut: {g.date_debut} {g.type_debut ? `(${g.type_debut})` : ""}
                  </p>
                )}
                {g.date_conception && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Conception: {g.date_conception}
                  </p>
                )}
                {g.dpa && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    DPA: {g.dpa}
                  </p>
                )}
                {g.nb_enfants && g.nb_enfants > 0 && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Enfants: {g.nb_enfants}
                  </p>
                )}
                {g.type_accouchement && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Accouchement: {g.type_accouchement}
                  </p>
                )}
                {g.date_accouchement && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Date accouchement: {g.date_accouchement}
                  </p>
                )}
                {g.date_perte && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Date perte: {g.date_perte}
                  </p>
                )}
                {g.commentaires && (
                  <p className={`text-xs italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {g.commentaires}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {hasVisites && (
          <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
            <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Visites prenatales</p>
            {data.visites_prenatales.map((v, i) => (
              <div key={i} className={`p-3 rounded-lg mb-2 space-y-1 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{v.numero || `Visite ${i + 1}`}</span>
                  {v.statut && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      v.statut === "completee"
                        ? "bg-green-100 text-green-700"
                        : v.statut === "planifiee"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-200 text-gray-600"
                    }`}>{v.statut === "completee" ? "Completee" : v.statut === "planifiee" ? "Planifiee" : v.statut}</span>
                  )}
                </div>
                {v.date_reelle && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Date: {v.date_reelle}{v.date_prevue ? ` (prevue: ${v.date_prevue})` : ""}
                  </p>
                )}
                {v.lieu && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Lieu: {v.lieu}
                  </p>
                )}
                {v.praticien && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Praticien: {v.praticien}
                  </p>
                )}
                {v.age_gestationnel && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Age gestationnel: {v.age_gestationnel}
                  </p>
                )}
                {(v.ta_systolique || v.ta_diastolique) && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    TA: {v.ta_systolique}/{v.ta_diastolique} mmHg
                  </p>
                )}
                {v.poids && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Poids: {v.poids} kg
                  </p>
                )}
                {v.hauteur_uterine && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Hauteur uterine: {v.hauteur_uterine} cm
                  </p>
                )}
                {v.rcf && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    RCF: {v.rcf}
                  </p>
                )}
                {v.oeudemes && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Oedemes: {v.oeudemes}
                  </p>
                )}
                {v.proteinurie && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Proteinurie: {v.proteinurie}
                  </p>
                )}
                {v.glycemie && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Glycemie: {v.glycemie}
                  </p>
                )}
                {v.echo_realisee && (
                  <div className={`p-2 rounded-lg mt-1 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Echographie</p>
                    {v.echo_date && (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date: {v.echo_date}</p>
                    )}
                    {v.echo_biometrie && (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Biometrie: {v.echo_biometrie}</p>
                    )}
                    {v.echo_presentation && (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Presentation: {v.echo_presentation}</p>
                    )}
                    {v.echo_liquide && (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Liquide amniotique: {v.echo_liquide}</p>
                    )}
                  </div>
                )}
                {v.traitement && (
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Traitement: {v.traitement}
                  </p>
                )}
                {v.prochaine_visite && (
                  <p className={`text-xs text-orange-500`}>
                    Prochaine visite: {v.prochaine_visite}
                  </p>
                )}
                {v.observations && (
                  <p className={`text-xs italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {v.observations}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DossierDetail({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessRequestSent, setAccessRequestSent] = useState(false);
  const [accessRequestLoading, setAccessRequestLoading] = useState(false);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const data = await get(`/api/dossiers_medicaux/${id}`);
        setDossier(data);
      } catch (err) {
        setError(err.message || "Impossible de charger le dossier medical");
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id]);

  const handleRequestAccess = async () => {
    setAccessRequestLoading(true);
    try {
      const res = await post(`/api/dossiers_medicaux/${id}/request-access`);
      if (res?.already_authorized) {
        window.location.reload();
      } else {
        setAccessRequestSent(true);
      }
    } catch {
    } finally {
      setAccessRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        <Loader className="animate-spin mr-2" size={20} />
        <span>Chargement du dossier...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 gap-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-500 hover:underline">
          Retour
        </button>
      </div>
    );
  }

  if (!dossier) return null;

  const isRestricted = dossier.acces_restricted === true;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Dossier medical
          </h1>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {dossier.numero_dossier}
          </p>
        </div>
        {isRestricted && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-semibold">
            <Lock size={12} />
            Acces restreint
          </span>
        )}
      </div>

      {isRestricted && (
        <div className={`p-6 rounded-2xl text-center space-y-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200 shadow-sm"}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${darkMode ? "bg-orange-900/30" : "bg-orange-100"}`}>
            <Lock size={28} className="text-orange-500" />
          </div>
          <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Acces restreint
          </h3>
          <p className={`text-sm max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Ce patient a restreint l'acces a son dossier medical. Vous devez obtenir son autorisation pour consulter ses informations detaillees.
          </p>
          {accessRequestSent ? (
            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}>
              <CheckCircle size={16} />
              Demande envoyee. En attente de la reponse du patient.
            </div>
          ) : (
            <button
              onClick={handleRequestAccess}
              disabled={accessRequestLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {accessRequestLoading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Demander l'autorisation au patient
            </button>
          )}
        </div>
      )}

      <Section icon={Shield} iconColor="text-blue-500" title="Informations generales" darkMode={darkMode}>
        <div className="grid grid-cols-2 gap-4">
          {dossier.numero_dossier && (
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Numero</p>
              <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{dossier.numero_dossier}</p>
            </div>
          )}
          {dossier.created_at && (
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cree le</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}
        </div>
      </Section>

      {!isRestricted && (
        <>
          <Section icon={Activity} iconColor="text-blue-500" title="Mesures physiques" darkMode={darkMode}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {dossier.taille_cm && (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                  <Ruler size={14} className="text-blue-500 mb-1" />
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Taille</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{dossier.taille_cm} cm</p>
                </div>
              )}
              {dossier.poids_kg && (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                  <Weight size={14} className="text-green-500 mb-1" />
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Poids</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{dossier.poids_kg} kg</p>
                </div>
              )}
              {dossier.imc && (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                  <Heart size={14} className="text-red-500 mb-1" />
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>IMC</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{dossier.imc}</p>
                </div>
              )}
              {dossier.tension_arterielle && (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                  <Activity size={14} className="text-orange-500 mb-1" />
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Tension arterielle</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{dossier.tension_arterielle}</p>
                </div>
              )}
              {dossier.glycemie_a_jeun && (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
                  <Thermometer size={14} className="text-purple-500 mb-1" />
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Glycemie a jeun</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{dossier.glycemie_a_jeun}</p>
                </div>
              )}
            </div>
          </Section>

          <Section icon={FileText} iconColor="text-blue-500" title="Antecedents" darkMode={darkMode}>
            <div className="space-y-5">
              <FamiliauxBlock raw={dossier.antecedents_familiaux} darkMode={darkMode} />
              <PersonnelsBlock raw={dossier.antecedents_personnels} darkMode={darkMode} />
              <ChirurgicauxBlock raw={dossier.antecedents_chirurgicaux} darkMode={darkMode} />
              <AllergiquesBlock raw={dossier.antecedents_allergiques} darkMode={darkMode} />
              <GynecoBlock raw={dossier.antecedents_gyneco} darkMode={darkMode} />
            </div>
          </Section>

          <Section icon={User} iconColor="text-blue-500" title="Mode de vie & Traitements" darkMode={darkMode}>
            <div className="space-y-4">
              <DictBlock title="Habitudes de vie" data={dossier.habitudes_vie} darkMode={darkMode} />
              <VaccinationsBlock raw={dossier.vaccinations} darkMode={darkMode} />
              <TraitementsBlock raw={dossier.traitements_chroniques} darkMode={darkMode} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
