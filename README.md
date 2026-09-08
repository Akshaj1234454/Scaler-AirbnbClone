# Scaler - Airbnb Clone NOTE: use user:akshaj password:akshaj

A full-stack Airbnb-style marketplace application built with Django + Django REST Framework on the backend and Next.js + TypeScript on the frontend. The project includes listing browsing, host flows, geolocation map selection, booking logic, ownership checks, amenities, and review support.

## Project Goals
- Allow users to browse listings, search, and filter homes.
- Support host-style listing creation and editing.
- Track booking dates and ownership rules.
- Use interactive map-based location selection for accurate coordinates.
- Maintain a realistic database with seeded listing and review data.

## Tech Stack
- Backend: Python, Django 6.1.1, Django REST Framework
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Mapping: Leaflet + react-leaflet
- Database: SQLite (local development database)
- Authentication: Django session auth with custom user_id fallback for browser-side flows
- Hosting / Runtime: Local development environment; designed for easy local setup and extension

## Architecture Overview
This repository is split into two main parts:

- back/
  - Django project and API backend
  - Models, serializers, API views, URLs, and SQLite database
- front/
  - Next.js app for the frontend UI
  - Pages for home, listing detail, host creation, edit, login, and map experiences

The frontend communicates with the Django backend over HTTP using the API base URL configured at runtime. The backend stores all persistent application data in the local SQLite database.

## Key Application Features
- Home page with filters and save-only search logic
- Map-based exact location picking with latitude/longitude values
- Host flow for creating listings with photo links and thumbnail selection
- Owner-only edit and delete actions
- Booking flow with date validation and conflict checks
- Amenities selection and pet flag handling
- Review model and generated per-listing review summaries

## Database Schema
The project uses Django's default auth user model plus custom domain models defined in `back/home/models.py`.

### User
Django built-in `auth.User` model is used for authentication and ownership.

### Listing
| Field | Type | Notes |
| --- | --- | --- |
| id | AutoField | Primary key |
| owner | ForeignKey(User) | Listing owner / host |
| title | CharField | Listing title |
| description | TextField | Listing details |
| location | CharField | Human-readable location text |
| latitude | FloatField | Exact latitude |
| longitude | FloatField | Exact longitude |
| category | CharField | Listing category |
| image_url | URLField | Primary image URL |
| photos | JSONField | List of image URLs |
| price_per_night | DecimalField | Nightly rate |
| pets | BooleanField | Pet-friendly status |
| amenities | JSONField | Array of selected amenities |
| created_at | DateTimeField | Creation timestamp |

### Review
| Field | Type | Notes |
| --- | --- | --- |
| id | AutoField | Primary key |
| listing | ForeignKey(Listing) | Parent listing |
| reviewer_name | CharField | Reviewer display name |
| rating | PositiveSmallIntegerField | 1-5 rating |
| comment | TextField | Review text |
| created_at | DateTimeField | Review timestamp |

### Booking
| Field | Type | Notes |
| --- | --- | --- |
| id | AutoField | Primary key |
| listing | ForeignKey(Listing) | Booked listing |
| guest | ForeignKey(User) | Booking guest |
| check_in | DateField | Check-in date |
| check_out | DateField | Check-out date |
| created_at | DateTimeField | Booking creation timestamp |

## Local Setup Instructions

### 1) Backend setup
From the project root:

```bash
cd back

# If needed, create and activate a virtual environment
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

python -m pip install --upgrade pip
pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py runserver 8000
```

### 2) Frontend setup
Open a second terminal:

```bash
cd front
npm install
npm run dev
```

Then open:

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000

### 3) Environment and API config
The frontend uses this default backend URL unless overridden:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

If you are running locally without an `.env.local`, the app will default to the value above.

## Database Retention / Data Safety
This project stores all app data in SQLite at:

```text
back/db.sqlite3
```

Important:
- Keep this file if you want to preserve the current listings, bookings, reviews, and user data.
- Do not delete `back/db.sqlite3` unless you want to reset the application state.
- The command `python manage.py seed_data --reset` intentionally clears existing listings and reseeds them, so it should only be used when a full reset is desired.
- Standard `migrate` commands are safe and will preserve the existing database unless model changes require data migration.

## Seed Data
The backend includes a seed command for listing fixtures and review data:

```bash
cd back
python manage.py seed_data
```

This updates listing coordinates and ensures each listing includes sample reviews. If you want to completely replace the listing data, use:

```bash
python manage.py seed_data --reset
```

## Assumptions
- The project is intended for local development and demonstration use.
- SQLite is used intentionally for simplicity and speed of setup.
- Session-based authentication is used for Django auth flows.
- The frontend has a browser-side user fallback for some owner checks when browser session data is missing.
- The app assumes a single local developer environment rather than production deployment.

## Project Structure
```text
scaler/
├── back/
│   ├── home/
│   ├── scaler/
│   ├── db.sqlite3
│   └── manage.py
├── front/
│   ├── src/
│   ├── package.json
│   └── next.config.ts
├── README.md
├── .gitignore
└── .venv/
```

## Notes
This repository is meant to be run locally while preserving the current database state. If you are making code changes, prefer migrations and app updates that maintain existing `db.sqlite3` data unless a deliberate reset is required.
