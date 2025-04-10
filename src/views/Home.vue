<template>
  <div class="viewer-container">
    <!-- Główny kontener dla modelu 3D -->
    <div id="viewer"></div>

    <!-- Panel boczny z listą modeli -->
    <div class="side-panel">
      <div class="models-list">
        <h2>Dostępne modele</h2>
        <ul>
          <li v-for="model in models" :key="model.id" @click="loadModel(model)">
            {{ model.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const models = ref([]);
let scene, camera, renderer, currentModel;

onMounted(() => {
  initThreeJS();
  loadModelsList();
});

const initThreeJS = () => {
  // Inicjalizacja sceny
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Inicjalizacja kamery
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Inicjalizacja renderera
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('viewer').appendChild(renderer.domElement);

  // Dodanie światła
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Dodanie ambient light
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Animacja
  const animate = () => {
    requestAnimationFrame(animate);
    if (currentModel) {
      currentModel.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
  };
  animate();

  // Obsługa zmiany rozmiaru okna
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

const loadModelsList = async () => {
  try {
    const response = await fetch('/models/list.json');
    models.value = await response.json();
  } catch (error) {
    console.error('Błąd podczas ładowania listy modeli:', error);
  }
};

const loadModel = (model) => {
  const loader = new GLTFLoader();
  loader.load(
    `/models/${model.path}`,
    (gltf) => {
      if (currentModel) {
        scene.remove(currentModel);
      }
      currentModel = gltf.scene;
      scene.add(currentModel);
    },
    undefined,
    (error) => {
      console.error('Błąd podczas ładowania modelu:', error);
    }
  );
};
</script>

<style scoped>
.viewer-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

#viewer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: white;
  padding: 20px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

.models-list {
  height: 100%;
  overflow-y: auto;
}

.models-list h2 {
  margin-bottom: 20px;
  color: #333;
}

.models-list ul {
  list-style: none;
  padding: 0;
}

.models-list li {
  padding: 10px;
  margin-bottom: 5px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.models-list li:hover {
  background: #e0e0e0;
}
</style>
