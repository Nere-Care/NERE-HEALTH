"""
Script de seed : analyses de laboratoire (biologie) couramment prescrites au Cameroun.

Usage :
    python seed_analyses.py

Insère les analyses dans la table 'analyses_biologiques' via une connexion directe à PostgreSQL.
Nécessite la variable DATABASE_URL dans .env ou un fichier .env à la racine du backend.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nere_user:nere_pass@localhost:5432/nere_health")

ANALYSES = [
    # ── HÉMATOLOGIE ──
    ("Numération Formule Sanguine (NFS)", "Hématologie", "Hémogramme complet : GB, GR, plaquettes, formule leucocytaire."),
    ("NFS-Plaquettes", "Hématologie", "Numération formule sanguine avec plaquettes."),
    ("Groupe sanguin ABO", "Hématologie", "Détermination du groupe sanguin système ABO."),
    ("Rhésus (Rh D)", "Hématologie", "Détermination du facteur Rhésus."),
    ("Groupage ABO-Rhésus", "Hématologie", "Groupe sanguin ABO et facteur Rhésus."),
    ("Test de Coombs direct", "Hématologie", "Recherche d'anticorps fixés sur les globules rouges."),
    ("Test de Coombs indirect", "Hématologie", "Recherche d'anticorps sériques anti-érythrocytaires."),
    ("Hémoglobine (Hb)", "Hématologie", "Taux d'hémoglobine dans le sang."),
    ("Hématocrite (Hte)", "Hématologie", "Volume globulaire ou hématocrite."),
    ("Vitesse de Sédimentation (VS)", "Hématologie", "Vitesse de sédimentation à la 1ère et 2ème heure."),
    ("Réticulocytes", "Hématologie", "Numération des réticulocytes."),
    ("Électrophorèse de l'hémoglobine", "Hématologie", "Recherche d'hémoglobinopathies (drépanocytose, thalassémie)."),
    ("Test de Sickling (Emmel)", "Hématologie", "Test de falciformation pour la drépanocytose."),
    ("Frottis sanguin", "Hématologie", "Examen morphologique du sang (paludisme, formule)."),
    ("Goutte épaisse", "Parasitologie", "Recherche d'hématozoaires du paludisme (Plasmodium)."),
    ("Myélogramme", "Hématologie", "Examen cytologique de la moelle osseuse."),
    ("Numération des plaquettes", "Hématologie", "Taux de plaquettes sanguines."),

    # ── BIOCHIMIE ──
    ("Glycémie à jeun", "Biochimie", "Taux de glucose sanguin à jeun."),
    ("Glycémie post-prandiale", "Biochimie", "Taux de glucose sanguin après repas."),
    ("HGPO (Hyperglycémie provoquée par voie orale)", "Biochimie", "Test de tolérance au glucose par voie orale."),
    ("Hémoglobine glyquée (HbA1c)", "Biochimie", "Moyenne glycémique des 2-3 derniers mois."),
    ("Créatinine sanguine", "Biochimie", "Exploration de la fonction rénale."),
    ("Urée sanguine", "Biochimie", "Exploration de la fonction rénale."),
    ("Clairance de la créatinine", "Biochimie", "Mesure de la clairance rénale de la créatinine."),
    ("Acide urique", "Biochimie", "Taux d'acide urique sanguin."),
    ("Transaminases ASAT (TGO)", "Biochimie", "Évaluation de la fonction hépatique et musculaire."),
    ("Transaminases ALAT (TGP)", "Biochimie", "Évaluation de la fonction hépatique."),
    ("Phosphatases alcalines (PAL)", "Biochimie", "Évaluation de la fonction hépatique et osseuse."),
    ("Gamma-GT (GGT)", "Biochimie", "Évaluation de la fonction hépatique et des voies biliaires."),
    ("Bilirubine totale", "Biochimie", "Taux de bilirubine totale."),
    ("Bilirubine conjuguée", "Biochimie", "Taux de bilirubine directe ou conjuguée."),
    ("Bilirubine libre", "Biochimie", "Taux de bilirubine indirecte ou libre."),
    ("Protéines totales", "Biochimie", "Protidémie totale."),
    ("Albumine sanguine", "Biochimie", "Taux d'albumine sérique."),
    ("Électrophorèse des protéines", "Biochimie", "Séparation des protéines sériques."),
    ("Lipides sanguins : Cholestérol total", "Biochimie", "Bilan lipidique : cholestérol total."),
    ("Cholestérol HDL", "Biochimie", "Bilan lipidique : bon cholestérol."),
    ("Cholestérol LDL", "Biochimie", "Bilan lipidique : mauvais cholestérol."),
    ("Triglycérides", "Biochimie", "Bilan lipidique : triglycérides."),
    ("Bilan lipidique complet", "Biochimie", "Cholestérol total, HDL, LDL et triglycérides."),
    ("Sodium (Na+)", "Biochimie", "Ionogramme : natrémie."),
    ("Potassium (K+)", "Biochimie", "Ionogramme : kaliémie."),
    ("Chlore (Cl-)", "Biochimie", "Ionogramme : chlorémie."),
    ("Ionogramme sanguin complet", "Biochimie", "Na+, K+, Cl-, calcémie."),
    ("Calcémie (Calcium)", "Biochimie", "Taux de calcium sanguin."),
    ("Phosphorémie", "Biochimie", "Taux de phosphore sanguin."),
    ("Magnésémie (Magnésium)", "Biochimie", "Taux de magnésium sanguin."),
    ("Fer sérique", "Biochimie", "Taux de fer sanguin."),
    ("Ferritine", "Biochimie", "Réserve en fer de l'organisme."),
    ("Capacité totale de fixation du fer (TIBC)", "Biochimie", "Évaluation du métabolisme du fer."),
    ("Créatine phosphokinase (CPK)", "Biochimie", "Marqueur musculaire et cardiaque."),
    ("Lactate déshydrogénase (LDH)", "Biochimie", "Enzyme ubiquitaire, marqueur de lyse cellulaire."),
    ("Amylase sanguine", "Biochimie", "Enzyme pancréatique et salivaire."),
    ("Lipase sanguine", "Biochimie", "Enzyme pancréatique spécifique."),
    ("Troponine I (Troponine)", "Biochimie", "Marqueur de souffrance myocardique."),
    ("C-réactive protéine (CRP)", "Biochimie", "Marqueur biologique de l'inflammation."),
    ("CPR ultra sensible", "Biochimie", "Dosage haute sensibilité de la protéine C réactive."),

    # ── COAGULATION ──
    ("Temps de Quick (TP)", "Coagulation", "Temps de prothrombine et taux de prothrombine."),
    ("Temps de Céphaline Kaolin (TCK)", "Coagulation", "Temps de céphaline activé."),
    ("Temps de Saignement", "Coagulation", "Mesure de l'hémostase primaire."),
    ("Fibrinogène", "Coagulation", "Taux de fibrinogène plasmatique."),
    ("D-dimères", "Coagulation", "Marqueur de la fibrinolyse (thrombose)."),
    ("INR", "Coagulation", "Ratio international normalisé (suivi AVK)."),
    ("Bilan d'hémostase complet", "Coagulation", "TP, TCK, fibrinogène et temps de saignement."),

    # ── SÉROLOGIE / IMMUNOLOGIE ──
    ("Test de dépistage du VIH (VCT)", "Sérologie", "Dépistage des anticorps anti-VIH."),
    ("Sérologie VIH (Western Blot)", "Sérologie", "Test de confirmation de l'infection VIH."),
    ("CD4 (Lymphocytes T CD4)", "Immunologie", "Taux de lymphocytes CD4, suivi de l'infection VIH."),
    ("Charge virale VIH", "Immunologie", "Quantification de l'ARN viral VIH."),
    ("Antigène HBs (Hépatite B)", "Sérologie", "Dépistage de l'hépatite B."),
    ("Anticorps anti-HBs", "Sérologie", "Évaluation de la réponse vaccinale hépatite B."),
    ("Anticorps anti-HBc", "Sérologie", "Marqueur de contact avec le virus de l'hépatite B."),
    ("Sérologie Hépatite C (anti-VHC)", "Sérologie", "Dépistage des anticorps anti-hépatite C."),
    ("Sérologie Hépatite A", "Sérologie", "Anticorps anti-HAV (IgM et IgG)."),
    ("Sérologie Hépatite E", "Sérologie", "Anticorps anti-HEV."),
    ("Sérologie Syphilis (VDRL/TPHA)", "Sérologie", "Dépistage et confirmation de la syphilis."),
    ("Test rapide Syphilis", "Sérologie", "Dépistage rapide de la syphilis."),
    ("Widal (Fievre typhoide)", "Sérologie", "Agglutinines anti-Salmonella typhi et paratyphi."),
    ("Test de Widal", "Sérologie", "Sérodiagnostic de la fièvre typhoïde."),
    ("Test rapide paludisme (TDR)", "Parasitologie", "Test de diagnostic rapide du paludisme."),
    ("Sérologie Toxoplasmose (IgG/IgM)", "Sérologie", "Dépistage de la toxoplasmose."),
    ("Sérologie Rubéole (IgG/IgM)", "Sérologie", "Dépistage de la rubéole."),
    ("Sérologie CMV (IgG/IgM)", "Sérologie", "Dépistage du cytomégalovirus."),
    ("Test de grossesse (Beta-HCG)", "Hormonologie", "Dosage de l'hormone bêta-HCG."),
    ("Test de grossesse urinaire", "Urines", "Détection de la bêta-HCG dans les urines."),
    ("Anticorps anti-nucléaires (AAN)", "Immunologie", "Dépistage des maladies auto-immunes."),
    ("Antistreptolysines O (ASLO)", "Sérologie", "Marqueur d'infection streptococcique."),
    ("Test de Widal et Felix", "Sérologie", "Sérodiagnostic typhoïde et rickettsioses."),
    ("CRP (Proteine C reactive)", "Sérologie", "Marqueur inflammatoire non spécifique."),
    ("Sérologie Brucellose", "Sérologie", "Anticorps anti-Brucella."),
    ("Sérologie Dengue (NS1/IgM)", "Sérologie", "Dépistage de la dengue."),
    ("Sérologie Chikungunya", "Sérologie", "Anticorps anti-Chikungunya (IgM)."),
    ("Sérologie Herpès (HSV 1/2)", "Sérologie", "Anticorps anti-herpès simplex."),
    ("Sérologie Varicelle-Zona (VZV)", "Sérologie", "Anticorps anti-VZV."),
    ("Sérologie COVID-19 (IgG/IgM)", "Sérologie", "Anticorps anti-SARS-CoV-2."),
    ("HLA-B27", "Immunologie", "Typage génétique associé à la spondylarthrite."),

    # ── HORMONOLOGIE ──
    ("TSH (Thyréostimuline)", "Hormonologie", "Hormone de régulation thyroïdienne."),
    ("T3 (Triiodothyronine)", "Hormonologie", "Hormone thyroïdienne T3."),
    ("T4 libre", "Hormonologie", "Hormone thyroïdienne T4 libre."),
    ("Bilan thyroïdien complet", "Hormonologie", "TSH, T3 et T4 libre."),
    ("Prolactine", "Hormonologie", "Dosage de la prolactine."),
    ("FSH", "Hormonologie", "Hormone folliculo-stimulante."),
    ("LH", "Hormonologie", "Hormone lutéinisante."),
    ("Testostérone", "Hormonologie", "Dosage de la testostérone totale."),
    ("Cortisol", "Hormonologie", "Dosage du cortisol sanguin."),
    ("Insuline", "Hormonologie", "Dosage de l'insuline sanguine."),
    ("17-OH Progestérone", "Hormonologie", "Dosage de la 17-hydroxyprogestérone."),
    ("Oestradiol (E2)", "Hormonologie", "Dosage de l'oestradiol."),
    ("Progestérone", "Hormonologie", "Dosage de la progestérone plasmatique."),
    ("Peptide C", "Hormonologie", "Évaluation de la sécrétion d'insuline."),
    ("PTH (Parathormone)", "Hormonologie", "Dosage de la parathormone."),
    ("Vitamine D (25-OH)", "Hormonologie", "Dosage de la vitamine D."),
    ("Alpha-fœtoprotéine (AFP)", "Hormonologie", "Marqueur tumoral et de dépistage prénatal."),
    ("CA 19-9", "Hormonologie", "Marqueur tumoral digestif."),
    ("CA 125", "Hormonologie", "Marqueur tumoral ovarien."),
    ("PSA (Antigène prostatique spécifique)", "Hormonologie", "Dépistage et suivi du cancer de la prostate."),

    # ── BACTÉRIOLOGIE / PARASITOLOGIE ──
    ("Examen Cytobactériologique des Urines (ECBU)", "Bactériologie", "Analyse des urines avec culture et antibiogramme."),
    ("Bandelette urinaire", "Urines", "Analyse qualitative rapide des urines."),
    ("Examen Parasitologique des Selles (EPS)", "Parasitologie", "Recherche de parasites et d'œufs dans les selles."),
    ("Culture des selles", "Bactériologie", "Coproculture avec antibiogramme."),
    ("Prélèvement vaginal (PV)", "Bactériologie", "Examen cytobactériologique du prélèvement vaginal."),
    ("Prélèvement urétral", "Bactériologie", "Examen cytobactériologique du prélèvement urétral."),
    ("Spermoculture", "Bactériologie", "Culture de sperme avec antibiogramme."),
    ("Spermogramme", "Bactériologie", "Analyse du sperme (numération, mobilité, morphologie)."),
    ("Crachat : BAAR", "Bactériologie", "Recherche de bacilles acido-alcoolo-résistants (tuberculose)."),
    ("Culture de crachats", "Bactériologie", "Examen bactériologique des crachats avec antibiogramme."),
    ("Culture du LCR", "Bactériologie", "Examen bactériologique du liquide céphalorachidien."),
    ("Hémoculture", "Bactériologie", "Recherche de bactéries dans le sang."),
    ("Antibiogramme", "Bactériologie", "Test de sensibilité aux antibiotiques."),
    ("Test de Ziehl-Neelsen", "Bactériologie", "Recherche de mycobactéries (tuberculose)."),
    ("Examen de selles (coproculture)", "Parasitologie", "Recherche de germes pathogènes dans les selles."),
    ("Scatologie", "Parasitologie", "Examen macroscopique et microscopique des selles."),

    # ── URINES ──
    ("Examen complet des urines", "Urines", "Bandelette + sédiment urinaire."),
    ("Protéinurie des 24h", "Urines", "Dosage des protéines urinaires sur 24 heures."),
    ("Glycosurie", "Urines", "Recherche de sucre dans les urines."),
    ("Albumine/créatinine urinaire (RAC)", "Urines", "Rapport albumine/créatinine urinaire."),
    ("Test de grossesse urinaire (HCG)", "Urines", "Détection précoce de la grossesse."),

    # ── AUTRES ──
    ("Examen cytologique du LCR", "Autres", "Numération et formule des cellules du LCR."),
    ("Ponction lombaire : chimie", "Autres", "Glucose, protéines et chlorures du LCR."),
    ("Examen cytologique (ascite/pleurésie)", "Autres", "Analyse cytologique d'un liquide d'épanchement."),
    ("Test de Schiller", "Autres", "Test de coloration à l'iode du col de l'utérus."),
    ("Test d'Emmel (drépanocytose)", "Hématologie", "Test de falciformation des globules rouges."),
    ("Test de Guthrie", "Autres", "Dépistage néonatal de la phénylcétonurie."),
    ("Kit prélèvement COVID-19 (PCR)", "Bactériologie", "Prélèvement nasopharyngé pour RT-PCR SARS-CoV-2."),
    ("PCR Tuberculose (GeneXpert)", "Bactériologie", "Détection moléculaire de la tuberculose et résistances."),
]


def seed():
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM analyses_biologiques")).scalar()
        if count >= len(ANALYSES):
            print(f"La table contient déjà {count} analyses. Rien à faire.")
            return

        insert_stmt = text("""
            INSERT INTO analyses_biologiques (nom, categorie, description)
            VALUES (:nom, :categorie, :description)
        """)

        for nom, categorie, description in ANALYSES:
            conn.execute(insert_stmt, {
                "nom": nom,
                "categorie": categorie,
                "description": description,
            })

        print(f"{len(ANALYSES)} analyses insérées avec succès.")


if __name__ == "__main__":
    seed()
