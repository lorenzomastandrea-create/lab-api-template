# Giorno 2 — Aprilo al mondo, e difendilo davvero

**Ieri hai chiuso i buchi che stanno nel server.** Oggi il portale esce da questo
computer: prende un indirizzo vero, raggiungibile da fuori, e il tuo codice è su un
repo pubblico. E lì si aprono i due buchi che ieri avevamo lasciato stare — perché
finché tutto girava solo da te non facevano male a nessuno.

Stesso metodo di ieri: **attacca → guarda → ripara → riattacca**.

> **Non si scrive il frontend.** La pagina è già finita dal primo minuto di ieri.
> Oggi si lavora su **come viaggia una richiesta HTTP** e su cosa si rompe quando in
> mezzo c'è internet: un altro dominio, un repo pubblico, un tab Network aperto.

---

# MATTINA

## Passo 0 — Siamo tutti allo stesso punto? (20 min)

> **Si fa insieme.** Prima di andare avanti, ognuno controlla a che punto è il suo
> portale. Non è un voto: è che da qui in poi i passi danno per scontato che ieri sia
> a posto.

Accendi i due server come ieri: `make backend` nel primo terminale, `make frontend`
nel secondo. Poi apri un **terzo** terminale. Incolla i quattro comandi **tutti insieme**:

```bash
echo "1. filtro:  $(curl -s -o /dev/null -w '%{http_code}' -G 'http://127.0.0.1:8000/tickets' --data-urlencode "status=x' OR '1'='1")  (deve dire 422)"
echo "2. POST:    $(curl -s -o /dev/null -w '%{http_code}' -X POST 'http://127.0.0.1:8000/tickets' -H 'X-API-Key: chiave-del-corso-2026' -H 'Content-Type: application/json' -d '{"title":"","status":"banana"}')  (deve dire 422)"
echo "3. DELETE:  $(curl -s -o /dev/null -w '%{http_code}' -X DELETE 'http://127.0.0.1:8000/tickets/1')  (deve dire 401)"
echo "4. PUT:     $(curl -s -o /dev/null -w '%{http_code}' -X PUT 'http://127.0.0.1:8000/tickets/2' -H 'X-API-Key: chiave-del-corso-2026' -H 'Content-Type: application/json' -d '{"title":"prova","description":"x","status":"chiuso"}')  (deve dire 200)"
```

**Quattro righe giuste** → hai finito ieri. Aspetta i compagni, o aiuta il vicino.

**Una o più sbagliate** → non è un problema, si recupera in trenta secondi. Nello
stesso terminale, dalla **radice del repo** (dove vedi `app/` e `frontend/`):

```bash
cd /workspaces/*
git fetch origin g1-riparato
git checkout origin/g1-riparato -- app/db.py app/main.py
```

> ⚠️ Questo **sostituisce** i tuoi `app/db.py` e `app/main.py` con la versione
> completa. Se avevi riparato qualcosa, il tuo lavoro in quei due file viene perso —
> è il senso del recupero. Il resto del repo non si tocca.

L'API (`make backend`) si riavvia da sola quando i file cambiano. Rilancia i quattro
comandi: ora devono essere tutti verdi.

**Come verifico:** 422 · 422 · 401 · 200.

---

## Passo 1 — Come la pagina parla con l'API (45 min)

> Qui non si scrive niente. Si legge, e si guarda il traffico vero.

### 1a. Il file

Apri `frontend/app.js`. È diviso in **sei sezioni numerate**, ognuna con due righe di
commento che dicono cosa fa e quando viene chiamata. Leggile in ordine.

Cerca la funzione che carica l'elenco. Dentro c'è questo, ed è il cuore di tutto:

```js
const risposta = await fetch(API_URL + "/tickets");
if (!risposta.ok) { … }
const dati = await risposta.json();
```

Tre righe, tre cose diverse:

| Riga | Cosa fa |
|------|---------|
| `fetch(...)` | manda la richiesta HTTP e **aspetta** (è quello che fa `await`) |
| `risposta.ok` | è `true` solo per gli status 2xx. Un 404 o un 401 **non** è un errore di rete: è una risposta arrivata benissimo, che dice "no" |
| `risposta.json()` | prende il testo della risposta e lo trasforma in oggetti JavaScript |

### 1b. Il traffico vero

