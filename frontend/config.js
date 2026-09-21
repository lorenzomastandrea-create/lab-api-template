// ============================================================================
// config.js — L'UNICO posto dove sta scritto l'indirizzo dell'API.
// ============================================================================
//
// La pagina e l'API sono due programmi separati, su due porte diverse.
// La pagina non sa dove sia l'API: glielo dici tu, qui.
//
// >>> PRIMA COSA DA FARE, prima di guardare qualsiasi altra cosa. <<<
//
// Se lavori su CODESPACES (il caso normale):
//   1. in basso in VS Code apri il pannello "PORTS" / "PORTE"
//   2. trova la riga della porta 8000, colonna "Forwarded Address"
//   3. copia quell'indirizzo e incollalo qui sotto, al posto di quello che c'e'
//   Viene fuori una cosa cosi':
//      const API_URL = "https://qualcosa-di-tuo-8000.app.github.dev";
//
//   ATTENZIONE: SENZA la barra finale. Gli indirizzi si compongono
//   come API_URL + "/tickets", e due barre di fila danno 404.
//
// Se lavori in locale (piano B, VS Code sul tuo computer):
//   va bene l'indirizzo che c'e' gia'.
//
// Questo indirizzo cambiera' ancora: quando pubblicherai la tua API su Render.
// E' per questo che sta in un file da solo, e non sparso dentro app.js.
// ============================================================================

const API_URL = "http://127.0.0.1:8000";
