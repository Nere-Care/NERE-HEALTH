import io
import json
import os
import hashlib
import tempfile
from datetime import datetime
from fpdf import FPDF
import qrcode

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "pdfs")
os.makedirs(UPLOAD_DIR, exist_ok=True)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://nere-health.app")

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
FALLBACK_FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")


def _resolve_font():
    for d in [FONT_DIR, FALLBACK_FONT_DIR]:
        regular = os.path.join(d, "DejaVuSans.ttf")
        bold = os.path.join(d, "DejaVuSans-Bold.ttf")
        if os.path.exists(regular) and os.path.exists(bold):
            return regular, bold
    return None, None


FONT_REGULAR, FONT_BOLD = _resolve_font()
USE_UNICODE = FONT_REGULAR is not None
FALLBACK = "Helvetica"


class OrdonnancePDF(FPDF):
    def __init__(self, structure_name="", structure_address=""):
        super().__init__()
        self._structure_name = structure_name or "NERE-HEALTH"
        self._structure_address = structure_address or ""

        if USE_UNICODE:
            self.add_font("DJV", "", FONT_REGULAR, uni=True)
            self.add_font("DJV", "B", FONT_BOLD, uni=True)
            self._font = "DJV"
        else:
            self._font = FALLBACK

    def header(self):
        self.set_x(10)
        self.set_font(self._font, "B", 16)
        self.cell(0, 10, self._structure_name, ln=True, align="C")

        self.set_x(10)
        self.set_font(self._font, "", 9)
        if self._structure_address:
            self.cell(0, 5, self._structure_address, ln=True, align="C")
        self.cell(0, 5, "Plateforme de santé numérique", ln=True, align="C")

        self.line(10, self.get_y() + 2, 200, self.get_y() + 2)
        self.ln(6)

    def footer(self):
        self.set_y(-20)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(2)
        self.set_x(10)
        self.set_font(self._font, "", 8)
        self.cell(0, 5, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, txt):
        self.set_x(10)
        self.set_font(self._font, "B", 10)
        self.multi_cell(0, 6, txt)

    def body_text(self, txt):
        self.set_x(10)
        self.set_font(self._font, "", 10)
        self.multi_cell(0, 6, txt)

    def body_text_small(self, txt):
        self.set_x(10)
        self.set_font(self._font, "", 9)
        self.multi_cell(0, 5, txt)

    def body_italic(self, txt):
        self.set_x(10)
        self.set_font(self._font, "", 9)
        self.multi_cell(0, 5, txt)

    def body_multi(self, txt):
        self.set_x(10)
        self.set_font(self._font, "", 10)
        self.multi_cell(0, 6, txt)

    def body_multi_small(self, txt):
        self.set_x(10)
        self.set_font(self._font, "", 9)
        self.multi_cell(0, 5, txt)


def _pdf_title(type_ordonnance: str) -> str:
    return {
        "medicament": "ORDONNANCE MÉDICALE",
        "biologie": "DEMANDE D'EXAMENS BIOLOGIQUES",
        "imagerie": "DEMANDE D'EXAMENS D'IMAGERIE MÉDICALE",
    }.get(type_ordonnance, "ORDONNANCE")


def _doc_type(type_ordonnance: str) -> str:
    return {
        "medicament": "ordonnance_scannee",
        "biologie": "ordonnance_biologie",
        "imagerie": "ordonnance_imagerie",
    }.get(type_ordonnance, "ordonnance_scannee")


def _unite_quantite(forme: str) -> str:
    f = (forme or "").lower().strip()
    if f in ("sirop", "injectable", "inhalateur"):
        return "flacon(s)"
    if f in ("creme", "pommade"):
        return "tube(s)"
    return "boîte(s)"


def _build_qr_data(ordonnance) -> str:
    numero = getattr(ordonnance, "numero", "") or ""
    frontend_url = FRONTEND_URL.rstrip("/")
    url = f"{frontend_url}/prescription/{numero}"
    payload = {
        "type": "nere_ordonnance",
        "numero": numero,
        "url": url,
    }
    return json.dumps(payload, ensure_ascii=False)


