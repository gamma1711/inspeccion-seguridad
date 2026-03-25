/**
 * Busca el peso de una pregunta en el catálogo.
 * @param {string} questionId 
 * @param {Object} catalog 
 * @returns {number}
 */
export const getIncidenceWeight = (questionId, catalog) => {
  for (const section of Object.values(catalog)) {
    const question = section.find(q => q.id === questionId);
    if (question) return question.weight;
  }
  return 0;
};

/**
 * Calcula el puntaje total de incidencia basado en las respuestas "NO OK".
 * @param {Object} responses 
 * @param {Object} catalog 
 * @returns {number}
 */
export const calculateTotalScore = (responses, catalog) => {
  return Object.values(catalog).flat().reduce((acc, question) => {
    const qKey = question.id.replace('.', '_');
    const currentResponse = responses[qKey];
    if (currentResponse?.status === 'NO OK') {
      return acc + question.weight;
    }
    return acc;
  }, 0);
};
