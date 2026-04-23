from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load the trained model and encoders
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models'))
model_path = os.path.join(MODEL_DIR, 'patient_model.pkl')
encoders_path = os.path.join(MODEL_DIR, 'encoders.pkl')

model = None
encoders = None

if os.path.exists(model_path) and os.path.exists(encoders_path):
    model = joblib.load(model_path)
    encoders = joblib.load(encoders_path)

def classify_load(patients):
    if patients < 30:
        return "Low"
    elif 30 <= patients <= 75:
        return "Medium"
    else:
        return "High"

@app.route('/predict', methods=['POST'])
def predict_load():
    if not model or not encoders:
        return jsonify({'error': 'Model not loaded on the server.'}), 500
        
    data = request.json
    try:
        hospital = data['hospital']
        department = data['department']
        hour = int(data['hour'])
        
        # Encode inputs
        h_encoded = encoders['hospital'].transform([hospital])[0]
        d_encoded = encoders['department'].transform([department])[0]
        
        # Predict
        prediction = model.predict([[h_encoded, d_encoded, hour]])[0]
        predicted_patients = int(max(0, prediction))
        
        load_category = classify_load(predicted_patients)
        
        return jsonify({
            'hospital': hospital,
            'department': department,
            'hour': hour,
            'predicted_patients': predicted_patients,
            'load_classification': load_category
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
