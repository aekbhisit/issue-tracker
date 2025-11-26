import React, { ReactNode } from "react";

type ButtonColor = "default" | "success" | "danger" | "warning" | "info";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  color?: ButtonColor; // Action-based color (works with outline variant)
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Additional custom classes
  type?: "button" | "submit" | "reset"; // Button type
}

const Button: React.FC<ButtonProps> = ({
  children,
  size,
  variant = "primary",
  color = "default",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  // Size Classes
  const defaultSizeClass = "control-height px-3 text-sm";
  const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };
  const resolvedSizeClass = size ? sizeClasses[size] : defaultSizeClass;

  // Base Variant Classes
  const baseVariantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white ring-1 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-white/[0.03]",
  };

  // Color Classes for Outline Variant
  const outlineColorClasses: Record<ButtonColor, string> = {
    default:
      "text-gray-700 ring-gray-300 hover:text-gray-700 dark:text-gray-400 dark:ring-gray-700 dark:hover:text-gray-300",
    success:
      "border-green-200 text-green-600 ring-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400 dark:ring-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-300",
    danger:
      "border-red-200 text-red-600 ring-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:ring-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-300",
    warning:
      "border-yellow-200 text-yellow-600 ring-yellow-200 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-800 dark:text-yellow-400 dark:ring-yellow-800 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300",
    info:
      "border-blue-light-200 text-blue-light-600 ring-blue-light-200 hover:bg-blue-light-50 hover:text-blue-light-700 dark:border-blue-light-800 dark:text-blue-light-400 dark:ring-blue-light-800 dark:hover:bg-blue-light-900/20 dark:hover:text-blue-light-300",
  };

  // Combine variant and color classes
  const getVariantClasses = (): string => {
    if (variant === "primary") {
      return baseVariantClasses.primary;
    }
    // For outline variant, apply color classes
    return `${baseVariantClasses.outline} ${outlineColorClasses[color as ButtonColor]}`;
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} ${
        resolvedSizeClass
      } ${getVariantClasses()} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
