#!/usr/bin/env python3
"""
Face landmark detection using MediaPipe Python (native implementation).
This is much faster than the JavaScript/WASM version.
"""
import sys
import json
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Model will be downloaded if needed
MODEL_PATH = 'src/lib/face/model/face_landmarker.task'

def detect_landmarks(image_path):
    """Detect face landmarks in an image."""
    
    # Initialize the face landmarker
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_faces=5,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    detector = vision.FaceLandmarker.create_from_options(options)
    
    # Load the image
    image = mp.Image.create_from_file(image_path)
    
    # Detect face landmarks
    detection_result = detector.detect(image)
    
    # Convert to JSON-serializable format
    landmarks_list = []
    if detection_result.face_landmarks:
        for face_landmarks in detection_result.face_landmarks:
            landmarks = [
                {"x": lm.x, "y": lm.y, "z": lm.z}
                for lm in face_landmarks
            ]
            landmarks_list.append(landmarks)
    
    result = {
        "faceCount": len(detection_result.face_landmarks) if detection_result.face_landmarks else 0,
        "confidence": 1.0 if detection_result.face_landmarks else 0.0,
        "landmarks": landmarks_list
    }
    
    return result

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: detect_face.py <image_path>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        result = detect_landmarks(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
