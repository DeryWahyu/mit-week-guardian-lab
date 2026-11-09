import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  alt = "Guardian Lab",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src="/brand/guardian-lab-koneksi.png"
      alt={alt}
      width={512}
      height={512}
      loading="eager"
      unoptimized
      data-brand-mark
      className={cn("size-10 shrink-0 object-contain", className)}
    />
  );
}

export function BrandIdentity({
  subtitle = "Sandbox & Threat X-Ray",
  className,
  markClassName,
  wordmarkClassName,
}: {
  subtitle?: string | null;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark alt="" className={markClassName} />
      <span className="flex flex-col">
        <span
          className={cn(
            "text-brand-navy text-lg leading-tight font-extrabold tracking-tight",
            wordmarkClassName,
          )}
        >
          Guardian<span className="text-brand-cyan">Lab</span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-medium tracking-wide text-slate-500">{subtitle}</span>
        )}
      </span>
    </span>
  );
}
