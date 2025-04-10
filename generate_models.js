import { Document } from '@gltf-transform/core';
import {
  readFileSync,
  statSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getModelInfo(gltfPath) {
  try {
    // Wczytanie pliku GLTF
    const gltfData = JSON.parse(readFileSync(gltfPath, 'utf-8'));

    // Wczytanie pliku binarnego
    const binPath = join(dirname(gltfPath), gltfData.buffers[0].uri);
    const binData = readFileSync(binPath);

    // Inicjalizacja liczników
    let totalTriangles = 0;
    let totalVertices = 0;

    // Analiza wszystkich meshów
    if (gltfData.meshes) {
      for (const mesh of gltfData.meshes) {
        for (const primitive of mesh.primitives) {
          // Liczenie wierzchołków
          if (primitive.attributes.POSITION !== undefined) {
            const accessor = gltfData.accessors[primitive.attributes.POSITION];
            totalVertices += accessor.count;
          }

          // Liczenie trójkątów
          if (primitive.indices !== undefined) {
            const accessor = gltfData.accessors[primitive.indices];
            const bufferView = gltfData.bufferViews[accessor.bufferView];
            const byteOffset = bufferView.byteOffset || 0;
            const byteLength = bufferView.byteLength;
            const componentType = accessor.componentType;
            const count = accessor.count;

            // Odczytanie danych indeksów z pliku binarnego
            const indicesData = binData.slice(
              byteOffset,
              byteOffset + byteLength
            );
            totalTriangles += count / 3;
          } else {
            // Jeśli nie ma indeksów, zakładamy że każdy wierzchołek jest częścią trójkąta
            const accessor = gltfData.accessors[primitive.attributes.POSITION];
            totalTriangles += accessor.count / 3;
          }
        }
      }
    }

    // Obliczenie całkowitego rozmiaru plików
    let totalSizeBytes = 0;

    // Dodanie rozmiaru głównego pliku
    totalSizeBytes += statSync(gltfPath).size;

    // Dodanie rozmiaru plików binarnych
    if (gltfData.buffers) {
      for (const buffer of gltfData.buffers) {
        if (buffer.uri) {
          const binPath = join(dirname(gltfPath), buffer.uri);
          // Sprawdź, czy plik istnieje przed pobraniem jego rozmiaru
          if (existsSync(binPath)) {
            totalSizeBytes += statSync(binPath).size;
          } else {
            console.warn(
              `  ⚠️ Plik binarny ${binPath} nie istnieje, pomijanie w obliczeniach rozmiaru.`
            );
          }
        }
      }
    }

    // Dodanie rozmiaru tekstur
    if (gltfData.images) {
      for (const image of gltfData.images) {
        if (image.uri) {
          const texturePath = join(dirname(gltfPath), image.uri);
          // Sprawdź, czy plik istnieje przed pobraniem jego rozmiaru
          if (existsSync(texturePath)) {
            totalSizeBytes += statSync(texturePath).size;
          } else {
            console.warn(
              `  ⚠️ Plik tekstury ${texturePath} nie istnieje, pomijanie w obliczeniach rozmiaru.`
            );
          }
        }
      }
    }

    // Konwersja na MB
    const fileSizeMB = totalSizeBytes / (1024 * 1024);

    // Pobranie bounding box (uproszczona wersja)
    const bounds = {
      min: [0, 0, 0],
      max: [0, 0, 0],
      size: [0, 0, 0],
    };

    return {
      triangles: Math.floor(totalTriangles),
      vertices: totalVertices,
      file_size_mb: Math.round(fileSizeMB * 100) / 100,
      bounds: bounds,
    };
  } catch (error) {
    console.error(
      `❌ Błąd podczas odczytywania informacji o modelu ${gltfPath}: ${error.message}`
    );
    return null;
  }
}

function normalizePath(path) {
  // Konwertuje ścieżkę do formatu URL (zawsze używając slashów)
  return path.replace(/\\/g, '/');
}

async function generateConfig(gltfPath) {
  try {
    // Tworzenie katalogu dla modelu jeśli nie istnieje
    const modelDir = dirname(gltfPath);
    try {
      mkdirSync(modelDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Sprawdzenie czy plik config.json już istnieje
    const configPath = join(modelDir, 'config.json');
    try {
      writeFileSync(configPath, '', { flag: 'wx' });
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(`Plik konfiguracyjny już istnieje dla ${gltfPath}`);
        return;
      }
      throw error;
    }

    // Pobranie informacji o modelu
    const modelInfo = await getModelInfo(gltfPath);

    // Tworzenie domyślnej konfiguracji
    const config = {
      center: { x: true, y: true, z: true },
      position: {
        method: 'floor', // Możliwe wartości: "floor", "center", "topEdge"
        value: 0,
        yOffset: 0,
      },
      scale: {
        method: 'fixed',
        fixedScale: 1,
      },
      rotation: {
        x: 0, // Obrót wokół osi X w stopniach
        y: 0, // Obrót wokół osi Y w stopniach
        z: 0, // Obrót wokół osi Z w stopniach
      },
      model_info: modelInfo || {},
    };

    // Zapisanie konfiguracji do pliku
    writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
    console.log(`✅ Wygenerowano nową konfigurację dla ${gltfPath}`);
  } catch (error) {
    console.error(
      `❌ Błąd podczas generowania konfiguracji dla ${gltfPath}: ${error.message}`
    );
  }
}

async function processModelsDirectory(baseDir = 'models') {
  try {
    // Sprawdź czy katalog models istnieje
    if (!statSync(baseDir)) {
      console.error(`❌ Katalog ${baseDir} nie istnieje!`);
      return;
    }

    console.log(`🔍 Skanowanie katalogu ${baseDir}...`);

    // Znajdź wszystkie pliki .gltf i .glb
    const modelFiles = [];
    const findModelFiles = (dir) => {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = join(dir, file.name);
        if (file.isDirectory()) {
          findModelFiles(fullPath);
        } else if (file.name.endsWith('.gltf') || file.name.endsWith('.glb')) {
          modelFiles.push(fullPath);
        }
      }
    };

    findModelFiles(baseDir);

    if (modelFiles.length === 0) {
      console.log('⚠️ Nie znaleziono żadnych plików .gltf lub .glb!');
      return;
    }

    console.log(`✅ Znaleziono ${modelFiles.length} modeli`);

    for (const modelFile of modelFiles) {
      console.log(`\n🔄 Przetwarzanie modelu: ${modelFile}`);
      await generateConfig(modelFile);
    }
  } catch (error) {
    console.error(
      `❌ Błąd podczas przetwarzania katalogu ${baseDir}: ${error.message}`
    );
  }
}

// Funkcja do generowania hasha na podstawie ścieżki folderu i plików
function generateModelHash(folderName, files) {
  const hashInput = folderName + JSON.stringify(files.sort());
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

async function generateIndex(onlyNew = false) {
  try {
    const modelsDir = 'models';
    const indexData = [];
    let existingModels = [];
    // Lista rozszerzeń plików do sumowania rozmiaru
    const sizeExtensions = [
      '.gltf',
      '.glb',
      '.bin',
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.bmp',
      '.gif',
      '.tiff',
    ];

    // Wczytaj istniejący index.json jeśli istnieje
    const indexPath = join(modelsDir, 'index.json');
    if (existsSync(indexPath)) {
      try {
        existingModels = JSON.parse(readFileSync(indexPath, 'utf-8'));
      } catch (error) {
        console.warn(
          '⚠️ Nie udało się wczytać istniejącego index.json:',
          error.message
        );
      }
    }

    // Przejście przez wszystkie foldery w katalogu models
    const folders = readdirSync(modelsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const folder of folders) {
      console.log(`🔍 Przetwarzanie folderu: ${folder}`);

      // Zbierz wszystkie pliki w folderze do generacji hasha
      const allFiles = [];
      ['gltf', 'glb'].forEach((ext) => {
        const files = readdirSync(join(modelsDir, folder)).filter((file) =>
          file.endsWith(`.${ext}`)
        );
        allFiles.push(...files);
      });

      // Wygeneruj unikalny hash dla modelu
      const modelHash = generateModelHash(folder, allFiles);

      // Jeśli generujemy tylko nowe modele, sprawdź czy model już istnieje
      if (onlyNew) {
        const existingModel = existingModels.find(
          (m) => m.model_hash === modelHash
        );
        if (existingModel) {
          console.log(`  ⏭️ Pomijanie istniejącego modelu: ${folder}`);
          indexData.push(existingModel); // Dodaj istniejący model z poprzedniego indeksu
          continue;
        }
      }

      let totalFolderSizeBytes = 0;
      let modelFiles = [];
      const currentModelPath = join(modelsDir, folder);

      try {
        const filesInFolder = readdirSync(currentModelPath);
        for (const file of filesInFolder) {
          const filePath = join(currentModelPath, file);
          const fileExt = '.' + file.split('.').pop().toLowerCase();

          // Sprawdź, czy plik ma rozszerzenie do zsumowania rozmiaru
          if (sizeExtensions.includes(fileExt)) {
            try {
              totalFolderSizeBytes += statSync(filePath).size;
            } catch (statError) {
              console.warn(
                `  ⚠️ Nie można odczytać rozmiaru pliku ${filePath}: ${statError.message}`
              );
            }
          }

          // Zbierz pliki .gltf/.glb do listy
          if (['.gltf', '.glb'].includes(fileExt)) {
            const relPath = normalizePath(join(folder, file));
            modelFiles.push(relPath);
            console.log(`  ✅ Znaleziono plik modelu: ${relPath}`);
          }
        }
      } catch (readDirError) {
        console.error(
          `❌ Błąd podczas odczytu folderu ${currentModelPath}: ${readDirError.message}`
        );
        continue; // Przejdź do następnego folderu w razie błędu
      }

      // Oblicz rozmiar w MB
      const fileSizeMB =
        Math.round((totalFolderSizeBytes / (1024 * 1024)) * 100) / 100;

      console.log(`  📊 Całkowity rozmiar plików: ${fileSizeMB} MB`);

      const modelData = {
        name: folder,
        model_hash: modelHash,
        gltf_files: modelFiles,
        config_path: null, // Zostanie ustawione poniżej, jeśli istnieje
        model_info: {
          file_size_mb: fileSizeMB, // Zapisz obliczony rozmiar
          // Można tu opcjonalnie dodać trójkąty/wierzchołki, jeśli potrzebne
          // np. pobierając info z pierwszego pliku .gltf/.glb
        },
      };

      // Sprawdzanie istnienia config.json
      const configPath = join(modelsDir, folder, 'config.json');
      try {
        // Używamy statSync w try-catch, aby obsłużyć brak pliku
        if (existsSync(configPath) && statSync(configPath).isFile()) {
          const relConfig = normalizePath(join(folder, 'config.json'));
          modelData.config_path = relConfig;
          console.log(`  ✅ Znaleziono config.json: ${relConfig}`);
        }
      } catch (configStatError) {
        // Ignoruj błąd, jeśli config.json nie istnieje lub jest niedostępny
        console.warn(
          `  ⚠️ Nie można sprawdzić statusu config.json w ${folder}: ${configStatError.message}`
        );
      }

      // Walidacja danych (sprawdzenie, czy znaleziono pliki modelu)
      if (modelData.gltf_files.length === 0) {
        console.log(`  ⚠️ Brak plików GLTF/GLB w folderze ${folder}`);
        continue;
      }

      indexData.push(modelData);
      console.log(`  ✅ Dodano model do index.json (Hash: ${modelHash})`);
    }

    // Zapisanie danych do pliku index.json w folderze models
    writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log('\n✅ Plik index.json został wygenerowany pomyślnie.');

    // Wymuszenie odświeżenia strony
    const reloadScript = `
      <script>
        if (window.location.href.includes('index.html')) {
          window.location.reload();
        }
      </script>
    `;
    writeFileSync(
      'index.html',
      readFileSync('index.html', 'utf-8').replace(
        '</body>',
        `${reloadScript}</body>`
      ),
      'utf-8'
    );
  } catch (error) {
    console.error(`❌ Błąd podczas generowania indeksu: ${error.message}`);
  }
}

async function main() {
  console.log('🔄 Generator konfiguracji i indeksu modeli 3D');
  console.log('--------------------------------------------');

  // Parsowanie argumentów wiersza poleceń
  const args = process.argv.slice(2);
  const onlyNew = args.includes('--only-new');

  try {
    // Generowanie konfiguracji
    await processModelsDirectory();
    console.log('\n✅ Zakończono generowanie konfiguracji.');

    // Generowanie indeksu
    console.log('\n🔄 Generowanie indeksu...');
    console.log(
      onlyNew ? '📝 Tryb: tylko nowe modele' : '📝 Tryb: wszystkie modele'
    );
    await generateIndex(onlyNew);
    console.log('\n✅ Zakończono generowanie indeksu.');
  } catch (error) {
    console.error(`\n❌ Wystąpił błąd: ${error.message}`);
  }
}

// Uruchomienie głównej funkcji
main();
