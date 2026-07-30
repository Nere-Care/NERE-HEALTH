function filled(val) {
  return val !== null && val !== undefined && val !== "" && val !== "Non_precise"
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
    specific = [
      extra?.numero_ordre,
      extra?.annees_experience,
      extra?.biographie,
      extra?.langues_parlees,
      extra?.tarif_consultation,
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
