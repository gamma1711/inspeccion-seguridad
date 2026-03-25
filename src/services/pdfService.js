import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Genera un PDF en formato base64 a partir de los datos de la inspección.
 */
export const generarPDFBase64 = (headerData, responsesArray, totalScore, catalog, imagesData) => {
  const doc = new jsPDF();
  let y = 15;
  const pageHeight = doc.internal.pageSize.height;

  // Función auxiliar para saltar de página si se acaba el espacio
  const checkPageBreak = (neededSpace) => {
    if (y + neededSpace > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
  };

  // --- CABECERA SUPERIOR (Estilo Grid 2 Columnas - Referencia Imagen) ---
  doc.setFontSize(8);
  const lCol = 10;   // Inicio label izquierda
  const vCol = 42;   // Inicio valor izquierda
  const rCol = 105;  // Inicio label derecha
  const rvCol = 140; // Inicio valor derecha
  const lineH = 5;   // Altura de línea

  // Fila 1: AGRUPACIÓN | PROYECTO
  doc.setFont("helvetica", "bold"); doc.text("AGRUPACION:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.agrupacion || "N/A", vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("PROYECTO:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.project_name || "N/A", 55)[0], rvCol, y);
  y += lineH;

  // Fila 2: CLIENTE/FILIAL | INSTALACIÓN
  doc.setFont("helvetica", "bold"); doc.text("CLIENTE/FILIAL:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.client_name || "N/A", 55)[0], vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("INSTALACION:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.instalacion || "N/A", 55)[0], rvCol, y);
  y += lineH;

  // Fila 3: NUMERO AU | F. AUDITORIA
  doc.setFont("helvetica", "bold"); doc.text("NUMERO AU:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.numero_au || "N/A", vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("F. AUDITORIA:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.fecha_auditoria || "N/A", rvCol, y);
  y += lineH;

  // Fila 4: OBS. TÉCNICO (ancho completo)
  doc.setFont("helvetica", "bold"); doc.text("OBS. TECNICO:", lCol, y);
  doc.setFont("helvetica", "normal");
  const obsLines = doc.splitTextToSize(headerData.obs_tecnico || "N/A", 152);
  doc.text(obsLines, vCol, y);
  y += (obsLines.length * 4) + 2;

  // Fila 5: USUARIO | ACTIVO
  doc.setFont("helvetica", "bold"); doc.text("USUARIO:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.usuario_auditor || "N/A", vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("ACTIVO:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.activo_inspeccionado || "N/A", rvCol, y);
  y += lineH;

  // Fila 6: TECNICO(S) (ancho completo, multi-línea)
  doc.setFont("helvetica", "bold"); doc.text("TECNICO:", lCol, y);
  doc.setFont("helvetica", "normal");
  const tecnicosText = headerData.tecnicos_involucrados || "N/A";
  const tecnicosList = tecnicosText.split(',').map(t => t.trim()).filter(Boolean);
  tecnicosList.forEach((tecnico, idx) => {
    doc.text(tecnico, vCol, y + (idx * 4));
  });
  y += Math.max(tecnicosList.length * 4, 4) + 2;

  // Fila 7: HORAS AUDITOR (inicio -> fecha auditoría con duración)
  doc.setFont("helvetica", "bold"); doc.text("HORAS AUDITOR:", lCol, y);
  doc.setFont("helvetica", "normal");
  const horaInicio = headerData.hora_inicio || "N/A";
  const horaFin = headerData.fecha_auditoria || "N/A";
  doc.text(`${horaInicio}   ->   ${horaFin}`, vCol, y);
  y += lineH;

  // Fila 8: EMPRESA/PAIS | TIPO DE AREA
  doc.setFont("helvetica", "bold"); doc.text("EMPRESA/PAIS:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.empresa_pais || "N/A", vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("TIPO DE AREA:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.tipo_area || "N/A", rvCol, y);
  y += lineH;

  // Fila 9: DESCRIPCION | FECHA CREACION
  doc.setFont("helvetica", "bold"); doc.text("DESCRIPCION:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.descripcion || "N/A", 55)[0], vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("FECHA CREACION:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(new Date().toISOString().split('T')[0], rvCol, y);
  y += lineH;

  // Fila 10: PROYECTO (repetido) 
  doc.setFont("helvetica", "bold"); doc.text("PROYECTO:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.project_name || "N/A", 55)[0], vCol, y);
  y += lineH;

  // Fila 11: TITULO
  doc.setFont("helvetica", "bold"); doc.text("TITULO:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.titulo || "N/A", 150)[0], vCol, y);
  y += lineH + 3;

  // --- BARRA NEGRA (Nº | V | PREGUNTA) ---
  checkPageBreak(10);
  doc.setFillColor(50, 50, 50); // Color gris oscuro/negro
  doc.rect(10, y, 190, 6, "F");
  doc.setTextColor(255, 255, 255); // Letra blanca
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Nº", 12, y + 4);
  doc.text("PUNTAJE", 23, y + 4);
  doc.text("PREGUNTA", 43, y + 4);
  doc.setTextColor(0, 0, 0); // Regresar a letra negra
  y += 10;

  // --- CUERPO DEL REPORTE ---
  const getResponse = (qId) => responsesArray.find(r => r.question_code === qId);

  Object.entries(catalog).forEach(([sectionName, questions]) => {
    checkPageBreak(15);
    // Título de la Sección
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(sectionName.toUpperCase(), 10, y);
    y += 6;

    questions.forEach(q => {
      const resp = getResponse(q.id);
      if (!resp) return; // Si la pregunta no se respondió, la saltamos

      checkPageBreak(15);

      // 1. Fila de la Pregunta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(q.id.toString(), 12, y); // ID
      
      const appliedScore = resp.applied_score || 0;
      doc.text(appliedScore.toString(), 25, y); // Puntaje

      doc.setFont("helvetica", "normal");
      const questionLines = doc.splitTextToSize(q.text, 145);
      doc.text(questionLines, 45, y);
      y += (questionLines.length * 4) + 2;

      // 2. Fila de Estado (sin color)
      doc.setFont("helvetica", "bold");
      doc.text("ESTADO:", 12, y);
      doc.setFont("helvetica", "normal");
      const status = resp.status || 'N/A';
      doc.text(status, 35, y);
      y += 5;

      // 3. Fila de Comentarios (sin color)
      doc.setFont("helvetica", "bold");
      doc.text("COMENTARIOS:", 12, y);
      doc.setFont("helvetica", "normal");
      const commentLines = doc.splitTextToSize(resp.comments || "Sin comentarios", 140);
      doc.text(commentLines, 45, y);
      y += (commentLines.length * 4) + 4;

      // 3. Renderizado de Imágenes
      const qImages = imagesData.filter(img => img.question_code === q.id);
      if (qImages.length > 0) {
        let xImg = 12;
        let maxHeightRow = 0;
        const imgWidth = 50;
        const imgHeight = 40;

        qImages.forEach((img) => {
          checkPageBreak(imgHeight + 10);

          if (xImg + imgWidth > 190) {
            // Si se sale del margen derecho, bajamos a la siguiente línea
            xImg = 12;
            y += imgHeight + 5;
            checkPageBreak(imgHeight + 10);
          }

          const imgDataUri = `data:${img.mimeType};base64,${img.content}`;
          const format = img.mimeType === 'image/png' ? 'PNG' : 'JPEG';

          doc.addImage(imgDataUri, format, xImg, y, imgWidth, imgHeight);
          xImg += imgWidth + 5;
          maxHeightRow = imgHeight;
        });

        y += maxHeightRow + 8; // Espacio después de las fotos
      } else {
        y += 3; // Espacio pequeño si no hay fotos
      }
    });
    y += 5; // Separación entre secciones mayores
  });

  // --- PUNTAJE TOTAL AL FINAL ---
  checkPageBreak(25);
  y += 5;
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.5);
  doc.line(10, y, 200, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PUNTAJE TOTAL DE LA INSPECCIÓN:", 10, y);

  if (totalScore > 0) {
    doc.setTextColor(220, 50, 50); // Rojo si hay penalización
  } else {
    doc.setTextColor(34, 139, 34); // Verde si puntaje perfecto
  }
  doc.text(totalScore.toString(), 95, y);
  doc.setTextColor(0, 0, 0);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("(0 = Sin incidencias. Mayor puntaje = Mayor penalización)", 10, y);

  const pdfOutput = doc.output('datauristring');
  return pdfOutput.split(',')[1];
};
