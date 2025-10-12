import React from "react";
import { Container } from "react-bootstrap";
import "./PageLayout.scss";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  subtitle?: string;
  className?: string;
  fluid?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "xxl" | "none";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  className = "",
  fluid = false,
  maxWidth = "xl",
  padding = "lg",
}) => {
  const containerClass = `
    page-layout 
    ${className}
    ${padding !== "none" ? `padding-${padding}` : ""}
    ${maxWidth !== "none" ? `max-width-${maxWidth}` : ""}
  `.trim();

  return (
    <Container fluid={fluid} className={containerClass}>
      {(title || subtitle) && (
        <div className="page-header">
          {title && <h1 className="page-title">{title}</h1>}
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="page-content">{children}</div>
    </Container>
  );
};

export default PageLayout;
