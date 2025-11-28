import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

// Simple 3D model generators
const createChairModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  
  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), material);
  seat.position.y = 0.4;
  group.add(seat);
  
  // Back
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), material);
  back.position.set(0, 0.8, -0.35);
  group.add(back);
  
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
  const positions = [[-0.3, 0.2, -0.3], [0.3, 0.2, -0.3], [-0.3, 0.2, 0.3], [0.3, 0.2, 0.3]];
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, material);
    leg.position.set(...pos);
    group.add(leg);
  });
  
  return group;
};

const createCubeModel = () => {
  return new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 })
  );
};

const createSphereModel = () => {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 })
  );
};

const createPyramidModel = () => {
  return new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1, 4),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 })
  );
};

const createTableModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.7), material);
  top.position.y = 0.5;
  group.add(top);
  
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
  [[-0.5, 0.25, -0.25], [0.5, 0.25, -0.25], [-0.5, 0.25, 0.25], [0.5, 0.25, 0.25]].forEach(pos => {
    const leg = new THREE.Mesh(legGeo, material);
    leg.position.set(...pos);
    group.add(leg);
  });
  
  return group;
};

const createRobotModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  
  // Body
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), material));
  
  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.3), material);
  head.position.y = 0.5;
  group.add(head);
  
  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
  eye1.position.set(-0.1, 0.55, 0.15);
  group.add(eye1);
  const eye2 = eye1.clone();
  eye2.position.x = 0.1;
  group.add(eye2);
  
  // Arms
  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
  const arm1 = new THREE.Mesh(armGeo, material);
  arm1.position.set(-0.35, 0, 0);
  arm1.rotation.z = Math.PI / 4;
  group.add(arm1);
  const arm2 = arm1.clone();
  arm2.position.x = 0.35;
  arm2.rotation.z = -Math.PI / 4;
  group.add(arm2);
  
  return group;
};

const createPickleballRacketModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  const accentMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.8 });
  
  // Paddle face (rounded rectangle shape using cylinder)
  const paddleFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.03, 32),
    material
  );
  paddleFace.rotation.x = Math.PI / 2;
  paddleFace.position.y = 0.4;
  group.add(paddleFace);
  
  // Paddle edge ring
  const edgeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.02, 8, 32),
    accentMat
  );
  edgeRing.position.y = 0.4;
  group.add(edgeRing);
  
  // Honeycomb pattern (simplified as grid lines)
  for (let i = -3; i <= 3; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.005, 0.005),
      accentMat
    );
    line.position.set(0, 0.4, i * 0.1);
    group.add(line);
    
    const line2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.005, 0.8),
      accentMat
    );
    line2.position.set(i * 0.1, 0.4, 0);
    group.add(line2);
  }
  
  // Handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.05, 0.5, 8),
    material
  );
  handle.position.y = -0.15;
  group.add(handle);
  
  // Handle grip (wrapped texture)
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.055, 0.4, 16),
    new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true, transparent: true, opacity: 0.6 })
  );
  grip.position.y = -0.15;
  group.add(grip);
  
  // Handle end cap
  const endCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    material
  );
  endCap.position.y = -0.4;
  group.add(endCap);
  
  return group;
};

const createPhoneModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  
  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.05), material);
  group.add(body);
  
  // Screen
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.7, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.5 })
  );
  screen.position.z = 0.03;
  group.add(screen);
  
  // Camera bump
  const camera = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), material);
  camera.rotation.x = Math.PI / 2;
  camera.position.set(-0.12, 0.3, -0.035);
  group.add(camera);
  
  return group;
};

const createCarModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  
  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 0.5), material);
  body.position.y = 0.2;
  group.add(body);
  
  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.45), material);
  cabin.position.set(0, 0.45, 0);
  group.add(cabin);
  
  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
  const wheelMat = new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true, transparent: true, opacity: 0.7 });
  const wheelPositions = [[-0.35, 0.05, 0.3], [0.35, 0.05, 0.3], [-0.35, 0.05, -0.3], [0.35, 0.05, -0.3]];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(...pos);
    group.add(wheel);
  });
  
  return group;
};

const createLaptopModel = () => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 });
  
  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), material);
  group.add(base);
  
  // Keyboard area
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.01, 0.35),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.5 })
  );
  keyboard.position.set(0, 0.025, 0.05);
  group.add(keyboard);
  
  // Screen
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.02), material);
  screen.position.set(0, 0.3, -0.28);
  screen.rotation.x = -0.2;
  group.add(screen);
  
  return group;
};

const createDefaultModel = () => {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.8, 1),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.8 })
  );
};

