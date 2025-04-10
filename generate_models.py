import json
import os
from pathlib import Path

import pygltflib
import trimesh
from pygltflib import GLTF2


def get_model_info(gltf_file):
    """Pobiera informacje o modelu GLTF/GLB."""
    try:
        # Wczytanie modelu używając pygltflib
        gltf = GLTF2().load(gltf_file)

        # Inicjalizacja liczników
        total_triangles = 0
        total_vertices = 0

        # Analiza wszystkich meshów
        for mesh in gltf.meshes:
            for primitive in mesh.primitives:
                # Liczenie wierzchołków
                if primitive.attributes.POSITION is not None:
                    accessor = gltf.accessors[primitive.attributes.POSITION]
                    total_vertices += accessor.count

                # Liczenie trójkątów
                if primitive.indices is not None:
                    accessor = gltf.accessors[primitive.indices]
                    total_triangles += accessor.count // 3
                else:
                    # Jeśli nie ma indeksów, zakładamy że każdy wierzchołek jest częścią trójkąta
                    total_triangles += accessor.count // 3

        # Obliczenie całkowitego rozmiaru plików
        total_size_bytes = 0

        # Dodanie rozmiaru głównego pliku
        total_size_bytes += os.path.getsize(gltf_file)

        # Dodanie rozmiaru plików binarnych
        if gltf.buffers:
            for buffer in gltf.buffers:
                if buffer.uri:
                    bin_path = gltf_file.parent / buffer.uri
                    if bin_path.exists():
                        total_size_bytes += os.path.getsize(bin_path)

        # Dodanie rozmiaru tekstur
        if gltf.images:
            for image in gltf.images:
                if image.uri:
                    texture_path = gltf_file.parent / image.uri
                    if texture_path.exists():
                        total_size_bytes += os.path.getsize(texture_path)

        # Konwersja na MB
        file_size_mb = total_size_bytes / (1024 * 1024)

        # Próba uzyskania bounding box z trimesh jako zapasowa opcja
        try:
            mesh = trimesh.load(gltf_file)
            bounds = mesh.bounds
            size = bounds[1] - bounds[0]
            bounds_data = {
                "min": bounds[0].tolist(),
                "max": bounds[1].tolist(),
                "size": size.tolist(),
            }
        except Exception:
            bounds_data = {
                "min": [0, 0, 0],
                "max": [0, 0, 0],
                "size": [0, 0, 0],
            }

        return {
            "triangles": total_triangles,
            "vertices": total_vertices,
            "file_size_mb": round(file_size_mb, 2),
            "bounds": bounds_data,
        }
    except Exception as e:
        print(f"❌ Błąd podczas odczytywania informacji o modelu {gltf_file.name}: {e}")
        return None


def normalize_path(path):
    """Konwertuje ścieżkę do formatu URL (zawsze używając slashów)"""
    return str(path).replace(os.sep, "/")


def generate_config(gltf_file):
    """Generuje plik konfiguracyjny dla modelu GLTF"""
    # Tworzenie katalogu dla modelu jeśli nie istnieje
    model_dir = gltf_file.parent
    if not model_dir.exists():
        model_dir.mkdir(parents=True)

    # Sprawdzenie czy plik config.json już istnieje
    config_path = model_dir / "config.json"
    if config_path.exists():
        print(f"Plik konfiguracyjny już istnieje dla {gltf_file.name}")
        return

    # Pobranie informacji o modelu
    model_info = get_model_info(gltf_file)

    # Tworzenie domyślnej konfiguracji
    config = {
        "center": {"x": True, "y": True, "z": True},
        "position": {
            "method": "floor",  # Możliwe wartości: "floor", "center", "topEdge"
            "value": 0,
            "yOffset": 0,
        },
        "scale": {
            "method": "fixed",
            "fixedScale": 1,
        },
        "rotation": {
            "x": 0,  # Obrót wokół osi X w stopniach
            "y": 0,  # Obrót wokół osi Y w stopniach
            "z": 0,  # Obrót wokół osi Z w stopniach
        },
        "model_info": model_info if model_info else {},
    }

    # Zapisanie konfiguracji do pliku
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4)

    print(f"✅ Wygenerowano nową konfigurację dla {gltf_file.name}")


