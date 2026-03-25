import React from 'react';

/**
 * Componente reutilizable para campos de formulario.
 */
export const FormField = ({ label, required, children, error, className = "form-group" }) => (
  <div className={className}>
    <label className="form-label">
      {label} {required && <span className="required">*</span>}
    </label>
    {children}
    {error && <span className="error-message">{error.message}</span>}
  </div>
);

export const FormInput = ({ register, name, rules, defaultValue, placeholder, type = "text", ...props }) => (
  <input
    className="form-control"
    type={type}
    placeholder={placeholder}
    defaultValue={defaultValue}
    {...register(name, rules)}
    {...props}
  />
);

export const FormTextArea = ({ register, name, rules, defaultValue, rows = "2", ...props }) => (
  <textarea
    className="form-control"
    rows={rows}
    defaultValue={defaultValue}
    {...register(name, rules)}
    {...props}
  />
);
