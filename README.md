# FilePilot — Intelligent File Organizer

![FilePilot Visual Interface](https://raw.githubusercontent.com/placeholder/filepilot/main/docs/preview.png)

FilePilot is an intelligent, local-first file organization tool featuring a modern visual interface matching pale blue (`#DCEAF7`) and deep purple (`#4F35B9`) design targets. It classifies unorganized archives, identifies exact SHA-256 duplicate files, generates deterministic organization manifests with collision prevention, and executes safe workspace transformations.

---

## 🚀 Key Features

- **Storage & Category Overview**: Scans archives and displays real category file counts and total storage sizes across Documents, Images, Audio, Videos, Code, Archives, and Others.
- **SHA-256 Duplicate Detection**: Group identical files by binary hashes and view potential storage savings before organizing.
- **Interactive Manifest & Plan Editor**: Inspect proposed destination paths, resolve filename collisions automatically, and edit custom target paths.
- **Safe Transformation & Restoration**: Non-destructive isolated sandbox execution with instant workspace state restoration and downloadable organized output ZIP archives.
- **File Inspection Drawer**: View file metadata, full SHA-256 hashes, and safe text/image content previews.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python 3.14+, FastAPI, SQLite, SQLAlchemy, Pydantic V2
- **Testing**: Pytest

---

## 📦 Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Running Backend Tests
```bash
python -m pytest backend/tests/test_engine.py
```

### 5. Generate Test Archive
```bash
python generate_test_data.py
```
This generates `sample_workspace.zip` (~57 files with duplicates and messy names) for testing uploads.

---

## 📝 License
MIT License
