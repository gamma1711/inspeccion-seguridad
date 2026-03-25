import React, { useEffect, useMemo } from 'react';
import { FormField, FormInput, FormTextArea } from './FormField';

/**
 * Genera un número de auditoría con formato UA + YYYYMMDDHHmmss
 */
const generarNumeroAuditoria = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `UA${timestamp}`;
};

export const HeaderSection = ({ register, setValue }) => {
  const numeroAuditoria = useMemo(() => generarNumeroAuditoria(), []);

  useEffect(() => {
    setValue('header.numero_au', numeroAuditoria);
  }, [setValue, numeroAuditoria]);

  return (
    <div className="header-section">
      <h3 className="section-title" style={{ marginTop: 0 }}>Datos del Proyecto e Instalación</h3>
      <div className="grid-3">
        <FormField label="Agrupación" required>
          <FormInput name="header.agrupacion" register={register} rules={{ required: true }} />
        </FormField>
        <FormField label="Proyecto" required>
          <FormInput name="header.project_name" register={register} rules={{ required: true }} />
        </FormField>
        <FormField label="Cliente / Filial" required>
          <FormInput name="header.client_name" register={register} rules={{ required: true }} />
        </FormField>
        <FormField label="Instalación" required>
          <FormInput name="header.instalacion" register={register} rules={{ required: true }} />
        </FormField>
        <FormField label="Empresa / País">
          <FormInput name="header.empresa_pais" register={register} />
        </FormField>
        <FormField label="Activo">
          <FormInput name="header.activo_inspeccionado" register={register} placeholder="Ej: AMPVNT-A104" />
        </FormField>
      </div>

      <div className="section-divider"></div>

      <h3 className="section-title" style={{ marginTop: 0 }}>Identificación de Auditoría</h3>
      <div className="grid-3">
        <FormField label="Nº Auditoría (Auto-generado)">
          <input
            type="text"
            className="form-control"
            value={numeroAuditoria}
            readOnly
            style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed', fontWeight: 'bold', letterSpacing: '0.5px' }}
          />
          <input type="hidden" {...register('header.numero_au')} />
        </FormField>
        <FormField label="Título de Auditoría" required>
          <FormInput name="header.titulo" register={register} rules={{ required: true }} />
        </FormField>
        <FormField label="Descripción">
          <FormInput name="header.descripcion" register={register} />
        </FormField>
        <FormField label="Tipo de Área">
          <FormInput name="header.tipo_area" register={register} placeholder="Ej: ALMACEN" />
        </FormField>
      </div>

      <div className="section-divider"></div>

      <h3 className="section-title" style={{ marginTop: 0 }}>Personal e Intervinientes</h3>
      <div className="grid-2">
        <FormField label="Usuario">
          <FormInput name="header.usuario_auditor" register={register} />
        </FormField>
        <FormField label="Técnico(s) (Nombres completos separados por coma)" className="form-group full-width">
          <FormTextArea name="header.tecnicos_involucrados" register={register} rows="2" />
        </FormField>
      </div>

      <div className="section-divider"></div>

      <h3 className="section-title" style={{ marginTop: 0 }}>Fechas y Tiempos</h3>
      <div className="grid-4">
        <FormField label="Fecha y Hora Auditoría">
          <FormInput name="header.fecha_auditoria" register={register} type="datetime-local" />
        </FormField>
        <FormField label="Hora Inicio">
          <FormInput name="header.hora_inicio" register={register} type="datetime-local" />
        </FormField>
      </div>

      <div className="section-divider"></div>

      <FormField label="Obs. Técnico" className="form-group full-width" style={{ marginBottom: '40px' }}>
        <FormTextArea name="header.obs_tecnico" register={register} rows="3" />
      </FormField>
    </div>
  );
};
