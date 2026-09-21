# Portale Assistenza — trova le falle e chiudile

**"L'app funziona. Ma è piena di buchi."**

Hai un portale ticket completo: si apre, mostra le segnalazioni, ne crea di nuove.
Sembra a posto. Non lo è. Dentro ci sono **cinque punti deboli** e **un pezzo mancante**.

Il tuo lavoro non è costruire da zero: è quello che si fa davvero in azienda, cioè
prendere codice che gira, capire dove è fragile, e ripararlo.

**Oggi ne chiudi tre e scrivi il pezzo che manca.** Sono i tre che vivono dentro il
server: ci si arriva da qui, dal tuo computer, senza bisogno di altro.
Gli altri due restano aperti apposta: fanno male solo quando il portale è **online e
pubblico**, e domani lo sarà. Colpirli oggi, in locale, sarebbe sparare a salve.

Ogni passo ha tre momenti:
- **Attacca** — fai il danno con le tue mani, così vedi che il buco è vero.
- **Guarda** — cosa è successo, e perché.
- **Ripara** — poche righe. Poi **riattacca**: non deve più funzionare.

Se ti blòcchi su un passo per più di dieci minuti, apri il triangolino **"Serve una mano"**
in fondo al passo: ti dice **dove** guardare, non la soluzione.

---

## Passo 0 — Accendere il portale

> **Questo passo lo facciamo insieme.** Il docente lo fa sul suo schermo, voi lo rifate
> sul vostro. Non andate avanti da soli: se uno resta indietro qui, resta indietro tutto
> il giorno. Alla fine del passo 0 tutti devono vedere la stessa pagina.

### 0.1 — Prendere il repo

Sul repo del docente, bottone verde **`Use this template`** → **`Create a new repository`**.

- nome: `portale-assistenza` (o quello che volete)
- visibilità: **Public**

> **Public, non Private.** Non è una svista: domani serve. Qui dentro non c'è niente di
> vostro e niente di vero — è materiale del corso.

Poi, sul **vostro** repo appena creato: `Code` → `Codespaces` → **`Create codespace on main`**.
Ci mette un paio di minuti: sta costruendo una macchina Linux con Python già dentro.

**Come verifico:** si apre VS Code nel browser, e nell'albero a sinistra vedete `app/`,
`frontend/`, `CONSEGNA.md`.

### 0.2 — Accendere l'API (terminale 1)

```bash
make backend
```

**Come verifico:** compare `Application startup complete.` e il terminale **resta occupato**.
È normale: il server è acceso e sta ascoltando. Non chiudete questo terminale, mai.

> `make backend` è una scorciatoia: dentro lancia `uvicorn app.main:app --reload`. Scriverlo
> a mano è facile da sbagliare (i punti e i due punti vanno al posto giusto), così non serve.

In basso, nel pannello **PORTS**, è comparsa la riga **8000**.

### 0.3 — Dire alla pagina dove sta l'API

La pagina e l'API sono due programmi diversi. La pagina **non sa** dove sia l'API: glielo
dite voi, e si fa in un file solo.

Quando avete lanciato `make backend`, in cima ha stampato l'indirizzo dell'API — una cosa
tipo `https://qualcosa-di-vostro-8000.app.github.dev`. Serve quello.

1. copiate quell'indirizzo (quello scritto dopo `API:` nel terminale del backend)
2. aprite `frontend/config.js`
3. incollatelo al posto dell'indirizzo che c'è, **senza la barra finale**

```js
const API_URL = "https://qualcosa-di-vostro-8000.app.github.dev";
```

**Come verifico:** aprite quell'indirizzo in una scheda nuova aggiungendo `/health` in
fondo. Deve rispondere `{"status":"ok"}`. Se vedete una pagina di login di GitHub, la
porta 8000 è privata: pannello **PORTS**, tasto destro sulla riga 8000 → **Port
Visibility** → **Public**.

### 0.4 — Accendere la pagina (terminale 2)

Aprite un terminale **nuovo** (il `+` nel pannello del terminale): il primo è occupato dall'API.

```bash
make frontend
```

