import React from 'react';
import ImageUploader from '../ImageUploader';
import { FormField, FormTextArea } from './FormField';

export const QuestionItem = ({ question, register, setValue }) => {
  const qKey = question.id.replace('.', '_');

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

      <div className="grid-2">
        <FormField label="Comentarios / Evidencia">
          <FormTextArea rows={2} name={`responses.${qKey}.comments`} register={register} />
        </FormField>
        <FormField label="Adjuntar Fotografías">
          <ImageUploader
            questionId={question.id}
            onFilesChange={(files) => {
              setValue(`responses.${qKey}.photos`, files);
            }}
          />
        </FormField>
      </div>
    </div>
  );
};
