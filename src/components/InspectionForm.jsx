// src/components/InspectionForm.jsx
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { inspectionCatalog } from '../constants/questionsCatalog';
import { HeaderSection } from './Form/HeaderSection';
import { QuestionItem } from './Form/QuestionItem';
import { generarPDFBase64 } from '../services/pdfService';
import {
  saveInspectionHeader,
  saveInspectionResponses,
  processM365Inspection
} from '../services/inspectionService';
import { compressAndPrepareImage } from '../utils/imageUtils';
import { calculateTotalScore, getIncidenceWeight } from '../utils/inspectionUtils';
import './InspectionForm.css';
import logo from '../assets/7-revergy_horizontal.png';

export default function InspectionForm() {
  const { register, control, handleSubmit, setValue, reset } = useForm();

  // Observamos las respuestas para el cálculo reactivo del puntaje
  const responses = useWatch({ control, name: 'responses' }) || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Cálculo dinámico del puntaje total
  const totalIncidenceScore = calculateTotalScore(responses, inspectionCatalog);

  /**
   * Manejador principal de envío del formulario.
   */
  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      // PASO 1: Guardar Cabecera en Supabase
      const inspectionData = await saveInspectionHeader(formData.header, totalIncidenceScore);
      const inspectionId = inspectionData.id;

      // PASO 2: Preparar Respuestas e Imágenes
      const responsesToInsert = [];
      const imagesForOneDrive = [];

      for (const [qKey, response] of Object.entries(formData.responses || {})) {
        const questionId = qKey.replace('_', '.'); // Formato original "1.1"
        if (!response || !response.status) continue;

        const isNoOk = response.status === 'NO OK';
        const appliedScore = isNoOk ? getIncidenceWeight(questionId, inspectionCatalog) : 0;

        responsesToInsert.push({
          inspection_id: inspectionId,
          question_code: questionId,
          status: response.status,
          comments: response.comments || '',
          applied_score: appliedScore
        });

        // Procesamiento de imágenes (compresión y base64)
        if (response.photos && response.photos.length > 0) {
          for (let i = 0; i < response.photos.length; i++) {
            const imageData = await compressAndPrepareImage(response.photos[i], questionId, i);
            imagesForOneDrive.push(imageData);
          }
        }
      }

      // PASO 3: Guardar Respuestas en Supabase
      await saveInspectionResponses(responsesToInsert);

      // PASO 4: Generar PDF y Sincronizar con M365 (OneDrive/Excel)
      const pdfBase64 = generarPDFBase64(
        formData.header,
        responsesToInsert,
        totalIncidenceScore,
        inspectionCatalog,
        imagesForOneDrive
      );

      await processM365Inspection({
        inspectionId,
        headerData: formData.header,
        totalScore: totalIncidenceScore,
        responses: responsesToInsert,
        images: imagesForOneDrive,
        pdfFile: pdfBase64
      });

      alert('Inspección guardada exitosamente en Supabase y OneDrive.');

      // RESET DEL FORMULARIO
      reset();
      setResetKey(prev => prev + 1); // Forzar remount de HeaderSection para nuevo ID
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Volver al inicio

    } catch (error) {
      console.error('Fallo en la transacción:', error);
      alert(error.message || 'Ocurrió un error inesperado al guardar la inspección.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="form-container">

        <div className="branding-header">
          <img src={logo} alt="REVERGY" className="branding-logo" />
        </div>

        <h2 className="main-title" id="form-top">Inspección de Seguridad a Aerogenerador</h2>

        <form onSubmit={handleSubmit(onSubmit)}>

          <HeaderSection key={resetKey} register={register} setValue={setValue} />

          {/* Renderizado dinámico de secciones de preguntas */}
          {Object.entries(inspectionCatalog).map(([sectionName, questions]) => (
            <div key={sectionName}>
              <h3 className="section-title">{sectionName}</h3>
              {questions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  register={register}
                  setValue={setValue}
                />
              ))}
            </div>
          ))}

          {/* Footer con el puntaje acumulado y botón de envío */}
          <div className="action-footer">
            <p className={`score-display ${totalIncidenceScore > 0 ? 'score-danger' : 'score-safe'}`}>
              Puntaje Acumulado: {totalIncidenceScore}
            </p>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Inspección'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}