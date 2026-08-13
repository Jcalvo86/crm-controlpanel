import { genUploader } from "uploadthing/client";

const uploadThingUploader = genUploader({
  url: "/api/uploadthing"
});

/**
 * Uploads a file. 
 * - If provider is Firebase, uploads to Firebase Storage.
 * - If provider is Supabase, uploads to Supabase Storage bucket 'images'.
 * - Otherwise, falls back to UploadThing.
 * 
 * @param {File} file 
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export async function uploadFile(file) {
  return uploadFileWithProgress(file);
}

/**
 * Uploads a file with progress reporting.
 * - If provider is Firebase, uploads to Firebase Storage via XMLHttpRequest.
 * - If provider is Supabase, uploads to Supabase Storage bucket 'images' via XMLHttpRequest.
 * - Otherwise, falls back to UploadThing with simulated progress.
 * 
 * @param {File} file 
 * @param {Function} [onProgress] Callback function receiving { loaded, total }
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export function uploadFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    // Read active runtime config (which contains the active provider and its credentials)
    const config = window.DataSourceConfig ? window.DataSourceConfig.getConfig() : window.CRM_CONFIG;

    if (!config) {
      return reject(new Error("No se pudo cargar la configuración de base de datos."));
    }

    // Read storage provider from config. Defaults to 'uploadthing'.
    const storageProvider = config.storageProvider || 'uploadthing';

    // 1. FIREBASE PROVIDER
    if (storageProvider === 'firebase' && config.firebase) {
      try {
        const { apiKey, projectId } = config.firebase;
        if (!apiKey || !projectId) {
          return reject(new Error("Falta la configuración de Firebase (apiKey o projectId) en la base de datos."));
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const bucketName = `${projectId}.appspot.com`;
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?name=${encodeURIComponent(fileName)}`;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              onProgress({ loaded: e.loaded, total: e.total });
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const downloadToken = data.downloadTokens;
              resolve(`https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media${downloadToken ? `&token=${downloadToken}` : ''}`);
            } catch (err) {
              reject(new Error("Error al procesar la respuesta de Firebase Storage."));
            }
          } else {
            reject(new Error(`Firebase Storage respondió con error ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Error de red al subir a Firebase Storage."));
        };

        xhr.send(file);
        return;
      } catch (firebaseError) {
        console.warn("Firebase upload failed, trying fallback to UploadThing:", firebaseError);
      }
    }

    // 2. SUPABASE PROVIDER
    if (storageProvider === 'supabase' && config.supabase && config.supabase.url && config.supabase.anonKey) {
      try {
        const cleanUrl = config.supabase.url.replace(/\/$/, '');
        const bucketName = 'images';
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const uploadUrl = `${cleanUrl}/storage/v1/object/${bucketName}/${fileName}`;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('apikey', config.supabase.anonKey);
        xhr.setRequestHeader('Authorization', `Bearer ${config.supabase.anonKey}`);
        xhr.setRequestHeader('Content-Type', file.type);

        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              onProgress({ loaded: e.loaded, total: e.total });
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(`${cleanUrl}/storage/v1/object/public/${bucketName}/${fileName}`);
          } else {
            reject(new Error(`Supabase Storage respondió con error ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Error de red al subir a Supabase Storage."));
        };

        xhr.send(file);
        return;
      } catch (supabaseError) {
        console.warn("Supabase upload failed, trying fallback to UploadThing:", supabaseError);
      }
    }

    // 3. FALLBACK TO UPLOADTHING (localStorage or other providers)
    let simulatedInterval;
    if (onProgress) {
      let progress = 0;
      simulatedInterval = setInterval(() => {
        progress += (100 - progress) * 0.1;
        if (progress > 95) progress = 95;
        onProgress({ loaded: Math.round((progress / 100) * file.size), total: file.size });
      }, 250);
    }

    uploadThingUploader.uploadFiles("imageUploader", {
      files: [file]
    }).then(res => {
      if (simulatedInterval) clearInterval(simulatedInterval);
      if (onProgress) onProgress({ loaded: file.size, total: file.size });
      if (res && res[0]) {
        resolve(res[0].url);
      } else {
        reject(new Error("No response from UploadThing"));
      }
    }).catch(err => {
      if (simulatedInterval) clearInterval(simulatedInterval);
      reject(err);
    });
  });
}
