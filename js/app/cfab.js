// RES 0.5  NG
// ESLINT !

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { ViewportGizmo } from 'three-viewport-gizmo';

// Konfiguracja
let CONFIG = {
  titleProject: '',
  infoProject: '',
  versionProject: '',
};

// Inicjalizacja zmiennych
let container, stats, controls, gizmo;
let camera, scene, renderer;
let currentModel = null;
let lights = {};
let lightSpheres = {};
let lightHelpers = {}; // Nowa zmienna dla pomocników świateł

// Zmienne dla UI
let isControlBarVisible = true;
let lastMouseY = 0;
let mouseTimer = null;
let isSidePanelVisible = true;
let axis; // Zmienna dla grupy osi

// Stan aplikacji
let isLightingVisible = false;
let isAxisVisible = false;
let isBoundingBoxVisible = false;
let isStatsVisible = false;
let isFloorVisible = true;
let boundingBoxHelper = null;
let currentCameraConfig = null;
let floor = null;

// Funkcja do chowania/pokazywania paska kontrolnego
function toggleControlBar(show) {
  const controlBar = document.querySelector('.bottom-controls');
  if (!controlBar) return;

  if (show) {
    controlBar.classList.remove('translate-y-full', 'opacity-0');
    controlBar.classList.add('translate-y-0', 'opacity-100');
  } else {
    controlBar.classList.remove('translate-y-0', 'opacity-100');
    controlBar.classList.add('translate-y-full', 'opacity-0');
  }
  isControlBarVisible = show;
}

// Funkcja do aktualizacji stanu panelu i przycisku
function updatePanelState() {
  const panel = document.querySelector('.models-panel');
  const toggleBtn = document.querySelector('.toggle-panel');
  if (!panel || !toggleBtn) return;

  // Sprawdzamy czy panel jest widoczny
  const isPanelVisible = !panel.classList.contains('translate-x-full');

  // Aktualizujemy stan przycisku
  if (isPanelVisible) {
    toggleBtn.classList.add('hidden');
  } else {
    toggleBtn.classList.remove('hidden');
  }
}

// Funkcja do chowania/pokazywania panelu bocznego
function toggleSidePanel() {
  const panel = document.querySelector('.models-panel');
  const toggleBtn = document.querySelector('.toggle-panel');
  if (!panel || !toggleBtn) return;

  isSidePanelVisible = !isSidePanelVisible;

  if (isSidePanelVisible) {
    panel.classList.remove('translate-x-full');
    toggleBtn.classList.add('hidden');
  } else {
    panel.classList.add('translate-x-full');
    toggleBtn.classList.remove('hidden');
  }
}

// Obsługa ruchu myszki
function handleMouseMove(event) {
  const mouseY = event.clientY;
  const windowHeight = window.innerHeight;

  // Pokaż pasek jeśli mysz jest blisko dołu ekranu
  if (mouseY > windowHeight - 100) {
    toggleControlBar(true);
  }

  // Resetuj timer przy każdym ruchu
  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(() => {
    // Schowaj pasek jeśli mysz nie jest blisko dołu
    if (mouseY < windowHeight - 100) {
      toggleControlBar(false);
    }
  }, 2000); // 2 sekundy opóźnienia
}

