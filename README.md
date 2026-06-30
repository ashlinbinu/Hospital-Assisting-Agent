# MediFlow — AI-Powered Hospital Patient Flow Management System

MediFlow is an operational platform that helps front desk staff and hospital administrators manage patient check-in, triage, queueing, scheduling, and daily reporting in one place. An AI triage layer reads a patient's reported symptoms and assigns an operational urgency score, which a logistics engine then uses to keep the waiting room ordered fairly and in real time. The system does **not** perform medical diagnosis — it is a queue-management and operations tool, not a clinical decision-support system.

---

## Table of contents

- [What this system does](#what-this-system-does)
- [Who it's for](#who-its-for)
- [Architecture overview](#architecture-overview)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [AI agents](#ai-agents)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Frontend application](#frontend-application)
- [Environment variables](#environment-variables)
- [Running tests](#running-tests)
- [Roadmap / known gaps](#roadmap--known-gaps)
- [License](#license)

---

## UI Overview
<img width="959" height="412" alt="image" src="https://github.com/user-attachments/assets/10b46399-b906-44b9-8e42-5850deb9b12d" />
<img width="959" height="413" alt="image" src="https://github.com/user-attachments/assets/22145536-00a0-4584-a6f2-06f2271c8971" />
<img width="958" height="410" alt="image" src="https://github.com/user-attachments/assets/03eeaa09-007a-41c1-9182-3a906cb8026e" />
<img width="956" height="413" alt="image" src="https://github.com/user-attachments/assets/75553e31-6535-4ffb-af26-d36b841a710c" />
<img width="958" height="412" alt="image" src="https://github.com/user-attachments/assets/aa5e7684-bea5-43d2-a907-bacb31666b02" />
<img width="959" height="414" alt="image" src="https://github.com/user-attachments/assets/8d2c9f04-3458-46c4-8524-cc322265721a" />
<img width="959" height="412" alt="image" src="https://github.com/user-attachments/assets/b635ee38-7d27-4888-bf6f-8093422c354f" />
<img width="959" height="413" alt="image" src="https://github.com/user-attachments/assets/1d0abaf5-d2c0-4944-a7fe-b82c2e741710" />
<img width="959" height="413" alt="image" src="https://github.com/user-attachments/assets/f03b85d3-bdbb-4a5e-ad12-5b529fe3bd15" />
<img width="959" height="412" alt="image" src="https://github.com/user-attachments/assets/bc31f689-9fee-4f66-bc48-4f6d19e9ab77" />













## What this system does

When a patient contacts, front desk staff register them with their basic details and a free-text description of their symptoms. The **severity agent** sends that description to a large language model, which classifies it into an operational urgency tier (`Low`, `Medium`, `High`, `Critical`) and a 1–10 priority score — strictly for queue ordering, with no diagnosis or medication advice. The **queue agent** then inserts the patient into the relevant doctor's queue and re-sorts every patient in that queue by priority score (and check-in time as a tiebreaker), so the most urgent cases always surface to the front.

Separately, the **scheduling agent** helps book appointments: given a patient's preferred department, date, and time, it checks doctor availability, picks the best-matching physician, and confirms or rejects the booking based on real slot conflicts.

A **reporting layer** aggregates the day's data — total patients processed, active critical cases, average severity, departmental appointment load, and priority-tier breakdowns — for the admin-facing analytics dashboard. A separate **machine learning model** (a scikit-learn Random Forest Regressor) estimates expected wait time in minutes from live queue length, department, and average consultation duration, and can be retrained nightly on the previous day's actual wait-time outcomes.

## Who it's for

This system is built for two roles inside a hospital's day-to-day operations:

- **Front desk staff**, who check patients in, view the live queue, and book appointments.
- **Hospital administrators**, who additionally need visibility into emergency cases, wait-time forecasting, and daily operational analytics, plus maintenance controls (archiving the previous day, retraining the prediction model, resetting test data, and seeding doctor records).

The frontend reflects this with a role switcher: Front Desk and Admin views share the day-to-day operational pages, while reporting, forecasting, and emergency-monitoring pages are admin-only. (Role switching is currently client-side only — see [Roadmap](#roadmap--known-gaps).)

## Architecture overview

```
┌─────────────────────────┐        ┌──────────────────────────────────┐
│   React Frontend (Vite)  │ ─────▶ │   FastAPI Backend (REST API)     │
│   Front Desk + Admin UI  │ ◀───── │                                  │
└─────────────────────────┘        │   ┌────────────────────────────┐ │
                                    │   │ LangGraph Agents            │ │
                                    │   │  • severity_agent (Gemini)  │ │
                                    │   │  • queue_agent               │ │
                                    │   │  • scheduling_agent (Gemini)│ │
                                    │   │  • report_agent              │ │
                                    │   └────────────────────────────┘ │
                                    │   ┌────────────────────────────┐ │
                                    │   │ ML wait-time prediction      │ │
                                    │   │  (scikit-learn RandomForest) │ │
                                    │   └────────────────────────────┘ │
                                    └────────────────┬─────────────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │  PostgreSQL DB  │
                                              └─────────────────┘
```

Each AI agent is implemented as a small [LangGraph](https://github.com/langchain-ai/langgraph) state graph — a single-node graph in most cases — which keeps the triage, queueing, and scheduling logic isolated, testable, and easy to extend with more steps later (e.g. adding a verification or escalation node).

## Tech stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API framework
- [LangGraph](https://github.com/langchain-ai/langgraph) + [LangChain](https://www.langchain.com/) — agent orchestration
- [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash` via `langchain-google-genai`) — symptom triage and scheduling reasoning
- [SQLAlchemy](https://www.sqlalchemy.org/) + PostgreSQL — data persistence
- [scikit-learn](https://scikit-learn.org/) — Random Forest wait-time regression model
- [Alembic](https://alembic.sqlalchemy.org/) — database migrations
- [pytest](https://docs.pytest.org/) — backend test suite

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/) — client-side routing
- [Recharts](https://recharts.org/) — analytics charts
- Plain CSS with a custom design-token system (no UI framework dependency)

## Project structure

```
Hospital-Assisting-Agent/
└── hospital-pfms/
    ├── docker-compose.yml
    ├── README.md
    ├── backend/
    │   ├── requirements.txt
    │   ├── .env.example
    │   ├── force_migrate.py        # Manual migration helper
    │   ├── reset_db.py             # Drops and recreates all tables
    │   ├── tests/
    │   │   ├── test_api.py
    │   │   └── test_api_maintenance.py
    │   └── app/
    │       ├── main.py             # FastAPI app + all route definitions
    │       ├── database.py         # SQLAlchemy engine/session setup
    │       ├── schemas.py          # Pydantic request/response models
    │       ├── agents/
    │       │   ├── severity_agent.py     # AI symptom triage
    │       │   ├── queue_agent.py        # Queue insertion + reordering
    │       │   ├── scheduling_agent.py   # AI appointment scheduling
    │       │   └── report_agent.py       # Daily analytics aggregation
    │       ├── models/             # SQLAlchemy ORM models
    │       │   ├── patient.py
    │       │   ├── doctor.py
    │       │   ├── queue.py
    │       │   ├── appointment.py
    │       │   └── wait_history.py
    │       ├── ml/
    │       │   ├── train.py        # Trains the wait-time regressor
    │       │   ├── predict.py      # Loads model.pkl and predicts
    │       │   └── model.pkl       # Trained model artifact
    │       ├── tools/
    │       │   ├── doctor_availability.py
    │       │   └── appointment_tool.py
    │       ├── utils/
    │       │   ├── doctor_seeder.py      # Seeds 8 default doctors
    │       │   └── history_cleanup.py    # Archives + retrains nightly
    │       └── routers/            # Reserved for future route modularization
    └── frontend/
        ├── package.json
        ├── vite.config.js
        ├── index.html
        └── src/
            ├── main.jsx
            ├── App.jsx
            ├── index.css                  # Design tokens + shared styles
            ├── api/client.js              # All backend API calls
            ├── context/RoleContext.jsx    # Front Desk / Admin view state
            ├── components/
            │   ├── Sidebar.jsx
            │   └── TriageBadge.jsx
            └── pages/
                ├── CheckIn.jsx            # Patient check-in & triage
                ├── QueueMonitor.jsx       # Live waiting-room queue
                ├── BookAppointment.jsx    # AI-assisted scheduling
                ├── Patients.jsx           # Patient records list
                ├── Doctors.jsx            # Doctor schedules by department
                ├── WaitTimePrediction.jsx # ML wait-time estimator (admin)
                ├── EmergencyAlerts.jsx    # Critical/High case monitor (admin)
                └── Reports.jsx            # Analytics + maintenance (admin)
```

> Note: `backend/app/routers/` currently contains empty placeholder files; all routes are defined directly in `main.py`. Splitting them into per-resource routers (as the folder structure suggests) is a natural next refactor — see [Roadmap](#roadmap--known-gaps).

## AI agents

| Agent | File | Responsibility |
|---|---|---|
| **Severity agent** | `agents/severity_agent.py` | Sends the patient's symptom text to Gemini with a strict prompt constraint to act only as a logistics classifier (no diagnoses, no medication names). Returns a priority tier, integer score (1–10), and emergency flag (true at score ≥ 8). |
| **Queue agent** | `agents/queue_agent.py` | Inserts or updates the patient's queue entry for their assigned doctor, then re-sorts the entire queue by `priority_score` descending, with `checked_in_at` ascending as a tiebreaker, rewriting everyone's position. |
| **Scheduling agent** | `agents/scheduling_agent.py` | Two-step graph: first queries active doctors in the requested department and asks Gemini to pick the best match for the requested date/time; then attempts to book that exact slot, checking for conflicts before confirming. |
| **Report agent** | `agents/report_agent.py` | Not an LLM agent — a SQL aggregation layer that computes total patients, critical case counts, average severity, departmental appointment load, priority distribution, and the 20 most recent patient records for the dashboard. |

All LLM-backed agents currently use `gemini-2.5-flash` at `temperature=0.1` for consistent, low-variance classification output.

## Data model

| Table | Key fields |
|---|---|
| `patients` | `name`, `age`, `gender`, `contact_number`, `symptoms_description`, `priority_level`, `priority_score`, `created_at` |
| `doctors` | `name`, `department`, `availability_start`, `availability_end`, `consultation_duration`, `is_active` |
| `queues` | `patient_id` (unique), `doctor_id`, `current_position`, `priority_tier`, `priority_score`, `estimated_wait_time`, `checked_in_at` |
| `appointments` | `patient_id`, `doctor_id`, `appointment_date`, `appointment_time`, `status` (`Scheduled` / `Completed` / `Cancelled`) |
| `wait_history` | `queue_length`, `department`, `avg_duration`, `wait_time`, `created_at` — archived daily for model retraining |

## API reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health/status check |
| `GET` | `/api/health-check` | Verifies database connectivity |
| `POST` | `/api/triage/check-in` | Registers a patient and runs the severity + queue agents |
| `GET` | `/api/reports/daily` | Returns the full daily analytics report |
| `POST` | `/api/maintenance/archive-previous-day` | Archives yesterday's queue data and retrains the ML model |
| `POST` | `/api/maintenance/reset-current-patients` | Deletes all current patients, queue entries, and appointments |
| `POST` | `/api/maintenance/seed-doctors` | Seeds 8 default doctors if none exist |
| `GET` | `/api/doctors` | Lists all doctors |
| `GET` | `/api/departments` | Lists distinct departments |
| `GET` | `/api/departments/{department}/doctors` | Lists active doctors in a department |
| `GET` | `/api/doctors/{doctor_id}/schedule` | Returns a doctor's profile and their scheduled appointments |
| `GET` | `/api/predictions/wait-time` | Predicts wait time (`queue_length`, `department`, `average_duration` query params) |
| `POST` | `/api/appointments/book` | Runs the scheduling agent to assign and confirm an appointment |

Interactive Swagger documentation is available at `http://localhost:8000/docs` once the backend is running.

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (running locally or accessible via `DATABASE_URL`)
- A [Google Gemini API key](https://ai.google.dev/) for the AI agents

### 1. Clone and configure

```bash
git clone https://github.com/ashlinbinu/Hospital-Assisting-Agent.git
cd Hospital-Assisting-Agent/hospital-pfms
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GEMINI_API_KEY and DATABASE_URL
```

Create the database (matching whatever you set in `DATABASE_URL`):

```bash
createdb hospital_db
```

Start the API — tables are created automatically and default doctors are seeded on first run:

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`, with docs at `http://localhost:8000/docs`.

> If you change the model schema later, `force_migrate.py` and `reset_db.py` are available as manual helpers for development databases — use with care, as `reset_db.py` drops all tables.

### 3. Frontend setup

In a separate terminal:

```bash
cd hospital-pfms/frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies all `/api/*` requests to the backend at `http://localhost:8000` (configured in `vite.config.js`), so no CORS configuration is needed in development.

### 4. (Optional) Train the wait-time model

A trained model is already included at `backend/app/ml/model.pkl`. To retrain it from scratch using synthetic or historical data:

```bash
cd backend
python app/ml/train.py
```

If `model.pkl` is ever missing, `predict.py` falls back to a simple deterministic calculation (`queue_length × average_duration`) so the prediction endpoint never hard-fails.

## Frontend application

The frontend is a from-scratch React + Vite single-page app with a persistent sidebar and a clinical, low-saturation grey/green color system intended to read as professional hospital operations software rather than a consumer dashboard.

**Pages**

- **Check-In & Triage** — register a new patient and see their AI-assigned priority and queue placement immediately.
- **Queue Monitor** — live, auto-refreshing view of the waiting room, including a horizontal priority-order strip and a detailed sortable table.
- **Book Appointment** — submit a patient's preferred department/date/time and see the agent's chosen doctor and confirmation status.
- **Patients** — searchable list of recently registered patients with triage and scheduling status.
- **Doctor Schedules** — browse doctors by department and view their booked appointments.
- **Wait-Time Prediction** *(admin)* — estimate expected wait time from queue length and consultation pace.
- **Emergency Alerts** *(admin)* — a live-refreshing list of Critical/High priority patients needing attention.
- **Reports & Analytics** *(admin)* — daily KPIs, priority-distribution and departmental-load charts, and maintenance actions (archive/retrain, reseed doctors, reset day's data).

**Role switching** is available in the sidebar (Front Desk / Admin) and is currently client-side only, since the backend has no authentication layer yet — see [Roadmap](#roadmap--known-gaps) below.

## Environment variables

Defined in `backend/.env.example`:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | API key for Google Gemini, used by the severity and scheduling agents |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/hospital_db` |

Copy `.env.example` to `.env` and fill in real values. `.env` is git-ignored and should never be committed.

## Running tests

```bash
cd backend
pytest
```

Tests cover the core API routes (`test_api.py`) and the maintenance endpoints (`test_api_maintenance.py`).

## Roadmap / known gaps

This is an actively developed system. Known gaps worth being aware of before production use:

- **No authentication or authorization.** The Front Desk/Admin role switch in the UI is client-side only and does not restrict API access — anyone with network access to the backend can call any endpoint, including maintenance/reset routes. A real auth layer (e.g. JWT sessions, role-based route guards on the backend) is required before deployment in a real clinical setting.
- **Empty router modules.** `backend/app/routers/*.py` are placeholder files; all routes currently live in `main.py`. Migrating them into per-resource routers would improve maintainability as the API grows.
- **`docker-compose.yml` is currently empty.** Containerized local setup (Postgres + backend + frontend) is not yet configured.
- **Single hardcoded doctor on check-in.** `POST /api/triage/check-in` currently assigns new patients to Doctor ID 1 by default rather than routing by department — appointment booking via `POST /api/appointments/book` does support department-aware doctor selection.
- **No automated frontend tests.** Backend has pytest coverage; the frontend does not yet have an equivalent test suite (e.g. Vitest + React Testing Library).
- **Emergency Alerts is derived client-side.** There is no dedicated backend endpoint for flagged cases; the frontend filters the daily report for Critical/High priority patients. A dedicated `/api/alerts` endpoint would be more efficient at scale.

Contributions and issues are welcome.

## License

No license file is currently present in this repository. Until one is added, all rights are reserved by the repository owner — please contact the maintainer before reuse or redistribution.
