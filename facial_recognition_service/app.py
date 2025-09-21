from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import base64
import json
import os
import uuid
from datetime import datetime
import hashlib
import pickle

# Import with error handling for compatibility issues
try:
    import cv2
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.preprocessing import StandardScaler
    print("✅ OpenCV and NumPy imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install compatible versions:")
    print("pip install opencv-python==4.8.0.76 numpy==1.21.6 scikit-learn==1.0.2")
    exit(1)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
MEMBER_PHOTOS_DIR = "member_photos"
MEMBER_DATA_FILE = "member_data.json"
FACE_ENCODINGS_FILE = "face_encodings.pkl"

# Ensure directories exist
os.makedirs(MEMBER_PHOTOS_DIR, exist_ok=True)

# Global variables for face encodings
face_encodings = {}
member_data = {}

def load_member_data():
    """Load member data from JSON file"""
    global member_data
    if os.path.exists(MEMBER_DATA_FILE):
        with open(MEMBER_DATA_FILE, 'r') as f:
            member_data = json.load(f)
    else:
        member_data = {}

def save_member_data():
    """Save member data to JSON file"""
    with open(MEMBER_DATA_FILE, 'w') as f:
        json.dump(member_data, f, indent=2)

def load_face_encodings():
    """Load face encodings from pickle file"""
    global face_encodings
    if os.path.exists(FACE_ENCODINGS_FILE):
        with open(FACE_ENCODINGS_FILE, 'rb') as f:
            face_encodings = pickle.load(f)
    else:
        face_encodings = {}

def save_face_encodings():
    """Save face encodings to pickle file"""
    with open(FACE_ENCODINGS_FILE, 'wb') as f:
        pickle.dump(face_encodings, f)