Anche qui, in cima, `make frontend` stampa il link della pagina: **Ctrl/Cmd + clic** per
aprirla. (In alternativa: pannello **PORTS**, riga **5500**, icona del **mondo**.)

**Come verifico:** si apre il portale. C'è il titolo "Assistenza interna", una tabella con
**tre segnalazioni**, un menu per filtrare e un form per crearne di nuove.
Se la tabella è vuota e in basso c'è un messaggio rosso, l'indirizzo del passo 0.3 è sbagliato.

### 0.5 — Guardarlo, prima di romperlo

Cinque minuti, senza scrivere niente. Provate:

- cambiate il menu **"Mostra"**: l'elenco si filtra
- create una segnalazione col form (la chiave è alla lavagna)
- premete **F12** → scheda **Network** → ricaricate: vedete le richieste che la pagina
  fa all'API, una per una, con il loro esito
  *(F12 apre gli Strumenti per sviluppatori del **browser**, sulla pagina — non in VS Code.
  Sui Mac, se non risponde: tasto destro sulla pagina → Ispeziona, oppure `Cmd + Option + I`.)*

**Questa è l'applicazione che vi hanno consegnato.** Funziona. Sembra a posto.

Da qui in poi lavorate da soli, un passo alla volta.

---

## Passo 1 — Il filtro che mostra troppo

**Attacca.** Nella pagina, in alto a destra dell'elenco, c'è il menu "Mostra". Sceglie
quali ticket vedere. Ora aprilo dal browser a mano: nella barra dell'indirizzo del
**backend** (porta 8000, non la pagina) scrivi:

```
http://127.0.0.1:8000/tickets?status=aperto
```

Vedi solo gli aperti. Giusto. Adesso prova questo al posto di `aperto`:

```
http://127.0.0.1:8000/tickets?status=x' OR '1'='1
```

**Guarda.** Chiedevi uno stato che non esiste (`x`), e invece di darti zero ticket
te li ha dati **tutti**. Il filtro è stato scavalcato. Apri `app/db.py`, funzione
`list_tickets`: la query viene **costruita incollando** il testo che arriva
dall'utente. Chi scrive nel filtro non sta scegliendo uno stato: sta scrivendo un
pezzo della tua query. Questo è l'**SQL injection**.

**Ripara.** Il valore non deve essere incollato nella stringa, ma passato a parte
con il segnaposto `?`. Così il database lo tratta come un **dato**, mai come codice.

**Riattacca.** Rilancia lo stesso indirizzo con `x' OR '1'='1`: ora restituisce
zero ticket, perché nessuno ha davvero quello stato. Il filtro onesto continua a funzionare.

<details><summary>Serve una mano</summary>

`app/db.py`, `list_tickets`. Guarda com'è già scritta la query di `get_ticket` poco
sotto: usa `?` e una tupla. Il filtro va scritto allo stesso modo:
`"... WHERE status = ? ORDER BY id", (status,)`.
</details>

---

## Passo 2 — Il form che accetta qualsiasi cosa

**Attacca.** Nel form della pagina prova a creare una segnalazione con il **titolo vuoto**.
Passa. Poi, dalla documentazione del backend (`http://127.0.0.1:8000/docs`, endpoint
`POST /tickets`, "Try it out"), manda un ticket con `"status": "banana"`.

**Guarda.** Ricarica l'elenco: c'è una riga senza titolo, e una con uno stato che il
tuo portale non sa neanche colorare. Il database si sta riempiendo di roba senza senso.
Apri `app/main.py`, `create_ticket`: prende il JSON e lo salva **così com'è**, senza
controllare niente.

**Ripara.** Esiste già un modello, `TicketIn` in `app/models.py`, che dice com'è fatto
un ticket valido (titolo da 3 a 100 caratteri, stato solo fra i tre ammessi). Basta
dire a FastAPI di usarlo: cambia la firma della funzione perché riceva un `TicketIn`,
e lascia che sia lui a rispondere **422** quando i dati non vanno.

**Riattacca.** Titolo vuoto → **422**, `status: "banana"` → **422**. Un ticket vero
passa ancora.

