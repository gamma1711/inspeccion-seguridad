// src/components/ImageUploader.jsx
import React, { useState, useEffect } from 'react';
import { compressAndPrepareImage } from '../utils/imageUtils';

export default function ImageUploader({ questionId, onFilesChange, initialFiles = [] }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isCompressing, setIsCompressing] = useState(false);

    // Sincronizar con archivos iniciales (cuando se recupera un borrador)
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            setSelectedFiles(initialFiles);
            // Ya no generamos URLs locales porque initialFiles ya vienen como objetos comprimidos
            // con la estructura { content, mimeType, filename, question_code }
        }
    }, [initialFiles]);

    // Maneja la selección de nuevos archivos
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsCompressing(true);

        try {
            const compressedNewFiles = [];
            // Comprimir cada archivo seleccionado
            for (let i = 0; i < files.length; i++) {
                // Generamos un índice único para evitar colisiones si se suben múltiples a la vez
                const uniqueIndex = `${Date.now()}_${i}`;
                const compressed = await compressAndPrepareImage(files[i], questionId, uniqueIndex);
                compressedNewFiles.push(compressed);
            }

            const newFiles = [...selectedFiles, ...compressedNewFiles];
            setSelectedFiles(newFiles);
            onFilesChange(newFiles); // Notifica al formulario principal con las imágenes YA COMPRIMIDAS
        } catch (error) {
            console.error("Error al comprimir las imágenes:", error);
            alert("Ocurrió un error al procesar algunas imágenes. Por favor, inténtalo de nuevo.");
        } finally {
            setIsCompressing(false);
            // Resetea el input para permitir seleccionar la misma imagen si fue borrada
            e.target.value = '';
        }
    };

    // Maneja la eliminación de una imagen específica
    const handleRemove = (indexToRemove) => {
        const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
        setSelectedFiles(updatedFiles);
        onFilesChange(updatedFiles); // Notifica al formulario principal
    };

    return (
        <div className="image-uploader">
            <input
                type="file"
                multiple
                accept="image/*,application/pdf,.heic,.heif"
                onChange={handleFileSelect}
                className="form-control"
                style={{ border: 'none', paddingLeft: 0, backgroundColor: 'transparent' }}
                disabled={isCompressing}
            />

            {/* Cinta de previsualización */}
            {(selectedFiles.length > 0 || isCompressing) && (
                <div className="preview-ribbon">
                    {selectedFiles.map((fileObj, index) => (
                        <div key={index} className="preview-item">
                            <img 
                                src={`data:${fileObj.mimeType || 'image/jpeg'};base64,${fileObj.content}`} 
                                alt={`Evidencia ${index + 1}`} 
                                className="preview-img" 
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="btn-remove-img"
                                title="Eliminar foto"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    
                    {isCompressing && (
                        <div className="preview-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Procesando...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}