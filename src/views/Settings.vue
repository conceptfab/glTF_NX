<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

    <div class="space-y-6">
      <!-- Render Settings -->
      <div class="border-b border-gray-200 pb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Render Settings</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Quality</label
            >
            <select
              v-model="settings.quality"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Background Color</label
            >
            <input
              type="color"
              v-model="settings.backgroundColor"
              class="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      <!-- Model Settings -->
      <div class="border-b border-gray-200 pb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Model Settings</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Default Scale</label
            >
            <input
              type="number"
              v-model="settings.defaultScale"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Auto-center Models</label
            >
            <input
              type="checkbox"
              v-model="settings.autoCenter"
              class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <!-- Validation Settings -->
      <div class="border-b border-gray-200 pb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Validation Settings
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Validate on Upload</label
            >
            <input
              type="checkbox"
              v-model="settings.validateOnUpload"
              class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Maximum File Size (MB)</label
            >
            <input
              type="number"
              v-model="settings.maxFileSize"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="saveSettings"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const settings = ref({
  quality: 'medium',
  backgroundColor: '#ffffff',
  defaultScale: 1,
  autoCenter: true,
  validateOnUpload: true,
  maxFileSize: 50,
});

const saveSettings = () => {
  // Tutaj będzie logika zapisywania ustawień
  console.log('Saving settings:', settings.value);
};
</script>
