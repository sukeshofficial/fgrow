import "../../styles/welcome.css";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  onClick,
  ...rest
}) => {
  const baseClass = "welcome-btn";
  const variantClass = `welcome-btn-${variant}`;
  const sizeClass = `welcome-btn-${size}`;
  const disabledClass = disabled ? "welcome-btn-disabled" : "";

  const finalClassName = [
    baseClass,
    variantClass,
    sizeClass,
    disabledClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={finalClassName}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};
