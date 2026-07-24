import { useState, useEffect, useCallback } from "react";
import { Plus, X, Clock } from "lucide-react";
import { MOMENTS_PRISE, UNITES_MEDICAMENT, CONDITIONS_REPAS } from "../constants/medicalOptions";

const EMPTY_PRISE = { moment: "matin", quantite: 1, unite: "comprime", heure: "" };

function genererPosologieLocale(prises, conditionRepas, dureeJours, instructionsSpeciales) {
  if (!prises.length || !dureeJours) return "";

  const momentLabels = {
    matin: "le matin", midi: "le midi", soir: "le soir", coucher: "le coucher",
    personnalise: "",
  };

  const pluralize = (q, unite) => {
    const u = UNITES_MEDICAMENT.find((x) => x.value === unite);
    if (!u) return `${q} ${unite}`;
    const label = q === 1 ? u.singular : u.plural;
    const qStr = Number.isInteger(q) ? String(q) : String(q).replace(".", ",");
    return `${qStr} ${label}`;
  };

  const groupes = prises.map((p) => {
    let moment;
    if (p.heure) {
      moment = `à ${p.heure}`;
    } else {
      moment = momentLabels[p.moment] || p.moment;
    }
    return `${pluralize(p.quantite, p.unite)} ${moment}`;
  });

  let texte;
  if (groupes.length === 1) {
    texte = groupes[0];
  } else if (groupes.length === 2) {
    texte = `${groupes[0]} et ${groupes[1]}`;
  } else {
    texte = groupes.slice(0, -1).join(", ") + ` et ${groupes[groupes.length - 1]}`;
  }

  const condition = CONDITIONS_REPAS.find((c) => c.value === conditionRepas);
  if (condition && condition.value !== "sans_lien") {
    texte += `, ${condition.label.toLowerCase()}`;
  }

  if (dureeJours === 1) {
    texte += ", pendant 1 jour";
  } else {
    texte += `, pendant ${dureeJours} jours`;
  }

  if (instructionsSpeciales) {
    texte += `. ${instructionsSpeciales}`;
  }

  texte += ".";
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export default function PosologieBuilder({ value, onChange, dureeJours = 7, darkMode = false }) {
  const [prises, setPrises] = useState(value?.prises || [{ ...EMPTY_PRISE }]);
  const [conditionRepas, setConditionRepas] = useState(value?.conditionRepas || "sans_lien");
  const [duree, setDuree] = useState(dureeJours);
  const [instructions, setInstructions] = useState(value?.instructions || "");

  const emitChange = useCallback(
    (newPrises, newCondition, newDuree, newInstructions) => {
      const posologie = genererPosologieLocale(newPrises, newCondition, newDuree, newInstructions);
      onChange?.({
        posologie,
        prises: newPrises,
        conditionRepas: newCondition,
        dureeJours: newDuree,
        instructions: newInstructions,
      });
    },
    [onChange]
  );

  useEffect(() => {
    emitChange(prises, conditionRepas, duree, instructions);
  }, []);

  const updatePrise = (index, field, val) => {
    const next = prises.map((p, i) => (i === index ? { ...p, [field]: val } : p));
    setPrises(next);
    emitChange(next, conditionRepas, duree, instructions);
  };

  const addPrise = () => {
    const next = [...prises, { ...EMPTY_PRISE }];
    setPrises(next);
    emitChange(next, conditionRepas, duree, instructions);
  };

  const removePrise = (index) => {
    if (prises.length <= 1) return;
    const next = prises.filter((_, i) => i !== index);
    setPrises(next);
    emitChange(next, conditionRepas, duree, instructions);
  };

  const setCondition = (val) => {
    setConditionRepas(val);
    emitChange(prises, val, duree, instructions);
  };

  const setDureeVal = (val) => {
    setDuree(val);
    emitChange(prises, conditionRepas, val, instructions);
  };

  const setInstructionsVal = (val) => {
    setInstructions(val);
    emitChange(prises, conditionRepas, duree, val);
  };

  const preview = genererPosologieLocale(prises, conditionRepas, duree, instructions);

  const inputClass = `border rounded-xl px-3 py-2 text-sm outline-none transition ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-400"
      : "bg-white border-gray-200 text-gray-800 focus:border-blue-400"
  }`;

  const pillBase = `px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer`;
  const pillActive = "bg-blue-100 border-blue-400 text-blue-700 font-semibold";
  const pillInactive = darkMode
    ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400"
    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300";

  return (
    <div className="space-y-4">
      {/* Prises */}
      <div>
        <label className={`text-xs font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Prises par jour
        </label>
        <div className="space-y-2">
          {prises.map((prise, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={prise.quantite}
                onChange={(e) => updatePrise(i, "quantite", parseFloat(e.target.value) || 0)}
                className={`w-16 text-center ${inputClass}`}
              />

              <select
                value={prise.unite}
                onChange={(e) => updatePrise(i, "unite", e.target.value)}
                className={inputClass}
              >
                {UNITES_MEDICAMENT.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>

              <select
                value={prise.moment}
                onChange={(e) => updatePrise(i, "moment", e.target.value)}
                className={inputClass}
              >
                {MOMENTS_PRISE.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <div className="relative">
                <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="time"
                  value={prise.heure || ""}
                  onChange={(e) => updatePrise(i, "heure", e.target.value)}
                  placeholder="Heure"
                  className={`pl-8 w-28 ${inputClass}`}
                />
              </div>

              {prises.length > 1 && (
                <button
                  onClick={() => removePrise(i)}
                  className="text-gray-400 hover:text-red-500 transition p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {prises.length < 6 && (
          <button
            onClick={addPrise}
            className={`mt-2 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl transition ${
              darkMode
                ? "text-blue-400 hover:bg-gray-700"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Plus size={12} /> Ajouter une prise
          </button>
        )}
      </div>

      {/* Condition repas */}
      <div>
        <label className={`text-xs font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Lien avec les repas
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS_REPAS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              className={`${pillBase} ${conditionRepas === c.value ? pillActive : pillInactive}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Durée */}
      <div className="flex items-center gap-3">
        <label className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Durée
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="365"
            value={duree}
            onChange={(e) => setDureeVal(parseInt(e.target.value) || 1)}
            className={`w-16 text-center ${inputClass}`}
          />
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {duree === 1 ? "jour" : "jours"}
          </span>
        </div>
      </div>

      {/* Instructions spéciales */}
      <div>
        <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Instructions spéciales (optionnel)
        </label>
        <input
          type="text"
          value={instructions}
          onChange={(e) => setInstructionsVal(e.target.value)}
          placeholder="ex: En cas de douleur uniquement"
          className={`w-full ${inputClass}`}
        />
      </div>

      {/* Aperçu */}
      {preview && (
        <div className={`rounded-xl p-3 border ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-blue-50 border-blue-200"}`}>
          <p className={`text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-blue-600"}`}>Aperçu</p>
          <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{preview}</p>
        </div>
      )}
    </div>
  );
}
