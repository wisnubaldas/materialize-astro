export default function InputField({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  error = "",
  type = "text",
}) {
  const inputId = `input-${name}`;

  return (
    <div className="form-floating form-floating-outline mb-3">
      <input
        type={type}
        className={`form-control ${error ? "is-invalid" : ""}`}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <label htmlFor={inputId}>{label}</label>
      {error && <div className="form-text text-danger mt-1">{error}</div>}
    </div>
  );
}