def process_models_directory(base_dir="models"):
    """Przetwarza wszystkie modele GLTF w katalogu models."""
    base_path = Path(base_dir)

    # Sprawdź czy katalog models istnieje
    if not base_path.exists():
        print(f"❌ Katalog {base_dir} nie istnieje!")
        return

    print(f"🔍 Skanowanie katalogu {base_dir}...")

    # Znajdź wszystkie pliki .gltf i .glb
    model_files = list(base_path.rglob("*.gltf")) + list(base_path.rglob("*.glb"))

    if not model_files:
        print("⚠️ Nie znaleziono żadnych plików .gltf lub .glb!")
        return

    print(f"✅ Znaleziono {len(model_files)} modeli")

    for model_file in model_files:
        model_dir = model_file.parent
        print(f"\n🔄 Przetwarzanie modelu: {model_file.name}")

        # Utwórz katalog dla modelu jeśli nie istnieje
        model_dir.mkdir(parents=True, exist_ok=True)

        # Wygeneruj config dla modelu
        generate_config(model_file)


def generate_index():
    """Generuje plik index.json zawierający informacje o wszystkich modelach."""
    models_dir = Path("models")
    index_data = []

    # Przejście przez wszystkie foldery w katalogu models
    for folder in models_dir.iterdir():
        if not folder.is_dir():
            continue

        print(f"🔍 Przetwarzanie folderu: {folder.name}")

        model_data = {
            "name": folder.name,
            "gltf_files": [],
            "config_path": None,
            "model_info": {},
        }

        # Wyszukiwanie plików GLTF i GLB
        for ext in ["*.gltf", "*.glb"]:
            for file in folder.glob(ext):
                # Konwertuj ścieżkę do formatu URL
                rel_path = normalize_path(file.relative_to(models_dir))
                model_data["gltf_files"].append(rel_path)

                # Pobranie informacji o modelu
                model_info = get_model_info(file)
                if model_info:
                    model_data["model_info"] = model_info

                print(f"  ✅ Znaleziono plik: {rel_path}")
                print(
                    f"  📊 Trójkąty: {model_info['triangles'] if model_info else 'N/A'}"
                )
                print(
                    f"  📊 Rozmiar pliku: {model_info['file_size_mb'] if model_info else 'N/A'} MB"
                )

        # Sprawdzanie istnienia config.json
        config_path = folder / "config.json"
        if config_path.exists():
            # Konwertuj ścieżkę do formatu URL
            rel_config = normalize_path(config_path.relative_to(models_dir))
            model_data["config_path"] = rel_config
            print(f"  ✅ Znaleziono config.json: {rel_config}")

        # Walidacja danych
        if not model_data["gltf_files"]:
            print(f"  ⚠️ Brak plików GLTF/GLB w folderze {folder.name}")
            continue

        index_data.append(model_data)
        print("  ✅ Dodano model do index.json")

    # Zapisanie danych do pliku index.json w folderze models
    try:
        with open(models_dir / "index.json", "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)
        print("\n✅ Plik index.json został wygenerowany pomyślnie.")
    except Exception as e:
        print(f"\n❌ Błąd podczas zapisywania pliku index.json: {e}")


def main():
    """Główna funkcja programu."""
    print("🔄 Generator konfiguracji i indeksu modeli 3D")
    print("--------------------------------------------")

    try:
        # Generowanie konfiguracji
        process_models_directory()
        print("\n✅ Zakończono generowanie konfiguracji.")

        # Generowanie indeksu
        print("\n🔄 Generowanie indeksu...")
        generate_index()
        print("\n✅ Zakończono generowanie indeksu.")

    except Exception as e:
        print(f"\n❌ Wystąpił błąd: {e}")


if __name__ == "__main__":
    main()
