# 🔐 PLAN D'AUDIT ET CORRECTION DE SÉCURITÉ - NERE APP

**Date**: 20 Avril 2026
**Audit Level**: Expert Cybersécurité + Pentesting
**Score Initial**: 2/10 🔴 CRITIQUE
**Objectif**: Production-Ready à 100% (Score 9/10+)

---

## 📋 TABLE DES MATIÈRES
1. [Failles Critiques](#phase-1-failles-critiques)
2. [Failles Hautes](#phase-2-failles-hautes)
3. [Failles Moyennes](#phase-3-failles-moyennes)
4. [Tests Obligatoires](#tests-obligatoires)
5. [Checklist de Déploiement](#checklist-déploiement)

---

## PHASE 1: FAILLES CRITIQUES (BLOQUANTES)

### 🚨 FAILLE #1: SECRETS CODÉS EN DUR
**Fichiers**: `docker-compose.yml`, `config.py`
**Niveau**: CRITIQUE
**Impact**: Accès DB root, Compromission JWT, Exposition API keys

**Corrections**:
- ✅ Créer `.env.production.template` sans valeurs
- ✅ Implémenter gestionnaire de secrets (python-dotenv avec validation)
- ✅ Retirer toutes valeurs sensibles des fichiers de code
- ✅ Ajouter hooks pre-commit pour détecter les secrets
- ✅ Rotation automatique des secrets tous les 90 jours

**Tests**:
- Vérifier que `SECRET_KEY='change-me'` lève exception en production
- Vérifier que les secrets sont obligatoires non-vides
- Vérifier pas de credentials en hardcoding

---

### 🚨 FAILLE #2: CORS TROP PERMISSIF
**Fichier**: `main.py` (lignes 101-106)
**Niveau**: CRITIQUE
**Impact**: Vulnérabilités CORS, Attaques CSRF, Exposition credentials

**Corrections**:
- ✅ Restreindre origins à domaines spécifiques UNIQUEMENT
- ✅ Désactiver `allow_methods=["*"]` → spécifier méthodes
- ✅ Désactiver `allow_headers=["*"]` → spécifier headers
- ✅ Appliquer Policy CORS stricte même en dev
- ✅ Ajouter validation `Origin` header

**Tests**:
- Test origin non-autorisée → 403 Forbidden
- Test CORS preflight request
- Test credentials avec CORS

---

### 🚨 FAILLE #3: VALIDATION HOSTS INSUFFISANTE
**Fichier**: `main.py` (lignes 75-89)
**Niveau**: CRITIQUE
**Impact**: Host header poisoning, Cache poisoning

**Corrections**:
- ✅ Valider hosts TOUS environnements (pas seulement production)
- ✅ Rejeter requests sans Host valide
- ✅ Implémenter whitelist stricte de hosts
- ✅ Ajouter logs d'alertes pour hosts invalides

**Tests**:
- Test Host header non-whitelisté → 400 Bad Request
- Test absence Host header
- Test Host avec port invalide

---

### 🚨 FAILLE #4: TOTP SECRET NON CHIFFRÉ
**Fichier**: `models.py` (User.totp_secret)
**Niveau**: CRITIQUE
**Impact**: Exposition secrets TOTP en cas de breach

**Corrections**:
- ✅ Implémenter chiffrement AES-256 avant stockage
- ✅ Ajouter migration Alembic pour chiffrer données existantes
- ✅ Ajouter champ `totp_secret_encrypted` (clé dérivée)
- ✅ Déchiffrer uniquement en mémoire

**Tests**:
- Vérifier TOTP secret est chiffré en DB
- Vérifier déchiffrage fonctionne correctement
- Vérifier 2FA fonctionne après chiffrement

---

### 🚨 FAILLE #5: RATE LIMITING NON CONFIGURÉ
**Fichier**: `limiter.py` / `main.py`
**Niveau**: CRITIQUE
**Impact**: Brute force, DDoS, Abusde ressources

**Corrections**:
- ✅ Implémenter rate limiting par endpoint
- ✅ Auth endpoints: 5 tentatives/5min par IP
- ✅ API endpoints: 100 requêtes/min par user
- ✅ Public endpoints: 1000 requêtes/min par IP
- ✅ Ajouter response headers (RateLimit-Remaining, etc.)

**Tests**:
- Dépasser limites → 429 Too Many Requests
- Vérifier reset après expiration
- Vérifier headers de rate limiting

---

### 🚨 FAILLE #6: SECRETS NON GÉRÉS CORRECTEMENT
**Fichier**: `config.py` (OPENAI_API_KEY, STRIPE_API_KEY)
**Niveau**: CRITIQUE
**Impact**: Exposition via logs, environment dumps

**Corrections**:
- ✅ Implémenter séparation dev/prod secrets
- ✅ Masquer secrets en logs (regex replacement)
- ✅ Ajouter audit trail pour accès secrets
- ✅ Implémenter secret rotation automatique
- ✅ Utiliser vaults pour secret storage

**Tests**:
- Vérifier secrets ne sont pas en logs
- Vérifier secrets masqués dans tracebacks
- Vérifier exception levée si secrets manquants en prod

---

## PHASE 2: FAILLES HAUTES

### ⚠️ FAILLE #7: DOCKERFILE VULNÉRABLE
**Fichier**: `backend/Dockerfile`
**Niveau**: HAUT
**Impact**: Accès non-autorisé aux fichiers source

**Corrections**:
- ✅ Changer d'utilisateur AVANT COPY code source
- ✅ Utiliser multi-stage build pour réduire surface d'attaque
- ✅ Ajouter healthcheck
- ✅ Utiliser version spécifique Python (3.11.10, pas 3.11-slim)
- ✅ Ajouter SBOM (Software Bill of Materials)

**Tests**:
- Build Docker vérifie permissions
- Vérifier user n'est pas root
- Vérifier code accessible uniquement au bon user

---

### ⚠️ FAILLE #8: VALIDATION ENTRÉES MANQUANTE
**Fichiers**: TOUS les routers API
**Niveau**: HAUT
**Impact**: Injection SQL, XSS, Buffer overflow

**Corrections**:
- ✅ Ajouter Pydantic validators strictes
- ✅ Limiter tailles de strings (max 1000 chars par défaut)
- ✅ Valider formats (email, UUID, dates)
- ✅ Rejeter caractères dangereux
- ✅ Ajouter sanitization des inputs

**Tests**:
- Test inputs oversized → 422 Validation Error
- Test formats invalides
- Test injections SQL
- Test XSS payloads

---

### ⚠️ FAILLE #9: GESTION ERREURS VERBOSE
**Fichiers**: Tous les routers
**Niveau**: HAUT
**Impact**: Information disclosure

**Corrections**:
- ✅ Errors génériques en production ("Erreur serveur")
- ✅ Détails techniques seulement en debug
- ✅ Log détails serveur-side (audit logs)
- ✅ Ne jamais exposer stack traces en production
- ✅ Ajouter request IDs pour tracing

**Tests**:
- Test erreur 500 → message générique
- Test erreur 400 → message pertinent uniquement
- Vérifier logs contiennent détails

---

### ⚠️ FAILLE #10: WEBHOOKS STRIPE NON SÉCURISÉS
**Fichier**: `routers/paiements.py`
**Niveau**: HAUT
**Impact**: Attaques par rejeu, Modifications paiements

**Corrections**:
- ✅ Vérifier signature webhook (déjà fait)
- ✅ Vérifier IP source Stripe (whitelist)
- ✅ Vérifier idempotency (no duplicate processing)
- ✅ Vérifier timestamp webhook (< 300 secondes)
- ✅ Ajouter retry logic avec exponential backoff

**Tests**:
- Test webhook avec signature invalide
- Test webhook avec IP non-Stripe
- Test webhook dupliqué (même ID)
- Test webhook ancien (> 300s)

---

## PHASE 3: FAILLES MOYENNES

### 🟡 FAILLE #11: AUDIT LOGGING INCOMPLET
**Fichier**: `models.py` (AuditLog)
**Niveau**: MOYEN
**Impact**: Traçabilité incomplète

**Corrections**:
- ✅ Rendre `utilisateur_id` obligatoire (NOT NULL)
- ✅ Ajouter `role_utilisateur` automatiquement du JWT
- ✅ Logger TOUS les accès (pas seulement modifications)
- ✅ Inclure IPs, user agents, endpoints
- ✅ Ajouter champs: `code_http`, `duree_ms`, `endpoint`

**Tests**:
- Vérifier tous les logs ont utilisateur_id
- Vérifier tous les accès sensibles sont loggés
- Vérifier audit logs sont immuables

---

### 🟡 FAILLE #12: SESSION MANAGEMENT FAIBLE
**Fichier**: `models.py` (Session)
**Niveau**: MOYEN
**Impact**: Tokens éternels, Accès compromis

**Corrections**:
- ✅ Implémenter refresh token rotation
- ✅ Limite durée de vie session (max 24h)
- ✅ Ajouter device fingerprinting
- ✅ Ajouter détection anomalies (IP change)
- ✅ Implémenter session logout obligatoire

**Tests**:
- Vérifier expiration automatique
- Vérifier refresh token rotation
- Vérifier revocation immédiate
- Vérifier détection IP change

---

### 🟡 FAILLE #13: CHIFFREMENT MESSAGES INCONSISTANT
**Fichier**: `models.py` (Message.contenu_chiffre)
**Niveau**: MOYEN
**Impact**: Messages déchiffrables ou non-chiffrés

**Corrections**:
- ✅ Spécifier clé chiffrement dérivée de master key
- ✅ Utiliser AES-256-GCM (avec authentification)
- ✅ Générer IV aléatoire par message
- ✅ Vérifier authenticité message (GCM tag)
- ✅ Ajouter rotation clés chiffrement

**Tests**:
- Vérifier messages sont chiffrés en DB
- Vérifier déchiffrage correct
- Vérifier tampering détecté

---

### 🟡 FAILLE #14: TESTS DE SÉCURITÉ ABSENTS
**Dossier**: `tests/`
**Niveau**: MOYEN
**Impact**: Vulnérabilités non-détectées

**Corrections**:
- ✅ Ajouter `test_security_auth.py` (10+ tests)
- ✅ Ajouter `test_security_injection.py`
- ✅ Ajouter `test_security_validation.py`
- ✅ Ajouter `test_security_cors.py`
- ✅ Ajouter `test_security_rate_limit.py`

**Tests**:
- Execute tout test suite
- Code coverage > 80%
- Tous les tests passent

---

## TESTS OBLIGATOIRES

### 🧪 Catégorie 1: Tests d'Authentification
```
- test_auth_invalid_credentials
- test_auth_expired_token
- test_auth_missing_token
- test_auth_malformed_token
- test_auth_brute_force
- test_session_expiration
- test_session_refresh
```

### 🧪 Catégorie 2: Tests de Validation
```
- test_input_oversized
- test_input_invalid_format
- test_input_sql_injection
- test_input_xss_payload
- test_input_path_traversal
- test_input_command_injection
```

### 🧪 Catégorie 3: Tests de Sécurité HTTP
```
- test_cors_invalid_origin
- test_cors_credentials
- test_host_header_invalid
- test_security_headers_present
- test_rate_limit_exceeded
```

### 🧪 Catégorie 4: Tests de Données Sensibles
```
- test_secrets_not_in_logs
- test_totp_encrypted
- test_messages_encrypted
- test_no_plaintext_passwords
```

### 🧪 Catégorie 5: Tests de Webhooks
```
- test_webhook_invalid_signature
- test_webhook_invalid_ip
- test_webhook_old_timestamp
- test_webhook_idempotency
```

---

## CHECKLIST DÉPLOIEMENT

### Avant Production ✅
- [ ] Tous les secrets en `.env` sans valeurs
- [ ] Aucun `change-me` dans le code
- [ ] CORS limité à domaines réels
- [ ] Rate limiting configuré
- [ ] Logs ne contiennent pas secrets
- [ ] Tests de sécurité 100% passants
- [ ] Dockerfile sécurisé
- [ ] Validation stricte sur tous endpoints
- [ ] Erreurs génériques en production
- [ ] TOTP chiffré
- [ ] Sessions rotation implémentée
- [ ] Audit logs completes
- [ ] Webhooks sécurisés
- [ ] Messages chiffrés
- [ ] Code review de sécurité
- [ ] Scan SBOM effectué

### Post-Déploiement ✅
- [ ] Monitoring audit logs
- [ ] Alertes sur anomalies
- [ ] Tests de pénétration externes
- [ ] Rotation secrets 90j
- [ ] Patching vulnérabilités

---

## PROGRESSION

**Status**: 🔴 À FAIRE (0/14 corrections)
**Temps estimé**: 3-4 semaines (20-25h)
**Priorité**: BLOQUANT PRODUCTION
**Next Step**: Implémenter FAILLE #1 (Secrets)

---

*Plan élaboré par: Expert Cybersécurité + Pentester*
*Dernière mise à jour: 20 Avril 2026*