def extract_face_features(image):
    """
    Extract comprehensive face features using multiple AI-based methods
    """
    try:
        # Convert to grayscale for some features
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 1. Color Histogram Features (RGB channels)
        hist_r = cv2.calcHist([image], [0], None, [256], [0, 256])
        hist_g = cv2.calcHist([image], [1], None, [256], [0, 256])
        hist_b = cv2.calcHist([image], [2], None, [256], [0, 256])
        color_features = np.concatenate([hist_r.flatten(), hist_g.flatten(), hist_b.flatten()])
        
        # 2. Texture Features using Local Binary Pattern (LBP)
        def get_lbp(image, radius=1, n_points=8):
            lbp = np.zeros_like(image)
            for i in range(radius, image.shape[0] - radius):
                for j in range(radius, image.shape[1] - radius):
                    center = image[i, j]
                    binary_string = ''
                    for k in range(n_points):
                        angle = 2 * np.pi * k / n_points
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        if x < image.shape[0] and y < image.shape[1]:
                            binary_string += '1' if image[x, y] >= center else '0'
                    lbp[i, j] = int(binary_string, 2)
            return lbp
        
        lbp = get_lbp(gray)
        lbp_hist = cv2.calcHist([lbp], [0], None, [256], [0, 256])
        texture_features = lbp_hist.flatten()
        
        # 3. Edge Features using Canny edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_features = np.sum(edges) / (edges.shape[0] * edges.shape[1])
        
        # 4. Geometric Features using image moments
        moments = cv2.moments(gray)
        geometric_features = np.array([
            moments['m00'], moments['m10'], moments['m01'], 
            moments['m20'], moments['m11'], moments['m02']
        ])
        
        # 5. Statistical Features
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        statistical_features = np.array([mean_val, std_val])
        
        # 6. Region-based Features (divide image into quadrants)
        h, w = gray.shape
        q1 = gray[0:h//2, 0:w//2]
        q2 = gray[0:h//2, w//2:w]
        q3 = gray[h//2:h, 0:w//2]
        q4 = gray[h//2:h, w//2:w]
        
        region_features = np.array([
            np.mean(q1), np.mean(q2), np.mean(q3), np.mean(q4),
            np.std(q1), np.std(q2), np.std(q3), np.std(q4)
        ])
        
        # Combine all features
        all_features = np.concatenate([
            color_features[:100],  # Limit color features to avoid memory issues
            texture_features[:50],  # Limit texture features
            [edge_features],
            geometric_features,
            statistical_features,
            region_features
        ])
        
        return all_features
        
    except Exception as e:
        print(f"Error extracting features: {str(e)}")
        return None

def detect_face(image):
    """Detect if there's a face in the image"""
    try:
        # Load Haar cascade for face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        return len(faces) > 0
    except Exception as e:
        print(f"Error detecting face: {str(e)}")
        return False

def compare_faces(encoding1, encoding2, threshold=0.7):
    """Compare two face encodings using cosine similarity"""
    try:
        # Reshape encodings for cosine similarity
        encoding1 = encoding1.reshape(1, -1)
        encoding2 = encoding2.reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(encoding1, encoding2)[0][0]
        return similarity >= threshold
    except Exception as e:
        print(f"Error comparing faces: {str(e)}")
        return False

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        print(f"Error converting base64 to image: {str(e)}")
        return None

# Load data on startup
load_member_data()
load_face_encodings()

@app.route('/')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Facial Recognition Service',
        'timestamp': datetime.now().isoformat(),
        'total_members': len(member_data)
    })

@app.route('/api/test/connection', methods=['GET'])
def test_connection():
    """Test connection endpoint"""
    print('Received connection test request')
    return jsonify(message='Facial Recognition Service connection successful!')

@app.route('/api/register-member', methods=['POST'])
def register_member():
    """Register a new member with photo"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstname', 'lastname', 'email', 'gym_id', 'image']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Convert base64 image to OpenCV format
        image = base64_to_image(data['image'])
        if image is None:
            return jsonify({'error': 'Invalid image format'}), 400
        
        # Check if face is detected
        if not detect_face(image):
            return jsonify({'error': 'No face detected in the image'}), 400
        
        # Extract face features
        face_encoding = extract_face_features(image)
        if face_encoding is None:
            return jsonify({'error': 'Failed to extract face features'}), 400
        
        # Generate unique member ID
        member_id = str(uuid.uuid4())
        
        # Save photo
        photo_filename = f"{member_id}.jpg"
        photo_path = os.path.join(MEMBER_PHOTOS_DIR, photo_filename)
        cv2.imwrite(photo_path, image)
        
        # Create member data
        member_info = {
            'id': member_id,
            'firstname': data['firstname'],
            'lastname': data['lastname'],
            'email': data['email'],
            'gym_id': data['gym_id'],
            'photo_path': photo_path,
            'registered_at': datetime.now().isoformat()
        }
        
        # Store member data and face encoding
        member_data[member_id] = member_info
        face_encodings[member_id] = face_encoding
        
        # Save to files
        save_member_data()
        save_face_encodings()
        
        print(f"Member registered successfully: {data['firstname']} {data['lastname']}")
        
        return jsonify({
            'message': 'Member registered successfully',
            'member_id': member_id,
            'member': member_info
        })
        
    except Exception as e:
        print(f"Error registering member: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/recognize-face', methods=['POST'])
def recognize_face():
    """Recognize a face for login"""
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Convert base64 image to OpenCV format
        image = base64_to_image(data['image'])
        if image is None:
            return jsonify({'error': 'Invalid image format'}), 400
        
        # Check if face is detected
        if not detect_face(image):
            return jsonify({'error': 'No face detected in the image'}), 400
        
        # Extract face features
        unknown_encoding = extract_face_features(image)
        if unknown_encoding is None:
            return jsonify({'error': 'Failed to extract face features'}), 400
        
        # Compare with stored encodings
        best_match = None
        best_similarity = 0
        
        for member_id, stored_encoding in face_encodings.items():
            if compare_faces(unknown_encoding, stored_encoding, threshold=0.6):
                # Calculate similarity score
                similarity = cosine_similarity(
                    unknown_encoding.reshape(1, -1), 
                    stored_encoding.reshape(1, -1)
                )[0][0]
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = member_id
        
        if best_match and best_similarity > 0.6:
            member_info = member_data[best_match]
            print(f"Face recognized: {member_info['firstname']} {member_info['lastname']}")
            
            return jsonify({
                'recognized': True,
                'member': member_info,
                'similarity_score': float(best_similarity)
            })
        else:
            print("Face not recognized")
            return jsonify({
                'recognized': False,
                'message': 'Face not recognized'
            })
        
    except Exception as e:
        print(f"Error recognizing face: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/members', methods=['GET'])
def get_members():
    """Get list of all registered members"""
    try:
        # Return member data without sensitive information
        members_list = []
        for member_id, member_info in member_data.items():
            members_list.append({
                'id': member_id,
                'firstname': member_info['firstname'],
                'lastname': member_info['lastname'],
                'email': member_info['email'],
                'gym_id': member_info['gym_id'],
                'registered_at': member_info['registered_at']
            })
        
        return jsonify({
            'members': members_list,
            'total_count': len(members_list)
        })
        
    except Exception as e:
        print(f"Error getting members: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-member/<member_id>', methods=['DELETE'])
def delete_member(member_id):
    """Delete a member and their data"""
    try:
        if member_id not in member_data:
            return jsonify({'error': 'Member not found'}), 404
        
        # Get member info
        member_info = member_data[member_id]
        
        # Delete photo file
        if os.path.exists(member_info['photo_path']):
            os.remove(member_info['photo_path'])
        
        # Remove from data structures
        del member_data[member_id]
        if member_id in face_encodings:
            del face_encodings[member_id]
        
        # Save updated data
        save_member_data()
        save_face_encodings()
        
        print(f"Member deleted: {member_info['firstname']} {member_info['lastname']}")
        
        return jsonify({'message': 'Member deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting member: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-member-by-email', methods=['DELETE'])
def delete_member_by_email():
    """Delete a member by email address"""
    try:
        data = request.get_json()
        if 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email']
        
        # Find member by email
        member_to_delete = None
        for member_id, member_info in member_data.items():
            if member_info['email'] == email:
                member_to_delete = member_id
                break
        
        if not member_to_delete:
            return jsonify({'error': 'Member not found'}), 404
        
        # Get member info
        member_info = member_data[member_to_delete]
        
        # Delete photo file
        if os.path.exists(member_info['photo_path']):
            os.remove(member_info['photo_path'])
        
        # Remove from data structures
        del member_data[member_to_delete]
        if member_to_delete in face_encodings:
            del face_encodings[member_to_delete]
        
        # Save updated data
        save_member_data()
        save_face_encodings()
        
        print(f"Member deleted by email: {member_info['firstname']} {member_info['lastname']} ({email})")
        
        return jsonify({'message': 'Member deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting member by email: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup-deleted-users', methods=['POST'])
def cleanup_deleted_users():
    """Clean up facial recognition data for users that no longer exist in the database"""
    try:
        data = request.get_json()
        if 'active_emails' not in data:
            return jsonify({'error': 'active_emails list is required'}), 400
        
        active_emails = set(data['active_emails'])
        deleted_count = 0
        
        # Find members to delete
        members_to_delete = []
        for member_id, member_info in member_data.items():
            if member_info['email'] not in active_emails:
                members_to_delete.append(member_id)
        
        # Delete members
        for member_id in members_to_delete:
            member_info = member_data[member_id]
            
            # Delete photo file
            if os.path.exists(member_info['photo_path']):
                os.remove(member_info['photo_path'])
            
            # Remove from data structures
            del member_data[member_id]
            if member_id in face_encodings:
                del face_encodings[member_id]
            
            deleted_count += 1
            print(f"Cleaned up deleted user: {member_info['firstname']} {member_info['lastname']} ({member_info['email']})")
        
        # Save updated data
        save_member_data()
        save_face_encodings()
        
        return jsonify({
            'message': f'Cleanup completed successfully',
            'deleted_count': deleted_count,
            'remaining_members': len(member_data)
        })
        
    except Exception as e:
        print(f"Error cleaning up deleted users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-member-photo/<member_id>', methods=['GET'])
def get_member_photo(member_id):
    """Get member photo"""
    try:
        if member_id not in member_data:
            return jsonify({'error': 'Member not found'}), 404
        
        photo_path = member_data[member_id]['photo_path']
        if not os.path.exists(photo_path):
            return jsonify({'error': 'Photo not found'}), 404
        
        return send_from_directory(MEMBER_PHOTOS_DIR, f"{member_id}.jpg")
        
    except Exception as e:
        print(f"Error getting member photo: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(e):
    """Global error handler"""
    print(f"Global error: {str(e)}")
    return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Facial Recognition Service...")
    print(f"Member photos directory: {MEMBER_PHOTOS_DIR}")
    print(f"Member data file: {MEMBER_DATA_FILE}")
    print(f"Face encodings file: {FACE_ENCODINGS_FILE}")
    app.run(host='0.0.0.0', port=5000, debug=True)
