import joblib
import pandas as pd
import os

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../models'))
MODEL_PATH = os.path.join(MODEL_DIR, 'patient_model.pkl')
ENCODERS_PATH = os.path.join(MODEL_DIR, 'encoders.pkl')

class HospitalPredictor:
    def __init__(self):
        try:
            self.model = joblib.load(MODEL_PATH)
            self.encoders = joblib.load(ENCODERS_PATH)
        except Exception as e:
            print(f"Error loading models: {e}. Ensure you have trained the model first.")
            self.model = None
            self.encoders = None
            
    def predict_patients(self, hospital, department, hour):
        if not self.model or not self.encoders:
            return None
            
        try:
            # Encode inputs
            h_encoded = self.encoders['hospital'].transform([hospital])[0]
            d_encoded = self.encoders['department'].transform([department])[0]
            
            input_df = pd.DataFrame([[h_encoded, d_encoded, hour]], columns=['hospital', 'department', 'hour'])
            prediction = self.model.predict(input_df)[0]
            return int(prediction)
        except ValueError as e:
            print(f"Prediction Error (Unseen Label?): {e}")
            return None
            
    def classify_load(self, predicted_patients):
        if predicted_patients is None:
            return "Unknown"
        if predicted_patients < 30:
            return "Low"
        elif predicted_patients < 70:
            return "Medium"
        else:
            return "High"

if __name__ == "__main__":
    # Simple test
    predictor = HospitalPredictor()
    pred = predictor.predict_patients('City Hospital', 'Emergency', 12)
    load = predictor.classify_load(pred)
    print(f"Predicted Patients: {pred}, Load Category: {load}")
