function filled(val) {
  if (val === null || val === undefined || val === "" || val === "Non_precise") return false
  if (typeof val === "number" && val === 0) return false
  if (typeof val === "string" && val === "0") return false
  if (Array.isArray(val) && val.length === 1 && val[0] === "fr") return false
  if (Array.isArray(val) && val.length === 0) return false
  return true
}

const COMMON_FIELDS = [
  "prenom",
  "nom",
  "telephone",
  "date_naissance",
  "adresse",
  "photo_url",
]

const PATIENT_FIELDS = [
  "sexe",
  "profession",
  "statut_matrimonial",
  "couverture_assurance",
  "numero_assurance",
  "groupe_sanguin",
  "taille_cm",
  "poids_kg",
  "contact_urgence_nom",
  "contact_urgence_tel",
  "contact_urgence_lien",
  "contact_urgence2_nom",
  "contact_urgence2_tel",
  "contact_urgence2_lien",
  "proche_nom",
  "proche_prenom",
  "proche_age",
]

const MEDECIN_FIELDS = [
  "numero_ordre",
  "presentation",
  "tarif_consultation",
  "devise",
  "annees_experience",
  "expertises",
  "actes",
  "diplomes",
  "certifications",
  "experience_history",
  "langues_parlees",
  "structure_id",
  "documents",
]

export function getProfileCompletion(user, extra) {
  const value = (key) => {
    let e
    if (key === "presentation") {
      e = extra?.presentation ?? extra?.biographie
    } else if (extra && extra[key] !== undefined && extra[key] !== null) {
      e = extra[key]
    } else {
      e = undefined
    }
    return e !== undefined && e !== null ? e : user?.[key]
  }

  let specific = []
  if (user?.role === "patient" || user?.role === "nurse") {
    specific = PATIENT_FIELDS
  } else if (user?.role === "doctor" || user?.role === "medecin") {
    specific = MEDECIN_FIELDS
  }

  const keys = [...COMMON_FIELDS, ...specific]
  const completed = keys.filter((k) => filled(value(k))).length
  const total = keys.length

  return {
    percent: total > 0 ? Math.round((completed / total) * 100) : 100,
    completed,
    total,
  }
}
