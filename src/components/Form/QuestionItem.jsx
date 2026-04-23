import React from 'react';
import { useWatch } from 'react-hook-form';
import ImageUploader from '../ImageUploader';
import { FormField, FormTextArea } from './FormField';

export const QuestionItem = ({ question, register, setValue, control }) => {
  const qKey = question.id.replace('.', '_');

  // Observamos las fotos de esta pregunta específica para pasarlas como valor inicial
  const photos = useWatch({
    control,
    name: `responses.${qKey}.photos`
  });

  return (
    <div className="question-item">
      <div className="question-header">
        <strong>{question.id}.</strong> {question.text}
      </div>

      <div className="options-group">
        <label className="radio-label">
          <input type="radio" value="OK" {...register(`responses.${qKey}.status`, { required: true })} /> OK
        </label>
        <label className="radio-label">
          <input type="radio" value="NO OK" {...register(`responses.${qKey}.status`, { required: true })} /> NO OK
        </label>
        <label className="radio-label">
          <input type="radio" value="N/A" {...register(`responses.${qKey}.status`, { required: true })} /> N/A
        </label>
      </div>

      <FormField label="Comentarios / Evidencia">
        <FormTextArea rows={2} name={`responses.${qKey}.comments`} register={register} />
      </FormField>

      <FormField label="Adjuntar Fotografías">
        <ImageUploader
          questionId={question.id}
          initialFiles={photos}
          onFilesChange={(files) => {
            setValue(`responses.${qKey}.photos`, files);
          }}
        />
      </FormField>
    </div>
  );
};
