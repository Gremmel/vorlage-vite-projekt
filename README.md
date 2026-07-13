
# Vorlage Vite Projekt

Basisprojekt mit Fokus auf Benutzerverwaltung.

Enthalten:
- Login/Logout mit Session-Cookie
- Rollenbasierte Routen (admin/benutzer)
- Benutzerliste (Admin)
- Benutzer anlegen, bearbeiten, loeschen (Admin)
- Passwort aendern (Benutzer)
- Passwort vergessen per E-Mail (Reset-Token)

## Produktive Konfiguration Passwort vergessen

Fuer den produktiven Einsatz muessen in extern/config.json folgende Bereiche gesetzt werden
(siehe auch server/config_vorlage.json):

- ui.baseUrl: Oeffentliche URL deiner UI, z. B. https://example.org
- security.passwordResetExpiresMinutes: Gueltigkeit des Reset-Links in Minuten
- smtp.host
- smtp.port
- smtp.secure
- smtp.user
- smtp.pass
- smtp.from

Der Reset-Link wird in der API nicht zurueckgegeben, sondern direkt per SMTP versendet.

## Secrets in Umgebungsvariablen

Fuer produktive Nutzung sollten SMTP-Zugangsdaten nicht im Klartext in extern/config.json liegen.
Das Backend unterstuetzt daher Umgebungsvariablen, die die Werte aus der JSON-Datei ueberschreiben:

- UI_BASE_URL
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- SMTP_FROM

Beispielwerte stehen in server/.env.example.

Vorgehen:
- server/.env.example nach server/.env uebernehmen und Werte setzen.
- smtp.pass in extern/config.json optional leer lassen.
- Server neu starten.

## Security-Basics in der Vorlage

Die Server-Basis enthaelt jetzt folgende produktionsnahe Defaults:

- Helmet fuer HTTP Security Header
- Rate-Limits auf sensiblen Endpunkten:
	- POST /api/login
	- POST /api/requestPasswordReset
- Start-up-Konfig-Validierung mit klaren Fehlermeldungen bei Pflichtfeldern

Rate-Limits sind in server/config_vorlage.json unter security.rateLimit konfigurierbar.

## CORS konfigurierbar

CORS ist fuer neue Projekte ueber die Konfiguration steuerbar:

- cors.origins: erlaubte Origins als Array
- cors.methods: erlaubte HTTP-Methoden als Array (optional)

Wenn cors nicht gesetzt ist, werden sichere Entwicklungs-Defaults genutzt.

## Proxy und Cookie Konfiguration

Fuer Deployments hinter Reverse Proxy (z. B. Nginx/Traefik) kann security.trustProxy aktiviert werden.

- security.trustProxy: true/false
- security.cookies.secure: true/false
- security.cookies.sameSite: strict/lax/none

Login, Token-Refresh und Logout verwenden dieselben Cookie-Optionen konsistent.

## Betriebsendpunkte

- GET /api/healthz: Liveness Check
- GET /api/readyz: Readiness Check

Nicht vorhandene /api Routen liefern einheitlich 404 im API-Fehlerformat.

## DB-Migrationen

Die Datenbankstruktur wird jetzt versioniert ueber SQL-Migrationen verwaltet.

- Ort: server/lib/api/migrations
- Reihenfolge: Dateinamen aufsteigend (z. B. 001_..., 002_...)
- Ausfuehrung: automatisch beim Serverstart
- Status: in der Tabelle schema_migrations

Fuer Schema-Aenderungen neuer Projekte immer eine neue .sql Datei in diesem Ordner anlegen,
statt bestehende Tabellen im Code implizit zu veraendern.

## Einheitliches API-Error-Handling

Fuer neue API-Endpunkte die zentralen Helper in server/lib/api/apiResponse.js verwenden:

- sendOk(req, res, payload)
- sendError(req, res, status, code, message, details)
- createApiError(status, code, message, details)
- asyncHandler(async (req, res) => { ... })

Empfohlenes Muster in server/lib/api/apiRoutes.js:

- Route mit asyncHandler umschliessen
- Validierungsfehler mit createApiError werfen
- Erfolgsantworten nur mit sendOk senden
- Unerwartete Fehler laufen in die zentrale Error-Middleware

Die Auth-Middleware nutzt ebenfalls sendError, damit auch 401/403 konsistent sind.

Die verbindliche Error-Code-Konvention und die aktuelle Code-Tabelle stehen in docs/error-codes.md.

