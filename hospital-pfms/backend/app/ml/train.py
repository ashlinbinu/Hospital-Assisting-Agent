import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

def train_historical_wait_model():
    print("Generating operational training data matrix...")
    np.random.seed(42)
    n_samples = 2000
    
    # Features: Queue Length, Department (0: Gen Med, 1: Cardio, 2: Pediatrics), Avg Service Duration
    queue_length = np.random.randint(1, 20, size=n_samples)
    dept_encoded = np.random.randint(0, 3, size=n_samples)
    avg_duration = np.random.choice([10, 15, 20], size=n_samples)
    
    # Target: Actual Waiting Time in minutes (Base wait + variance + noise)
    actual_wait_time = (queue_length * avg_duration) + np.random.normal(5, 4, size=n_samples)
    actual_wait_time = np.clip(actual_wait_time, 0, None) # Ensure no negative wait times
    
    df = pd.DataFrame({
        'queue_length': queue_length,
        'dept': dept_encoded,
        'avg_duration': avg_duration,
        'wait_time': actual_wait_time
    })
    
    X = df[['queue_length', 'dept', 'avg_duration']]
    y = df['wait_time']
    
    print("Fitting Random Forest Regressor tree sequence...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save the model artifact to the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'model.pkl')
    joblib.dump(model, model_path)
    print(f"Model successfully serialized and saved to: {model_path}")

if __name__ == "__main__":
    train_historical_wait_model()