> **Cos'è F12.** Apre gli **Strumenti per sviluppatori del browser** (Chrome/Edge/Firefox):
> vanno usati **sulla pagina del portale**, cioè nella scheda del browser dove l'hai aperta —
> **non** dentro l'editor di VS Code / Codespaces. Se `F12` non risponde (tipico sui Mac),
> **tasto destro sulla pagina → Ispeziona**, oppure `Cmd + Option + I`.

Apri la pagina del portale nel browser, premi **F12**, vai alla scheda **Network** e
**ricarica** la pagina.

Clicca sulla riga `tickets`. Sono le stesse cose che ieri vedevi in `curl`, ma disegnate:

- **Headers** → in alto il metodo (`GET`) e lo status (`200`)
- **Response** → il JSON esatto che è tornato
- **Timing** → **quanto ci ha messo**, spezzato in fasi

Guarda il Timing. Sono millisecondi, perché l'API è sulla tua stessa macchina. Tieni a
mente quel numero: quando un utente dice *"il portale è lento"*, è qui che si guarda
per primo — e si scopre se è lenta la rete, il server, o il database.

Prova a rendertene conto: nella pagina, cambia il filtro avanti e indietro qualche
volta guardando il Network. Ogni cambio è **una richiesta nuova**. Una pagina che
sembra istantanea sta facendo traffico, e ogni riga lì dentro è lavoro per il server.

Ora tieni il Network aperto e **crea una segnalazione** col form. Compare una seconda
riga: `POST`, status `201`. Clicca su **Request Headers**: c'è `X-API-Key`, e accanto
**la chiave in chiaro**.

> Guardala bene. Ci torniamo nel pomeriggio.

### 1c. Gli status code, dal lato di chi chiama

Prova a sbagliare apposta, e guarda cosa fa la pagina:

| Cosa fai | Status | Cosa mostra la pagina |
|----------|--------|----------------------|
| Crei senza scrivere la chiave | `401` | "Chiave API sbagliata" |
| Crei con un titolo di due lettere | `422` | il messaggio di validazione |
| In `config.js` aggiungi `/sbagliato` all'URL | `404` | "Errore dal server: 404" |
| In `config.js` metti `https://non-esiste.example` | — | "Impossibile contattare l'API" |

**Rimetti l'URL giusto.**

L'ultima riga è diversa dalle altre tre: lì non è arrivata **nessuna** risposta. Le
prime tre sono risposte arrivate, che dicono di no. Un client serio le distingue —
il tuo `app.js` lo fa con `risposta.ok` e con il `try/catch`.

**Come verifico:** sai dire, per ognuno dei quattro casi, se il server ha risposto o no.

---

## Passo 2 — Il dato che diventa codice (60 min)

**Attacca.** Crea una segnalazione con questo **titolo** esatto:

```
<img src=x onerror="alert('bucato')">
```

**Guarda.** Appena l'elenco si ricarica, parte un popup. Tu volevi scrivere un titolo,
e il browser ha eseguito il tuo testo come **codice**. Si chiama **XSS**.

Al posto di `alert` poteva esserci qualcosa che legge i cookie di chi apre la pagina e
li manda altrove. E non colpisce te: colpisce **chiunque apra il portale** — i tuoi
colleghi, il tuo capo.

Apri `frontend/app.js`, funzione `costruisciRiga`. Il titolo finisce nella pagina con
`innerHTML`, che al browser vuol dire: *"questo è HTML, eseguilo"*.

**Ripara.** Titolo e descrizione vanno messi con `textContent`, che vuol dire:
*"questo è **testo**, mostralo e basta"*. Devi creare i due `<div>` a mano e riempirli,
invece di comporre una stringa di HTML.

**Riattacca.** Ricarica: quel ticket ora si **vede scritto**, `<img ...>` compreso, e
nessun popup. Il dato è tornato a essere un dato.

<details><summary>Serve una mano</summary>

In `costruisciRiga`, il blocco `cellaTesto.innerHTML = ...`. Sostituiscilo creando due
`div` con `document.createElement("div")`, dando a ciascuno la sua classe
(`cella-titolo`, `cella-descrizione`) e assegnando `.textContent = ticket.title` e
`.textContent = ticket.description`.
</details>

### La cosa da capire, che vale più della riparazione

**L'API non ha sbagliato niente.** Ha salvato quel testo e l'ha restituito: è il suo
mestiere, e non è lei a decidere come verrà mostrato. Quello stesso ticket potrebbe
finire in un'app mobile, in un export Excel, in una mail — posti dove `<img>` non
significa niente.

