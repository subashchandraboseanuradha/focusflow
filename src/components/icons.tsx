// src/components/icons.tsx
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2a10 10 0 0 1 10 10" />
        <path d="m7 12 5 5 5-5" />
        <path d="m7 7 5 5 5-5" />
    </svg>
  );
}

export const Icons = {
  focus: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 8v6" />
      <path d="m21 12-6 0m-8 0-6 0" />
      <path d="m16.24 7.76-4.24 4.24" />
      <path d="M7.76 16.24l4.24-4.24" />
      <path d="M16.24 16.24l-4.24-4.24" />
      <path d="M7.76 7.76l4.24 4.24" />
    </svg>
  ),
  spinner: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  logo: Logo,
};
