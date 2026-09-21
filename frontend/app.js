// ===========================================================================
// app.js — il comportamento della pagina.
// ===========================================================================
// index.html e' la struttura, style.css l'aspetto, questo file e' quello che
// SUCCEDE: chiama l'API, costruisce le righe della tabella, manda il form.
//
// Come e' organizzato (l'ordine e' quello in cui conviene leggerlo):
//   1. I riferimenti agli elementi della pagina
//   2. Le funzioni che parlano con l'API
//   3. Le funzioni che disegnano
//   4. Le azioni sulle righe: cambia stato, elimina
//   5. Il form
//   6. L'avvio
//
// Regola di lettura: ogni funzione fa UNA cosa e ha sopra due righe che dicono
// cosa fa e quando viene chiamata.


// ===========================================================================
// 1. I RIFERIMENTI AGLI ELEMENTI DELLA PAGINA
// ===========================================================================
// Li prendiamo tutti qui, una volta sola. Ogni nome corrisponde a un id
// scritto in index.html: se cambi un id li', devi cambiarlo anche qui.

const pallinoServer   = document.getElementById("pallino-server");
const testoServer     = document.getElementById("testo-server");

const filtroStato     = document.getElementById("filtro-stato");
const bottoneRicarica = document.getElementById("bottone-ricarica");

const tabella         = document.getElementById("tabella-ticket");
const corpoTabella    = document.getElementById("righe-ticket");
const elencoCaricamento = document.getElementById("elenco-caricamento");
const elencoVuoto     = document.getElementById("elenco-vuoto");
const elencoErrore    = document.getElementById("elenco-errore");

const formTicket      = document.getElementById("form-ticket");
const campoTitolo     = document.getElementById("campo-titolo");
const campoDescrizione = document.getElementById("campo-descrizione");
const campoStato      = document.getElementById("campo-stato");
const campoChiave     = document.getElementById("campo-chiave");
const bottoneInvia    = document.getElementById("bottone-invia");
const messaggioForm   = document.getElementById("messaggio-form");

// Le tre etichette degli stati, scritte per essere lette da un umano.
// L'API usa "in_lavorazione", la pagina mostra "in lavorazione".
const ETICHETTE_STATO = {
  aperto: "aperto",
  in_lavorazione: "in lavorazione",
  chiuso: "chiuso",
};


// ===========================================================================
// 2. LE FUNZIONI CHE PARLANO CON L'API
// ===========================================================================
// Sono le uniche che fanno fetch. Tutto il resto della pagina chiama queste.

// Chiede all'API se e' viva. Chiamata una volta sola, all'avvio.
async function chiediSeIlServerEVivo() {
  try {
    const risposta = await fetch(API_URL + "/health");
    if (!risposta.ok) throw new Error("risposta non ok");
    return true;
  } catch (errore) {
    return false;
  }
}

// Scarica la lista dei ticket, eventualmente filtrata per stato.
// Chiamata all'avvio, quando cambia il filtro e dopo ogni modifica.
async function scaricaTicket(stato) {
  // Se c'e' un filtro lo attacchiamo all'indirizzo: /tickets?status=aperto
  let indirizzo = API_URL + "/tickets";
  if (stato) {
    indirizzo = indirizzo + "?status=" + encodeURIComponent(stato);
  }

  const risposta = await fetch(indirizzo);
  if (!risposta.ok) {
    throw new Error("Il server ha risposto " + risposta.status);
  }
  return await risposta.json();
}

// Crea un ticket. Serve la chiave: e' una scrittura.
// Chiamata quando si invia il form.
async function creaTicket(datiDelTicket, chiave) {
  const risposta = await fetch(API_URL + "/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": chiave,
    },
    body: JSON.stringify(datiDelTicket),
  });
  return risposta;   // chi chiama decide cosa fare degli status code
}

// Sostituisce un ticket esistente. Serve la chiave.
// Chiamata quando si cambia lo stato dal menu di una riga.
async function aggiornaTicket(id, datiDelTicket, chiave) {
  const risposta = await fetch(API_URL + "/tickets/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": chiave,
    },
    body: JSON.stringify(datiDelTicket),
  });
  return risposta;
}

// Cancella un ticket. Serve la chiave.
// Chiamata quando si clicca il cestino di una riga.
async function eliminaTicket(id, chiave) {
  const risposta = await fetch(API_URL + "/tickets/" + id, {
    method: "DELETE",
    headers: { "X-API-Key": chiave },
  });
  return risposta;
}


// ===========================================================================
// 3. LE FUNZIONI CHE DISEGNANO
// ===========================================================================

// Accende uno solo dei quattro stati dell'elenco e spegne gli altri.
// Chiamata da caricaEMostraTicket, a ogni passaggio.
function mostraSoltanto(quale) {
  elencoCaricamento.hidden = (quale !== "caricamento");
  elencoVuoto.hidden       = (quale !== "vuoto");
  elencoErrore.hidden      = (quale !== "errore");
  tabella.hidden           = (quale !== "tabella");
}

