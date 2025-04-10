<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Model Management</h2>
      <button
        @click="showUploadModal = true"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Upload New Model
      </button>
    </div>

    <!-- Model List -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Size
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Modified
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="model in models" :key="model.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ model.name }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ model.size }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ model.lastModified }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="previewModel(model)"
                class="text-blue-600 hover:text-blue-900 mr-4"
              >
                Preview
              </button>
              <button
                @click="deleteModel(model)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Upload Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
      >
        <div class="mt-3 text-center">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Upload New Model
          </h3>
          <div class="mt-2 px-7 py-3">
            <div class="mt-4">
              <input
                type="file"
                @change="handleFileUpload"
                accept=".gltf,.glb"
                class="hidden"
                ref="fileInput"
              />
              <button
                @click="$refs.fileInput.click()"
                class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Select File
              </button>
            </div>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="showUploadModal = false"
              class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const models = ref([]);
const showUploadModal = ref(false);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Tutaj będzie logika uploadu pliku
    console.log('Selected file:', file);
  }
};

const previewModel = (model) => {
  // Tutaj będzie logika podglądu modelu
  console.log('Preview model:', model);
};

const deleteModel = (model) => {
  // Tutaj będzie logika usuwania modelu
  console.log('Delete model:', model);
};
</script>
