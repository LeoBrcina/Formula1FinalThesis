# 📘 Formula 1 Final Thesis — Race Analytics, Telemetry & Prediction Platform

**Author:** Leo Brcina  
**University:** Algebra University College (Software Engineering Thesis)  
**Year:** 2025  

---

## 🚀 Overview

This is a full-featured Formula 1 analytics and prediction system developed as a university thesis project. It combines historical and live-style race data, telemetry, and machine learning predictions into a modular, high-performance application with a clean, responsive frontend.

The system is designed to help fans, analysts, and developers explore F1 race dynamics with:

- Rich **seasonal insights**
- Detailed **race and driver stats**
- Visual **telemetry and dominance maps**
- **Podium predictions** powered by machine learning

---

## 🧠 High-Level Architecture

The repository is organized into two main modules:

### `Formula 1 Final Thesis Project`
- **FastAPI backend** exposing REST endpoints  
- **React + Next.js + Tailwind** frontend for visualization  
- Telemetry and standings integration via **FastF1** and **Jolpica (Ergast-compatible)**  

### `Formula 1 Final Thesis ML`
- Python-based **machine learning pipeline**  
- Feature engineering, training, and inference scripts  
- Models for podium prediction (LightGBM, XGBoost, Random Forest)  

These modules are loosely coupled: the ML module can run independently, while its outputs (predicted podiums) can be consumed by the backend or manually added to the frontend.

---

## 🧩 Core Features

### 🔧 FastAPI Backend

- Fully documented **Swagger UI** at `/docs`
- Clean routing grouped by domain:
  - **Drivers**
  - **Constructors**
  - **Circuits**
  - **Results**
  - **Standings**
  - **Schedule**
- **Telemetry endpoints** powered by FastF1:
  - Lap timing data  
  - Position tracking  
  - Strategy & stint info  
  - Sector dominance with SVG circuit maps
- **PostgreSQL caching layer**
  - Reduces repeat telemetry downloads  
  - Stores race session data for fast retrieval  

---

### 🖥️ Frontend (Next.js)

- **Next.js + TypeScript**  
- Styled with **Tailwind CSS**  
- Clean, dark, modern F1-inspired design  
- Components:
  - Card-based UI with hover effects  
  - Red glow borders  
  - Clear hierarchy for readability  
- Pages:
  - `/` — Landing page  
  - `/races/{year}`  
  - `/results/{year}/{round}`  
  - `/circuits/season/{year}`  
  - `/predictions` — ML-guided podium predictions  

---

### 🧠 Machine Learning Podium Predictor

Located in **`Formula 1 Final Thesis ML`**, the ML workflow includes:

- **Algorithms**
  - LightGBM  
  - XGBoost  
  - Random Forest  

- **Feature Engineering**
  - Grid position  
  - Driver and constructor form  
  - Circuit history  
  - Pace deltas  
  - Consistency metrics  

- **Workflow**
  1. Import raw data (Ergast/Jolpica & telemetry-derived)  
  2. Clean & normalize → `DataExcel/`  
  3. Create ML-ready datasets → `DataML/`  
  4. Train using GridSearchCV  
  5. Save models → `Models/`  
  6. Predict podiums using scripts in `Predictor/`  

> In the thesis version, predictions are **manually added** to the frontend based on model outputs, similar to betting-style prediction sites.

---

## 📂 Project Structure

```bash
Formula1FinalThesis/
├── Formula 1 Final Thesis Project/
│   ├── Backend/
│   │   ├── api/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── utils/
│   │   └── main.py
│   │
│   └── Frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx
│       │   │   ├── races/
│       │   │   ├── results/[year]/[round]/
│       │   │   ├── circuits/
│       │   │   └── predictions/
│       │   ├── components/
│       │   └── lib/
│       │       └── hooks/
│       └── ...
│
└── Formula 1 Final Thesis ML/
    ├── Data/
    ├── DataExcel/
    ├── DataML/
    ├── Models/
    ├── Predictor/
    └── utils/
```

---

## 📡 Data Sources

The project integrates:

- **Jolpica API** — modern Ergast-compatible JSON API  
- **Ergast Developer API** — reference formulas and historical model  
- **FastF1** — for telemetry & session data:
  - Car telemetry  
  - Lap times  
  - Sector data  
  - GPS coordinates for SVG dominance maps  

---

## 🧱 System Architecture Diagram

```mermaid
graph TD
    subgraph External_Data
        A[Jolpica / Ergast Data] --> B[Backend]
        A2[FastF1 Telemetry] --> B
    end

    B -->|Normalized & Cached| C[(PostgreSQL)]
    B --> D[Frontend UI]
    B --> E[ML Input Generator]

    subgraph ML_Pipeline
        E --> F[Data Cleaning & Feature Engineering]
        F --> G[Model Training (LGBM / XGBoost / RF)]
        G --> H[Podium Prediction Scripts]
    end

    H -->|Podium Suggestions| D
```

---

## 🔌 Key Backend Endpoints

```http
GET /drivers/{driver_id}
GET /constructors/{constructor_id}
GET /results/{year}/{round}
GET /standings/drivers/{year}
GET /standings/constructors/{year}
GET /races/{year}
GET /telemetry/{year}/{round}/dominance
```

Optional ML-related endpoint:

```http
POST /ml/predict
```

---

## ⚙️ Installation & Setup

### 1️⃣ Backend (FastAPI)

```bash
cd "Formula 1 Final Thesis Project/Backend"

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=formula1
```

Run backend:

```bash
uvicorn main:app --reload
```

Swagger UI: **http://localhost:8000/docs**

---

### 2️⃣ Machine Learning Module

```bash
cd "Formula 1 Final Thesis ML"

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Train models:

```bash
python train_models.py
```

Predict:

```bash
python Predictor/predict_podium.py
```

---

### 3️⃣ Frontend (Next.js)

```bash
cd "Formula 1 Final Thesis Project/Frontend"

npm install
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🧠 ML Workflow Summary

- Raw data → `Data/`  
- Cleaned datasets → `DataExcel/`  
- ML-ready datasets → `DataML/`  
- Model training → LightGBM, XGBoost, Random Forest  
- Models saved → `Models/`  
- Podium predictions → `Predictor/`  

---

## 🧾 .gitignore Highlights

```gitignore
fastf1_cache/
Cache/
*.sqlite
*.ff1pkl
__pycache__/
node_modules/
dist/
venv/
.env
Models/
DataML/
DataExcel/
Data/
```

---

## 🚧 Future Improvements

- Live telemetry ingestion  
- More advanced ML (weather, tyre degradation)  
- Strategy tree visualization  
- Dockerized deployment  
- Real-time race predictor UI  

---

## 🙏 Acknowledgements

- **Ergast Developer API**  
- **Jolpica API**  
- **FastF1**  
- **pandas, NumPy, scikit-learn, LightGBM, XGBoost**  
- Algebra University College – faculty support  

---

## 📜 License

This project is provided for educational and research purposes.  
A formal license (e.g., MIT) can be added to the repository root.

---

## 📌 Repository

https://github.com/LeoBrcina/Formula1FinalThesis

**Built with speed, precision, and a lot of telemetry. 🏁**
