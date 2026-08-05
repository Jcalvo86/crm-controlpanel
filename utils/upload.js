import { genUploader } from "uploadthing/client";

const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
const uploadThingUploader = genUploader({
  url: isLocalhost 
    ? "https://www.suenotravel.cl/api/uploadthing" 
    : "/api/uploadthing"
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
  // Read active runtime config (which contains the active provider and its credentials)
  const config = window.DataSourceConfig ? window.DataSourceConfig.getConfig() : window.CRM_CONFIG;

  if (!config) {
    throw new Error("No se pudo cargar la configuración de base de datos.");
  }

  // 1. FIREBASE PROVIDER
  if (config.provider === 'firebase' && config.firebase) {
    try {
      const { apiKey, projectId } = config.firebase;
      if (!apiKey || !projectId) {
        throw new Error("Falta la configuración de Firebase (apiKey o projectId) en la base de datos.");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const bucketName = `${projectId}.appspot.com`;
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?name=${encodeURIComponent(fileName)}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Firebase Storage respondió con error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const downloadToken = data.downloadTokens;
      
      // Public download URL
      return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media${downloadToken ? `&token=${downloadToken}` : ''}`;
    } catch (firebaseError) {
      console.warn("Firebase upload failed, trying fallback to UploadThing:", firebaseError);
      throw new Error(
        `No se pudo subir la imagen a Firebase Storage: ${firebaseError.message}.\n\n` +
        `Asegúrate de que las reglas de Firebase Storage permiten escrituras públicas para desarrollo, ` +
        `o de configurar correctamente tu Firebase Storage.`
      );
    }
  }

  // 2. SUPABASE PROVIDER
  if (config.provider === 'supabase' && config.supabase && config.supabase.url && config.supabase.anonKey) {
    try {
      const cleanUrl = config.supabase.url.replace(/\/$/, '');
      const bucketName = 'images';
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      
      const uploadUrl = `${cleanUrl}/storage/v1/object/${bucketName}/${fileName}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': config.supabase.anonKey,
          'Authorization': `Bearer ${config.supabase.anonKey}`,
          'Content-Type': file.type
        },
        body: file
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase Storage respondió con error ${response.status}: ${errText}`);
      }
      
      return `${cleanUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
    } catch (supabaseError) {
      console.warn("Supabase upload failed, trying fallback to UploadThing:", supabaseError);
      throw new Error(
        `No se pudo subir la imagen a Supabase Storage: ${supabaseError.message}.\n\n` +
        `Asegúrate de haber creado un bucket llamado 'images' en tu panel de Supabase y que esté marcado como 'Public'.`
      );
    }
  }

  // 3. FALLBACK TO UPLOADTHING (localStorage or other providers)
  const res = await uploadThingUploader.uploadFiles("imageUploader", {
    files: [file]
  });
  if (res && res[0]) {
    return res[0].url;
  }
  throw new Error("No response from UploadThing");
}