// Model detection from text
const detectModelFromText = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  if (lower.includes('pickleball') || lower.includes('paddle') || lower.includes('racket') || lower.includes('racquet')) return 'pickleball';
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone')) return 'phone';
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('automobile')) return 'car';
  if (lower.includes('laptop') || lower.includes('computer') || lower.includes('notebook')) return 'laptop';
  if (lower.includes('chair') || lower.includes('seat')) return 'chair';
  if (lower.includes('table') || lower.includes('desk')) return 'table';
  if (lower.includes('cube') || lower.includes('box')) return 'cube';
  if (lower.includes('sphere') || lower.includes('ball')) return 'sphere';
  if (lower.includes('pyramid') || lower.includes('triangle')) return 'pyramid';
  if (lower.includes('robot') || lower.includes('bot')) return 'robot';
  
  return null;
};

const modelCreators = {
  pickleball: createPickleballRacketModel,
  phone: createPhoneModel,
  car: createCarModel,
  laptop: createLaptopModel,
  chair: createChairModel,
  table: createTableModel,
  cube: createCubeModel,
  sphere: createSphereModel,
  pyramid: createPyramidModel,
  robot: createRobotModel,
  default: createDefaultModel
};

export default function HologramVisual({ isActive, isSpeaking, isListening, alertMode, displayModel }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const glowRef = useRef(null);
  const frameRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentModelType, setCurrentModelType] = useState('default');

  // Detect model type from displayModel text
  const detectedModel = useMemo(() => {
    return detectModelFromText(displayModel) || 'default';
  }, [displayModel]);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(300, 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Inner glow
    const glowGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.15 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);
    glowRef.current = glow;

    // Initial model
    const model = createDefaultModel();
    scene.add(model);
    modelRef.current = model;

    setIsInitialized(true);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Switch models when detected model changes
  useEffect(() => {
    if (!isInitialized || !sceneRef.current || detectedModel === currentModelType) return;

    // Remove old model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      if (modelRef.current.geometry) modelRef.current.geometry.dispose();
      if (modelRef.current.material) modelRef.current.material.dispose();
    }

    // Create new model
    const creator = modelCreators[detectedModel] || modelCreators.default;
    const newModel = creator();
    sceneRef.current.add(newModel);
    modelRef.current = newModel;
    setCurrentModelType(detectedModel);

  }, [isInitialized, detectedModel, currentModelType]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;

    let rotationSpeed = 0.005;
    let scale = 1;
    let targetScale = 1;
    let glowIntensity = 0.15;
    let colorHue = 0.55; // cyan

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Determine color based on state
      let targetColor = new THREE.Color(0x00d4ff); // cyan
      
      if (alertMode) {
        targetColor = new THREE.Color(0xff0000);
        rotationSpeed = 0.03;
        targetScale = 1.3 + Math.sin(time * 10) * 0.2;
        glowIntensity = 0.4 + Math.sin(time * 15) * 0.3;
      } else if (isSpeaking) {
        targetColor = new THREE.Color(0x00ff88);
        rotationSpeed = 0.025;
        targetScale = 1.15 + Math.sin(time * 8) * 0.1;
        glowIntensity = 0.3 + Math.sin(time * 6) * 0.15;
      } else if (isListening) {
        targetColor = new THREE.Color(0xff6600);
        rotationSpeed = 0.02;
        targetScale = 1.1 + Math.sin(time * 5) * 0.15;
        glowIntensity = 0.25;
      } else if (isActive) {
        targetColor = new THREE.Color(0x00d4ff);
        rotationSpeed = 0.015;
        targetScale = 1.05 + Math.sin(time * 3) * 0.05;
        glowIntensity = 0.2;
      } else {
        rotationSpeed = 0.005;
        targetScale = 1 + Math.sin(time * 2) * 0.03;
        glowIntensity = 0.15 + Math.sin(time * 2) * 0.05;
      }

      if (modelRef.current) {
        // Smooth scale
        scale += (targetScale - scale) * 0.1;
        modelRef.current.scale.setScalar(scale);

        // Rotate
        modelRef.current.rotation.y += rotationSpeed;
        modelRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;

        // Update color for all meshes in the model
        modelRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.lerp(targetColor, 0.1);
          }
        });
      }

      if (glowRef.current) {
        glowRef.current.material.opacity = glowIntensity;
        glowRef.current.material.color.lerp(targetColor, 0.1);
        glowRef.current.scale.setScalar(scale * 1.2);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isInitialized, isActive, isSpeaking, isListening, alertMode]);

  return (
    <div className="relative flex items-center justify-center">
      <div 
        ref={containerRef} 
        className="w-[300px] h-[300px]"
        style={{
          filter: `drop-shadow(0 0 ${alertMode ? '30px rgba(255, 0, 0, 0.7)' : '20px rgba(0, 212, 255, 0.5)'})`
        }}
      />
      
      {/* Model label */}
      {currentModelType !== 'default' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <div className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded text-xs font-mono text-cyan-400 uppercase">
            {currentModelType}
          </div>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-all
          ${alertMode ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' :
            isSpeaking ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
            isListening ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
            isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
            'bg-gray-500/20 text-gray-400 border border-gray-500/50'}`}
        >
          {alertMode ? 'ALERT' : isSpeaking ? 'Speaking' : isListening ? 'Listening' : isActive ? 'Processing' : 'Standby'}
        </div>
      </div>
    </div>
  );
}
