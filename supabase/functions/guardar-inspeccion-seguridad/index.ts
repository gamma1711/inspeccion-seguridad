import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Catálogo de IDs (Ajusta si tienes más preguntas)
const IDS_CATALOGO = ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.1', '3.1', '4.1', '4.2', '4.3', '4.4', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '6.1', '6.2', '6.3', '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '10.1', '10.2', '10.3', '10.4', '11.1', '11.2', '11.3', '11.4', '12.1', '12.2', '12.3', '12.4', '13.1', '13.2', '14.1', '14.2', '14.3', '14.4', '15.1', '15.2', '15.3', '15.4', '15.5', '15.6', '16.1', '16.2', '16.3', '16.4', '16.5', '16.6', '16.7', '16.8', '16.9', '16.10', '16.11', '16.12', '16.13', '16.14', '16.15', '16.16', '16.17', '16.18', '16.19', '16.20', '16.21', '16.22', '16.23', '16.24', '16.25', '16.26', '16.27', '16.28', '16.29', '16.30', '16.31', '16.32', '16.33', '16.34', '16.35', '16.36', '16.37', '16.38', '16.39', '16.40', '16.41', '16.42', '17.1', '17.2', '17.3'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    // AHORA RECIBIMOS EL pdfFile DESDE REACT
    const { inspectionId, headerData, totalScore, responses, images, pdfFile } = payload;

    // 1. Credenciales M365
    const tenantId = Deno.env.get('MS_TENANT_ID')
    const clientId = Deno.env.get('MS_CLIENT_ID')
    const refreshToken = Deno.env.get('MS_REFRESH_TOKEN')

    if (!tenantId || !clientId || !refreshToken) {
      throw new Error("Faltan variables de entorno MS en Supabase.");
    }

    // 2. Renovar Access Token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error('Error token MS: ' + JSON.stringify(tokenData))
    const accessToken = tokenData.access_token

    // Configuración de la carpeta en OneDrive
    const nombreCarpeta = `${headerData.project_name || 'Auditoria'}_${new Date().toISOString().split('T')[0]}`;
    const rutaBase = `Inspecciones_Ambientales/${nombreCarpeta}`;
    const urlsImagenes: Record<string, string[]> = {};

    // 3. Subir Imágenes a OneDrive
    if (images && images.length > 0) {
      for (const img of images) {
        const base64Content = img.content.split(',')[1] || img.content;
        const binary = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));

        const uploadPath = `https://graph.microsoft.com/v1.0/me/drive/root:/${rutaBase}/Evidencias/${img.filename}:/content`;
        
        const uploadRes = await fetch(uploadPath, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': img.mimeType || 'image/jpeg'
          },
          body: binary
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          if (!urlsImagenes[img.question_code]) urlsImagenes[img.question_code] = [];
          urlsImagenes[img.question_code].push(uploadData.webUrl);
        }
      }
    }

    // 4. SUBIR EL PDF A ONEDRIVE
    let urlPdfGenerado = "Sin PDF";
    if (pdfFile) {
        const pdfBinary = Uint8Array.from(atob(pdfFile), c => c.charCodeAt(0));
        const nombrePdf = `Reporte_${headerData.project_name || 'Auditoria'}_${inspectionId.split('-')[0]}.pdf`;
        const pdfUploadPath = `https://graph.microsoft.com/v1.0/me/drive/root:/${rutaBase}/${nombrePdf}:/content`;
        
        const pdfRes = await fetch(pdfUploadPath, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/pdf'
          },
          body: pdfBinary
        });

        const pdfData = await pdfRes.json();
        if (pdfRes.ok) {
            urlPdfGenerado = pdfData.webUrl;
        } else {
            console.error("Error subiendo PDF:", pdfData);
        }
    }

    /* OMITIENDO GUARDADO EN EXCEL POR PETICIÓN DEL USUARIO
2026-03-25: Se comenta la lógica de Excel para cumplir con el requerimiento.
    
    // 5. Construir Fila para Excel
    const filaExcel = [
      inspectionId.split('-')[0],
      new Date().toLocaleDateString(),
      headerData.project_name || "N/A",
      headerData.client_name || "N/A",
      headerData.usuario_auditor || "N/A",
      totalScore.toString()
    ];

    const mapResp = responses.reduce((acc: any, r: any) => ({ ...acc, [r.question_code]: r }), {});

    for (const code of IDS_CATALOGO) {
      const r = mapResp[code] || {};
      const linksFotos = urlsImagenes[code] ? urlsImagenes[code].join(" | ") : "Sin fotos";
      filaExcel.push(r.status || "N/A");
      filaExcel.push(r.comments || "");
      filaExcel.push(linksFotos);
    }

    console.log(filaExcel);

    // Opcional: Agregar el link del PDF al final de la fila de Excel
    // filaExcel.push(urlPdfGenerado);

    // 6. Insertar en Excel
    const excelFile = 'Inspecciones_Ambientales/Reporte_Inspecciones_Ambientales.xlsx';
    const tableName = 'TablaInspecciones';
    const graphUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${excelFile}:/workbook/tables/${tableName}/rows`;

    const excelRes = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [filaExcel] })
    });

    if (!excelRes.ok) {
      const errorExcel = await excelRes.json();
      throw new Error('Error Excel: ' + JSON.stringify(errorExcel));
    }
    */

    return new Response(JSON.stringify({ success: true, pdfUrl: urlPdfGenerado }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})