# Déploiement LiveKit (téléconsultation)

LiveKit est le serveur de visioconférence (WebRTC) utilisé par la
téléconsultation de Néré Health. Les clients se connectent via un token JWT
généré par le backend (`GET /api/rendez_vous/{id}/token`).

## Architecture

```
 Navigateur (patient/médecin)
   │  wss://visio.exemple.fr   (signalisation + chat, via Caddy/SSL)
   ├──────────────► Caddy:443 ──► livekit:7880
   │  flux média vidéo/audio (UDP 50000-50100, TCP 7881, UDP 7882)
   └──────────────────────────► livekit (direct, pas de proxy)
```

- **Caddy** gère le HTTPS (Let's Encrypt) et le reverse-proxy WebSocket.
- **livekit-server** gère le signalement, le relais des flux média et le
  data-channel du chat de consultation.

## Prérequis

- Un VPS (≥ 2 Go de RAM, Ubuntu/Debian) avec une adresse IP publique.
- Un domaine (ex. `visio.exemple.fr`) dont le DNS pointe vers l'IP du VPS.
- Docker + docker compose plugin installés sur le VPS.

## Étapes

1. **Récupérer ce dossier sur le VPS** (depuis le dépôt du projet) :

   ```bash
   scp -r livekit root@IP_VPS:/opt/nere-livekit
   ```

2. **Configurer** :

   ```bash
   cd /opt/nere-livekit
   cp .env.example .env
   # Éditer .env :
   #   - LIVEKIT_API_KEY / LIVEKIT_API_SECRET : changer le secret
   #     (python3 -c "import secrets; print(secrets.token_urlsafe(32))")
   #   - VISIO_DOMAIN : visio.exemple.fr
   vi .env
   ```

3. **Ouvrir les ports** (UFW, exemple) :

   ```bash
   ufw allow 80,443/tcp
   ufw allow 7881/tcp
   ufw allow 7882/udp
   ufw allow 50000:50100/udp
   ```

4. **Démarrer** :

   ```bash
   docker compose up -d
   docker compose logs -f livekit
   ```

   Le certificat SSL pour `visio.exemple.fr` est généré automatiquement.

5. **Vérifier** :

   ```bash
   curl -k https://visio.exemple.fr  # doit répondre
   docker compose logs livekit | grep -i "node id"
   ```

6. **Connecter le backend de Néré Health** (variables d'environnement) :

   ```env
   LIVEKIT_URL=wss://visio.exemple.fr
   LIVEKIT_API_KEY=<clé du .env>
   LIVEKIT_API_SECRET=<secret du .env>
   ```

   Puis redémarrer le backend.

## Test en local (LAN, sans VPS)

Le `docker-compose.yml` racine inclut déjà un service `livekit` (config
`livekit/livekit.local.yaml`, `node_ip` = IP de la machine de dev). Les deux
parties (patient + médecin) doivent être sur le même réseau :

```bash
docker compose up -d --build
# IP machine : 172.20.10.10 (adapter LIVEKIT_RTC_NODE_IP et LIVEKIT_URL si besoin)
```

- Signalisation : `ws://<IP_MACHINE>:7880`
- Ouvrir l'app en `http://<IP_MACHINE>:4173` depuis les deux appareils.
- Caméra/micro nécessitent **HTTPS** (ou `localhost`) : sur un téléphone en
  LAN, utiliser un navigateur qui autorise getUserMedia sur IP privée
  (Chrome autorise `localhost` ; sinon passer par le VPS en HTTPS).

## Sécurité / notes

- `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` signent les tokens : le backend les
  possède, ils ne doivent jamais être exposés côté navigateur.
- Le room est `nere-<uuid du RDV>` : un utilisateur ne peut obtenir le token
  que s'il est le médecin ou le patient de ce RDV (403 sinon).
- Pour les réseaux très restrictifs, ajouter un serveur TURN (coturn) en plus
  de LiveKit (ports 3478/5349) — recommandé pour la production.