<details><summary>Serve una mano</summary>

Confronta con `POST` della soluzione o con il modo in cui `get_ticket` dichiara i suoi
parametri. La firma diventa `def create_ticket(ticket: TicketIn):` e dentro usi
`ticket.title`, `ticket.description`, `ticket.status`. Sparisce il `request.json()`.
</details>

---

## Passo 3 — La cancellazione che non chiede niente

**Attacca.** Creare un ticket chiede la chiave. Cancellarne uno, no. Provalo: dalla
documentazione (`/docs`, `DELETE /tickets/{id}`) cancella il ticket 1 **senza** mettere
nessuna chiave. Sparisce.

**Guarda.** Leggere è giusto che sia libero. Ma **cancellare** è una scrittura, e le
scritture le protegge la chiave. In `app/main.py` guarda `POST`: ha
`dependencies=[Depends(require_api_key)]`. `DELETE`, sotto, **non ce l'ha**.

**Ripara.** Aggiungi la stessa guardia al `DELETE`. Una riga, copiata da `POST`.

**Riattacca.** `DELETE` senza chiave → **401**. Con la chiave giusta → cancella.

<details><summary>Serve una mano</summary>

`app/main.py`, riga di `@app.delete(...)`. Aggiungi `, dependencies=[Depends(require_api_key)]`
dentro le parentesi del decoratore, esattamente come su `@app.post`.
</details>

---

## Passo 4 — Il pezzo che manca: cambiare stato

**Attacca.** Nell'elenco, cambia lo stato di un ticket con il menu colorato. In basso
compare un errore. Apri la console (F12): il server ha risposto **405**.

**Guarda.** Il menu chiama `PUT /tickets/{id}`, ma quell'endpoint **non esiste**: in
`app/main.py` c'è solo un commento `# TODO`. `405` vuol dire "quel metodo qui non c'è".
Questa non è una falla: è codice da scrivere. La funzione che tocca il database,
`update_ticket`, esiste già in `db.py`: manca solo l'endpoint che la usa.

**Ripara.** Scrivi `PUT /tickets/{ticket_id}`. Prendi `POST` come modello: stessa
protezione con la chiave, stesso `TicketIn` in ingresso (il passo 2!), ma chiama
`db.update_ticket(...)` e risponde **404** se quell'id non c'è.

**Riattacca.** Cambia stato dalla pagina: la pastiglia cambia colore, niente errore.

<details><summary>Serve una mano</summary>

Struttura:
```
@app.put("/tickets/{ticket_id}", response_model=TicketOut, dependencies=[Depends(require_api_key)])
def update_ticket(ticket_id: int, ticket: TicketIn):
    aggiornato = db.update_ticket(ticket_id, ticket.title, ticket.description, ticket.status)
    if aggiornato is None:
        raise HTTPException(status_code=404, detail="Ticket non trovato")
    return aggiornato
```
</details>

---

## Chiusura — il giro completo

Riparate tutte, rifai i quattro attacchi di fila. Devono fallire tutti:

- [ ] filtro `x' OR '1'='1` → zero ticket, non tutti
- [ ] titolo vuoto / `status: banana` → 422
- [ ] `DELETE` senza chiave → 401
- [ ] menu dello stato → funziona, niente 405

Poi due righe: **quale falla ti ha sorpreso di più, e perché.**

---

## Quello che resta aperto (e non è una dimenticanza)

Due punti deboli sono ancora lì, e li vedrai **domani**:

- prova a creare una segnalazione col titolo `<img src=x onerror="alert('ciao')">`
  e guarda cosa fa la pagina;
- apri `app/main.py` e cerca la chiave. Poi apri `.gitignore` e cerca `.env`.

Non ripararli oggi. Domani il portale va online, con un indirizzo vero e un repo
pubblico: è lì che questi due smettono di essere esercizi.

Le istruzioni del secondo giorno sono già qui, in
[`CONSEGNA_GIORNO_2.md`](./CONSEGNA_GIORNO_2.md). Aprilo domani mattina.
