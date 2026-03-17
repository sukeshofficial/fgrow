import "../../styles/welcome.css";

export const Card = ({ children, className = "", ...rest }) => {
  return (
    <div className={`welcome-base-card ${className}`} {...rest}>
      {children}
    </div>
  );
};
