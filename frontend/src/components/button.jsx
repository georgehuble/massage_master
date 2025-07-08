import { motion } from "framer-motion";

export function Button({ children, onClick, className = "", disabled = false, variant = "outline" }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
      className={`px-3 py-2 rounded border ${variant === "default" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600"} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
