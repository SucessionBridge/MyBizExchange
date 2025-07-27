export default function FloatingInput({ label, name, value, onChange, type = "text", ...props }) {
  return (
    <div className="relative w-full">
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        className="peer w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-transparent"
        placeholder={label}
        {...props}
      />
      <label className="absolute left-3 top-3 text-gray-500 transition-all 
        peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
        peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-600">
        {label}
      </label>
    </div>
  );
}
