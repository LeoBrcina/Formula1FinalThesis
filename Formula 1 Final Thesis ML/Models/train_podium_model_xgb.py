import os
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from xgboost import XGBClassifier

# --- FILE PATHS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "../DataML/podium_training_dataset_normalized.csv")  # Historical
MODEL_FILE = os.path.join(BASE_DIR, "podium_xgb_tuned_historical.pkl")

# --- LOAD DATA ---
data = pd.read_csv(DATA_FILE, sep=";")
X = data.drop(columns=["podium", "year", "raceId", "driverId", "constructorId"])
y = data["podium"]

# --- ENSURE CONSISTENT 0–1 NORMALIZATION ---
def min_max_scale(series, min_val=0, max_val=25):
    return (series - min_val) / (max_val - min_val + 1e-9)

for col in X.columns:
    X[col] = min_max_scale(X[col])  # same as modern dataset

# Dynamic class balance ratio for scale_pos_weight
neg, pos = (y == 0).sum(), (y == 1).sum()
scale_pos_weight = neg / pos if pos > 0 else 1

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# --- GRID SEARCH PARAMETERS ---
param_grid = {
    "n_estimators": [200, 400],
    "max_depth": [3, 5, 7],
    "learning_rate": [0.01, 0.05, 0.1],
    "subsample": [0.7, 1.0],
    "colsample_bytree": [0.7, 1.0],
    "scale_pos_weight": [scale_pos_weight]  # dynamically balanced
}

print(f"Calculated scale_pos_weight for imbalance: {scale_pos_weight:.2f}")
print("Starting GridSearchCV tuning for XGBoost (Historical)...")
grid_search = GridSearchCV(
    XGBClassifier(
        objective="binary:logistic",
        eval_metric="logloss",
        use_label_encoder=False,
        random_state=42
    ),
    param_grid,
    cv=3,
    scoring="f1",
    n_jobs=-1,
    verbose=2
)

grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_

print("\nBest Hyperparameters:", grid_search.best_params_)

# --- EVALUATION ---
y_pred = best_model.predict(X_test)
print("\nPodium Prediction Model (Historical XGBoost)")
print("--------------------------------------------")
print(f"Accuracy:  {accuracy_score(y_test, y_pred):.3f}")
print(f"Precision: {precision_score(y_test, y_pred):.3f}")
print(f"Recall:    {recall_score(y_test, y_pred):.3f}")
print(f"F1 Score:  {f1_score(y_test, y_pred):.3f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Not Podium", "Podium"],
            yticklabels=["Not Podium", "Podium"])
plt.title("Confusion Matrix (Historical XGBoost)")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.show()

# Feature Importance
importances = best_model.feature_importances_
feature_names = X.columns
indices = importances.argsort()[::-1]
sorted_features = feature_names[indices]
sorted_importances = importances[indices]

plt.figure(figsize=(10, 6))
sns.barplot(x=sorted_importances, y=sorted_features, palette="viridis", legend=False)
plt.title("Feature Importance (Historical XGBoost)")
plt.xlabel("Importance Score")
plt.ylabel("Features")
plt.tight_layout()
plt.show()

# --- SAVE MODEL (overwrite) ---
joblib.dump(best_model, MODEL_FILE)
print(f"\nTuned Historical XGBoost model saved (overwritten) to {MODEL_FILE}")
