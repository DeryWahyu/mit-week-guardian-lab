import Image from "next/image";
import { cn } from "@/lib/utils";
import guardianFox from "@/public/brand/guardian-lab-fox.webp";

interface CyberGuardianMascotProps {
  className?: string;
  sizes?: string;
}

export function CyberGuardianMascot({
  className,
  sizes = "(min-width: 640px) 240px, 200px",
}: CyberGuardianMascotProps) {
  return (
    <Image
      src={guardianFox}
      alt="Maskot rubah Guardian 3D berjaket cyan dengan logo Koneksi dan kaca pembesar."
      sizes={sizes}
      className={cn("h-auto w-full max-w-[260px] select-none sm:max-w-[300px]", className)}
    />
  );
}
