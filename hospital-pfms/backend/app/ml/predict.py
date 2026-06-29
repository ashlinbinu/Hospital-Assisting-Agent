import joblib
import numpy as np
import os

# Load the model into memory when the module is imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, 'model.pkl')

def predict_patient_wait_time(queue_len: int, department: str, avg_dur: int) -> int:
    """
    Predicts estimated wait times using our Random Forest Regressor.
    Falls back to a safe deterministic calculation if the model artifact is missing.
    """
    if not os.path.exists(MODEL_PATH):
        # Fallback linear baseline calculation if model isn't built
        return max(0, queue_len * avg_dur)
        
    model = joblib.load(MODEL_PATH)
    
    # Map text string inputs to match our numerical training encoder
    dept_map = {"General Medicine": 0, "Cardiology": 1, "Pediatrics": 2}
    dept_val = dept_map.get(department, 0)
    
    # Format the row matrix for Scikit-Learn input
    input_features = np.array([[queue_len, dept_val, avg_dur]])
    prediction = model.predict(input_features)
    
    return max(0, int(prediction[0]))