import React, { useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebcamCapture({ onCapture, isEnabled, onToggle }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported in this browser');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'environment'
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied - please allow camera permissions');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isActive) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    if (onCapture) {
      onCapture(dataUrl);
    }
    return dataUrl;
  }, [isActive, onCapture]);

  const handleToggle = () => {
    if (isActive) {
      stopCamera();
    } else {
      startCamera();
    }
    onToggle(!isActive);
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-cyan-500/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-xs font-mono text-gray-400 uppercase">
            Workspace Vision
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={isActive ? 'text-green-400' : 'text-gray-400'}
        >
          {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
        </Button>
      </div>

      <div className="relative aspect-video bg-black">
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2">
              <Button
                size="sm"
                onClick={captureFrame}
                className="bg-cyan-600 hover:bg-cyan-700 text-xs"
              >
                Analyze
              </Button>
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-white/70 font-mono">LIVE</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Camera className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-mono">Camera disabled</p>
            {error && (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
