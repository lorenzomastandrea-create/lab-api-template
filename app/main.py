"""
Portale Ticket — l'API dell'assistenza interna.

Endpoint:
  GET    /health              -> il server e' vivo
  GET    /tickets             -> lista (filtro opzionale ?status=aperto)
  GET    /tickets/{id}        -> un ticket, 404 se non c'e'
  POST   /tickets             -> crea (richiede X-API-Key)
  PUT    /tickets/{id}        -> DA SCRIVERE
  DELETE /tickets/{id}        -> cancella (richiede X-API-Key)

Al primo avvio il database viene creato e riempito con i tre ticket di esempio
(gli stessi del template).

Avvio:  uvicorn app.main:app --reload
Docs:   http://127.0.0.1:8000/docs
"""

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app import db
import os
from typing import Optional

from dotenv import load_dotenv

from app.models import TicketIn, TicketOut, TicketStatus

load_dotenv()

# La chiave che protegge le scritture.
API_KEY = "chiave-del-corso-2026"

app = FastAPI(title="Portale Ticket", version="1.0")

# --- CORS -------------------------------------------------------------------
# Chi puo' chiamare questa API da un browser. Con ["*"] chiunque: va bene SOLO
# per la versione del docente usata come bersaglio la mattina di G2.
# Nella vostra versione (G2 pomeriggio) qui ci va l'URL esatto del vostro frontend.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Preparazione del database, una volta sola all'avvio del server:
# prima la tabella, poi i ticket di esempio (solo se la tabella e' vuota).
db.init_db()
db.seed_if_empty()


def require_api_key(x_api_key: Optional[str] = Header(default=None)):
    """Lascia passare solo chi presenta la chiave giusta.

    Il nome "x_api_key" diventa l'header "X-API-Key": FastAPI converte
    gli underscore in trattini da solo.
    """
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Chiave API mancante o errata")


@app.get("/health")
def health():
    """Risponde se il server e' vivo. Lo useremo anche in G2 per il monitoraggio."""
    return {"status": "ok"}


@app.get("/tickets")
def list_tickets(status: Optional[str] = Query(default=None)):
    """La lista dei ticket, eventualmente filtrata per stato."""
    return db.list_tickets(status)


@app.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int):
    """Un singolo ticket.

    {ticket_id} nel percorso diventa il parametro della funzione. Avendolo dichiarato
    "int", FastAPI rifiuta da solo un URL come /tickets/pippo con un errore 422.
    """
    ticket = db.get_ticket(ticket_id)

    # Un id che non esiste non e' un errore del server: e' un 404, "non trovato".
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket non trovato")

    return ticket

@app.post("/tickets", status_code=201, dependencies=[Depends(require_api_key)])
def create_ticket(ticket: TicketIn):
    """Crea un nuovo ticket."""
    return db.create_ticket(
        ticket.title,
        ticket.description,
        ticket.status,
    )


@app.put(
    "/tickets/{ticket_id}",
    response_model=TicketOut,
    dependencies=[Depends(require_api_key)],
)
def update_ticket(ticket_id: int, ticket: TicketIn):
    aggiornato = db.update_ticket(
        ticket_id,
        ticket.title,
        ticket.description,
        ticket.status,
    )

    if aggiornato is None:
        raise HTTPException(status_code=404, detail="Ticket non trovato")

    return aggiornato


@app.delete("/tickets/{ticket_id}", status_code=204, dependencies=[Depends(require_api_key)],)
def delete_ticket(ticket_id: int):
    """Cancella un ticket. 204 vuol dire "fatto, e non ho niente da dirti"."""
    if not db.delete_ticket(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket non trovato")