**La difesa sta nel punto in cui il dato diventa HTML.** Cioè nel frontend, nella riga
che hai appena cambiato.

**Regola:** dati che vengono da fuori (API, utente, URL) → `textContent`.
`innerHTML` **solo** con HTML scritto da te, mai con una variabile dentro.

**Come verifico:** il ticket col titolo strano si vede scritto, e non succede niente.

---

## Passo 3 — Il portale esce dal tuo computer (60 min)

Fino a ora il tuo portale l'hai visto solo tu. Adesso lo rendi raggiungibile **da
internet**, con un indirizzo vero, e glielo fai aprire a un compagno dal **suo**
computer.

### 3a. Le due porte diventano pubbliche

Nel pannello **PORTS**, in basso in VS Code, ci sono le due righe: **8000** (l'API) e
**5500** (la pagina).

Su ognuna: tasto destro → **Port Visibility** → **Public**.

> Fermati un secondo su cosa hai appena fatto. **Private** vuol dire che quell'indirizzo
> risponde solo a te, dopo il login su GitHub. **Public** vuol dire che risponde a
> chiunque abbia il link. Non è un dettaglio di configurazione: è una decisione di
> sicurezza, e l'hai presa tu adesso.

### 3b. L'indirizzo vero

Copia dalla colonna **Forwarded Address** l'indirizzo della **5500**. È una cosa tipo:

```
https://qualcosa-di-tuo-5500.app.github.dev
```

Guardalo bene: comincia per **`https://`**. Non l'hai chiesto, non hai comprato niente,
te l'ha dato GitHub. E ricordi la chiave che stamattina hai visto in chiaro nel tab
Network? Senza HTTPS quella viaggerebbe **in chiaro sulla rete** — il Wi-Fi del
laboratorio, quello del bar — e chiunque in mezzo potrebbe leggerla.

### 3c. Fallo aprire a qualcun altro

Manda il link della 5500 al compagno di fianco. Deve aprirlo **sul suo computer**, non
sul tuo.

**Come verifico:** lui vede il tuo portale, con le **tue** segnalazioni. Fatti creare
una segnalazione da lui (dagli la chiave) e guardala comparire sul tuo schermo.

> Questo è il momento in cui il tuo esercizio smette di essere un esercizio. C'è un
> indirizzo, e dall'altra parte c'è qualcuno. Da qui in poi tutto quello che faremo —
> CORS, la chiave, l'XSS — riguarda **lui**, non te.

### 3d. E quando lo spegni?

Chiudi la scheda del Codespace e riapri il link dopo qualche minuto: non risponde più.
Il Codespace si **ferma da solo** dopo mezz'ora che non lo usi.

Un portale vero non può spegnersi quando il programmatore chiude il portatile.

**Come verifico:** hai l'indirizzo `https://` della tua pagina, un compagno l'ha aperto
dal suo computer, e hai visto che quell'indirizzo non vive per sempre.

---

### 3e. Come sarebbe in produzione (si legge insieme, 15 min)

> **Qui non si fa niente: si guarda.** Il docente lo mostra sul suo schermo. Non
> pubblicherete il vostro portale oggi, ma dovete sapere cos'è la cosa che non state
> facendo — perché è la metà del mestiere, e perché spiega cinque scelte che avete già
> preso senza accorgervene.

**Lo stesso codice gira in posti diversi.** Di solito almeno due, spesso tre:

| Ambiente | Dov'è | A cosa serve |
|----------|-------|--------------|
| **Sviluppo** | il tuo Codespace | ci lavori, rompi, riprovi. Se lo butti giù non se ne accorge nessuno |
| **Staging** | un server uguale a quello vero | si prova la versione nuova prima di darla agli utenti |
| **Produzione** | un server sempre acceso | ci sono gli utenti veri e i dati veri. Qui non si sperimenta |

**La cosa importante: il codice è lo stesso in tutti e tre.** Quello che cambia è la
**configurazione**. Ed è esattamente per questo che oggi avete tolto la chiave dal
codice e l'avete messa in un file a parte, e che l'indirizzo dell'API sta in
`config.js` e non sparso in `app.js`.

| | Sul tuo Codespace | In produzione |
|---|---|---|
| La chiave | nel file `.env`, che non entra nel repo | nel pannello del servizio, che la tiene cifrata. **Non esiste in nessun file** |
| `ALLOWED_ORIGINS` | l'indirizzo della tua 5500 | l'indirizzo vero del sito, e solo quello |
| Il certificato HTTPS | te lo dà GitHub | te lo dà il servizio, e si rinnova da solo |
| Il database | un file sul disco del container | un database gestito, con i **backup**. Mai un file dentro l'applicazione |
| Chi lo spegne | tu, chiudendo il portatile | nessuno. Gira e basta |

**Le protezioni che si aggiungono passando in produzione:**

1. **I segreti escono da ogni file.** Nel pannello del servizio, scritti una volta e mai più letti da nessuno — nemmeno da chi li ha messi. Se servisse cambiarli, si cambia lì, senza toccare il codice.
2. **CORS si chiude sull'indirizzo vero.** Niente `*`, mai.
3. **HTTPS è obbligatorio**, e chi arriva in `http://` viene rediretto.
4. **I log dicono chi ha fatto cosa e quando.** Quando qualcosa va storto alle tre di notte, sono l'unica cosa che hai.
5. **Il database sta fuori dall'applicazione**, e ha i backup. Un disco dentro un container si azzera a ogni riavvio.

**E una cosa che costa e si paga:** un server sempre acceso costa. Sui piani gratuiti
viene spento quando nessuno lo usa, e la prima richiesta dopo lo spegnimento aspetta
che si riaccenda — venti, quaranta secondi. Si chiama **cold start**, ed è la prima
cosa che l'utente chiama "il sito è lento".

> **Questa non è teoria.** L'API che avete usato ieri dai notebook — quella vera, con
> otto segnalazioni dentro — è esattamente così: gira su un server, la chiave sta nel
> pannello e non in un file, e se non la chiamate da un po' la prima risposta arriva
> tardi. Il docente ve la mostra adesso: il pannello, la variabile d'ambiente, i log, e
> il cold start cronometrato.

---

# POMERIGGIO

## Passo 4 — CORS: il browser che blocca (60 min)

Stamattina tutto ha funzionato perché `ALLOWED_ORIGINS` vale `*`. Adesso vediamo cosa
c'è sotto — e attenzione, **non è un esercizio finto**: la tua pagina e la tua API
stanno davvero su due indirizzi diversi.

### 4a. Cos'è un'origine

Il browser identifica ogni pagina con la sua **origine** = schema + host + porta:

| URL | Origine |
|-----|---------|
| `https://qualcosa-di-tuo-5500.app.github.dev/index.html` | `https://qualcosa-di-tuo-5500.app.github.dev` |
| `https://qualcosa-di-tuo-8000.app.github.dev/tickets` | `https://qualcosa-di-tuo-8000.app.github.dev` ← **diversa** |

Sono due host diversi: `-5500` e `-8000`. La tua pagina e la tua API sono **sempre** su
origini diverse — il frontend da una parte, il backend dall'altra. È la situazione
normale, non un errore di impostazione.

### 4b. La regola

Per una regola di sicurezza del browser (*Same-Origin Policy*), una pagina **non può
leggere** la risposta di un'altra origine, a meno che quel server non l'autorizzi
esplicitamente con un header:

```
Access-Control-Allow-Origin: https://qualcosa-di-tuo-5500.app.github.dev
```

Questo meccanismo si chiama **CORS**. Attenzione a chi fa cosa:

- **Il server** dichiara "accetto chiamate da queste origini" (l'header).
- **Il browser** controlla e, se l'origine della pagina non c'è, **butta via la
  risposta**: la richiesta parte lo stesso, ma tu non la vedi.
- `curl`, `requests`, Postman **non hanno CORS**: non sono browser.

### 4c. Provoca l'errore

Apri `app/main.py` e guarda le righe del `CORSMiddleware`: `ALLOWED_ORIGINS` arriva da
`.env`, e se manca vale `*`.

Nel file `.env` aggiungi una riga con un'origine che **non è la tua**:

```
ALLOWED_ORIGINS=https://un-sito-che-non-e-la-mia-pagina.it
```

Ferma l'API con `CTRL+C` nel suo terminale e rilancia `make backend`: le variabili
d'ambiente si leggono **all'avvio**, il riavvio automatico non basta.

Ricarica la pagina.

**Come verifico:** "Impossibile contattare l'API". Apri la console (F12), in rosso:

```
Access to fetch at 'https://...-8000.app.github.dev/tickets'
from origin 'https://...-5500.app.github.dev' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present...
```

Ora vai nel tab **Network** e clicca su quella richiesta. Guarda lo **status: 200**.

**L'API ha risposto.** Ha fatto il suo lavoro, i dati sono partiti. È il **browser** che
ha buttato via la risposta prima di darla alla pagina.

Leggi di nuovo le ultime due righe. È la cosa che sbagliano tutti: "errore CORS" non
vuol dire che l'API è rotta. Vuol dire che l'API non ti ha autorizzato.

### 4d. Aprila all'origine giusta

In `.env` metti l'origine **della tua pagina** — quella della porta 5500, **senza barra
finale** e senza `/index.html`:

```
ALLOWED_ORIGINS=https://qualcosa-di-tuo-5500.app.github.dev
```

Rilancia `make backend`, ricarica.

**Come verifico:** la tabella si riempie. Nel tab Network, nella risposta, c'è l'header
`access-control-allow-origin` con l'indirizzo della tua pagina.

### 4e. Quindi CORS cosa protegge?

Due prove, una dopo l'altra.

**Uno.** Chiedi al compagno di fianco di aprire la **sua** pagina, premere F12 e
scrivere nella console, mettendo il **tuo** indirizzo della 8000:

```js
fetch("https://qualcosa-di-TUO-8000.app.github.dev/tickets").then(r => r.json()).then(console.log)
```

→ errore rosso **CORS**. La tua API non autorizza la sua pagina.

**Due.** Adesso lui, dal **terminale**, la stessa identica chiamata:

```bash
curl https://qualcosa-di-TUO-8000.app.github.dev/tickets
```

→ **funziona.** Escono tutti i tuoi ticket.

**CORS non protegge la tua API.** `curl` passa, e passa chiunque non usi un browser.
**Protegge gli utenti dei browser**: impedisce a un sito estraneo di usare il browser di
una persona per parlare con la tua API a nome suo, sfruttando il fatto che quella
persona è già dentro.

La chiave protegge le **scritture**. CORS decide chi può **leggere le risposte da una
pagina web**. Sono due cose diverse e servono tutte e due.

**Come verifico:** sai spiegare, con parole tue, perché `curl` passa e il browser no.

---

## Passo 5 — Il segreto che non è segreto (60 min)

### 5a. Guarda

Apri il **tuo** repo su GitHub, dal browser. Vai in `app/main.py`.

```python
API_KEY = "chiave-del-corso-2026"
```

È lì. Pubblica. Col tuo nome sopra. Chiunque la legge in due clic e può scrivere sulla
tua API — e la tua API, da mezz'ora, è raggiungibile da internet.

Ora apri `.gitignore`. Cerca `.env`. **Non c'è.** Quindi anche quel file è nel repo.

### 5b. Ripara — e sono tre mosse, non una

**Primo tempo — il futuro.** Che non succeda più.

1. In `.gitignore`, aggiungi una riga: `.env`
2. In `app/main.py`, la chiave non sta più nel codice:
   ```python
   API_KEY = os.getenv("API_KEY")
   if not API_KEY:
       raise RuntimeError("Manca API_KEY: copia .env.example in .env e imposta una chiave.")
   ```
   Il `load_dotenv()` che legge il file `.env` c'è già, in cima.
3. Nel tuo `.env`, che ora è ignorato, aggiungi `API_KEY=chiave-del-corso-2026`.
   Rilancia `make backend`: l'app riparte e funziona come prima.

**Secondo tempo — il presente.** Il file è ancora dentro git.

```bash
git rm --cached .env
```

`--cached` lo toglie da git ma **lo lascia sul disco**: l'app continua a girare.

```bash
git add -A && git commit -m "La chiave esce dal codice" && git push
```

Ricarica il tuo repo su GitHub: `.env` non c'è più, e in `main.py` non c'è nessuna
chiave. Sembra finita.

**Terzo tempo — il passato. È quello che conta.**

Sul tuo repo, apri la lista dei **commit** e vai al **primo**, quello di quando hai
creato il repo dal template. Apri `app/main.py`.

**La chiave è ancora lì.**

Git non dimentica niente. `.gitignore` protegge il futuro, `git rm --cached` il
presente, ma la storia dei commit resta pubblica e chiunque la può leggere.

L'unica riparazione vera è **cambiare la chiave**:

1. scegline una nuova, tua, e mettila nel `.env` al posto di quella vecchia
2. rilancia `make backend`
3. prova a creare un ticket dalla pagina con la chiave **vecchia** → **401**.
   Con quella nuova → **201**

La chiave che è rimasta nella storia adesso non apre più niente.

> **Un segreto finito su un repo pubblico è bruciato. Non si toglie: si cambia.**

Succede sul serio, tutti i giorni, a gente pagata per non farlo. Esistono programmi che
scandagliano GitHub in continuazione cercando chiavi nei commit, e le trovano in minuti.

### 5c. E la chiave nel browser?

Ricordi il tab Network di stamattina, con `X-API-Key` in chiaro nei Request Headers?

Quella non si può nascondere. La pagina deve mandarla, e chi apre il browser la vede.
**HTTPS protegge il canale, non il segreto**: cifra il viaggio, così nessuno la legge
per strada — ma l'utente che la digita, ovviamente, ce l'ha.

Per questo la pagina la **chiede all'utente** invece di tenerla scritta dentro: una
chiave in un frontend non è un segreto, è un'etichetta. **Identifica, non protegge.**

Il modo giusto sarebbe un login vero — utenti, password, sessioni — dove il browser
tiene un gettone temporaneo, personale e che scade, e non la chiave di tutti. Non lo
facciamo oggi: la chiave unica è il primo gradino, non l'ultimo.

**Come verifico:** in `main.py` non c'è nessuna chiave scritta. `.env` è nel
`.gitignore` e non è più nel repo. L'app funziona con la chiave nuova e dà **401** con
quella vecchia. E nel primo commit su GitHub la vecchia si vede ancora — e sai perché
non è un problema.

---

## Passo 6 — Il riattacco (75 min)

Cinque attacchi, sul tuo portale raggiungibile da internet. **Devono fallire tutti.**

Al posto di `API` metti l'indirizzo della tua porta **8000**,
al posto di `PAGINA` quello della tua porta **5500**.

| # | Attacco | Come | Deve succedere |
|---|---------|------|----------------|
| 1 | SQL injection | `curl -G "API/tickets" --data-urlencode "status=x' OR '1'='1"` | **422** — il filtro non si scavalca |
| 2 | Dati spazzatura | `POST` con titolo vuoto e `status:"banana"`, con la chiave | **422** — il database resta pulito |
| 3 | Scrittura senza chiave | `curl -i -X DELETE "API/tickets/1"` | **401** — e lo stesso per POST e PUT |
| 4 | Il segreto | apri `app/main.py` sul tuo repo, **e poi il primo commit** | nel file di adesso nessuna chiave; nel primo commit c'è la vecchia, **che non funziona più** |
| 5 | XSS | crea un ticket col titolo `<img src=x onerror="alert(1)">` e apri `PAGINA` | si **vede scritto**, nessun popup |

E un sesto, che non è una falla ma va provato:

| 6 | Origine estranea | dalla pagina di un compagno, in console: `fetch("API/tickets")` | errore CORS. Poi lui prova lo stesso URL con `curl`: **funziona**. Sai dire perché |

**Fatteli verificare da un altro.** Scambiatevi gli indirizzi e attaccatevi a vicenda:
è più onesto, e uno di fuori prova cose che a te non vengono in mente.

**Se qualcosa non regge**, hai tempo: torna al passo di ieri o di oggi che lo riguarda e
chiudilo. Il modulo finisce con i test verdi, non con l'orario.

---

## Il report — cinque righe, non di più

Crea `REPORT.md` nel repo, committa e pusha.

```markdown
# Portale Assistenza — report

## I sei attacchi
(uno per riga: quale, cosa ha risposto, regge sì/no)

## Il numero che ho guardato
Quanti millisecondi ci mette una richiesta nel tab Network, e cosa lo farebbe crescere.

## La cosa che non sapevo
Una riga. Quella vera.
```

---

## Cosa ti porti a casa

1. Un'API e una pagina sono **due programmi separati** che si parlano via HTTP, e stanno su due indirizzi diversi.
2. Un dato che viene da fuori non è mai codice: lo diventa se sei tu a metterlo dove il browser lo esegue.
3. CORS non protegge l'API: protegge gli utenti del browser. La chiave protegge le scritture. Due cose diverse.
4. HTTPS protegge il canale, non il segreto.
5. **Un segreto finito in un repo pubblico è bruciato. Non si toglie: si cambia.**
