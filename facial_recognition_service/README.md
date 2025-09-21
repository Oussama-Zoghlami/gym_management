# Facial Recognition Service

## Overview
This is a Python-based facial recognition service that provides secure, contactless gym access control using advanced computer vision and machine learning techniques. The service integrates with the Gym Management System to enable members to access gym facilities using facial recognition instead of traditional keycards or passwords.

## 🎯 Features

### Core Functionality
- **👤 Member Registration**: Register new members with facial photos
- **🔍 Face Recognition**: Real-time face recognition for gym access
- **📊 Member Management**: View, update, and delete member records
- **🔄 Data Synchronization**: Automatic cleanup of deleted users
- **📸 Photo Management**: Secure storage and retrieval of member photos

### Advanced AI Features
- **🧠 Multi-Feature Extraction**: Combines multiple AI-based feature extraction methods
- **🎨 Color Histogram Analysis**: RGB channel analysis for facial characteristics
- **🔍 Texture Analysis**: Local Binary Pattern (LBP) for facial texture features
- **📐 Edge Detection**: Canny edge detection for facial structure analysis
- **📊 Geometric Features**: Image moments for facial geometry
- **📈 Statistical Analysis**: Mean and standard deviation calculations
- **🗺️ Region-based Features**: Quadrant-based facial region analysis

## 🏗️ Architecture

### Technology Stack
- **Framework**: Flask (Python web framework)
- **Computer Vision**: OpenCV (cv2)
- **Machine Learning**: scikit-learn
- **Data Processing**: NumPy
- **Face Detection**: Haar Cascade Classifier
- **Similarity Matching**: Cosine Similarity
- **Data Storage**: JSON (member data) + Pickle (face encodings)
- **Image Processing**: Base64 encoding/decoding

### Service Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Facial Recog    │    │   Backend       │
│   (Angular)     │◄──►│   Service        │◄──►│  (Spring Boot)  │
│                 │    │   (Flask)        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Data Storage   │
                       │  - member_data   │
                       │  - face_encodings│
                       │  - member_photos │
                       └──────────────────┘
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Virtual environment (recommended)

### Installation Steps

1. **Navigate to Service Directory**
   ```bash
   cd facial_recognition_service
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install flask flask-cors opencv-python==4.8.0.76 numpy==1.21.6 scikit-learn==1.0.2
   ```

4. **Run the Service**
   ```bash
   python app.py
   ```

5. **Verify Installation**
   - Service runs on `http://localhost:5000`
   - Health check: `http://localhost:5000/`

## 🚀 API Endpoints

### Health & Status
```http
GET /
```
**Response:**
```json
{
  "status": "healthy",
  "service": "Facial Recognition Service",
  "timestamp": "2024-01-15T10:30:00",
  "total_members": 25
}
```

### Member Registration
```http
POST /api/register-member
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "gym_id": 1,
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**
```json
{
  "message": "Member registered successfully",
  "member_id": "1b7524c6-625d-4ce8-9986-b5c8aaa2994b",
  "member": {
    "id": "1b7524c6-625d-4ce8-9986-b5c8aaa2994b",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "gym_id": 1,
    "photo_path": "member_photos/1b7524c6-625d-4ce8-9986-b5c8aaa2994b.jpg",
    "registered_at": "2024-01-15T10:30:00"
  }
}
```

### Face Recognition
```http
POST /api/recognize-face
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response (Recognized):**
```json
{
  "recognized": true,
  "member": {
    "id": "1b7524c6-625d-4ce8-9986-b5c8aaa2994b",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "gym_id": 1,
    "registered_at": "2024-01-15T10:30:00"
  },
  "similarity_score": 0.85
}
```

**Response (Not Recognized):**
```json
{
  "recognized": false,
  "message": "Face not recognized"
}
```

### Member Management
```http
GET /api/members
```
**Response:**
```json
{
  "members": [
    {
      "id": "1b7524c6-625d-4ce8-9986-b5c8aaa2994b",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john.doe@example.com",
      "gym_id": 1,
      "registered_at": "2024-01-15T10:30:00"
    }
  ],
  "total_count": 1
}
```

### Member Deletion
```http
DELETE /api/delete-member/{member_id}
```

```http
DELETE /api/delete-member-by-email
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

### Data Cleanup
```http
POST /api/cleanup-deleted-users
Content-Type: application/json

