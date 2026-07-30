function filled(val) {
  if (val === null || val === undefined || val === "" || val === "Non_precise") return false
  if (typeof val === "number" && val === 0) return false
  if (typeof val === "string" && val === "0") return false
  if (Array.isArray(val) && val.length === 1 && val[0] === "fr") return false
  if (Array.isArray(val) && val.length === 0) return false
  return true
}

export function getProfileCompletion(user, extra) {
  const common = [
    user?.prenom,
    user?.nom,
    user?.telephone,
    user?.date_naissance,
    user?.adresse,
    user?.photo_url,
  ]

  let specific = []

  if (user?.role === "patient" || user?.role === "nurse") {
    specific = [
      extra?.sexe,
      extra?.ville,
      extra?.groupe_sanguin,
      extra?.profession,
      extra?.contact_urgence_nom,
    ]
  } else if (user?.role === "doctor" || user?.role === "medecin") {
    const tc = extra?.tarif_consultation
    const tarifSet = tc !== undefined && tc !== null && (
      (typeof tc === "number" && tc !== 5000) ||
      (typeof tc === "string" && tc !== "5000.00" && tc !== "5000")
    )
    specific = [
      extra?.numero_ordre,
      extra?.annees_experience,
      extra?.biographie,
      extra?.langues_parlees,
      tarifSet ? tc : null,
    ]
  } else {
    specific = []
  }

  const all = [...common, ...specific]
  const completed = all.filter(filled).length
  const total = all.length

  return {
    percent: total > 0 ? Math.round((completed / total) * 100) : 100,
    completed,
    total,
  }
}
