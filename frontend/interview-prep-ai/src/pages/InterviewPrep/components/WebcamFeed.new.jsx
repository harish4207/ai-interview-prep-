import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
// Add pose detection imports
import * as posedetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

// Define CDN URLs for models in case local loading fails
const CDN_URLS = {
  ssdMobilenetv1: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
  faceLandmark68Net: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
  faceExpressionNet: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
};

export default function WebcamFeed({ isActive, onFaceAnalysis }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [poseDetector, setPoseDetector] = useState(null);

  // Load face-api.js and pose models
  useEffect(() => {
    async function loadModels() {
      if (!isActive) return;
      
      setLoadingModels(true);
      try {
        // Initialize TensorFlow.js backend
        await faceapi.tf.setBackend('webgl');
        await faceapi.tf.ready();
        console.log('TensorFlow.js backend ready');
        
        // Try loading models from local path first
        try {
          console.log('Attempting to load models from local path...');
          await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
          await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
          await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        } catch (localError) {
          console.log('Local model loading failed, trying CDN...', localError);
          await faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URLS.ssdMobilenetv1);
          await faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URLS.faceLandmark68Net);
          await faceapi.nets.faceExpressionNet.loadFromUri(CDN_URLS.faceExpressionNet);
        }
        
        // Load pose detector
        const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, {
          modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        });
        setPoseDetector(detector);
        setLoadingModels(false);
        console.log('All models loaded successfully');
      } catch (error) {
        console.error('Error loading models:', error);
        setError(\`Failed to load models: \${error.message}\`);
        setLoadingModels(false);
      }
    }

    loadModels();

    return () => {
      // Cleanup
      if (poseDetector) {
        poseDetector.dispose();
      }
    };
  }, [isActive]);

  // Start webcam
  useEffect(() => {
    let stream;
    if (isActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => setError('Could not access camera: ' + err.message));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Face and pose detection loop
  useEffect(() => {
    let interval;
    async function detect() {
      if (
        isActive &&
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        !loadingModels
      ) {
        try {
          // Face detection
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceExpressions();

          // Pose detection
          let posture = null;
          if (poseDetector) {
            const poses = await poseDetector.estimatePoses(videoRef.current);
            if (poses && poses[0] && poses[0].keypoints) {
              const leftShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
              const rightShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
              const nose = poses[0].keypoints.find(k => k.name === 'nose');
              if (leftShoulder && rightShoulder && nose) {
                const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                posture = Math.abs(nose.y - avgShoulderY) < 60 ? 'upright' : 'slouching';
              }
            }
          }

          // Draw results
          const canvas = canvasRef.current;
          if (canvas && detections) {
            const dims = {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            };
            faceapi.matchDimensions(canvas, dims);
            const resized = faceapi.resizeResults(detections, dims);
            
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resized);
            faceapi.draw.drawFaceLandmarks(canvas, resized);

            // Overlay posture
            if (posture) {
              const ctx = canvas.getContext('2d');
              ctx.font = '18px Arial';
              ctx.fillStyle = posture === 'upright' ? 'green' : 'orange';
              ctx.fillText(\`Posture: \${posture}\`, 10, 30);
            }

            // Analysis
            if (detections.length > 0) {
              const faceCount = detections.length;
              const mainFace = detections[0];
              const emotion = mainFace.expressions
                ? Object.entries(mainFace.expressions).sort((a, b) => b[1] - a[1])[0][0]
                : null;

              let attention = null;
              if (mainFace.landmarks) {
                const nose = mainFace.landmarks.getNose();
                const x = nose[3].x;
                const w = videoRef.current.videoWidth;
                attention = x > w * 0.3 && x < w * 0.7 ? 'focused' : 'not_focused';
              }

              if (onFaceAnalysis) {
                onFaceAnalysis({ faceCount, emotion, attention, posture });
              }
            }
          }
        } catch (err) {
          console.error('Detection error:', err);
        }
      }
    }

    if (isActive && !loadingModels) {
      interval = setInterval(detect, 500);
    }

    return () => clearInterval(interval);
  }, [isActive, loadingModels, onFaceAnalysis, poseDetector]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center mb-4 relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={(e) => {
          e.target.play();
        }}
        className="rounded-lg border border-gray-300 w-96 h-72 bg-black"
        width={384}
        height={288}
        style={{ position: 'relative', zIndex: 1 }}
      />
      <canvas
        ref={canvasRef}
        width={384}
        height={288}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      {loadingModels && (
        <div className="text-blue-500 text-xs mt-2">Loading face & posture models...</div>
      )}
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
    </div>
  );
}
