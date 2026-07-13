<template>
  <main class="container mt-4">
    <div class="card p-4">
      <h1>Impressum</h1>
      <p>Angaben gemaess DDG.</p>

      <h2 class="h4 mt-4">Verantwortlich fuer den Inhalt</h2>
      <p>
        Christian Mayr<br>
        Gschwend 38<br>
        87484 Nesselwang<br>
        E-Mail:
        <a href="mailto:dein-projektname@example.org">dein-projektname@example.org</a>
      </p>

      <h2 class="h4 mt-4">Verantwortlich gemaess MStV</h2>
      <p>Christian Mayr, Anschrift wie oben.</p>

      <h2 class="h4 mt-4">Haftungsausschluss</h2>
      <p>
        Die Inhalte dieser Website werden mit groesster Sorgfalt erstellt. Fuer die
        Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte kann jedoch keine
        Gewaehr uebernommen werden. Fuer Inhalte externer Links sind ausschliesslich
        deren Betreiber verantwortlich.
      </p>
    </div>
  </main>
</template>

<script setup>
defineOptions({
  name: 'ImpressumView'
});
</script>

<style scoped>
.card {
  max-width: 65rem;
}
</style>
