# Accende i due pezzi del portale. Servono DUE terminali:
#   Terminale 1:  make backend
#   Terminale 2:  make frontend
# Lasciali aperti tutti e due: se ne chiudi uno, meta' portale smette di funzionare.
#
# In LOCALE (sul tuo computer), la prima volta:  make setup
# Su Codespaces non serve: le librerie ci sono gia'.

.PHONY: help setup backend frontend

# Se c'e' un ambiente locale (.venv) usa quello; altrimenti il python di sistema
# (e' il caso di Codespaces, dove le librerie sono gia' installate).
PY := $(shell [ -x .venv/bin/python ] && echo .venv/bin/python || echo python3)

# "make" senza argomenti mostra questo aiuto.
help:
	@echo "make setup     -> prepara l'ambiente in locale (una volta sola)"
	@echo "make backend   -> accende l'API      (terminale 1)"
	@echo "make frontend  -> accende la pagina  (terminale 2)"
	@echo ""
	@echo "Servono due terminali, uno per comando. Lasciali aperti."

# Solo in locale: crea l'ambiente virtuale e installa le librerie.
setup:
	python3 -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r requirements.txt
	@echo ""
	@echo "Pronto. Ora: make backend"

# L'API (FastAPI). Prima stampa l'indirizzo dove risponde, poi la avvia.
backend:
	@echo "---------------------------------------------------------------"
	@if [ -n "$$CODESPACE_NAME" ]; then \
	  echo "   API:   https://$$CODESPACE_NAME-8000.$$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"; \
	  echo "   docs:  https://$$CODESPACE_NAME-8000.$$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN/docs"; \
	  echo ""; \
	  echo "   >> Copia il primo indirizzo in frontend/config.js (senza / finale)"; \
	else \
	  echo "   API:   http://127.0.0.1:8000"; \
	  echo "   docs:  http://127.0.0.1:8000/docs"; \
	fi
	@echo "---------------------------------------------------------------"
	$(PY) -m uvicorn app.main:app --reload

# La pagina (un server statico). Prima stampa il link, poi la serve.
frontend:
	@echo "---------------------------------------------------------------"
	@if [ -n "$$CODESPACE_NAME" ]; then \
	  echo "   Pagina:  https://$$CODESPACE_NAME-5500.$$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"; \
	else \
	  echo "   Pagina:  http://127.0.0.1:5500"; \
	fi
	@echo "   (Ctrl/Cmd + clic sul link per aprirlo)"
	@echo "---------------------------------------------------------------"
	$(PY) -m http.server 5500 --directory frontend
