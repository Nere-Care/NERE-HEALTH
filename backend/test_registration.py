import json
import ssl
import subprocess
import time
import urllib.parse
import urllib.request

api = "http://127.0.0.1:8100"
email = f"test.medecin.{int(time.time())}@example.com"
user_data = {
    "email": email,
    "password": "Passw0rd!",
    "prenom": "Jean",
    "nom": "Dupont",
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    f"{api}/auth/register",
    data=json.dumps(user_data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, context=ctx) as r:
    reg = json.loads(r.read().decode())
print("register", reg)

login_data = {"username": email, "password": "Passw0rd!"}
req = urllib.request.Request(
    f"{api}/auth/token",
    data=urllib.parse.urlencode(login_data).encode(),
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
with urllib.request.urlopen(req, context=ctx) as r:
    tok = json.loads(r.read().decode())
print("token", tok)

token = tok["access_token"]

query_user = f"select id,email,prenom,nom,telephone,role,statut from users where email='{email}'"
res_user = subprocess.run(
    ["docker", "exec", "nere_app-db-1", "psql", "-U", "nere_user", "-d", "nere_db", "-c", query_user],
    capture_output=True,
    text=True,
)
print("db user", res_user.stdout)
