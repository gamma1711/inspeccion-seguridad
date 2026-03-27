import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
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

    // Configuración de rutas
    const nombreCarpeta = `${headerData.numero_au || 'Auditoria'}_${new Date().toISOString().split('T')[0]}`;
    const rutaBase = `Inspecciones_Seguridad/Evidencias/${nombreCarpeta}`;
    const urlsImagenes: Record<string, string[]> = {};

    // 3. Subir Imágenes a OneDrive
    if (images && images.length > 0) {
      for (const img of images) {
        const base64Content = img.content.split(',')[1] || img.content;
        const binary = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
        const uploadPath = `https://graph.microsoft.com/v1.0/me/drive/root:/${rutaBase}/${img.filename}:/content`;
        
        const uploadRes = await fetch(uploadPath, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': img.mimeType || 'image/jpeg' },
          body: binary
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          if (!urlsImagenes[img.question_code]) urlsImagenes[img.question_code] = [];
          urlsImagenes[img.question_code].push(uploadData.webUrl);
        }
      }
    }

    // 4. Subir PDF a OneDrive
    let urlPdfGenerado = "Sin PDF";
    if (pdfFile) {
        const pdfBinary = Uint8Array.from(atob(pdfFile), c => c.charCodeAt(0));
        const nombrePdf = `Reporte_${headerData.project_name || 'Auditoria'}_${headerData.numero_au || inspectionId.split('-')[0]}.pdf`;
        const pdfUploadPath = `https://graph.microsoft.com/v1.0/me/drive/root:/${rutaBase}/${nombrePdf}:/content`;
        
        const pdfRes = await fetch(pdfUploadPath, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/pdf' },
          body: pdfBinary
        });

        const pdfData = await pdfRes.json();
        if (pdfRes.ok) urlPdfGenerado = pdfData.webUrl;
    }

    const archivoExcel = 'Inspecciones_Seguridad/Reporte_Inspecciones_Seguridad.xlsx';
    const idRelacional = headerData.numero_au || inspectionId.split('-')[0]; // El AU que une todo

    // =========================================================================
    // 5. INSERCIÓN EN TABLA MAESTRA (1 Fila)
    // =========================================================================
    const filaMaestra = [
      idRelacional,
      new Date().toLocaleDateString(),
      headerData.agrupacion || "N/A",
      headerData.project_name || "N/A",
      headerData.client_name || "N/A",
      headerData.instalacion || "N/A",
      headerData.fecha_auditoria || "N/A",
      headerData.fecha_cierre || "N/A",
      headerData.usuario_auditor || "N/A",
      headerData.activo_inspeccionado || "N/A",
      headerData.tecnicos_involucrados || "N/A",
      headerData.obs_tecnico || "N/A",
      totalScore.toString(),
      urlPdfGenerado
    ];

    const urlMaestra = `https://graph.microsoft.com/v1.0/me/drive/root:/${archivoExcel}:/workbook/tables/TablaMaestra/rows`;
    const resMaestra = await fetch(urlMaestra, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [filaMaestra] })
    });
    if (!resMaestra.ok) throw new Error('Error TablaMaestra: ' + JSON.stringify(await resMaestra.json()));


    // =========================================================================
    // 6. INSERCIÓN EN TABLA DETALLES (Múltiples Filas de un golpe)
    // =========================================================================
    // Transformamos el array de respuestas en un array de filas para Excel
    const filasDetalle = responses.map((r: any) => {
      const linksFotos = urlsImagenes[r.question_code] ? urlsImagenes[r.question_code].join(" | ") : "Sin fotos";
      return [
        idRelacional,           // Clave foránea que une con la TablaMaestra
        r.question_code,        // Ej: 1.1
        r.status,               // OK, NO OK, N/A
        r.comments || "N/A",    // Comentarios
        linksFotos              // Links a OneDrive
      ];
    });

    // Validamos que haya respuestas para insertar
    if (filasDetalle.length > 0) {
      const urlDetalles = `https://graph.microsoft.com/v1.0/me/drive/root:/${archivoExcel}:/workbook/tables/TablaDetalles/rows`;
      const resDetalles = await fetch(urlDetalles, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        // Microsoft Graph permite enviar múltiples filas en una sola petición
        body: JSON.stringify({ values: filasDetalle }) 
      });
      if (!resDetalles.ok) throw new Error('Error TablaDetalles: ' + JSON.stringify(await resDetalles.json()));
    }

    return new Response(JSON.stringify({ success: true }), {
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