// Trasforma "2026-09-19T08:30:00+00:00" in "19/09/2026".
// Chiamata da costruisciRiga.
function formattaData(testoIso) {
  const data = new Date(testoIso);
  if (isNaN(data)) return "—";          // se la data non si legge, non inventiamo
  return data.toLocaleDateString("it-IT");
}

// Costruisce UNA riga della tabella a partire da un ticket.
// Chiamata da disegnaTabella, una volta per ticket.
function costruisciRiga(ticket) {
  const riga = document.createElement("tr");

  // --- id ---
  const cellaId = document.createElement("td");
  cellaId.className = "cella-id";
  cellaId.textContent = ticket.id;
  riga.appendChild(cellaId);

  // --- titolo e descrizione ---
  // Costruiamo le due righe di testo in un colpo solo: e' piu' corto che
  // creare due <div> a mano.
  const cellaTesto = document.createElement("td");
  cellaTesto.innerHTML =
    '<div class="cella-titolo">' + ticket.title + '</div>' +
    '<div class="cella-descrizione">' + ticket.description + '</div>';
  riga.appendChild(cellaTesto);

  // --- stato ---
  // Un menu solo, colorato in base allo stato: si legge e si cambia nello
  // stesso punto. Due elementi (un'etichetta + un menu) direbbero la stessa
  // cosa due volte.
  const cellaStato = document.createElement("td");
  cellaStato.appendChild(costruisciMenuStato(ticket));
  riga.appendChild(cellaStato);

  // --- data ---
  const cellaData = document.createElement("td");
  cellaData.className = "cella-data";
  cellaData.textContent = formattaData(ticket.created_at);
  riga.appendChild(cellaData);

  // --- azioni ---
  const cellaAzioni = document.createElement("td");
  cellaAzioni.className = "colonna-azioni";
  cellaAzioni.appendChild(costruisciBottoneElimina(ticket));
  riga.appendChild(cellaAzioni);

  return riga;
}

// Svuota la tabella e la ridisegna con i ticket ricevuti.
// Chiamata da caricaEMostraTicket.
function disegnaTabella(ticket) {
  corpoTabella.textContent = "";        // via le righe di prima

  for (const unTicket of ticket) {
    corpoTabella.appendChild(costruisciRiga(unTicket));
  }
}


// ===========================================================================
// 4. LE AZIONI SULLE RIGHE
// ===========================================================================

// Il menu a tendina che cambia lo stato di un ticket.
// Chiamata da costruisciRiga.
function costruisciMenuStato(ticket) {
  const menu = document.createElement("select");

  // Due classi: una per la forma, una per il colore dello stato attuale.
  menu.className = "select-stato select-stato--" + ticket.status;

  for (const stato of Object.keys(ETICHETTE_STATO)) {
    const voce = document.createElement("option");
    voce.value = stato;
    voce.textContent = ETICHETTE_STATO[stato];
    if (stato === ticket.status) voce.selected = true;
    menu.appendChild(voce);
  }

  // "change" scatta quando l'utente sceglie una voce diversa.
  menu.addEventListener("change", function () {
    cambiaStato(ticket, menu.value);
  });

  return menu;
}

// Il cestino che cancella un ticket.
// Chiamata da costruisciRiga.
function costruisciBottoneElimina(ticket) {
  const bottone = document.createElement("button");
  bottone.type = "button";
  bottone.className = "bottone-elimina";
  bottone.textContent = "🗑";
  bottone.title = "Elimina la segnalazione " + ticket.id;

  bottone.addEventListener("click", function () {
    chiediEdElimina(ticket);
  });

  return bottone;
}

// Manda il PUT che cambia lo stato, poi ricarica l'elenco.
// Chiamata dal menu di una riga.
async function cambiaStato(ticket, nuovoStato) {
  const chiave = campoChiave.value.trim();
  if (!chiave) {
    mostraMessaggio("Per modificare una segnalazione serve la chiave: scrivila qui sopra.", "errore");
    caricaEMostraTicket();        // rimette il menu com'era
    return;
  }

  // PUT sostituisce il ticket INTERO: rimandiamo anche titolo e descrizione,
  // altrimenti li perderemmo.
  const risposta = await aggiornaTicket(ticket.id, {
    title: ticket.title,
    description: ticket.description,
    status: nuovoStato,
  }, chiave);

  if (risposta.ok) {
    mostraMessaggio("Segnalazione " + ticket.id + " → " + ETICHETTE_STATO[nuovoStato] + ".", "ok");
  } else {
    mostraMessaggio(await spiegaErrore(risposta), "errore");
  }
  caricaEMostraTicket();
}

