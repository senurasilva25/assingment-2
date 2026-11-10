export default function FormField({
  field,
  value,
  error,
  onChange,
  onBlur,
  limits = {},
}) {
  const {
    name,
    label,
    type,
    required,
    options,
    autoComplete,
    inputMode,
    maxLength,
  } = field;
  const props = {
    id: name,
    name,
    value,
    required,
    autoComplete,
    inputMode,
    maxLength,
    className: `${type === 'select' ? 'form-select' : 'form-control'}${error ? ' invalid' : ''}`,
    'aria-invalid': Boolean(error),
    'aria-describedby': `${name}-error`,
    onChange: (event) => onChange(name, event.target.value),
    onBlur: () => onBlur(name),
    ...limits,
  };
  return (
    <div className="field-row">
      <label htmlFor={name}>
        {label}
        {required && ' *'}
      </label>
      <div className="field-control">
        {type === 'select' ? (
          <select {...props}>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea {...props} rows={5} />
        ) : (
          <input {...props} type={type} />
        )}
        <span className="error" id={`${name}-error`}>
          {error}
        </span>
      </div>
    </div>
  );
}
