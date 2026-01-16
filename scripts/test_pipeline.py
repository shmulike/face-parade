
import requests
import os
import time

BASE_URL = "http://localhost:3000/api"
DATA_DIR = "/home/shmulik/shmul/shmulikcreations/face-parade/data/set_1"

def run_test():
    print(f"Starting test with images in {DATA_DIR}...")
    
    # 1. IMPORT
    print("\n[1] Importing images...")
    files_to_upload = []
    file_handles = []
    
    try:
        for fname in sorted(os.listdir(DATA_DIR)):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                fpath = os.path.join(DATA_DIR, fname)
                fh = open(fpath, 'rb')
                file_handles.append(fh)
                files_to_upload.append(('files', (fname, fh, 'image/jpeg')))
        
        if not files_to_upload:
            print("No images found!")
            return

        res = requests.post(f"{BASE_URL}/import", files=files_to_upload)
        if res.status_code != 200:
            print(f"Import failed: {res.text}")
            return
            
        data = res.json()
        job_id = data.get('jobId')
        images = data.get('images', [])
        print(f"Job ID: {job_id}")
        print(f"Imported {len(images)} images.")
        
    finally:
        for fh in file_handles:
            fh.close()

    if not job_id:
        return

    # 2. ANALYZE
    print("\n[2] Analyzing images...")
    order = [img['id'] for img in images]
    payload = {
        "jobId": job_id,
        "order": order,
        "options": {"minConfidence": 0.5}
    }
    
    res = requests.post(f"{BASE_URL}/analyze", json=payload)
    if res.status_code != 200:
        print(f"Analysis failed: {res.text}")
        return
        
    analysis_results = res.json().get('results', [])
    print(f"Analyzed {len(analysis_results)} images.")
    
    flagged_count = 0
    for r in analysis_results:
        status = "OK"
        if r.get('flagged'):
            status = f"FLAGGED ({r.get('reason')})"
            flagged_count += 1
        
        # Check landmarks
        lm_str = "No landmarks"
        if r.get('landmarks'):
            lm_str = f"{len(r['landmarks'])} pts"
            
        print(f" - {r['id']}: FaceCount={r.get('faceCount')}, Conf={r.get('confidence')}, {status}, {lm_str}")

    if flagged_count == len(images):
        print("\n[WARNING] ALL IMAGES FLAGGED! Stopping render attempt.")
        # We can still try to render to see if it blows up, but usually we stop.
        # But for debug let's try to render one if possible or force it.
    
    # 3. RENDER
    print("\n[3] Rendering video...")
    render_payload = {
        "jobId": job_id,
        "order": order,
        "options": {
            "fps": 4,
            "width": 1080,
            "height": 1920,
            "format": "mp4"
        }
    }
    
    res = requests.post(f"{BASE_URL}/render", json=render_payload)
    if res.status_code != 200:
        print(f"Render start failed: {res.text}")
        return
        
    print("Render started. Polling...")
    
    while True:
        res = requests.get(f"{BASE_URL}/progress?jobId={job_id}")
        data = res.json()
        
        status = data.get('status')
        progress = data.get('progress')
        step = data.get('step')
        
        print(f"Status: {status} ({progress}%) - {step}")
        
        if status == 'COMPLETED':
            print(f"\nSUCCESS! Video url: {data.get('resultUrl')}")
            break
        
        if status == 'ERROR':
            print(f"\nFAILED! Error: {data.get('error')}")
            break
            
        time.sleep(1)

if __name__ == "__main__":
    run_test()
