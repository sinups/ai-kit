export function ThemeIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={className}
      style={{ transform: "rotate(-45deg)" }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M5 20L19 5" />
      <path d="M16 9L22 13.8528" />
      <path d="M12.4128 12.4059L19.3601 18.3634" />
      <path d="M8 15.6672L15 21.5" />
    </svg>
  );
}
