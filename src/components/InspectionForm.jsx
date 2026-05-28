// src/components/InspectionForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import localforage from 'localforage';
import { inspectionCatalog } from '../constants/questionsCatalog';
import { HeaderSection } from './Form/HeaderSection';
import { QuestionItem } from './Form/QuestionItem';
import { generarPDFBase64 } from '../services/pdfService';
import {
  saveInspectionHeader,
  saveInspectionResponses,
  processM365Inspection
} from '../services/inspectionService';
import { calculateTotalScore, getIncidenceWeight } from '../utils/inspectionUtils';
import './InspectionForm.css';
import logo from '../assets/7-revergy_horizontal.png';

// Configuración de localforage
localforage.config({
  name: 'InspeccionSeguridad',
  storeName: 'drafts'
});

export default function InspectionForm() {
  const { register, control, handleSubmit, setValue, reset, watch } = useForm();

  // Observamos todo el formulario para el guardado automático
  const allValues = watch();
  
  // Observamos las respuestas para el cálculo reactivo del puntaje
  const responses = useWatch({ control, name: 'responses' }) || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Carga inicial del borrador
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const draft = await localforage.getItem('current_inspection_draft');
        if (draft) {
          const shouldRestore = window.confirm(
            'Se encontró una inspección iniciada pero no guardada. ¿Desea recuperar los datos?'
          );
          if (shouldRestore) {
            reset(draft);
          } else {
            await localforage.removeItem('current_inspection_draft');
          }
        }
      } catch (err) {
        console.error('Error al cargar el borrador:', err);
      }
    };
    checkDraft();
  }, [reset]);

  // Guardado automático con Debounce (1.5 segundos)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Solo guardamos si hay texto en la cabecera (ignorando autogenerados como numero_au) o alguna respuesta con valor real
      const hasHeaderContent = !!(allValues.header?.project_name || allValues.header?.instalacion || allValues.header?.activo_inspeccionado || allValues.header?.agrupacion);
      const hasActualResponses = Object.values(allValues.responses || {}).some(
        resp => resp && (resp.status || resp.comments || (resp.photos && resp.photos.length > 0))
      );
      const hasContent = hasHeaderContent || hasActualResponses;
      
      if (hasContent && !isSubmitting) {
        try {
          await localforage.setItem('current_inspection_draft', allValues);
          console.log('Borrador guardado automáticamente');
        } catch (err) {
          console.error('Error al guardar borrador:', err);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [allValues, isSubmitting]);

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

        // Procesamiento de imágenes (ya vienen comprimidas desde el ImageUploader)
        if (response.photos && response.photos.length > 0) {
          for (let i = 0; i < response.photos.length; i++) {
            imagesForOneDrive.push(response.photos[i]);
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

      // Borrar borrador local tras éxito
      await localforage.removeItem('current_inspection_draft');

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

          <HeaderSection key={resetKey} register={register} setValue={setValue} control={control} />

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
                  control={control}
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