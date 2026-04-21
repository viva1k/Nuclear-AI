import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv('reactor_data.csv')
# List all 5 sensors here
X = df[['temp', 'pressure', 'vibration', 'radiation', 'coolant_flow']]
y = df['label']

model = RandomForestClassifier(n_estimators=200, max_depth=10)
model.fit(X, y)

joblib.dump(model, 'model.pkl')
print("✅ SUCCESS: Advanced AI Brain (model.pkl) trained on 5-point sensor data.")