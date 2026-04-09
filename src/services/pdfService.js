import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import logo from '../assets/7-revergy_horizontal.png';

/**
 * Genera un PDF en formato base64 a partir de los datos de la inspección.
 */
export const generarPDFBase64 = (headerData, responsesArray, totalScore, catalog, imagesData) => {
  const doc = new jsPDF({
    compress: true
  });

  // Agregar LOGO y TÍTULO en la cabecera
  const addHeader = () => {
    doc.addImage(logo, 'PNG', 10, 10, 45, 12);

    // Título de la inspección como encabezado en todas las páginas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Posicionamos el texto a la derecha del logo
    doc.text("INSPECCIÓN DE SEGURIDAD A AEROGENERADOR", 60, 18);
  };

  addHeader();

  let y = 30; // Aumentado para dar más espaciado tras el logo
  const pageHeight = doc.internal.pageSize.height;

  // Función auxiliar para saltar de página si se acaba el espacio
  const checkPageBreak = (neededSpace) => {
    if (y + neededSpace > pageHeight - 15) {
      doc.addPage();
      addHeader();
      y = 30;
    }
  };

  // --- CABECERA SUPERIOR (Estilo Grid 2 Columnas - Referencia Imagen) ---
  doc.setFontSize(8);
  const lCol = 10;   // Inicio label izquierda
  const vCol = 42;   // Inicio valor izquierda
  const rCol = 105;  // Inicio label derecha
  const rvCol = 140; // Inicio valor derecha
  const lineH = 5;   // Altura de línea

  // Fila 1: NUMERO AU | AGRUPACIÓN
  doc.setFont("helvetica", "bold"); doc.text("NUMERO AU:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.numero_au || "N/A", vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("AGRUPACION:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.agrupacion || "N/A", rvCol, y);
  y += lineH;

  // Fila 2: PROYECTO | INSTALACIÓN
  doc.setFont("helvetica", "bold"); doc.text("PROYECTO:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.project_name || "N/A", 55)[0], vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("INSTALACION:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.instalacion || "N/A", 55)[0], rvCol, y);
  y += lineH;

  // Fila 3: CLIENTE/FILIAL | ACTIVO
  doc.setFont("helvetica", "bold"); doc.text("CLIENTE/FILIAL:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(headerData.client_name || "N/A", 55)[0], vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("ACTIVO:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.activo_inspeccionado || "N/A", rvCol, y);
  y += lineH;

  // Fila 4: F. AUDITORIA | F. CIERRE
  doc.setFont("helvetica", "bold"); doc.text("F. AUDITORIA:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.fecha_auditoria || "N/A", vCol, y);
  doc.setFont("helvetica", "bold"); doc.text("F. CIERRE:", rCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.fecha_cierre || "N/A", rvCol, y);
  y += lineH;

  // Fila 5: USUARIO
  doc.setFont("helvetica", "bold"); doc.text("USUARIO:", lCol, y);
  doc.setFont("helvetica", "normal"); doc.text(headerData.usuario_auditor || "N/A", vCol, y);
  y += lineH;

  // Fila 6: OBS. TÉCNICO (ancho completo)
  doc.setFont("helvetica", "bold"); doc.text("OBS. TECNICO:", lCol, y);
  doc.setFont("helvetica", "normal");
  const obsLines = doc.splitTextToSize(headerData.obs_tecnico || "N/A", 152);
  doc.text(obsLines, vCol, y);
  y += (obsLines.length * 4) + 2;

  // Fila 7: TECNICO(S) (ancho completo, multi-línea)
  doc.setFont("helvetica", "bold"); doc.text("TECNICO:", lCol, y);
  doc.setFont("helvetica", "normal");
  const tecnicosText = headerData.tecnicos_involucrados || "N/A";
  const tecnicosList = tecnicosText.split(',').map(t => t.trim()).filter(Boolean);
  tecnicosList.forEach((tecnico, idx) => {
    doc.text(tecnico, vCol, y + (idx * 4));
  });
  y += Math.max(tecnicosList.length * 4, 4) + 5;

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

      const isNoOk = resp.status === 'NO OK' || (resp.applied_score && resp.applied_score > 0);

      const drawBlockBg = (yPos, height) => {
        if (isNoOk) {
          doc.setFillColor(255, 235, 235); // Rojo claro
          // Cajas contiguas para armar el panel completo (y - 4 es porque y es bottom-baseline del texto normal)
          doc.rect(10, yPos - 4, 190, height, "F");
        }
      };

      const appliedScore = resp.applied_score || 0;
      const questionLines = doc.splitTextToSize(q.text, 145);
      const qHeight = (questionLines.length * 4) + 2;

      checkPageBreak(qHeight + 5);

      // 1. Fila de la Pregunta
      drawBlockBg(y, qHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(q.id.toString(), 12, y); // ID

      if (isNoOk) doc.setTextColor(200, 0, 0); // Opcional: resaltar el puntaje en rojo más fuerte
      doc.text(appliedScore.toString(), 25, y); // Puntaje
      doc.setTextColor(0, 0, 0);

      doc.setFont("helvetica", "normal");
      doc.text(questionLines, 45, y);
      y += qHeight;

      // 2. Fila de Estado
      checkPageBreak(5);
      drawBlockBg(y, 5);
      doc.setFont("helvetica", "bold");
      doc.text("ESTADO:", 12, y);
      doc.setFont("helvetica", "normal");
      const status = resp.status || 'N/A';
      if (isNoOk) doc.setTextColor(200, 0, 0);
      doc.text(status, 35, y);
      doc.setTextColor(0, 0, 0);
      y += 5;

      // 3. Fila de Comentarios
      const commentLines = doc.splitTextToSize(resp.comments || "Sin comentarios", 140);
      const cHeight = (commentLines.length * 4) + 4;
      checkPageBreak(cHeight);
      drawBlockBg(y, cHeight);
      doc.setFont("helvetica", "bold");
      doc.text("COMENTARIOS:", 12, y);
      doc.setFont("helvetica", "normal");
      doc.text(commentLines, 45, y);
      y += cHeight;

      // 4. Renderizado de Imágenes
      const qImages = imagesData.filter(img => img.question_code === q.id);
      if (qImages.length > 0) {
        let xImg = 12;
        const imgWidth = 50;
        const imgHeight = 40;
        let isFirstInRow = true;

        qImages.forEach((img) => {
          if (xImg + imgWidth > 190) {
            // Salto a la nueva fila de imágenes en la misma pregunta
            y += imgHeight + 8;
            xImg = 12;
            isFirstInRow = true;
          }

          if (isFirstInRow) {
            checkPageBreak(imgHeight + 12);
            drawBlockBg(y, imgHeight + 8);
            isFirstInRow = false;
          }

          const imgDataUri = `data:${img.mimeType};base64,${img.content}`;
          const format = img.mimeType === 'image/png' ? 'PNG' : 'JPEG';

          // El alias 'FAST' ayuda adicionalmente a la compresión si la misma imagen se usa, aunque aquí son únicas
          doc.addImage(imgDataUri, format, xImg, y, imgWidth, imgHeight, undefined, 'FAST');
          xImg += imgWidth + 5;
        });

        y += imgHeight + 8; // Altura final de la última fila de imágenes transcurrida
      } else {
        drawBlockBg(y, 3);
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
