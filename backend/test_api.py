import json
import random
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "http://localhost:8100"


def request(method, path, data=None, token=None, form=False):
    url = BASE_URL + path
    headers = {}
    body = None
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="ignore")
        print(f"HTTPError {exc.code} {path}: {body}")
        raise
    except urllib.error.URLError as exc:
        print(f"URLError {path}: {exc}")
        raise


def main():
    print("GET / ->", request("GET", "/"))
    print("GET /health ->", request("GET", "/health"))

    email = f"test.user.{random.randint(100000,999999)}@example.com"
    print("Registering user", email)
    user = request("POST", "/auth/register", {
        "email": email,
        "password": "Password123!",
        "prenom": "Test",
        "nom": "User",
        "telephone": f"+237655{random.randint(100000, 999999)}"
    })
    print("Registered user id", user.get("id"), "role", user.get("role"))

    print("Logging in admin")
    token_data = request(
        "POST",
        "/auth/token",
        {"username": "test.admin.123@example.com", "password": "Secret123!"},
        form=True,
    )
    token = token_data["access_token"]
    print("Admin token obtained")

    notification = request(
        "POST",
        "/api/notifications",
        {
            "utilisateur_id": user["id"],
            "type": "nouveau_message",
            "titre": "Test notification",
            "contenu": "This is a test from backend validation.",
            "canal": "in_app",
            "statut": "en_attente",
        },
        token=token,
    )
    print("Created notification", notification)

    notifications = request("GET", "/api/notifications", token=token)
    print("Notifications list count", len(notifications))
    print("First notification", notifications[0] if notifications else None)


if __name__ == "__main__":
    main()
