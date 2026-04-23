import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load Classification Thresholds
LOAD_THRESHOLDS = {
    'LOW': 30,
    'MEDIUM': 75
}

# Hospitals list for validation
HOSPITALS = ["City Hospital", "Metro Hospital", "Green Valley Hospital"]
DEPARTMENTS = ["Emergency", "Dental", "Orthopedic", "Cardiology", "X-ray"]
