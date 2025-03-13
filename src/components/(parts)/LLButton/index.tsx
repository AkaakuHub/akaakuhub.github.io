import React from 'react';

interface LLButtonProps {
  text: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}
export const LLButton = (props: LLButtonProps) => {
  const { text, onClick, href, className } = props;
  if (href) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
      >
        {text}
      </a>
    );
  }
  return (
    <button
      className={className}
      onClick={onClick}
    >
      {text}
    </button>
  );
}