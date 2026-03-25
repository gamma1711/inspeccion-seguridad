// src/components/ImageUploader.jsx
import React, { useState, useEffect } from 'react';

export default function ImageUploader({ questionId, onFilesChange }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);

    // Maneja la selección de nuevos archivos
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);
        onFilesChange(newFiles); // Notifica al formulario principal

        // Generar URLs de vista previa
        const newUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newUrls]);

        // Resetea el input para permitir seleccionar la misma imagen si fue borrada
        e.target.value = '';
    };

    // Maneja la eliminación de una imagen específica
    const handleRemove = (indexToRemove) => {
        const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
        const updatedUrls = previewUrls.filter((_, index) => index !== indexToRemove);

        // Liberar memoria revocando la URL local
        URL.revokeObjectURL(previewUrls[indexToRemove]);

        setSelectedFiles(updatedFiles);
        setPreviewUrls(updatedUrls);
        onFilesChange(updatedFiles); // Notifica al formulario principal
    };

    // Limpieza de memoria cuando el componente se desmonta
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    return (
        <div className="image-uploader">
            <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="form-control"
                style={{ border: 'none', paddingLeft: 0, backgroundColor: 'transparent' }}
            />

            {/* Cinta de previsualización */}
            {previewUrls.length > 0 && (
                <div className="preview-ribbon">
                    {previewUrls.map((url, index) => (
                        <div key={index} className="preview-item">
                            <img src={url} alt={`Evidencia ${index + 1}`} className="preview-img" />
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
                </div>
            )}
        </div>
    );
}