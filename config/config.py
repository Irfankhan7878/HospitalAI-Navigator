import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load Classification Thresholds
LOAD_THRESHOLDS = {
    'LOW': 30,
    'MEDIUM': 75
}

# Hospital Data
HOSPITALS_INFO = {
    "City Hospital": {"lat": 28.61, "long": 77.20},
    "Metro Hospital": {"lat": 28.65, "long": 77.25},
    "Green Valley Hospital": {"lat": 28.70, "long": 77.30}
}

DEPARTMENTS_INFO = {
    "Emergency": {"floor": 0, "doctors": ["Dr Khan", "Dr Allen", "Dr Smith", "Dr Doe"], "beds_capacity": 10},
    "Dental": {"floor": 1, "doctors": ["Dr Singh", "Dr Ali", "Dr Wong"], "beds_capacity": 6},
    "Orthopedic": {"floor": 2, "doctors": ["Dr Sharma", "Dr Verma", "Dr Reddy", "Dr Patel"], "beds_capacity": 12},
    "Cardiology": {"floor": 3, "doctors": ["Dr Gupta", "Dr Lee", "Dr Kim", "Dr Wright"], "beds_capacity": 10},
    "X-ray": {"floor": 4, "doctors": ["Dr Ray", "Dr Das"], "beds_capacity": 5}
}
