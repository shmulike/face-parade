import requests

BASE_URL = "http://localhost:3000/api"
DATA_DIR = "/home/shmulik/shmul/shmulikcreations/face-parade/data/set_1"

import os

# Get one image
img_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.jpg')]
if not img_files:
    print("No images found!")
    exit(1)

img_path = os.path.join(DATA_DIR, img_files[0])
print(f"Testing with single image: {img_files[0]}")

# Import
print("\n[1] Importing...")
with open(img_path, 'rb') as f:
    files = [('files', (img_files[0], f, 'image/jpeg'))]
    res = requests.post(f"{BASE_URL}/import", files=files)

data = res.json()
job_id = data['jobId']
image_id = data['images'][0]['id']
print(f"Job ID: {job_id}, Image ID: {image_id}")

# Analyze
print("\n[2] Analyzing (with timeout)...")
payload = {
    "jobId": job_id,
    "order": [image_id],
    "options": {"minConfidence": 0.5}
}

try:
    res = requests.post(f"{BASE_URL}/analyze", json=payload, timeout=30)
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        result = res.json()
        print("SUCCESS!")
        print(result)
    else:
        print(f"FAILED: {res.text}")
except requests.Timeout:
    print("TIMEOUT after 30 seconds - worker is hanging!")
except Exception as e:
    print(f"ERROR: {e}")
