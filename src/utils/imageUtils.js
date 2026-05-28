import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

/**
 * Convierte un objeto File a una cadena Base64.
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

/**
 * Comprime una imagen y la prepara para el envío.
 * @param {File} originalFile 
 * @param {string} questionId 
 * @param {number} index 
 * @returns {Promise<Object>} Object containing filename, content (base64) and mimeType.
 */
export const compressAndPrepareImage = async (originalFile, questionId, index) => {
  let fileToProcess = originalFile;

  // Check if the file is HEIC/HEIF and convert it to JPEG
  const isHeic = originalFile.type === 'image/heic' || 
                 originalFile.type === 'image/heif' || 
                 originalFile.name.toLowerCase().endsWith('.heic') || 
                 originalFile.name.toLowerCase().endsWith('.heif');
                 
  if (isHeic) {
    try {
      const conversionResult = await heic2any({
        blob: originalFile,
        toType: 'image/jpeg',
        quality: 0.8
      });
      const blobToUse = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
      const newFilename = originalFile.name.replace(/\.heic$|\.heif$/i, '.jpg');
      fileToProcess = new File([blobToUse], newFilename, { type: 'image/jpeg' });
    } catch (err) {
      console.error("Error convirtiendo imagen HEIC/HEIF:", err);
      throw new Error("No se pudo procesar la imagen HEIC. Intente con otro formato.");
    }
  }

  const options = { 
    maxSizeMB: 0.05, 
    maxWidthOrHeight: 500, 
    useWebWorker: true 
  };

  try {
    const compressedFile = await imageCompression(fileToProcess, options);
    const base64String = await fileToBase64(compressedFile);

    return {
      question_code: questionId,
      filename: `evidencia_${questionId}_${index}.jpg`,
      content: base64String.split(',')[1],
      mimeType: compressedFile.type
    };
  } catch (err) {
    console.error("Error comprimiendo imagen:", err);
    throw err;
  }
};
