import pandas as pd
import joblib
import os

# --- FILE PATHS (adjust for your structure) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "../Models/podium_lgbm_tuned_historical.pkl")  # Historical LightGBM model
PREDICTION_FILE = os.path.join(BASE_DIR, "../DataML/podium_prediction_2025_japan_normalized.csv")

# --- STEP 1: Load the Trained Historical LightGBM Model ---
print("Loading historical LightGBM model...")
model = joblib.load(MODEL_FILE)

# --- STEP 2: Load Prediction Dataset ---
df = pd.read_csv(PREDICTION_FILE, sep=";")

# Store IDs for display
ids = df[["driverId", "constructorId"]]

# Prepare feature set (drop IDs and non-feature columns)
X_pred = df.drop(columns=["year", "raceId", "driverId", "constructorId"], errors="ignore")

# --- STEP 3: Predict Podium Probabilities ---
podium_probs = model.predict_proba(X_pred)[:, 1]  # Probability of being on podium
df["podium_probability"] = podium_probs

# --- STEP 4: Get Top 3 Podium Predictions ---
top3 = df.sort_values(by="podium_probability", ascending=False).head(3)
top3_output = pd.concat(
    [ids.loc[top3.index].reset_index(drop=True),
     top3[["podium_probability"]].reset_index(drop=True)],
    axis=1
)

# --- OUTPUT TO TERMINAL ---
print("\nPredicted Podium for 2025 Australia GP (Top 3) [Historical LightGBM]:")
for idx, row in top3_output.iterrows():
    print(f"{idx+1}. Driver {row['driverId']} ({row['constructorId']}) - Podium Probability: {row['podium_probability']:.3f}")
