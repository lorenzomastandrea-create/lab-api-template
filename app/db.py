"""
Tutto quello che tocca il database sta qui dentro, e solo qui.

Perche' separare? Perche' in "main.py" vogliamo leggere gli endpoint dell'API
senza vedere il SQL di mezzo. Se domani cambiamo database, cambiamo solo questo file.

"""

import sqlite3
from datetime import datetime, timezone
from typing import Optional

# Il database e' un singolo file, creato nella cartella del progetto.
# E' nel .gitignore: non finisce su GitHub.
DB_PATH = "tickets.db"

# Ticket di esempio, inseriti al primo avvio (vedi seed_if_empty).
# Servono per avere subito qualcosa da vedere e, piu' avanti, da filtrare.
SEED_TICKETS = [
    ("Stampante del piano 2 offline", "Non compare piu' tra le stampanti disponibili.", "aperto"),
    ("Wi-Fi lento in aula 3", "Dalle 14 in poi la connessione cade di continuo.", "in_lavorazione"),
    ("Monitor da sostituire", "Il monitor della postazione 7 ha una riga verde fissa.", "chiuso"),
]


def get_connection() -> sqlite3.Connection:
    """Apre una connessione al database.

    row_factory = sqlite3.Row fa si' che le righe si leggano per nome di colonna
    (row["title"]) invece che per posizione (row[1]): molto piu' difficile sbagliare.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Crea la tabella dei ticket, se non esiste gia'.

    "IF NOT EXISTS" rende la funzione ripetibile: puoi chiamarla a ogni avvio
    del server senza distruggere i dati gia' presenti.
    """
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tickets (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status      TEXT NOT NULL DEFAULT 'aperto',
                created_at  TEXT NOT NULL
            )
            """
        )


def seed_if_empty() -> int:
    """Inserisce i ticket di esempio, ma solo se la tabella e' vuota.

    Il controllo "solo se vuota" e' importante: senza, a ogni riavvio del server
    ti ritroveresti tre ticket in piu'.

    Restituisce quanti ticket ha inserito (0 se c'erano gia' dei dati).
    """
    with get_connection() as conn:
        already_there = conn.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
        if already_there > 0:
            return 0

        created_at = _now()
        conn.executemany(
            "INSERT INTO tickets (title, description, status, created_at) VALUES (?, ?, ?, ?)",
            [(title, description, status, created_at) for title, description, status in SEED_TICKETS],
        )

    return len(SEED_TICKETS)


def list_tickets(status: Optional[str] = None) -> list[dict]:
    """Restituisce i ticket, dal piu' vecchio al piu' recente.

    Se "status" e' None restituisce tutti i ticket, altrimenti solo quelli
    con quello stato.
    """
    with get_connection() as conn:
        if status is None:
            rows = conn.execute("SELECT * FROM tickets ORDER BY id").fetchall()
        else:
            # Il filtro viene incollato dentro la query cosi' com'e' arrivato.
            # Funziona: /tickets?status=aperto restituisce i ticket aperti.
            query = f"SELECT * FROM tickets WHERE status = ? ORDER BY id"
            rows = conn.execute(query, (status,) ).fetchall()

    return [dict(row) for row in rows]


def get_ticket(ticket_id: int) -> Optional[dict]:
    """Restituisce un singolo ticket, oppure None se quell'id non esiste.

    Optional[dict] si legge: "un dizionario, oppure niente".
    """
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()

    return dict(row) if row else None


def create_ticket(title: str, description: str, status: str) -> dict:
    """Inserisce un nuovo ticket e restituisce il ticket appena creato.

    lastrowid e' l'id che SQLite ha assegnato alla riga appena inserita:
    lo usiamo per rileggere il ticket completo, con id e created_at.
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO tickets (title, description, status, created_at) VALUES (?, ?, ?, ?)",
            (title, description, status, _now()),
        )
        new_id = cursor.lastrowid

    return get_ticket(new_id)


def update_ticket(ticket_id: int, title: str, description: str, status: str) -> Optional[dict]:
    """Modifica un ticket esistente. Restituisce None se quell'id non esiste.

    rowcount dice quante righe sono state modificate: se e' 0, l'id non c'era.
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE tickets SET title = ?, description = ?, status = ? WHERE id = ?",
            (title, description, status, ticket_id),
        )
        if cursor.rowcount == 0:
            return None

    return get_ticket(ticket_id)


def delete_ticket(ticket_id: int) -> bool:
    """Cancella un ticket. Restituisce True se c'era, False se l'id non esisteva."""
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
        return cursor.rowcount > 0


def _now() -> str:
    """Data e ora di adesso, in formato testo (es. "2026-09-18T10:30:00+00:00").

    L'underscore davanti al nome e' una convenzione Python: "funzione di servizio,
    usata solo dentro questo file".
    """
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
