# Funkcjonalności do przeniesienia z projektu przykładowego

## Podstawowe funkcje renderowania

- [ ] Inicjalizacja sceny Three.js
- [ ] Konfiguracja renderera
- [ ] Obsługa kamery i kontrolek OrbitControls
- [ ] Responsywność (dostosowanie do rozmiaru okna)
- [ ] System statystyk wydajności

## System zarządzania scenami

- [ ] Ładowanie konfiguracji scen z plików JSON
- [ ] Przełączanie między różnymi scenami
- [ ] Dynamiczne ładowanie listy dostępnych scen
- [ ] Konfiguracja tła sceny
- [ ] System zarządzania materiałami (np. podłoga)

## System oświetlenia

- [ ] Konfiguracja świateł z plików JSON
- [ ] Wizualizacja pozycji świateł (sfery)
- [ ] Dynamiczne dodawanie/usuwanie świateł
- [ ] Konfiguracja cieni dla świateł kierunkowych
- [ ] Kontrolki do zarządzania światłami

## Zarządzanie modelami 3D

- [ ] Ładowanie modeli GLTF
- [ ] System konfiguracji modeli
- [ ] Lista dostępnych modeli
- [ ] Dynamiczne przełączanie między modelami
- [ ] Obliczanie i wyświetlanie bounding box

## Interfejs użytkownika

- [ ] Panel boczny z listą modeli
- [ ] Przyciski widoków kamery (Przód, Tył, Góra)
- [ ] Przycisk pokazywania/ukrywania świateł
- [ ] Przycisk pokazywania/ukrywania osi
- [ ] Przycisk pokazywania/ukrywania bounding box
- [ ] Przycisk pokazywania/ukrywania statystyk
- [ ] Chowany panel boczny
- [ ] Animacje przejść i interakcji (Framer Motion)
- [ ] Responsywny design z Tailwind CSS
- [ ] Ciemny/jasny motyw
- [ ] Animowane przejścia między widokami
- [ ] Płynne animacje paneli i przycisków

## System osi

- [ ] Tworzenie i wyświetlanie osi XYZ
- [ ] Etykiety dla osi
- [ ] Możliwość pokazywania/ukrywania osi

## Dodatkowe funkcje

- [ ] System konfiguracji przez pliki JSON
- [ ] Obsługa różnych typów świateł
- [ ] Responsywny design interfejsu z Tailwind CSS
- [ ] Optymalizacja wydajności
- [ ] Obsługa cieni
- [ ] Animacje interfejsu z Framer Motion

## Struktura plików

- [ ] Organizacja katalogów (models, scenes, tex)
- [ ] System konfiguracji (config.json)
- [ ] Skrypty pomocnicze (generate_config.py, generate_index.py)

## Uwagi do implementacji

1. Projekt wykorzystuje Three.js w wersji r132
2. Wykorzystuje Tailwind CSS do stylowania i Framer Motion do animacji
3. Wymaga implementacji systemu ładowania konfiguracji
4. Potrzebne wsparcie dla formatów GLTF
5. Wymagana obsługa WebGL
6. Implementacja płynnych animacji interfejsu
7. Dostosowanie motywu kolorystycznego
