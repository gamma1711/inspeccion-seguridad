import imageCompression from 'browser-image-compression';

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
  const options = { 
    maxSizeMB: 0.05, 
    maxWidthOrHeight: 500, 
    useWebWorker: true 
  };

  try {
    const compressedFile = await imageCompression(originalFile, options);
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
