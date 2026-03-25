import { supabase } from '../supabaseClient';

/**
 * Guarda la cabecera de la inspección en la base de datos.
 * @param {Object} headerData 
 * @param {number} totalScore 
 * @returns {Promise<Object>} The inserted inspection record.
 */
export const saveInspectionHeader = async (headerData, totalScore) => {
  const { data, error } = await supabase
    .from('inspections')
    .insert([{
      ...headerData,
      total_incidence_score: totalScore
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al guardar cabecera: ${error.message}`);
  return data;
};

/**
 * Guarda las respuestas de la inspección en la base de datos.
 * @param {Array} responses 
 */
export const saveInspectionResponses = async (responses) => {
  const { error } = await supabase
    .from('inspection_responses')
    .insert(responses);

  if (error) throw new Error(`Error al guardar respuestas: ${error.message}`);
};

/**
 * Invoca la Edge Function para procesar la inspección en M365 (OneDrive/Excel/PDF).
 * @param {Object} payload 
 */
export const processM365Inspection = async (payload) => {
  const { data, error } = await supabase.functions.invoke('guardar-inspeccion-seguridad', {
    body: payload
  });

  if (error) throw new Error(`Error en la integración M365: ${error.message}`);
  return data;
};
