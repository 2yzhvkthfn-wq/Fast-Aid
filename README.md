# FastAid 🚑

Welcome to **FastAid**, a volunteer-based platform that connects people experiencing urgent problems with nearby qualified professionals in the Montreal area. With real-time communication powered by WebSockets, FastAid delivers immediate alerts to matching helpers within 2 km.

---

## 💻 **Tech Stack**

- **Node.js & Express.js** (Backend)
- **MongoDB & Mongoose** (Database)
- **Socket.IO** (Real-Time Communication)
- **MapBox GL JS** (Mapping & Geolocation)
- **JWT** (Authentication)
- **JavaScript, HTML & CSS** (Frontend)

---

## 🚀 **Features**

- **Multi-category urgent help** — Medical, vehicle, home, and pet emergencies
- **Profession-based matching** — Helpers only receive relevant requests within 2 km
- **Real-time notifications** — Instant alerts and live status updates
- **Bilingual interface** — English and French
- **Admin dashboard** — Manage users, requests, and view the activity map
- **Separate database** — Uses `fastaid_db` (independent from QuickAid)

---

## 🛠️ **Local Setup**

### Prerequisites

- Node.js
- MongoDB running locally
- Mapbox access token

### Installation

1. Open a terminal in the `FastAid/app` folder
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and add your values:

```bash
copy .env.example .env
```

Set `MAPBOX_TOKEN` and `JWT_SECRET` in `.env`.

4. Seed the demonstration database:

```bash
npm run seed
```

5. Start the server:

```bash
npm start
```

6. Open **http://localhost:8001**

---

## 👤 **Demonstration Accounts**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin` | Administrator |
| `requester` | `demo123` | Requester only |
| `paramedic` | `demo123` | Paramedic helper |
| `mechanic` | `demo123` | Mechanic helper |
| `plumber` | `demo123` | Plumber helper |
| `electrician` | `demo123` | Electrician helper |
| `locksmith` | `demo123` | Locksmith helper |
| `heating` | `demo123` | Heating technician helper |
| `vet` | `demo123` | Veterinarian helper |
| `dualuser` | `demo123` | Requester + mechanic helper |

All seeded helpers are located in downtown Montreal so the 2 km matching demo works immediately.

---

## 📍 **Port & Database**

- **Server port:** `8001` (QuickAid uses `8000`)
- **MongoDB database:** `fastaid_db`

---

Built with care by **Alexandre Nasrallah**
