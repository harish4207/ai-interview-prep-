import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const WebcamFeed = ({ isActive, onFaceAnalysis }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Initialize face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load models from tiny face api for better performance
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        console.log('Loading models from:', MODEL_URL);

        // Load models one by one to ensure proper loading
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('Loaded face detector');
        
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('Loaded landmarks detector');
        
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log('Loaded expression detector');

        console.log('All models loaded successfully');
        setIsModelsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error loading models:', err);
        setError(`Failed to load face detection models: ${err.message}`);
        setIsModelsLoaded(false);
      }
    };

    if (isActive) {
      loadModels();
    }

    return () => {
      setIsModelsLoaded(false);
    };
  }, [isActive]);

  // Start webcam
  useEffect(() => {
    let stream;

    const startWebcam = async () => {
      try {
        if (!isActive || !navigator.mediaDevices?.getUserMedia) {
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setIsVideoReady(true);
              resolve();
            };
          });
        }
      } catch (err) {
        console.error('Webcam error:', err);
        setError('Could not access camera: ' + err.message);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsVideoReady(false);
    };
  }, [isActive]);

  // Face detection loop
  useEffect(() => {
    let animationFrameId;
    let isDetecting = false;

    const detectFaces = async () => {
      if (!isModelsLoaded || !isVideoReady || !videoRef.current?.video || !canvasRef.current || !isActive) {
        animationFrameId = requestAnimationFrame(detectFaces);
        return;
      }

      if (isDetecting) {
        animationFrameId = requestAnimationFrame(detectFaces);
        return;
      }

      isDetecting = true;

      try {
        const video = videoRef.current.video;
        const canvas = canvasRef.current;

        if (video.readyState === 4) {
          // Set canvas size
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Clear previous drawings
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw video frame to canvas first
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Get image data from canvas
          const detection = await faceapi
            .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.2
            }))
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detection && detection.length > 0) {
            // Use first detected face
            const face = detection[0];
            
            // Clear canvas for drawing detections
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Draw results
            const dims = { width: canvas.width, height: canvas.height };
            const resizedResults = faceapi.resizeResults(face, dims);

            // Draw rectangle around face
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            const { x, y, width, height } = resizedResults.detection.box;
            ctx.strokeRect(x, y, width, height);

            // Draw face landmarks
            const landmarks = resizedResults.landmarks;
            const points = landmarks.positions;
            
            ctx.fillStyle = '#00ff00';
            points.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });

            // Update results
            const results = {
              expressions: resizedResults.expressions,
              detection: {
                box: resizedResults.detection.box,
                score: resizedResults.detection.score,
              },
              landmarks: {
                positions: resizedResults.landmarks.positions,
                shift: resizedResults.landmarks.shift,
              },
              timestamp: new Date().toISOString(),
            };
            setDetectionResults(results);
            if (onFaceAnalysis) {
              onFaceAnalysis(results);
            }
          } else {
            setDetectionResults(null);
            if (onFaceAnalysis) {
              onFaceAnalysis(null);
            }
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
        if (!err.message.includes('no faces')) {
          setError(`Face detection error: ${err.message}`);
        }
      } finally {
        isDetecting = false;
        animationFrameId = requestAnimationFrame(detectFaces);
      }
    };

    if (isActive) {
      detectFaces();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isModelsLoaded, isActive, isVideoReady, onFaceAnalysis]);

  if (!isActive) return null;

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
          {error}
        </div>
      )}
      <div className="relative">
        <Webcam
          ref={videoRef}
          mirrored
          screenshotFormat="image/jpeg"
          className="w-full"
          onUserMediaError={(err) => setError('Camera error: ' + err.message)}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
        {isModelsLoaded && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm z-10">
            Face Detection Active
          </div>
        )}
        

      </div>
    </div>
  );
};

export default WebcamFeed;