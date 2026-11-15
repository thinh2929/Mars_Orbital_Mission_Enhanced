'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Mars3DViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Mars3DView: React.FC<Mars3DViewProps> = ({ className, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velocityX = 0.0025; // Continuous default auto-rotation speed
    let velocityY = 0;

    // 1. Scene setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.appendChild(renderer.domElement);

    // 2. Cinematic Space Lighting
    // Ambient light - deep space dark tone
    const ambientLight = new THREE.AmbientLight(0x2a1714, 0.65);
    scene.add(ambientLight);

    // Primary Sun Light - strong directional light from the left/front
    const sunLight = new THREE.DirectionalLight(0xfff1e0, 3.2);
    sunLight.position.set(-4, 2.5, 3);
    scene.add(sunLight);

    // Rim light - reddish/orange atmospheric rim backlighting
    const rimLight = new THREE.DirectionalLight(0xe85d34, 1.8);
    rimLight.position.set(3, -1.5, -2);
    scene.add(rimLight);

    // Secondary fill light
    const fillLight = new THREE.PointLight(0xb84b2c, 0.9, 10);
    fillLight.position.set(2, 3, 2);
    scene.add(fillLight);

    // 3. Mars Group with Mars axial tilt (25.19°)
    const marsGroup = new THREE.Group();
    marsGroup.rotation.z = -THREE.MathUtils.degToRad(25.19);
    marsGroup.rotation.x = THREE.MathUtils.degToRad(8);
    scene.add(marsGroup);

    // 4. Load NASA mars.glb model
    const loader = new GLTFLoader();
    let marsMesh: THREE.Object3D | null = null;

    loader.load(
      '/assets/nasa_planets/mars.glb',
      (gltf) => {
        const model = gltf.scene;

        // Compute bounding box and normalize scale to fit nicely inside window
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.75 / maxDim;

        model.position.sub(center);
        model.scale.setScalar(scale);

        // Enhance materials
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.max(0.65, mat.roughness || 0.85);
              mat.metalness = Math.min(0.15, mat.metalness || 0.05);
            }
          }
        });

        marsMesh = model;
        marsGroup.add(model);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Failed to load mars.glb, using high-res procedural sphere fallback', err);
        // Fallback procedural textured Mars sphere
        const textureLoader = new THREE.TextureLoader();
        const marsTex = textureLoader.load('/assets/nasa_planets/mars_texture.jpg');
        const geo = new THREE.SphereGeometry(0.88, 64, 64);
        const mat = new THREE.MeshStandardMaterial({
          map: marsTex,
          roughness: 0.85,
          metalness: 0.05,
        });
        const sphere = new THREE.Mesh(geo, mat);
        marsMesh = sphere;
        marsGroup.add(sphere);
        setLoading(false);
      }
    );

    // 5. Interactive Mouse/Touch drag handling
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      velocityX = dx * 0.003;
      velocityY = dy * 0.002;

      marsGroup.rotation.y += velocityX;
      marsGroup.rotation.x = Math.max(-0.6, Math.min(0.6, marsGroup.rotation.x + velocityY));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseX;
      const dy = e.touches[0].clientY - prevMouseY;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;

      velocityX = dx * 0.003;
      velocityY = dy * 0.002;

      marsGroup.rotation.y += velocityX;
      marsGroup.rotation.x = Math.max(-0.6, Math.min(0.6, marsGroup.rotation.x + velocityY));
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const el = renderer.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 6. Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 7. Animation Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Auto rotation with inertia damping
      if (!isDragging) {
        // Return velocity smoothly towards steady idle rotation speed
        velocityX += (0.0022 - velocityX) * 0.04;
        velocityY *= 0.95;
      }

      marsGroup.rotation.y += velocityX;
      marsGroup.rotation.x += velocityY;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (marsMesh) {
        marsMesh.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.geometry?.dispose();
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose());
            } else if (m.material) {
              m.material.dispose();
            }
          }
        });
      }

      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a7b8c4',
            fontSize: 10,
            letterSpacing: '0.15em',
            pointerEvents: 'none',
          }}
        >
          LOADING NASA 3D MESH...
        </div>
      )}
    </div>
  );
};
