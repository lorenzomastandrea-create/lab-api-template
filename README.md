# Portale Assistenza — la versione da riparare

## Cos'è questa roba

Un **portale interno di segnalazioni**: il posto dove in un'azienda scrivi "la stampante
del piano 2 non stampa" e qualcuno lo prende in carico.

Funziona. Si apre, mostra le segnalazioni, ne crea di nuove, le filtra, cambia lo stato.
Non devi costruirlo: **ce l'hai già finito**.

Ma è **bucato**. Dentro ci sono cinque punti deboli veri — quelli che si trovano nel
codice vero — e un pezzo che manca. Il tuo lavoro per due giorni è trovarli e chiuderli.

> Non stai facendo un esercizio da scuola. È quello che si fa in azienda: ti danno codice
> che gira, scritto da altri, e devi capire dove è fragile prima che lo capisca qualcun altro.

**Le istruzioni passo per passo sono in [`CONSEGNA.md`](./CONSEGNA.md).** Parti da lì.
Il secondo giorno si continua con [`CONSEGNA_GIORNO_2.md`](./CONSEGNA_GIORNO_2.md).

---

## La mattina: i notebook Colab (giorno 1)

La mattina del primo giorno non serve questo repo: serve solo il browser. Clicca,
premi **Copia in Drive**, esegui dall'alto in basso con **Shift+Invio**.

| Notebook | Apri in Colab |
|----------|---------------|
| 00 · Setup (2 min) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/danieledangeli-ctrl/portale-ticket-template/blob/main/colab/00_setup_colab.ipynb) |
| G1_01 · HTTP con le mani (45 min) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/danieledangeli-ctrl/portale-ticket-template/blob/main/colab/G1/G1_01_http_con_le_mani.ipynb) |
| G1_02 · Dati che si difendono (45 min) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/danieledangeli-ctrl/portale-ticket-template/blob/main/colab/G1/G1_02_dati_che_si_difendono.ipynb) |
| G1_03 · Database e injection (60 min) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/danieledangeli-ctrl/portale-ticket-template/blob/main/colab/G1/G1_03_database_e_injection.ipynb) |

La chiave per le celle di scrittura te la dà il docente (è alla lavagna).

---

## Sono due programmi, non uno

Questa è la cosa da capire prima di toccare qualsiasi tasto.

```
   IL TUO BROWSER
         │
         │  (1) chiede la pagina
         ▼
   ┌──────────────┐          ┌──────────────┐
   │  LA PAGINA   │  (2)     │    L'API     │
   │  porta 5500  │ ───────► │  porta 8000  │
   │              │  chiede  │              │
   │ HTML CSS JS  │ i dati   │ Python +     │
   │              │ ◄─────── │ database     │
   └──────────────┘  JSON    └──────────────┘
      http.server               uvicorn
```

- **L'API** (porta **8000**) è un programma Python. Parla solo JSON: se la apri nel
  browser vedi testo, non un sito. È lei che tiene i dati.
- **La pagina** (porta **5500**) è HTML, CSS e JavaScript. Non ha dati suoi: li **chiede**
  all'API, uno per uno, mentre la guardi.

Girano **separati**, in **due terminali diversi**, e restano accesi tutto il giorno.
Spegnere uno dei due rompe metà delle cose, ed è utile saperlo: quando qualcosa non va,
la prima domanda è sempre *"quale dei due è morto?"*.

---

## Accenderlo

Servono **due terminali**: uno per l'API, uno per la pagina. Non devi ricordare i
comandi lunghi — ci sono due scorciatoie.

> **In locale** (sul tuo computer, non su Codespaces) la prima volta lancia `make setup`:
> crea l'ambiente e installa le librerie. Su Codespaces non serve, ci sono già.
> Se vedi `make: uvicorn: No such file or directory`, è questo che manca.

**Terminale 1 — l'API.** Lascialo lì, non chiuderlo.

```bash
make backend
```

Deve comparire `Application startup complete`. La documentazione automatica dell'API
è su `/docs`: lì puoi provare ogni endpoint senza scrivere codice.

**Terminale 2 — la pagina.** Aprine uno **nuovo** (in VS Code: il `+` nel pannello del
terminale). Il primo resta occupato dall'API.

```bash
make frontend
```

`make` senza altro ti ricorda cosa fanno i due comandi. (Dietro le quinte sono
`uvicorn app.main:app --reload` e `python3 -m http.server 5500`: se vuoi vederli,
apri il `Makefile`.)

