import React, { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
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

export const HeaderSection = ({ register, setValue, control }) => {
  const numeroAuditoria = useMemo(() => generarNumeroAuditoria(), []);
  
  // Observamos si ya hay un número asignado (por ejemplo, desde un borrador)
  const currentNumero = useWatch({ control, name: 'header.numero_au' });

  useEffect(() => {
    // Solo asignamos el nuevo número si el campo está vacío
    if (!currentNumero) {
      setValue('header.numero_au', numeroAuditoria);
    }
  }, [setValue, numeroAuditoria, currentNumero]);

  return (
    <div className="header-section">
      <h3 className="section-title" style={{ marginTop: 0 }}>Datos del Proyecto e Instalación</h3>
      <div className="grid-3">
        <FormField label="Nº Auditoría (Auto-generado)">
          <input
            type="text"
            className="form-control"
            value={currentNumero || numeroAuditoria}
            readOnly
            style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed', fontWeight: 'bold', letterSpacing: '0.5px' }}
          />
          <input type="hidden" {...register('header.numero_au')} />
        </FormField>
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
        <FormField label="Activo">
          <FormInput name="header.activo_inspeccionado" register={register} placeholder="Ej: AMPVNT-A104" />
        </FormField>
      </div>

      <div className="section-divider"></div>

      <h3 className="section-title" style={{ marginTop: 0 }}>Fechas y Plazos</h3>
      <div className="grid-2">
        <FormField label="Fecha Auditoría">
          <FormInput name="header.fecha_auditoria" register={register} type="date" />
        </FormField>
        <FormField label="Fecha de Cierre">
          <FormInput name="header.fecha_cierre" register={register} type="date" />
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

      <FormField label="Obs. Técnico" className="form-group full-width" style={{ marginBottom: '40px' }}>
        <FormTextArea name="header.obs_tecnico" register={register} rows="3" />
      </FormField>
    </div>
  );
};
