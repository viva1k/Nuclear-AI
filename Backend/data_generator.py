import pandas as pd
import numpy as np

# Generating 1000 rows of high-fidelity data
data = {
    'temp': np.random.uniform(250, 450, 1000),         # Celsius
    'pressure': np.random.uniform(100, 220, 1000),      # Bar
    'vibration': np.random.uniform(0.01, 0.15, 1000),   # mm/s
    'radiation': np.random.uniform(0.1, 5.0, 1000),     # mSv/h (New!)
    'coolant_flow': np.random.uniform(80, 120, 1000)    # % Capacity (New!)
}
df = pd.DataFrame(data)

# Advanced Logic: Danger if multiple systems fail at once
# If (Temp > 400 AND Flow < 85) OR (Radiation > 4.0), it's a CRITICAL DANGER (1)
df['label'] = (((df['temp'] > 400) & (df['coolant_flow'] < 85)) | (df['radiation'] > 4.0)).astype(int)

df.to_csv('reactor_data.csv', index=False)
print("✅ SUCCESS: Advanced 'reactor_data.csv' created with 5 sensors.")