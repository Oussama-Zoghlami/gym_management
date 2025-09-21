import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MemberRegistration {
  firstname: string;
  lastname: string;
  email: string;
  gym_id: number;
  image: string; // base64 encoded image
}

export interface FaceRecognitionRequest {
  image: string; // base64 encoded image
}

export interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  gym_id: number;
  registered_at: string;
}

export interface RecognitionResponse {
  recognized: boolean;
  member?: Member;
  similarity_score?: number;
  message?: string;
}

export interface MembersListResponse {
  members: Member[];
  total_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacialRecognitionService {
  private readonly FLASK_API_URL = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }


  /**
   * Register a new member with facial recognition
   */
  registerMember(memberData: MemberRegistration): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.FLASK_API_URL}/register-member`, memberData, { headers });
  }

  /**
   * Recognize a face for login
   */
  recognizeFace(faceData: FaceRecognitionRequest): Observable<RecognitionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<RecognitionResponse>(`${this.FLASK_API_URL}/recognize-face`, faceData, { headers });
  }

  /**
   * Get list of all registered members
   */
  getMembers(): Observable<MembersListResponse> {
    return this.http.get<MembersListResponse>(`${this.FLASK_API_URL}/members`);
  }

  /**
   * Delete a member
   */
  deleteMember(memberId: string): Observable<any> {
    return this.http.delete(`${this.FLASK_API_URL}/delete-member/${memberId}`);
  }

  /**
   * Get member photo
   */
  getMemberPhoto(memberId: string): Observable<Blob> {
    return this.http.get(`${this.FLASK_API_URL}/get-member-photo/${memberId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Convert file to base64 string
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Capture image from camera
   */
  captureFromCamera(): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user', // Front camera
          frameRate: { ideal: 30, max: 60 } // Higher frame rate for faster capture
        } 
      })
        .then(stream => {
          video.srcObject = stream;
          video.play();

          video.addEventListener('loadedmetadata', () => {
            // Set canvas to video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;


            // Wait for video to stabilize and capture
            setTimeout(() => {
              if (context) {
                // Draw the current video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert to high quality JPEG
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                
                // Stop the camera
                stream.getTracks().forEach(track => track.stop());
                
                // Remove data URL prefix
                const base64 = imageData.split(',')[1];
                
                resolve(base64);
              } else {
                stream.getTracks().forEach(track => track.stop());
                reject(new Error('Could not get canvas context'));
              }
            }, 500); // Reduced from 2000ms to 500ms for faster capture
          });
        })
        .catch(error => {
          console.error('Camera access error:', error);
          reject(error);
        });
    });
  }

  /**
   * Validate image for face detection
   */
  validateImageForFace(imageBase64: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Basic validation - check if image is not too small
        if (img.width < 100 || img.height < 100) {
          resolve(false);
          return;
        }
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = `data:image/jpeg;base64,${imageBase64}`;
    });
  }
}
