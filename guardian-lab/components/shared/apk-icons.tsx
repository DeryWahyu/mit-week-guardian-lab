import type { SVGProps } from "react";

export function AndroidMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M6 6L3 1M26 6L29 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 23C1 12 7 5 16 5S31 12 31 23Z" fill="currentColor" />
      <circle cx="9.5" cy="15" r="1.4" fill="#fff" />
      <circle cx="22.5" cy="15" r="1.4" fill="#fff" />
    </svg>
  );
}

export function ApkFileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 80" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M12 3H37L56 23V70Q56 77 49 77H12Q5 77 5 70V10Q5 3 12 3Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M37 4V19Q37 24 42 24H55"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <AndroidMark x={18} y={27} width={26} height={21} />
      <text
        x="31"
        y="65"
        textAnchor="middle"
        fill="currentColor"
        fontSize="13"
        fontFamily="inherit"
        fontWeight="800"
      >
        .APK
      </text>
    </svg>
  );
}
