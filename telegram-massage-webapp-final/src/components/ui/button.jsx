export function Button({ children, onClick, className = "", disabled = false, variant = "outline" }) {
  return (
    <button
      className={`px-3 py-2 rounded border \${variant === "default" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600"} \${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
