"""Service d'envoi d'emails (SMTP) avec repli en mode développement.

Si SMTP_HOST n'est pas configuré (dev), les emails ne sont pas réellement
envoyés : ils sont journalisés dans les logs backend et le lien / code est
renvoyé dans la réponse des endpoints concernés pour pouvoir tester.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import settings

logger = logging.getLogger(__name__)


def email_enabled() -> bool:
    return bool(settings.SMTP_HOST)


def _build_message(to: str, subject: str, text: str, html: str | None) -> MIMEMultipart:
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
    message["To"] = to
    message.attach(MIMEText(text, "plain", "utf-8"))
    if html:
        message.attach(MIMEText(html, "html", "utf-8"))
    return message


def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    """Envoie un email via SMTP, ou le journalise si SMTP non configuré."""
    if not email_enabled():
        print(
            f"\n[EMAIL DEV] To={to} | Subject={subject}\n{html or text}\n",
            flush=True,
        )
        return

    message = _build_message(to, subject, text, html)
    try:
        if settings.SMTP_SECURITY == "ssl":
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
        try:
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        finally:
            server.quit()
        logger.info("Email envoyé à %s (sujet: %s)", to, subject)
    except Exception as exc:  # pragma: no cover - dépend du réseau
        logger.error("Échec de l'envoi de l'email à %s : %s", to, exc)
        raise


def _shell(subject: str, body: str) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <div style="font-size:22px;font-weight:bold;color:#2F80ED;margin-bottom:16px;">Néré Health</div>
      <div style="font-size:15px;color:#374151;line-height:1.6;">{body}</div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
        Néré Health — Plateforme de santé numérique. Si vous n'êtes pas à l'origine de cette action, ignorez cet email.
      </div>
    </div>
    """


def _verification_text_link(token: str, base_url: str | None = None) -> str:
    base = (base_url or settings.FRONTEND_URL).rstrip("/")
    return f"{base}/verify-email?token={token}"


def send_verification_email(to: str, prenom: str, token: str, code: str, base_url: str | None = None) -> None:
    """Envoie l'email de confirmation d'adresse (lien + code à 6 chiffres)."""
    link = _verification_text_link(token, base_url)
    subject = "Confirmez votre adresse email — Néré Health"
    minutes_or_hours = (
        f"{int(settings.EMAIL_VERIFICATION_EXPIRE_HOURS * 60)} minutes"
        if settings.EMAIL_VERIFICATION_EXPIRE_HOURS < 1
        else (
            f"{int(settings.EMAIL_VERIFICATION_EXPIRE_HOURS)} h"
            if settings.EMAIL_VERIFICATION_EXPIRE_HOURS.is_integer()
            else f"{settings.EMAIL_VERIFICATION_EXPIRE_HOURS} h"
        )
    )
    text = (
        f"Bonjour {prenom},\n\n"
        f"Merci de vous être inscrit(e) sur Néré Health. Pour activer votre compte, "
        f"veuillez confirmer votre adresse email en cliquant sur le lien suivant :\n\n"
        f"{link}\n\n"
        f"Ou saisissez ce code de confirmation sur la page : {code}\n\n"
        f"Ce lien et ce code expirent dans {minutes_or_hours}."
    )
    html = _shell(
        subject,
        f"<p>Bonjour <b>{prenom}</b>,</p>"
        f"<p>Merci de vous être inscrit(e) sur Néré Health. Pour activer votre compte, "
        f"confirmez votre adresse email :</p>"
        f'<p style="text-align:center;margin:24px 0;">'
        f'<a href="{link}" style="background-color:#2F80ED;color:#ffffff;padding:12px 28px;'
        f'border-radius:8px;text-decoration:none;font-weight:bold;">Confirmer mon adresse</a></p>'
        f"<p>Ou saisissez ce code de confirmation : "
        f'<b style="font-size:20px;letter-spacing:2px;">{code}</b></p>'
        f"<p style='color:#9ca3af;font-size:12px;'>Ce lien et ce code expirent dans "
        f"{minutes_or_hours}.</p>",
    )
    send_email(to, subject, text, html)


def _security_alert_body(
    prenom: str, action: str, detail: str, advice: str
) -> tuple[str, str]:
    subject = f"Sécurité de votre compte — Néré Health"
    text = (
        f"Bonjour {prenom},\n\n"
        f"{action}\n\n"
        f"{detail}\n"
        f"{advice}\n\n"
        f"Si vous n'êtes pas à l'origine de cette action, changez immédiatement "
        f"votre mot de passe et activez la double authentification, puis contactez-nous."
    )
    html = _shell(
        subject,
        f"<p>Bonjour <b>{prenom}</b>,</p>"
        f"<p>{action}</p>"
        f"<p>{detail}</p>"
        f"<p style='color:#9ca3af;'>{advice}</p>"
        f"<p style='color:#9ca3af;font-size:12px;'>Si vous n'êtes pas à l'origine de cette "
        f"action, changez immédiatement votre mot de passe, activez la double authentification "
        f"et contactez le support.</p>",
    )
    return subject, html


