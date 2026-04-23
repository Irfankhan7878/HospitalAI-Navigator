import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Paths
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/final/final_dataset.csv'))
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../models'))

def train_load_predictor():
    print("Loading dataset from:", DATA_PATH)
    if not os.path.exists(DATA_PATH):
        print("Error: Dataset not found. Please ensure data is present.")
        return
        
    df = pd.read_csv(DATA_PATH)
    
    # We want to predict 'patients' load based on hour, department, and hospital
    features = ['hospital', 'department', 'hour']
    X = df[features].copy()
    y = df['patients']
    
    # Encoding categorical variables
    encoders = {}
    for col in ['hospital', 'department']:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le
        
    print("Training Random Forest Regressor...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model configuration
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    score = model.score(X_test, y_test)
    print(f"Model R^2 Score: {score:.4f}")
    
    # Save model and encoders
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(MODEL_DIR, 'patient_model.pkl'))
    joblib.dump(encoders, os.path.join(MODEL_DIR, 'encoders.pkl'))
    print(f"Model and encoders successfully saved to {MODEL_DIR}")

if __name__ == '__main__':
    train_load_predictor()
