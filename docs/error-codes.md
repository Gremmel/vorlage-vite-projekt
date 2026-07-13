# Error-Code Konvention

Ziel: Stabile, maschinenlesbare Fehlercodes fuer Frontend, Logging und Monitoring.

## Schema

Format: BEREICH_EREIGNIS

Beispiele:
- AUTH_INVALID_CREDENTIALS
- USER_UPDATE_FAILED
- RESET_INVALID_OR_EXPIRED_TOKEN
- RATE_TOO_MANY_REQUESTS
- SYS_INTERNAL_ERROR

Regeln:
- Nur GROSSBUCHSTABEN und Unterstriche
- Message kann sich aendern, Code bleibt stabil
- 4xx fuer fachliche/Client-Fehler
- 5xx fuer Systemfehler

## Aktuelle Codes

| Code | HTTP | Bedeutung |
|---|---:|---|
| AUTH_INVALID_CREDENTIALS | 401 | Login fehlgeschlagen |
| AUTH_NO_SESSION | 401 | Kein Session-Cookie vorhanden |
| AUTH_SESSION_EXPIRED | 401 | Session ungueltig oder abgelaufen |
| AUTH_INSUFFICIENT_PERMISSIONS | 403 | Benutzerrolle reicht nicht aus |
| USER_CREATE_FAILED | 401 | Benutzer konnte nicht angelegt werden |
| USER_UPDATE_FAILED | 401 | Benutzer konnte nicht geaendert werden |
| USER_CHANGE_PASSWORD_FAILED | 401 | Passwort konnte nicht geaendert werden |
| USER_DELETE_FAILED | 401 | Benutzer konnte nicht geloescht werden |
| RESET_MISSING_FIELDS | 400 | Token oder Passwort fehlen |
| RESET_PASSWORD_TOO_SHORT | 400 | Passwort zu kurz |
| RESET_INVALID_OR_EXPIRED_TOKEN | 400 | Reset-Token ungueltig oder abgelaufen |
| RATE_TOO_MANY_REQUESTS | 429 | Rate-Limit erreicht |
| SYS_INTERNAL_ERROR | 500 | Unerwarteter Serverfehler |

## Verwendung in neuen Endpunkten

1. Erfolg nur mit sendOk(req, res, payload).
2. Fachliche Fehler mit createApiError(status, code, message) werfen.
3. Keine eigenen Fehlerformate pro Route bauen.
4. In Middleware Fehler mit sendError(req, res, status, code, message, details) senden.

### Codebeispiel

```js
import {
	asyncHandler,
	createApiError,
	sendError,
	sendOk
} from './apiResponse.js';

app.post('/api/profile', asyncHandler(async (req, res) => {
	const displayName = String(req.body?.displayName || '').trim();

	if (!displayName) {
		throw createApiError(400, 'USER_DISPLAY_NAME_REQUIRED', 'Anzeigename ist erforderlich.');
	}

	if (displayName.length < 3) {
		throw createApiError(400, 'USER_DISPLAY_NAME_TOO_SHORT', 'Anzeigename muss mindestens 3 Zeichen lang sein.');
	}

	const saved = await userController.updateDisplayName(req.user.id, displayName);

	if (!saved) {
		throw createApiError(409, 'USER_PROFILE_UPDATE_FAILED', 'Profil konnte nicht aktualisiert werden.');
	}

	return sendOk(req, res, {
		message: 'Profil wurde aktualisiert.',
		result: true
	});
}));

app.get('/api/admin-only', (req, res) => {
	if (!req.user?.roles?.includes('admin')) {
		return sendError(req, res, 403, 'AUTH_INSUFFICIENT_PERMISSIONS', 'Zugriff verweigert.');
	}

	return sendOk(req, res, { data: [] });
});
```

### Codebeispiel externer Service (SMTP/API)

```js
app.post('/api/newsletter/send', asyncHandler(async (req, res) => {
	const email = String(req.body?.email || '').trim();

	if (!email) {
		throw createApiError(400, 'NEWSLETTER_EMAIL_REQUIRED', 'E-Mail ist erforderlich.');
	}

	try {
		await newsletterService.sendWelcomeMail(email);
	} catch (error) {
		logger.error('Newsletter Versand fehlgeschlagen', {
			email,
			provider: 'smtp',
			// Wichtig: keine Secrets oder kompletten Rohfehler ins API-Response geben
			providerCode: error?.code || null
		});

		throw createApiError(
			502,
			'NEWSLETTER_PROVIDER_UNAVAILABLE',
			'Der Mail-Dienst ist aktuell nicht erreichbar. Bitte spaeter erneut versuchen.',
			{
				provider: 'smtp',
				providerCode: error?.code || null
			}
		);
	}

	return sendOk(req, res, {
		message: 'Willkommensmail wurde versendet.',
		result: true
	});
}));
```

Hinweise zu details:
- Nur technische Metadaten aufnehmen (z. B. provider, providerCode).
- Keine Zugangsdaten, Tokens oder Stacktraces an Clients senden.
- Vollstaendige Fehlerdetails nur im Server-Log halten.

## Frontend-Nutzung

- UI-Entscheidungen ueber error.code treffen, nicht ueber message.
- requestId bei Support-Fehlern anzeigen, damit Logs schnell gefunden werden.