// Funkcja do przełączania kamery
function switchCamera(cameraName) {
  if (!currentCameraConfig || !currentCameraConfig.cameras[cameraName]) return;

  const cameraConfig = currentCameraConfig.cameras[cameraName];

  // Aktualizacja parametrów kamery
  camera.fov = cameraConfig.fov;
  camera.near = cameraConfig.near;
  camera.far = cameraConfig.far;
  camera.position.set(
    cameraConfig.position.x,
    cameraConfig.position.y,
    cameraConfig.position.z
  );
  camera.updateProjectionMatrix();

  // Aktualizacja kontrolek
  controls.target.set(
    cameraConfig.target.x,
    cameraConfig.target.y,
    cameraConfig.target.z
  );
  controls.update();

  // Aktualizacja UI - usunięcie klasy active ze wszystkich przycisków kamer
  document.querySelectorAll('.camera-btn').forEach((btn) => {
    btn.classList.remove('active');
  });
  // Dodanie klasy active do aktywnego przycisku
  const activeBtn = document.querySelector(`[data-camera="${cameraName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Inicjalizacja UI
function initializeUI() {
  // Dodaj obsługę ruchu myszki
  document.addEventListener('mousemove', handleMouseMove);

  // Dodaj obsługę przycisku toggle dla panelu bocznego
  const toggleBtn = document.getElementById('togglePanel');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidePanel);
  }

  // Dodaj obsługę przycisku pokazywania/ukrywania osi
  const showAxisBtn = document.getElementById('showAxis');
  if (showAxisBtn) {
    showAxisBtn.addEventListener('click', () => {
      isAxisVisible = !isAxisVisible;
      axis.visible = isAxisVisible;
      showAxisBtn.classList.toggle('active');
      showAxisBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        ${isAxisVisible ? 'Ukryj osie' : 'Pokaż osie'}
      `;
    });
  }

  // Dodaj obsługę przycisku pokazywania/ukrywania statystyk
  const showStatsBtn = document.getElementById('showStats');
  if (showStatsBtn) {
    showStatsBtn.addEventListener('click', () => {
      isStatsVisible = !isStatsVisible;
      stats.dom.style.display = isStatsVisible ? 'block' : 'none';
      showStatsBtn.classList.toggle('active');
      showStatsBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        ${isStatsVisible ? 'Ukryj statystyki' : 'Pokaż statystyki'}
      `;
    });
  }

  // Dodaj obsługę przycisku pokazywania/ukrywania bounding boxa
  const showBoundingBoxBtn = document.getElementById('showBoundingBox');
  if (showBoundingBoxBtn) {
    showBoundingBoxBtn.addEventListener('click', () => {
      isBoundingBoxVisible = !isBoundingBoxVisible;
      updateBoundingBox();
      showBoundingBoxBtn.classList.toggle('active');
      showBoundingBoxBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
        ${isBoundingBoxVisible ? 'Ukryj bounding box' : 'Pokaż bounding box'}
      `;
    });
  }

  // Dodaj obsługę przycisku pokazywania/ukrywania podłogi
  const showFloorBtn = document.getElementById('showFloor');
  if (showFloorBtn) {
    showFloorBtn.addEventListener('click', () => {
      isFloorVisible = !isFloorVisible;
      floor.visible = isFloorVisible;
      showFloorBtn.classList.toggle('active');
      showFloorBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M4 5h16a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
        ${isFloorVisible ? 'Ukryj podłogę' : 'Pokaż podłogę'}
      `;
    });
  }

  // Dodanie obsługi przycisków kamer
  document.querySelectorAll('.camera-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cameraName = btn.dataset.camera;
      if (cameraName) {
        switchCamera(cameraName);
      }
    });
  });

  // Dodaj obsługę przycisku pokazywania/ukrywania świateł
  const showLightsBtn = document.getElementById('showLights');
  if (showLightsBtn) {
    showLightsBtn.addEventListener('click', () => {
      isLightingVisible = !isLightingVisible;
      // Aktualizacja widoczności pomocników świateł
      Object.values(lightHelpers).forEach((helper) => {
        helper.visible = isLightingVisible;
      });
      showLightsBtn.classList.toggle('active');
      showLightsBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        ${isLightingVisible ? 'Ukryj światła' : 'Pokaż światła'}
      `;
    });
  }

  // Schowaj pasek po 2 sekundach od startu
  setTimeout(() => {
    toggleControlBar(false);
  }, 2000);
}

