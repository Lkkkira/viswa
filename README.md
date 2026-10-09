# FilePilot — Intelligent File Organizer

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Lkkkira/viswa)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lkkkira/viswa)

FilePilot is an intelligent, local-first file organization tool featuring a modern visual interface matching pale blue (`#DCEAF7`) and deep purple (`#4F35B9`) design targets. It classifies unorganized archives, identifies exact SHA-256 duplicate files, generates deterministic organization manifests with collision prevention, and executes safe workspace transformations.

---

## 🎨 Visual Identity & Interface Architecture

- **Primary Background**: `#DCEAF7` (Pale blue backdrop)
- **Main Container**: Large rounded surface (`#F0F6FB` / white cards) with soft shadows
- **Sidebar**: Left navigation sidebar with vertical divider, branding logo, workspace badge, and section navigation
- **Accent Purple**: `#4F35B9` (Primary actions, active indicators, storage overview card)
- **Accent Cyan**: `#20BCE5` (Folder icons, file type badges, highlights)

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python 3.14+, FastAPI, SQLite, SQLAlchemy, Pydantic V2
- **Testing**: Pytest

---

## 🚀 Instant Cloud Deployment

Click either button below to deploy FilePilot live from this GitHub repository:

- 🟣 **Deploy Full Stack to Render** (1-Click Docker Web Service): [Deploy on Render](https://render.com/deploy?repo=https://github.com/Lkkkira/viswa)
- ▲ **Deploy Frontend to Vercel** (1-Click Static React App): [Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/Lkkkira/viswa)

---

## 📦 Setup & Local Running

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 2. Running Local Applications

- **React Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Open `http://localhost:5173`

- **FastAPI Backend**:
  ```bash
  python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
  ```

---

## 📝 License
MIT License