def _generate_qr_image(qr_data: str) -> str:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name, format="PNG")
    return tmp.name


def generate_ordonnance_pdf(ordonnance, patient_user, medecin_user=None, medecin_info=None, structure=None) -> dict:
    struct_name = ""
    struct_address = ""
    if structure:
        struct_name = getattr(structure, "nom_etablissement", "") or ""
    if medecin_user:
        struct_address = getattr(medecin_user, "adresse", "") or ""
    if not struct_address and structure:
        struct_address = getattr(structure, "ville", "") or ""

    if not struct_name:
        struct_name = getattr(ordonnance, "structure_nom", None) or "NERE-HEALTH"

    pdf = OrdonnancePDF(structure_name=struct_name, structure_address=struct_address)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    type_ordonnance = ordonnance.type_ordonnance or "medicament"
    now = datetime.now()

    # --- Title ---
    pdf.set_x(10)
    pdf.set_font(pdf._font, "B", 14)
    pdf.cell(0, 10, _pdf_title(type_ordonnance), ln=True, align="C")
    pdf.ln(2)

    start_y = pdf.get_y()
    eff_w = 145

    # --- Patient info ---
    pdf.set_x(10)
    pdf.set_font(pdf._font, "B", 10)
    pdf.multi_cell(eff_w, 6, "Patient")
    patient_name = f"{getattr(patient_user, 'prenom', '') or ''} {getattr(patient_user, 'nom', '') or ''}".strip()
    pdf.set_x(10)
    pdf.set_font(pdf._font, "", 10)
    pdf.multi_cell(eff_w, 5, f"Nom et prénom : {patient_name}")
    if getattr(patient_user, "date_naissance", None):
        pdf.set_x(10)
        pdf.multi_cell(eff_w, 5, f"Date de naissance : {patient_user.date_naissance}")
    pdf.ln(3)

    # --- Prescripteur info ---
    pdf.set_x(10)
    pdf.set_font(pdf._font, "B", 10)
    pdf.multi_cell(eff_w, 6, "Prescripteur")
    pdf.set_x(10)
    pdf.set_font(pdf._font, "", 10)
    if medecin_user:
        med_name = f"Dr. {getattr(medecin_user, 'prenom', '') or ''} {getattr(medecin_user, 'nom', '') or ''}".strip()
        pdf.set_x(10)
        pdf.multi_cell(eff_w, 5, f"Nom et prénom : {med_name}")
        if medecin_info:
            specs = getattr(medecin_info, "expertises", None) or []
            if specs:
                pdf.set_x(10)
                pdf.multi_cell(eff_w, 5, f"Spécialité : {', '.join(specs)}")
            numero = getattr(medecin_info, "numero_ordre", "")
            if numero:
                pdf.set_x(10)
                pdf.multi_cell(eff_w, 5, f"Numéro d'ordre : {numero}")
    elif ordonnance.medecin_nom_libre:
        pdf.set_x(10)
        pdf.multi_cell(eff_w, 5, f"Nom : {ordonnance.medecin_nom_libre}")
    pdf.ln(3)

    # --- Date + Référence ---
    pdf.set_x(10)
    pdf.set_font(pdf._font, "", 9)
    pdf.multi_cell(eff_w, 5, f"Date : {now.strftime('%d/%m/%Y')}  Heure : {now.strftime('%H:%M')}")
    if ordonnance.numero:
        pdf.set_x(10)
        pdf.multi_cell(eff_w, 5, f"Référence : {ordonnance.numero}")
    pdf.ln(4)

    # --- QR code (top right corner) ---
    if ordonnance.numero:
        try:
            qr_data = _build_qr_data(ordonnance)
            qr_path = _generate_qr_image(qr_data)
            pdf.image(qr_path, x=160, y=start_y, w=30, h=30)
            os.unlink(qr_path)
        except Exception:
            pass

    if pdf.get_y() < start_y + 32:
        pdf.set_y(start_y + 32)

    pdf.set_x(10)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)

    # --- Motif ---
    if ordonnance.motif:
        pdf.section_title("Motif / Diagnostic")
        pdf.body_multi(ordonnance.motif)
        pdf.ln(3)

    # --- Lignes ---
    if type_ordonnance == "medicament":
        pdf.section_title("Prescription Médicamenteuse")
        pdf.ln(2)
        lignes = ordonnance.lignes or []
        for i, l in enumerate(lignes):
            pdf.set_x(10)
            pdf.set_font(pdf._font, "B", 10)
            pdf.multi_cell(0, 6, f"{i + 1}. {l.medicament_nom}")
            details = []
            if l.dosage:
                details.append(f"Dosage : {l.dosage}")
            if l.forme and l.forme != "autre":
                details.append(f"Forme : {l.forme}")
            if l.quantite:
                unite_qte = _unite_quantite(l.forme)
                details.append(f"Quantité : {l.quantite} {unite_qte}")
            pdf.set_x(10)
            pdf.set_font(pdf._font, "", 9)
            if details:
                pdf.multi_cell(0, 5, "    • " + "   • ".join(details))
            if l.posologie:
                pdf.set_x(10)
                pdf.multi_cell(0, 5, f"    • Posologie : {l.posologie}")
            pdf.ln(3)

    elif type_ordonnance == "biologie":
        pdf.section_title("Examens Biologiques Demandés")
        pdf.ln(2)
        lignes = ordonnance.lignes or []
        for i, l in enumerate(lignes):
            cat = l.dosage or ""
            label = l.medicament_nom
            if cat:
                label += f" ({cat})"
            pdf.set_x(10)
            pdf.set_font(pdf._font, "", 10)
            pdf.multi_cell(0, 6, f"  {i + 1}. {label}")
            if l.posologie:
                pdf.set_x(10)
                pdf.set_font(pdf._font, "", 9)
                pdf.multi_cell(0, 5, f"      Indication : {l.posologie}")
            pdf.ln(2)

    elif type_ordonnance == "imagerie":
        pdf.section_title("Examens d'Imagerie Médicale Demandés")
        pdf.ln(2)
        lignes = ordonnance.lignes or []
        for i, l in enumerate(lignes):
            pdf.set_x(10)
            pdf.set_font(pdf._font, "", 10)
            pdf.multi_cell(0, 6, f"  {i + 1}. {l.medicament_nom}")
            if l.posologie:
                pdf.set_x(10)
                pdf.set_font(pdf._font, "", 9)
                pdf.multi_cell(0, 5, f"      Indication : {l.posologie}")
            pdf.ln(2)

    # --- Notes ---
    if ordonnance.notes_medecin:
        pdf.ln(2)
        pdf.section_title("Instructions / Notes du Médecin")
        pdf.body_multi(ordonnance.notes_medecin)

    # --- Signature ---
    pdf.ln(12)
    pdf.set_x(10)
    pdf.set_font(pdf._font, "B", 10)
    pdf.multi_cell(0, 5, "Signature et cachet du médecin :", align="R")
    pdf.ln(15)
    if medecin_user:
        med_name = f"Dr. {getattr(medecin_user, 'prenom', '') or ''} {getattr(medecin_user, 'nom', '') or ''}".strip()
        pdf.set_x(10)
        pdf.set_font(pdf._font, "", 9)
        pdf.multi_cell(0, 5, med_name, align="R")

    # --- Save ---
    filename = f"{ordonnance.numero}_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    pdf.output(filepath)

    with open(filepath, "rb") as f:
        checksum = hashlib.sha256(f.read()).hexdigest()
    file_size = os.path.getsize(filepath)

    return {
        "filepath": filepath,
        "filename": filename,
        "checksum": checksum,
        "file_size": file_size,
        "doc_type": _doc_type(type_ordonnance),
        "url": f"/uploads/pdfs/{filename}",
    }
