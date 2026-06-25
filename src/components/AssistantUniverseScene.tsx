"use client";

import { useEffect, useRef } from "react";
import type { AssistantBranch } from "@/lib/assistantExperience";

const planetColors: Record<string, number> = {
  cfo: 0x22c55e,
  investment: 0xf59e0b,
  client: 0x38bdf8,
  content: 0xa78bfa,
  business: 0xfb7185,
  product: 0x60a5fa,
  safety: 0x94a3b8
};

export function AssistantUniverseScene({
  branches,
  activeId,
  onSelect
}: {
  branches: AssistantBranch[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(activeId);
  const selectRef = useRef(onSelect);

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    const mount = mountRef.current;
    if (!mount) return;

    async function boot() {
      const THREE = await import("three");
      if (disposed || !mountRef.current) return;

      const container = mountRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050816);

      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(0, 4.2, 9.6);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.setAttribute("aria-label", "Mark AI Assistant 3D 助理宇宙圖");
      renderer.domElement.setAttribute("role", "img");
      container.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambient);
      const point = new THREE.PointLight(0xffffff, 2.4, 60);
      point.position.set(0, 4, 6);
      scene.add(point);

      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 48, 48),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x14b8a6, emissiveIntensity: 0.45, roughness: 0.35 })
      );
      center.name = "Mark AI Assistant";
      scene.add(center);

      const ringMaterial = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.72 });
      const planetMeshes: Array<{ id: string; mesh: import("three").Mesh; orbit: number; speed: number; offset: number }> = [];

      branches.forEach((branch, index) => {
        const orbit = 2.05 + index * 0.38;
        const points = [];
        for (let i = 0; i <= 96; i += 1) {
          const angle = (i / 96) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * orbit, 0, Math.sin(angle) * orbit));
        }
        const orbitLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ringMaterial);
        orbitLine.rotation.x = Math.PI * 0.06;
        scene.add(orbitLine);

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.24 + (index % 3) * 0.035, 32, 32),
          new THREE.MeshStandardMaterial({
            color: planetColors[branch.id] ?? 0x60a5fa,
            emissive: planetColors[branch.id] ?? 0x60a5fa,
            emissiveIntensity: 0.2,
            roughness: 0.42,
            metalness: 0.08
          })
        );
        mesh.userData.branchId = branch.id;
        mesh.userData.title = branch.title;
        scene.add(mesh);
        planetMeshes.push({ id: branch.id, mesh, orbit, speed: 0.11 + index * 0.014, offset: index * 0.86 });
      });

      const stars = new THREE.BufferGeometry();
      const starPositions = new Float32Array(420 * 3);
      for (let i = 0; i < 420; i += 1) {
        starPositions[i * 3] = (Math.random() - 0.5) * 22;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 22;
      }
      stars.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xdbeafe, size: 0.026 })));

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      function resize() {
        if (!container) return;
        const width = container.clientWidth;
        const height = Math.max(360, Math.min(620, Math.round(width * 0.62)));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function pick(event: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(planetMeshes.map((item) => item.mesh))[0];
        if (hit?.object.userData.branchId) selectRef.current(String(hit.object.userData.branchId));
      }

      resize();
      window.addEventListener("resize", resize);
      renderer.domElement.addEventListener("pointerdown", pick);

      const clock = new THREE.Clock();
      function animate() {
        if (disposed) return;
        const elapsed = clock.getElapsedTime();
        center.rotation.y += 0.006;
        planetMeshes.forEach((item) => {
          const angle = elapsed * item.speed + item.offset;
          item.mesh.position.set(Math.cos(angle) * item.orbit, Math.sin(angle * 0.72) * 0.36, Math.sin(angle) * item.orbit);
          item.mesh.rotation.y += 0.016;
          const selected = item.id === activeRef.current;
          item.mesh.scale.setScalar(selected ? 1.55 : 1);
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      animate();

      return () => {
        window.removeEventListener("resize", resize);
        renderer.domElement.removeEventListener("pointerdown", pick);
        renderer.dispose();
        scene.traverse((object) => {
          const mesh = object as import("three").Mesh;
          mesh.geometry?.dispose?.();
          const material = mesh.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose?.();
        });
        renderer.domElement.remove();
      };
    }

    let cleanup: (() => void) | undefined;
    boot().then((result) => { cleanup = result; });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [branches]);

  return <div className="assistant-universe-scene" ref={mountRef} />;
}
