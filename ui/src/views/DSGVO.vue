<template>
  <main class="container mt-4">
    <div class="card p-4">
      <h1>Datenschutzerklaerung</h1>
      <p><em>Stand: Juli 2026</em></p>

      <h2 class="h4 mt-4">1. Verantwortlicher</h2>
      <p>
        Christian Mayr<br>
        E-Mail:
        <a href="mailto:dein-projektname@example.org">dein-projektname@example.org</a>
      </p>
      <p>
        Weitere Pflichtangaben stehen im
        <router-link to="/impressum">Impressum</router-link>.
      </p>

      <h2 class="h4 mt-4">2. Verarbeitung personenbezogener Daten</h2>
      <p>Im Rahmen der Nutzung werden insbesondere folgende Daten verarbeitet:</p>
      <ul>
        <li>Benutzername</li>
        <li>E-Mail-Adresse</li>
        <li>Passwort (nur als Hash, nicht im Klartext)</li>
        <li>Rolle und Berechtigungen innerhalb der Anwendung</li>
        <li>Session- und technische Logdaten</li>
      </ul>

      <h2 class="h4 mt-4">3. Rechtsgrundlagen</h2>
      <ul>
        <li>Art. 6 Abs. 1 lit. b DSGVO (Durchfuehrung des Nutzungsverhaeltnisses)</li>
        <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb)</li>
      </ul>

      <h2 class="h4 mt-4">4. Speicherdauer</h2>
      <ul>
        <li>Stammdaten werden gespeichert, solange ein Benutzerkonto besteht.</li>
        <li>Session-Daten werden automatisch nach Ablauf entfernt.</li>
        <li>Server-Logs werden nur so lange gespeichert, wie betrieblich erforderlich.</li>
      </ul>

      <h2 class="h4 mt-4">5. Empfaenger und Hosting</h2>
      <p>
        Eine Weitergabe zu Werbezwecken findet nicht statt. Technischer Betrieb kann
        ueber einen Hosting-Dienstleister als Auftragsverarbeiter erfolgen.
      </p>

      <h2 class="h4 mt-4">6. Sicherheit</h2>
      <ul>
        <li>Passwoerter werden mit bcrypt gehasht gespeichert.</li>
        <li>Cookies fuer Sessions sind als HttpOnly gesetzt.</li>
        <li>Zugriffe auf Daten sind rollenbasiert geschuetzt.</li>
      </ul>

      <h2 class="h4 mt-4">7. Betroffenenrechte</h2>
      <p>
        Sie haben insbesondere ein Recht auf Auskunft, Berichtigung, Loeschung,
        Einschraenkung, Widerspruch und Datenuebertragbarkeit nach DSGVO.
      </p>

      <h2 class="h4 mt-4">8. Cookies und Sessions</h2>
      <p>
        Diese Anwendung nutzt technisch notwendige Session-Cookies zur Anmeldung.
        Ohne diese Cookies ist die Nutzung geschuetzter Bereiche nicht moeglich.
      </p>

      <h2 class="h4 mt-4">9. Aenderungen</h2>
      <p>
        Diese Datenschutzerklaerung kann angepasst werden, wenn sich die Anwendung
        oder rechtliche Anforderungen aendern.
      </p>
    </div>
  </main>
</template>

<script setup>
defineOptions({
  name: 'DatenschutzView'
});
</script>

<style scoped>
.card {
  max-width: 65rem;
}
</style>
