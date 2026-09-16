export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AI UI Kit logo"
      className={className}
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.15A.5.5 0 0 1 5 18.75V16a2.5 2.5 0 0 1-1-2v-8.5Z" />
      <path d="M8.5 9.5h7" />
      <path d="M8.5 12.5h4" />
    </svg>
  );
}