// Chiede conferma e manda il DELETE.
// Chiamata dal cestino di una riga.
async function chiediEdElimina(ticket) {
  const chiave = campoChiave.value.trim();
  if (!chiave) {
    mostraMessaggio("Per eliminare una segnalazione serve la chiave: scrivila qui sopra.", "errore");
    return;
  }

  const conferma = window.confirm("Elimino la segnalazione " + ticket.id + "? Non si torna indietro.");
  if (!conferma) return;

  const risposta = await eliminaTicket(ticket.id, chiave);

  if (risposta.ok) {
    mostraMessaggio("Segnalazione " + ticket.id + " eliminata.", "ok");
  } else {
    mostraMessaggio(await spiegaErrore(risposta), "errore");
  }
  caricaEMostraTicket();
}


// ===========================================================================
// 5. IL FORM
// ===========================================================================

// Scrive un messaggio sotto il form, con il colore giusto.
// Chiamata da tutte le azioni che possono andare bene o male.
function mostraMessaggio(testo, tipo) {
  messaggioForm.hidden = false;
  messaggioForm.textContent = testo;
  messaggioForm.className = "messaggio messaggio--" + tipo;
}

// Traduce una risposta di errore dell'API in una frase leggibile.
// Chiamata ogni volta che una scrittura non e' andata a buon fine.
async function spiegaErrore(risposta) {
  if (risposta.status === 401) {
    return "Chiave sbagliata o mancante: la scrittura è stata rifiutata (401).";
  }
  if (risposta.status === 404) {
    return "Quella segnalazione non esiste più (404). Ricarico l'elenco.";
  }
  if (risposta.status === 422) {
    // Il 422 di FastAPI porta con se' il motivo preciso: vale la pena mostrarlo.
    try {
      const dettaglio = await risposta.json();
      const primo = dettaglio.detail[0];
      return "Dati non validi (422): " + primo.loc.join(" → ") + " — " + primo.msg;
    } catch (errore) {
      return "Dati non validi (422).";
    }
  }
  return "Il server ha risposto " + risposta.status + ".";
}

// Manda il form: legge i campi, chiama l'API, mostra l'esito.
// Chiamata quando si preme "Invia la segnalazione".
async function inviaForm(evento) {
  evento.preventDefault();          // niente ricaricamento della pagina

  const chiave = campoChiave.value.trim();
  if (!chiave) {
    mostraMessaggio("Serve la chiave di servizio per aprire una segnalazione.", "errore");
    campoChiave.focus();
    return;
  }

  const nuovoTicket = {
    title: campoTitolo.value.trim(),
    description: campoDescrizione.value.trim(),
    status: campoStato.value,
  };

  // Mentre aspettiamo, il bottone si spegne: cosi' nessuno preme due volte.
  bottoneInvia.disabled = true;
  bottoneInvia.textContent = "Invio…";

  try {
    const risposta = await creaTicket(nuovoTicket, chiave);

    if (risposta.status === 201) {
      const creato = await risposta.json();
      mostraMessaggio("Segnalazione " + creato.id + " aperta. Grazie!", "ok");
      campoTitolo.value = "";
      campoDescrizione.value = "";
      caricaEMostraTicket();
    } else {
      mostraMessaggio(await spiegaErrore(risposta), "errore");
    }
  } catch (errore) {
    // Qui ci arriviamo se la rete non ha funzionato del tutto: server spento,
    // indirizzo sbagliato in config.js, oppure CORS che blocca la risposta.
    mostraMessaggio("Non riesco a contattare il server. Controlla la console (F12).", "errore");
    console.error(errore);
  } finally {
    // "finally" gira sempre, sia che sia andata bene sia che sia andata male:
    // il bottone va riacceso in ogni caso.
    bottoneInvia.disabled = false;
    bottoneInvia.textContent = "Invia la segnalazione";
  }
}


// ===========================================================================
// 6. L'AVVIO
// ===========================================================================

// Scarica i ticket e aggiorna l'elenco. E' la funzione che si richiama
// ogni volta che qualcosa cambia.
async function caricaEMostraTicket() {
  mostraSoltanto("caricamento");

  try {
    const ticket = await scaricaTicket(filtroStato.value);

    if (ticket.length === 0) {
      mostraSoltanto("vuoto");
      return;
    }

    disegnaTabella(ticket);
    mostraSoltanto("tabella");

  } catch (errore) {
    elencoErrore.textContent =
      "Non riesco a leggere le segnalazioni. Il server risponde? (dettagli in console, F12)";
    mostraSoltanto("errore");
    console.error(errore);
  }
}

// Accende il pallino verde o rosso in alto a destra.
// Chiamata una volta sola, all'avvio.
async function aggiornaStatoServer() {
  const vivo = await chiediSeIlServerEVivo();

  pallinoServer.className = vivo ? "pallino pallino--vivo" : "pallino pallino--giu";
  testoServer.textContent = vivo ? "server attivo" : "server non raggiungibile";
}

// --- Chi ascolta cosa ------------------------------------------------------
formTicket.addEventListener("submit", inviaForm);
filtroStato.addEventListener("change", caricaEMostraTicket);
bottoneRicarica.addEventListener("click", caricaEMostraTicket);

// --- Si parte --------------------------------------------------------------
console.log("app.js caricato. API:", API_URL);
aggiornaStatoServer();
caricaEMostraTicket();
