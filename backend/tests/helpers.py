PREFIX = "/api"


def verify_registered_user(client, register_response, email: str | None = None) -> None:
    """Confirme l'email d'un utilisateur fraîchement inscrit via le jeton de dev."""
    data = register_response.json()
    token = (data or {}).get("dev_verification_token")
    if token:
        vr = client.post(f"{PREFIX}/auth/verify-email", json={"token": token})
        assert vr.status_code == 200, vr.text