def send_password_changed_email(to: str, prenom: str) -> None:
    """Alerte envoyée quand le mot de passe du compte est modifié."""
    subject, html = _security_alert_body(
        prenom,
        "Votre mot de passe a été modifié avec succès.",
        "Si c'était bien vous, aucune action n'est nécessaire.",
        "Si ce n'était pas vous, votre compte est peut-être compromis.",
    )
    send_email(to, subject, "", html)


def send_2fa_enabled_email(to: str, prenom: str) -> None:
    """Alerte envoyée quand la double authentification est activée."""
    subject, html = _security_alert_body(
        prenom,
        "La double authentification (2FA) a été activée sur votre compte.",
        "À chaque connexion, un code à 6 chiffres sera désormais requis.",
        "Conservez vos codes de récupération et votre application d'authentification en sécurité.",
    )
    send_email(to, subject, "", html)


def send_2fa_disabled_email(to: str, prenom: str) -> None:
    """Alerte envoyée quand la double authentification est désactivée."""
    subject, html = _security_alert_body(
        prenom,
        "La double authentification (2FA) a été désactivée sur votre compte.",
        "Seul votre mot de passe est désormais requis pour vous connecter.",
        "La désactivation réduit la sécurité de votre compte.",
    )
    send_email(to, subject, "", html)


def send_account_activated_email(to: str, prenom: str) -> None:
    """Email envoyé au médecin quand son compte est validé par un administrateur."""
    subject = "Votre compte a été validé — Néré Health"
    text = (
        f"Bonjour {prenom},\n\n"
        f"Votre compte Néré Health a été validé par un administrateur. "
        f"Vous pouvez désormais vous connecter et gérer votre planning.\n\n"
        f"Accédez à votre espace : {settings.FRONTEND_URL.rstrip('/')}\n\n"
        f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
    )
    html = _shell(
        subject,
        f"<p>Bonjour <b>{prenom}</b>,</p>"
        f"<p>Votre compte Néré Health a été <b>validé</b> par un administrateur. "
        f"Vous pouvez désormais vous connecter et gérer votre planning.</p>"
        f'<p style="margin-top:20px;"><a href="{settings.FRONTEND_URL.rstrip("/")}" '
        f'style="background:#27AE60;color:#fff;padding:12px 24px;border-radius:8px;'
        f'text-decoration:none;font-weight:bold;">Accéder à mon espace</a></p>'
        f"<p style='color:#9ca3af;font-size:12px;'>Si vous n'êtes pas à l'origine de "
        f"cette demande, ignorez cet email.</p>",
    )
    send_email(to, subject, text, html)


def _reset_text_link(token: str, base_url: str | None = None) -> str:
    base = (base_url or settings.FRONTEND_URL).rstrip("/")
    return f"{base}/reset-password?token={token}"


def send_reset_password_email(to: str, prenom: str, token: str, base_url: str | None = None) -> None:
    """Envoie l'email de réinitialisation du mot de passe (lien)."""
    link = _reset_text_link(token, base_url)
    subject = "Réinitialisation de votre mot de passe — Néré Health"
    text = (
        f"Bonjour {prenom},\n\n"
        f"Vous avez demandé la réinitialisation de votre mot de passe Néré Health. "
        f"Cliquez sur le lien suivant pour le réinitialiser :\n\n"
        f"{link}\n\n"
        f"Ce lien expire dans 24 h. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
    )
    html = _shell(
        subject,
        f"<p>Bonjour <b>{prenom}</b>,</p>"
        f"<p>Vous avez demandé la réinitialisation de votre mot de passe Néré Health. "
        f"Cliquez sur le bouton ci-dessous :</p>"
        f'<p style="text-align:center;margin:24px 0;">'
        f'<a href="{link}" style="background-color:#2F80ED;color:#ffffff;padding:12px 28px;'
        f'border-radius:8px;text-decoration:none;font-weight:bold;">Réinitialiser le mot de passe</a></p>'
        f"<p style='color:#9ca3af;font-size:12px;'>Ce lien expire dans 24 h. "
        f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>",
    )
    send_email(to, subject, text, html)