// Funkcja wczytująca konfigurację sceny
async function loadSceneConfig() {
  try {
    const response = await fetch('scenes/default.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const sceneConfig = await response.json();
    return sceneConfig;
  } catch (error) {
    console.error('Błąd wczytywania konfiguracji sceny:', error);
    // Zwracamy domyślną konfigurację w przypadku błędu
    return {
      camera: {
        fov: 45,
        near: 0.25,
        far: 2000,
        position: { x: 50, y: 25, z: 50 },
        target: { x: 0, y: 0, z: 0 },
      },
      background: {
        color: 0x848484,
      },
      axis: {
        length: 5,
        visible: false,
      },
      grid: {
        size: 125,
        divisions: 25,
        visible: false,
      },
      renderer: {
        antialias: true,
        pixelRatio: 'device',
        outputColorSpace: 'srgb',
      },
      floor: {
        size: 125,
        segments: 128,
        texture: {
          file: 'opacity_floor.jpg',
          repeat: 1,
        },
        material: {
          color: 0x404040,
          metalness: 0.2,
          roughness: 0.8,
          envMapIntensity: 0.5,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          opacity: 0.95,
          reflectivity: 0.5,
          transmission: 0.0,
          thickness: 0.5,
        },
        visible: true,
      },
    };
  }
}

// Modyfikacja funkcji init()
async function init() {
  try {
    // Wczytanie konfiguracji sceny
    const sceneConfig = await loadSceneConfig();
    currentCameraConfig = sceneConfig; // Zapisanie konfiguracji do zmiennej globalnej

    // Sprawdzenie WebGL
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      const message =
        'Twoja przeglądarka nie obsługuje WebGL. Zobacz https://get.webgl.org/';
      const element = document.createElement('div');
      element.style.fontFamily = 'monospace';
      element.style.fontSize = '13px';
      element.style.textAlign = 'center';
      element.style.background = '#fff';
      element.style.color = '#000';
      element.style.padding = '1.5em';
      element.style.width = '400px';
      element.style.margin = '5em auto 0';
      element.innerHTML = message;
      document.body.appendChild(element);
      throw new Error('WebGL nie jest dostępny');
    }

    container = document.createElement('div');
    document.body.appendChild(container);

    // Inicjalizacja kamery z konfiguracją domyślną
    camera = new THREE.PerspectiveCamera(
      sceneConfig.cameras.default.fov,
      window.innerWidth / window.innerHeight,
      sceneConfig.cameras.default.near,
      sceneConfig.cameras.default.far
    );
    camera.position.set(
      sceneConfig.cameras.default.position.x,
      sceneConfig.cameras.default.position.y,
      sceneConfig.cameras.default.position.z
    );

    // Inicjalizacja sceny
    scene = new THREE.Scene();

    // Wczytywanie świateł ze sceny
    if (sceneConfig.lights && Array.isArray(sceneConfig.lights)) {
      sceneConfig.lights.forEach((lightConfig) => {
        let light;

        // Tworzenie światła odpowiedniego typu
        if (lightConfig.type === 'DirectionalLight') {
          light = new THREE.DirectionalLight(
            lightConfig.color,
            lightConfig.intensity
          );
          light.position.set(
            lightConfig.position.x,
            lightConfig.position.y,
            lightConfig.position.z
          );

          // Konfiguracja cieni
          if (lightConfig.castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = lightConfig.shadow.mapSize.width;
            light.shadow.mapSize.height = lightConfig.shadow.mapSize.height;
            light.shadow.camera.left = lightConfig.shadow.camera.left;
            light.shadow.camera.right = lightConfig.shadow.camera.right;
            light.shadow.camera.top = lightConfig.shadow.camera.top;
            light.shadow.camera.bottom = lightConfig.shadow.camera.bottom;
            light.shadow.camera.near = lightConfig.shadow.camera.near;
            light.shadow.camera.far = lightConfig.shadow.camera.far;
            light.shadow.radius = lightConfig.shadow.radius;
            light.shadow.bias = lightConfig.shadow.bias;
            light.shadow.blurSamples = lightConfig.shadow.blurSamples;
          }

          // Dodaj światło do kolekcji
          lights[lightConfig.name] = light;

          // Tworzenie pomocnika światła
          const helper = new THREE.DirectionalLightHelper(
            light,
            lightConfig.helper?.size || 5
          );
          helper.visible = false; // Domyślnie ukryty
          scene.add(helper);
          lightHelpers[lightConfig.name] = helper;
        }

        if (light) {
          light.name = lightConfig.name;
          scene.add(light);
        }
      });
    }

    // Inicjalizacja renderera
    renderer = new THREE.WebGLRenderer({
      antialias: sceneConfig.renderer.antialias,
      logarithmicDepthBuffer: sceneConfig.renderer.logarithmicDepthBuffer,
      precision: sceneConfig.renderer.precision,
      powerPreference: sceneConfig.renderer.powerPreference,
      stencil: sceneConfig.renderer.stencil,
    });

    // Ustawienia renderera
    renderer.setPixelRatio(
      sceneConfig.renderer.pixelRatio === 'device'
        ? window.devicePixelRatio
        : sceneConfig.renderer.pixelRatio
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace =
      sceneConfig.renderer.outputColorSpace === 'srgb'
        ? THREE.SRGBColorSpace
        : THREE.LinearSRGBColorSpace;

    // Ustawienia cieni
    if (sceneConfig.renderer.shadowMap.enabled) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE[sceneConfig.renderer.shadowMap.type];
    }

    // Ustawienia tone mappingu
    if (sceneConfig.renderer.toneMapping.enabled) {
      renderer.toneMapping = THREE[sceneConfig.renderer.toneMapping.type];
      renderer.toneMappingExposure = sceneConfig.renderer.toneMapping.exposure;
    }

    // Ustawienia fizycznego oświetlenia
    renderer.physicallyCorrectLights =
      sceneConfig.renderer.physicallyCorrectLights;

    container.appendChild(renderer.domElement);

    // Inicjalizacja kontrolek
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(
      sceneConfig.cameras.default.target.x,
      sceneConfig.cameras.default.target.y,
      sceneConfig.cameras.default.target.z
    );
    controls.update();

    // Inicjalizacja ViewportGizmo
    gizmo = new ViewportGizmo(camera, renderer);
    gizmo.attachControls(controls);

    // Ustawiamy pozycję gizmo po załadowaniu
    if (gizmo && gizmo.domElement) {
      const gizmoElement = gizmo.domElement;
      gizmoElement.style.position = 'fixed';
      gizmoElement.style.right = isSidePanelVisible ? '288px' : '16px';
      gizmoElement.style.top = '16px';
      gizmoElement.style.zIndex = '9999';
      gizmoElement.style.transition =
        'right 0.3s ease-in-out, opacity 0.3s ease-in-out';
      gizmoElement.style.opacity = '0';
      // Pokazujemy gizmo po krótkim opóźnieniu
      setTimeout(() => {
        gizmoElement.style.opacity = '1';
      }, 300);
    }

    // Dodanie podłogi
    const floorGeometry = new THREE.CircleGeometry(
      sceneConfig.floor.size / 2,
      sceneConfig.floor.segments
    );
    const floorTexture = new THREE.TextureLoader().load(
      `textures/${sceneConfig.floor.texture.file}`
    );
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;
    floorTexture.repeat.set(
      sceneConfig.floor.texture.repeat,
      sceneConfig.floor.texture.repeat
    );
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    floorTexture.minFilter =
      sceneConfig.floor.texture.filter === 'linear'
        ? THREE.LinearFilter
        : THREE.NearestFilter;
    floorTexture.magFilter =
      sceneConfig.floor.texture.filter === 'linear'
        ? THREE.LinearFilter
        : THREE.NearestFilter;

    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: sceneConfig.floor.material.color,
      metalness: sceneConfig.floor.material.metalness,
      roughness: sceneConfig.floor.material.roughness,
      envMapIntensity: sceneConfig.floor.material.envMapIntensity,
      clearcoat: sceneConfig.floor.material.clearcoat,
      clearcoatRoughness: sceneConfig.floor.material.clearcoatRoughness,
      side: THREE.FrontSide,
      transparent: true,
      map: floorTexture,
      alphaMap: floorTexture,
      opacity: sceneConfig.floor.material.opacity,
      reflectivity: sceneConfig.floor.material.reflectivity,
      transmission: sceneConfig.floor.material.transmission,
      thickness: sceneConfig.floor.material.thickness,
    });

    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    floor.visible = sceneConfig.floor.visible;
    isFloorVisible = sceneConfig.floor.visible;
    scene.add(floor);

    // Dodanie siatki referencyjnej
    const gridHelper = new THREE.GridHelper(
      sceneConfig.grid.size,
      sceneConfig.grid.divisions,
      0x808080,
      0x404040
    );
    gridHelper.position.y = 0;
    gridHelper.visible = sceneConfig.grid.visible;
    gridHelper.rotation.x = -Math.PI / 2;
    scene.add(gridHelper);

    // Dodanie obsługi zmiany rozmiaru okna
    window.addEventListener('resize', onWindowResize, false);

    // Inicjalizacja statystyk
    stats = new Stats();
    stats.dom.style.display = 'none'; // Domyślnie ukryte
    container.appendChild(stats.dom);

    // Ładowanie tekstur środowiskowych
    if (sceneConfig.environment.enabled) {
      const loader = new THREE.CubeTextureLoader().setPath(
        sceneConfig.environment.path
      );
      loader.load(
        sceneConfig.environment.files,
        function (texture) {
          const envMap = texture;
          envMap.colorSpace =
            sceneConfig.environment.colorSpace === 'srgb'
              ? THREE.SRGBColorSpace
              : THREE.LinearSRGBColorSpace;
          scene.background = new THREE.Color(sceneConfig.background.color);
          scene.environment = envMap;
        },
        undefined,
        function (error) {
          console.error('Błąd ładowania tekstur środowiskowych:', error);
        }
      );
    }

    // Inicjalizacja osi z konfiguracją
    createAxis(sceneConfig.axis.length);
    axis.visible = sceneConfig.axis.visible;

    // Ustawienie początkowego stanu oświetlenia
    // isLightingVisible = sceneConfig.lighting.visible; // Zawsze false na starcie

    // Aktualizacja widoczności wizualizacji świateł
    // Object.values(lightSpheres).forEach((sphere) => {
    //   if (sphere) sphere.visible = isLightingVisible;
    // });

    // Aktualizacja przycisku oświetlenia
    const showLightsBtn = document.getElementById('showLights');
    if (showLightsBtn) {
      showLightsBtn.classList.toggle('active', isLightingVisible);
      showLightsBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        ${isLightingVisible ? 'Ukryj światła' : 'Pokaż światła'}
      `;
    }
  } catch (error) {
    console.error('Błąd inicjalizacji:', error);
    throw error;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  gizmo.update();
}

function animate() {
  try {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    stats.update();

    // Renderowanie ViewportGizmo
    gizmo.render();

    // Aktualizuj bounding box jeśli jest widoczny
    if (isBoundingBoxVisible && currentModel) {
      updateBoundingBox();
    }
  } catch (error) {
    console.error('Błąd animacji:', error);
  }
}

// Funkcja do wczytywania listy modeli
async function loadModelsList() {
  try {
    const response = await fetch('models/index.json');
    const models = await response.json();
    const modelsList = document.getElementById('modelsList');
    modelsList.innerHTML = '';

    models.forEach((model) => {
      const modelItem = document.createElement('div');
      modelItem.className = 'model-item';
      modelItem.innerHTML = `
        <div>
          <div class="model-item-name">${model.name}</div>
          <div class="model-item-info">
            ${
              model.model_info
                ? `GLTF • ${model.model_info.triangles} trójkątów • ${model.model_info.file_size_mb}MB`
                : 'GLTF • Brak informacji'
            }
          </div>
        </div>
        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      `;

      modelItem.addEventListener('click', () => loadModel(model));
      modelsList.appendChild(modelItem);
    });
  } catch (error) {
    console.error('Błąd podczas wczytywania listy modeli:', error);
  }
}

// Funkcja do ładowania modelu
async function loadModel(model) {
  if (!model.gltf_files || model.gltf_files.length === 0) {
    console.error('Brak plików GLTF dla modelu:', model.name);
    return;
  }

  try {
    // Usunięcie poprzedniego modelu
    if (currentModel) {
      scene.remove(currentModel);
    }

    // Wczytanie konfiguracji
    let config = {};
    if (model.config_path) {
      try {
        const configResponse = await fetch(`models/${model.config_path}`);
        if (!configResponse.ok) {
          throw new Error(`HTTP error! status: ${configResponse.status}`);
        }
        config = await configResponse.json();
      } catch (error) {
        console.warn(
          `Nie udało się wczytać konfiguracji dla modelu ${model.name}:`,
          error
        );
        // Używamy domyślnej konfiguracji
        config = {
          center: { x: true, y: false, z: true },
          position: { method: 'floor', value: 0, yOffset: 0 },
          scale: { method: 'fixed', fixedScale: 1 },
          rotation: { x: 0, y: 0, z: 0 },
        };
      }
    }

    // Wczytanie modelu
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(`models/${model.gltf_files[0]}`);
    currentModel = gltf.scene;

    // Konfiguracja cieni dla modelu
    currentModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Najpierw zastosuj skalowanie, jeśli jest zdefiniowane
    if (config.scale && config.scale.method === 'fixed') {
      currentModel.scale.setScalar(config.scale.fixedScale);
    }

    // Oblicz bounding box po przeskalowaniu
    const box = new THREE.Box3().setFromObject(currentModel);
    const center = box.getCenter(new THREE.Vector3());

    // Resetuj pozycję modelu
    currentModel.position.set(0, 0, 0);

    // Najpierw ustaw model tak, aby jego dolna płaszczyzna była na Y=0
    currentModel.position.y = -box.min.y;

    // Następnie wycentruj na osiach X i Z jeśli potrzeba
    if (config.center) {
      if (config.center.x) currentModel.position.x = -center.x;
      if (config.center.z) currentModel.position.z = -center.z;
    }

    // Zastosuj dodatkowe pozycjonowanie Y z konfiguracji
    if (config.position) {
      const position = config.position;
      if (position.method === 'floor') {
        // Dodaj tylko offset, bo model jest już na poziomie 0
        currentModel.position.y += position.value + position.yOffset;
      } else if (position.method === 'topEdge') {
        // Oblicz nową pozycję Y względem górnej krawędzi
        const height = box.max.y - box.min.y;
        currentModel.position.y = position.value - height;
      }
    }

    // Zastosuj rotację
    if (config.rotation) {
      currentModel.rotation.set(
        THREE.MathUtils.degToRad(config.rotation.x),
        THREE.MathUtils.degToRad(config.rotation.y),
        THREE.MathUtils.degToRad(config.rotation.z)
      );
    }

    scene.add(currentModel);

    // Aktualizacja bounding boxa po wszystkich transformacjach
    updateBoundingBox();

    // Aktualizacja UI
    document.querySelectorAll('.model-item').forEach((item) => {
      item.classList.remove('active');
    });
    const clickedItem = Array.from(
      document.querySelectorAll('.model-item')
    ).find(
      (item) =>
        item.querySelector('.model-item-name').textContent === model.name
    );
    if (clickedItem) {
      clickedItem.classList.add('active');
    }

    // Po załadowaniu modelu, ukryj panel boczny
    const modelsPanel = document.querySelector('.models-panel');
    const togglePanel = document.getElementById('togglePanel');
    if (modelsPanel && togglePanel) {
      modelsPanel.classList.add('translate-x-full');
      togglePanel.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Błąd podczas wczytywania modelu:', error);
  }
}

// Inicjalizacja aplikacji
async function initialize() {
  try {
    // Inicjalizacja podstawowych komponentów
    await init();

    // Inicjalizacja UI
    initializeUI();

    // Wczytanie konfiguracji i listy modeli
    try {
      await Promise.all([
        loadModelsList().catch((error) => {
          console.warn('Błąd wczytywania listy modeli:', error);
          // Kontynuuj bez listy modeli
        }),
      ]);
    } catch (error) {
      console.warn('Błąd podczas wczytywania danych:', error);
      // Kontynuuj działanie aplikacji
    }

    // Rozpoczęcie pętli renderowania
    animate();
  } catch (error) {
    console.error('Krytyczny błąd inicjalizacji aplikacji:', error);
    // Wyświetl informację o błędzie dla użytkownika
    const errorContainer = document.createElement('div');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '50%';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translate(-50%, -50%)';
    errorContainer.style.background = '#ff5555';
    errorContainer.style.color = 'white';
    errorContainer.style.padding = '20px';
    errorContainer.style.borderRadius = '5px';
    errorContainer.style.zIndex = '9999';
    errorContainer.innerHTML = `
      <h3>Błąd inicjalizacji aplikacji</h3>
      <p>Przepraszamy, wystąpił błąd podczas uruchamiania aplikacji.</p>
      <p>Szczegóły: ${error.message}</p>
    `;
    document.body.appendChild(errorContainer);
  }
}

// Uruchomienie aplikacji
initialize();

// Funkcja tworząca etykietę osi
function createAxisLabel(
  text,
  color,
  position,
  rotation = { x: 0, y: 0, z: 0 }
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;

  context.font = 'Bold 24px Arial';
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.position.copy(position);
  sprite.scale.set(1, 1, 1);
  sprite.rotation.set(rotation.x, rotation.y, rotation.z);

  return sprite;
}

// Modyfikacja funkcji createAxis()
function createAxis(length = 5) {
  // Tworzymy grupę dla osi i etykiet
  axis = new THREE.Group();
  axis.visible = false; // Domyślnie ukryte

  // Dodajemy osie
  const axesHelper = new THREE.AxesHelper(length);
  axis.add(axesHelper);

  // Dodajemy etykiety
  const labelOffset = length * 0.1; // Offset proporcjonalny do długości osi

  // Etykieta X (czerwona)
  const labelX = createAxisLabel(
    'X',
    '#ff0000',
    new THREE.Vector3(length + labelOffset, 0, 0)
  );
  axis.add(labelX);

  // Etykieta Y (zielona)
  const labelY = createAxisLabel(
    'Y',
    '#00ff00',
    new THREE.Vector3(0, length + labelOffset, 0)
  );
  axis.add(labelY);

  // Etykieta Z (niebieska)
  const labelZ = createAxisLabel(
    'Z',
    '#0000ff',
    new THREE.Vector3(0, 0, length + labelOffset)
  );
  axis.add(labelZ);

  scene.add(axis);
  return axis;
}

// Funkcja aktualizująca bounding box
function updateBoundingBox() {
  // Usuń poprzedni bounding box jeśli istnieje
  if (boundingBoxHelper) {
    scene.remove(boundingBoxHelper);
    boundingBoxHelper = null;
  }

  // Jeśli nie ma modelu lub bounding box jest wyłączony, zakończ
  if (!currentModel || !isBoundingBoxVisible) {
    return;
  }

  // Stwórz nowy bounding box
  const box = new THREE.Box3().setFromObject(currentModel);
  boundingBoxHelper = new THREE.Box3Helper(box, 0xffff00);
  scene.add(boundingBoxHelper);
}

function createLightSpheres() {
  // Usuwamy istniejące wizualizacje
  Object.values(lightSpheres).forEach((visualization) => {
    if (visualization.parent) visualization.parent.remove(visualization);
  });
  lightSpheres = {};

  // Jeśli światła są wyłączone, nie tworzymy wizualizacji
  if (!isLightingVisible) return;

  // Tworzymy nowe wizualizacje dla każdego światła
  Object.entries(lights).forEach(([key, light]) => {
    if (light instanceof THREE.DirectionalLight) {
      // Tworzymy stożek wireframe
      const coneGeometry = new THREE.ConeGeometry(2.5, 5, 32);
      const coneMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(light.color),
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);

      // Ustawiamy pozycję i orientację stożka
      cone.position.copy(light.position);

      // Obracamy stożek tak, aby podstawa była skierowana w stronę celu światła
      const target = new THREE.Vector3(0, 0, 0);
      cone.lookAt(target);
      cone.rotateX(-Math.PI / 2); // Obracamy o -90 stopni, aby podstawa była skierowana w dół

      scene.add(cone);
      lightSpheres[key] = cone;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggleControls = document.getElementById('toggleControls');
  const bottomControls = document.querySelector('.bottom-controls');

  toggleControls.addEventListener('click', () => {
    toggleControls.classList.toggle('active');
    bottomControls.classList.toggle('visible');
  });

  const togglePanel = document.getElementById('togglePanel');
  const modelsPanel = document.querySelector('.models-panel');
  const modelsList = document.getElementById('modelsList');

  if (togglePanel) {
    togglePanel.addEventListener('click', toggleSidePanel);
  }

  // Obsługa wyboru modelu
  if (modelsList) {
    modelsList.addEventListener('click', (event) => {
      const modelButton = event.target.closest('.model-button');
      if (modelButton) {
        if (modelsPanel) {
          modelsPanel.classList.add('translate-x-full');
        }
        if (togglePanel) {
          togglePanel.classList.remove('hidden');
        }
      }
    });
  }
});
