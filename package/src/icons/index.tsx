import React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };

export function IconSpinner({ size = 16, style, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      style={{
        animation: 'ae-spin 1s linear infinite',
        willChange: 'transform',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity={0.2}
      />
      <path
        d="M12 2C6.48 2 2 6.48 2 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IconThinSpinner({ size = 12, style, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      style={{ animation: 'ae-spin 1s linear infinite', flexShrink: 0, ...style }}
      {...rest}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="28"
        strokeDashoffset="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      {...props}
    >
      <path
        d="M5 12.75L10 19L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconArrowRight({ size = 24, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} {...props}>
      <path
        d="M14 6L20 12L14 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconDoubleChevronRight({ size = 16, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} {...props}>
      <path
        d="M6 17L11 12L6 7M13 17L18 12L13 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
