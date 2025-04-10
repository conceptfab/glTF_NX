<template>
  <div class="min-h-screen bg-gray-100">
    <header class="sr-only">
      <h1>CONCEPTFAB glTF Viewer</h1>
    </header>

    <main>
      <div
        id="container"
        role="main"
        aria-label="Obszar wyświetlania modelu 3D"
      ></div>
    </main>

    <button id="togglePanel" class="toggle-panel">
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>

    <aside class="models-panel translate-x-full" aria-label="Panel kontrolny">
      <section class="models-section" aria-labelledby="models-heading">
        <h2 id="models-heading">CONCEPTFAB glTF VIEWER</h2>
        <div
          class="models-list"
          id="modelsList"
          role="list"
          aria-label="Lista dostępnych modeli"
        >
          <!-- Lista modeli będzie generowana dynamicznie -->
        </div>
        <button
          class="hide-panel-btn"
          id="hidePanelBtn"
          aria-label="Ukryj panel boczny"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 5l7 7-7 7"
            />
          </svg>
        </button>
      </section>
    </aside>

    <button
      id="toggleControls"
      class="toggle-controls"
      aria-label="Pokaż/ukryj pasek kontrolny"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <nav class="controls-panel" aria-label="Panel kontrolny">
      <router-link to="/settings" class="settings-link">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </router-link>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script setup>
// Tutaj będzie logika komponentu
</script>

<style>
/* Tutaj będą style */
</style>
