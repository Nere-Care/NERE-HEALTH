import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings




def envoyer_email(destinataire: str, sujet: str, corps_html: str):
    """Envoie un email HTML. Ne bloque pas l'application si echec."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = sujet
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = destinataire

        msg.attach(MIMEText(corps_html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Echec envoi a {destinataire}: {e}")
        return False


def email_medecin_valide(prenom: str, nom: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">NERE Health</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #16a34a;">Compte approuvé !</h2>
            <p>Bonjour Dr. {prenom} {nom},</p>
            <p>
                Nous avons le plaisir de vous informer que votre compte professionnel
                sur NERE Health a été <strong>vérifié et activé</strong> par notre équipe.
            </p>
            <p>
                Vous pouvez dès à présent vous connecter à votre espace médecin et commencer
                à recevoir des demandes de consultation de patients.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="http://localhost:4173" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Accéder à mon espace
                </a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">
                Merci de votre confiance et bienvenue sur NERE Health.
            </p>
        </div>
    </div>
    """


def email_medecin_rejete(prenom: str, nom: str, motif: str = "") -> str:
    motif_html = f"<p><strong>Motif :</strong> {motif}</p>" if motif else ""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">NERE Health</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #dc2626;">Vérification non aboutie</h2>
            <p>Bonjour Dr. {prenom} {nom},</p>
            <p>
                Après examen de votre dossier, nous ne sommes malheureusement pas en mesure
                de valider votre compte professionnel pour le moment.
            </p>
            {motif_html}
            <h3 style="color: #374151; margin-top: 24px;">Procédure à suivre :</h3>
            <ol style="color: #374151; line-height: 1.8;">
                <li>Vérifiez que votre numéro d'ordre professionnel est correct et lisible.</li>
                <li>Assurez-vous que vos documents justificatifs (diplôme, certification) sont nets et complets.</li>
                <li>Connectez-vous à votre espace et soumettez à nouveau vos documents corrigés.</li>
                <li>Contactez notre support à support@nere-health.cm si vous pensez qu'il s'agit d'une erreur.</li>
            </ol>
            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                Nous restons à votre disposition pour vous accompagner dans cette démarche.
            </p>
        </div>
    </div>
    """