**Poi apri la pagina.** Su Codespaces: pannello **PORTS**, riga della porta **5500**,
clicca sull'icona del mondo. In locale: `http://127.0.0.1:5500`.

> ⚠️ **Non aprire `index.html` con doppio clic.** Da `file://` il browser blocca le
> chiamate all'API per sicurezza, e vedi una pagina vuota senza capire perché.
> Serve il server del terminale 2.

**La chiave** per creare, modificare ed eliminare te la dà il docente (è alla lavagna).

---

## Dì alla pagina dove sta l'API — `frontend/config.js`

La pagina e l'API sono due programmi separati: la pagina **non sa** dove trovare l'API
finché non glielo dici tu. Si fa in un punto solo, `frontend/config.js`, ultima riga.

**In locale** (sul tuo computer) va già bene com'è:

```js
const API_URL = "http://127.0.0.1:8000";
```

**Su Codespaces** quell'indirizzo, letto dal tuo browser, è il *tuo* computer — non il
Codespace, che gira altrove. Devi metterci l'indirizzo vero della porta 8000:

1. pannello **PORTS**, riga **8000**, colonna **Forwarded Address** → copia l'indirizzo
   (è tipo `https://qualcosa-8000.app.github.dev`)
2. incollalo in `config.js`, **senza barra finale**:
   ```js
   const API_URL = "https://qualcosa-8000.app.github.dev";
   ```
3. ricarica la pagina con **Ctrl/Cmd + Shift + R** — una ricarica normale tiene in
   cache il vecchio `config.js` e sembra che non sia cambiato niente.

> Se la pagina dice *"non riesco a contattare il server"*, il 99% delle volte è questo:
> `config.js` punta ancora a `127.0.0.1`, oppure la porta 8000 nel pannello PORTS è
> **Private** (aprila: tasto destro → Port Visibility → Public).

---

## Se qualcosa non va

I due-tre errori che capitano davvero, e come si chiudono.

**`Address already in use`** (di solito sulla 8000)
Quel server è **già acceso** in un altro terminale. O usi quello, oppure lo chiudi e
rilanci:
```bash
pkill -f uvicorn        # chiude l'API rimasta accesa
make backend            # e la riaccende
```
Per la pagina (porta 5500) è lo stesso con `pkill -f http.server`.
Due programmi non possono ascoltare sulla stessa porta: è anche il motivo per cui
l'API sta sulla 8000 e la pagina sulla 5500.

**La pagina dice "non riesco a contattare il server"**
Quasi sempre `frontend/config.js` (vedi sopra): punta ancora a `127.0.0.1`, oppure la
porta 8000 nel pannello **PORTS** è **Private**. Dopo averlo sistemato, ricarica con
**Ctrl/Cmd + Shift + R**.

**`Attribute "main:app" not found`** avviando a mano
Hai scritto `app:main:app`. Il modo giusto è `app.main:app` (un punto, poi due punti) —
ma con `make backend` non ci pensi.

**Il portale non risponde più dopo una pausa**
Il Codespace si **ferma da solo** dopo mezz'ora di inattività. Riaprilo da
[github.com/codespaces](https://github.com/codespaces), poi di nuovo `make backend` e
`make frontend`.

---

## Cosa c'è dentro

```
app/            l'API (FastAPI + SQLite)
  main.py       gli endpoint: chi risponde a cosa
  db.py         tutto quello che tocca il database
  models.py     la forma di una segnalazione valida
frontend/       la pagina (HTML/CSS/JS, senza framework)
  index.html    la struttura: tabella, form, filtro
  style.css     l'aspetto
  app.js        la logica: sei sezioni numerate e commentate
  config.js     l'UNICO posto con l'indirizzo dell'API
.env            la chiave. Guardalo bene. E guarda il .gitignore…
requirements.txt  le librerie che servono
Makefile          le scorciatoie: make backend, make frontend

CONSEGNA.md            il primo giorno
CONSEGNA_GIORNO_2.md   il secondo
```

I dati sono di esempio e si ricreano da soli a ogni avvio: puoi rompere tutto senza paura.

---

## Le due giornate

**Oggi** chiudi le tre falle che vivono dentro l'API e scrivi il pezzo che manca. Sono
quelle che si vedono da qui, dal tuo Codespace.

**Domani** il portale va **online**, con un indirizzo vero e un repo pubblico. Lì si
chiudono le altre due: in locale non farebbero male a nessuno, e capirai perché.
Le istruzioni sono in [`CONSEGNA_GIORNO_2.md`](./CONSEGNA_GIORNO_2.md).
