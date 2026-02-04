import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`card ${hover ? "" : "hover:border-charcoal-800 hover:shadow-none"} ${className}`}
    >
      {children}
    </div>
  );
}
