from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import random
import sys
import math

# Add the parent directory to sys.path to import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config.config import HOSPITALS_INFO, DEPARTMENTS_INFO, LOAD_THRESHOLDS

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
    if patients < LOAD_THRESHOLDS['LOW']:
        return "Low"
    elif LOAD_THRESHOLDS['LOW'] <= patients <= LOAD_THRESHOLDS['MEDIUM']:
        return "Medium"
    else:
        return "High"

def haversine_distance(lat1, lon1, lat2, lon2):
    # Calculate distance using Haversine formula
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    return distance

def simulate_realtime_data(department, predicted_patients):
    """Simulates doctor availability and beds based on patients and department rules"""
    dept_info = DEPARTMENTS_INFO[department]
    
    # Simulate doctors
    doctors = []
    available_doctors_count = 0
    for doc in dept_info["doctors"]:
        # 15% chance doctor is on leave
        on_leave = random.random() < 0.15
        doctors.append({
            "name": doc,
            "leave_status": "Yes" if on_leave else "No",
            "available": "No" if on_leave else "Yes"
        })
        if not on_leave:
            available_doctors_count += 1
            
    # Simulate beds
    total_beds = dept_info["beds_capacity"]
    # If patients are high, beds get occupied quickly
    occupancy_ratio = min(predicted_patients / 80.0, 1.0)
    if department == "Emergency":
        occupancy_ratio = min(predicted_patients / 120.0, 1.0)
        
    beds_occupied = int(total_beds * occupancy_ratio)
    beds_available = max(0, total_beds - beds_occupied)
    
    return doctors, available_doctors_count, beds_available

@app.route('/predict', methods=['POST'])
def predict_load():
    if not model or not encoders:
        return jsonify({'error': 'Model not loaded on the server.'}), 500
        
    data = request.json
    try:
        hospital = data['hospital']
        department = data['department']
        hour = int(data['hour'])
        
        h_encoded = encoders['hospital'].transform([hospital])[0]
        d_encoded = encoders['department'].transform([department])[0]
        
        prediction = model.predict([[h_encoded, d_encoded, hour]])[0]
        predicted_patients = int(max(0, prediction))
        
        return jsonify({
            'hospital': hospital,
            'department': department,
            'hour': hour,
            'predicted_patients': predicted_patients,
            'load_classification': classify_load(predicted_patients)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/recommend', methods=['POST'])
def recommend_hospital():
    """
    Emergency Decision & Hospital Recommendation System
    Returns the best hospital based on lowest crowd, high beds, and available doctors
    """
    if not model or not encoders:
        return jsonify({'error': 'Model not loaded on the server.'}), 500
        
    data = request.json
    try:
        department = data['department']
        hour = int(data['hour'])
        user_lat = data.get('user_lat', None)
        user_long = data.get('user_long', None)
        
        recommendations = []
        
        for hospital, info in HOSPITALS_INFO.items():
            h_encoded = encoders['hospital'].transform([hospital])[0]
            d_encoded = encoders['department'].transform([department])[0]
            
            # 1. Predict Patients
            prediction = model.predict([[h_encoded, d_encoded, hour]])[0]
            predicted_patients = int(max(0, prediction))
            load_class = classify_load(predicted_patients)
            
            # 2. Get Realtime Simulated Data (Doctors, Beds)
            doctors, available_docs, beds_available = simulate_realtime_data(department, predicted_patients)
            
            # 3. Calculate distance if user location provided
            distance = 0
            if user_lat and user_long:
                distance = haversine_distance(float(user_lat), float(user_long), info['lat'], info['long'])
            
            # 4. Scoring Algorithm (Lower is better)
            # Base score is number of patients
            score = predicted_patients 
            
            # Penalty for low beds (adds to score)
            if beds_available == 0:
                score += 100 # High penalty if no beds
            else:
                score -= (beds_available * 5) # Bonus for having beds
                
            # Penalty for no doctors
            if available_docs == 0:
                score += 200 # Critical penalty if no doctors
            else:
                score -= (available_docs * 10)
                
            # Distance penalty
            if distance > 0:
                score += (distance * 2) # Add 2 points per km
                
            recommendations.append({
                'hospital': hospital,
                'distance_km': round(distance, 2) if distance else None,
                'predicted_patients': predicted_patients,
                'load_classification': load_class,
                'beds_available': beds_available,
                'available_doctors': available_docs,
                'score': score,
                'doctor_details': doctors
            })
            
        # Sort by score (Lowest score is best)
        recommendations = sorted(recommendations, key=lambda x: x['score'])
        
        return jsonify({
            'best_recommendation': recommendations[0],
            'all_options': recommendations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/doctor', methods=['GET'])
def get_doctors():
    """
    Doctor Availability System API
    """
    department = request.args.get('department')
    if not department or department not in DEPARTMENTS_INFO:
        return jsonify({'error': 'Invalid or missing department.'}), 400
        
    # We use a dummy prediction to simulate current load
    # In a real app this would be queried from DB
    predicted_patients = random.randint(10, 80)
    doctors, available_docs, _ = simulate_realtime_data(department, predicted_patients)
    
    return jsonify({
        'department': department,
        'total_doctors': len(doctors),
        'available_doctors': available_docs,
        'doctors': doctors
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
