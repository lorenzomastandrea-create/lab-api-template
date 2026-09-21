"""
Modelli dei dati.

Un "modello" descrive che forma deve avere un ticket. FastAPI lo usa per due cose:
  1. controllare i dati che arrivano dal client (e rifiutarli se sono sbagliati);
  2. decidere che forma hanno i dati che rispondiamo.
"""

from typing import Literal

from pydantic import BaseModel, Field

# Gli unici tre stati ammessi. Qualsiasi altro valore viene rifiutato.
TicketStatus = Literal["aperto", "in_lavorazione", "chiuso"]


class TicketIn(BaseModel):
    """I dati che il client ci manda quando crea o modifica un ticket.

    Nota: qui NON c'e' l'id, e non c'e' created_at. Quelli li decide il server:
    se li decidesse il client, chiunque potrebbe sovrascrivere un ticket altrui.
    """

    title: str = Field(min_length=3, max_length=100)
    description: str = Field(default="", max_length=1000)
    status: TicketStatus = "aperto"


class TicketOut(TicketIn):
    """I dati che il server risponde: quelli di TicketIn, piu' id e data di creazione.

    "TicketOut(TicketIn)" significa: prendi tutti i campi di TicketIn e aggiungi questi.
    """

    id: int
    created_at: str