{
  "active_emails": ["user1@example.com", "user2@example.com"]
}
```

## 🧠 AI & Machine Learning

### Face Feature Extraction
The service uses a comprehensive approach to extract facial features:

#### 1. Color Histogram Features
```python
# RGB channel analysis
hist_r = cv2.calcHist([image], [0], None, [256], [0, 256])
hist_g = cv2.calcHist([image], [1], None, [256], [0, 256])
hist_b = cv2.calcHist([image], [2], None, [256], [0, 256])
color_features = np.concatenate([hist_r.flatten(), hist_g.flatten(), hist_b.flatten()])
```

#### 2. Texture Analysis (LBP)
```python
def get_lbp(image, radius=1, n_points=8):
    # Local Binary Pattern for texture analysis
    lbp = np.zeros_like(image)
    # ... LBP calculation logic
    return lbp
```

#### 3. Edge Detection
```python
# Canny edge detection for facial structure
edges = cv2.Canny(gray, 50, 150)
edge_features = np.sum(edges) / (edges.shape[0] * edges.shape[1])
```

#### 4. Geometric Features
```python
# Image moments for facial geometry
moments = cv2.moments(gray)
geometric_features = np.array([
    moments['m00'], moments['m10'], moments['m01'], 
    moments['m20'], moments['m11'], moments['m02']
])
```

#### 5. Statistical Features
```python
# Mean and standard deviation
mean_val = np.mean(gray)
std_val = np.std(gray)
statistical_features = np.array([mean_val, std_val])
```

#### 6. Region-based Features
```python
# Divide image into quadrants for regional analysis
h, w = gray.shape
q1 = gray[0:h//2, 0:w//2]
q2 = gray[0:h//2, w//2:w]
q3 = gray[h//2:h, 0:w//2]
q4 = gray[h//2:h, w//2:w]
```

### Face Recognition Process

#### 1. Face Detection
```python
def detect_face(image):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    return len(faces) > 0
```

#### 2. Feature Comparison
```python
def compare_faces(encoding1, encoding2, threshold=0.7):
    encoding1 = encoding1.reshape(1, -1)
    encoding2 = encoding2.reshape(1, -1)
    similarity = cosine_similarity(encoding1, encoding2)[0][0]
    return similarity >= threshold
```

## 📁 Data Storage

### File Structure
```
facial_recognition_service/
├── app.py                    # Main Flask application
├── member_data.json         # Member information storage
├── face_encodings.pkl       # Face feature encodings
├── member_photos/           # Member photo storage
│   ├── {member_id}.jpg
│   └── ...
├── venv/                    # Python virtual environment
└── README.md               # This file
```

### Data Formats

#### Member Data (JSON)
```json
{
  "1b7524c6-625d-4ce8-9986-b5c8aaa2994b": {
    "id": "1b7524c6-625d-4ce8-9986-b5c8aaa2994b",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "gym_id": 1,
    "photo_path": "member_photos/1b7524c6-625d-4ce8-9986-b5c8aaa2994b.jpg",
    "registered_at": "2024-01-15T10:30:00"
  }
}
```

#### Face Encodings (Pickle)
```python
# Binary file containing numpy arrays of face features
face_encodings = {
    "member_id": numpy_array_of_features,
    # ...
}
```

## 🔒 Security Features

### Data Protection
- **Secure Storage**: Face encodings stored as binary data
- **Access Control**: API endpoints require proper authentication
- **Data Validation**: Input validation for all API requests
- **Error Handling**: Comprehensive error handling and logging

### Privacy Considerations
- **Local Processing**: All face recognition happens locally
- **No Cloud Storage**: Data stored locally on the server
- **Member Consent**: Members must consent to facial recognition
- **Data Retention**: Clear data retention policies

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom port
export FACIAL_RECOGNITION_PORT=5000

# Optional: Custom photo directory
export MEMBER_PHOTOS_DIR=member_photos

# Optional: Custom data files
export MEMBER_DATA_FILE=member_data.json
export FACE_ENCODINGS_FILE=face_encodings.pkl
```

### Service Configuration
```python
# Configuration constants in app.py
MEMBER_PHOTOS_DIR = "member_photos"
MEMBER_DATA_FILE = "member_data.json"
FACE_ENCODINGS_FILE = "face_encodings.pkl"
```

## 🚀 Integration with Gym Management System

### Frontend Integration
The facial recognition service integrates with the Angular frontend:

```typescript
// Angular service for facial recognition
@Injectable()
export class FacialRecognitionService {
  private apiUrl = 'http://localhost:5000/api';
  
  registerMember(memberData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-member`, memberData);
  }
  
  recognizeFace(imageData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recognize-face`, { image: imageData });
  }
}
```

### Backend Integration
The Spring Boot backend communicates with the facial recognition service:

```java
@Service
public class FacialRecognitionService {
    private final String FACIAL_SERVICE_URL = "http://localhost:5000/api";
    
    public void registerMember(MemberRegistrationRequest request) {
        // Send registration request to facial recognition service
    }
    
    public boolean recognizeMember(String imageData) {
        // Send recognition request to facial recognition service
    }
}
```

## 🧪 Testing

### Manual Testing
```bash
# Test connection
curl http://localhost:5000/

# Test member registration
curl -X POST http://localhost:5000/api/register-member \
  -H "Content-Type: application/json" \
  -d '{"firstname": "Test", "lastname": "User", "email": "test@example.com", "gym_id": 1, "image": "base64_image_data"}'

# Test face recognition
curl -X POST http://localhost:5000/api/recognize-face \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data"}'
```

### Automated Testing
```python
import unittest
import requests
import base64

class TestFacialRecognitionService(unittest.TestCase):
    def setUp(self):
        self.base_url = "http://localhost:5000/api"
    
    def test_health_check(self):
        response = requests.get("http://localhost:5000/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")
    
    def test_member_registration(self):
        # Test member registration with sample data
        pass
    
    def test_face_recognition(self):
        # Test face recognition with sample image
        pass
```

## 📊 Performance & Optimization

### Performance Metrics
- **Registration Time**: ~2-3 seconds per member
- **Recognition Time**: ~1-2 seconds per recognition
- **Memory Usage**: ~50-100MB for 1000 members
- **Storage**: ~1-2MB per member (photo + encoding)

### Optimization Strategies
- **Feature Compression**: Limit feature vectors to essential components
- **Batch Processing**: Process multiple recognitions efficiently
- **Caching**: Cache frequently accessed data
- **Image Optimization**: Compress images before storage

## 🚀 Deployment

### Production Deployment
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Or with systemd service
sudo systemctl start facial-recognition-service
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Environment Setup
```bash
# Production environment variables
export FLASK_ENV=production
export FACIAL_RECOGNITION_PORT=5000
export MEMBER_PHOTOS_DIR=/data/member_photos
export MEMBER_DATA_FILE=/data/member_data.json
export FACE_ENCODINGS_FILE=/data/face_encodings.pkl
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# Error: No module named 'cv2'
pip install opencv-python==4.8.0.76

# Error: No module named 'sklearn'
pip install scikit-learn==1.0.2
```

#### 2. Face Detection Issues
- Ensure good lighting conditions
- Use high-quality images
- Check if face is clearly visible
- Verify image format (JPEG/PNG)

#### 3. Recognition Accuracy
- Adjust similarity threshold (default: 0.6)
- Ensure consistent image quality
- Use multiple reference photos
- Regular retraining with updated photos

#### 4. Performance Issues
- Monitor memory usage
- Optimize image sizes
- Use SSD storage for better I/O
- Consider GPU acceleration for large datasets

### Debug Mode
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Run with debug mode
app.run(host='0.0.0.0', port=5000, debug=True)
```

## 📈 Future Enhancements

### Planned Features
- **Deep Learning Models**: Integration with TensorFlow/PyTorch
- **Real-time Video**: Live video stream recognition
- **Multi-face Detection**: Handle multiple faces in one image
- **Age/Gender Detection**: Additional demographic information
- **Emotion Recognition**: Facial expression analysis
- **Anti-spoofing**: Liveness detection to prevent photo attacks

### Scalability Improvements
- **Database Integration**: Move from file-based to database storage
- **Microservices**: Split into multiple specialized services
- **Load Balancing**: Support for multiple service instances
- **Cloud Integration**: AWS/Azure cloud deployment options

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Built with ❤️ using Python, Flask, and OpenCV**
