"use client";

import { Activity, CheckCircle2, Cpu, FileCode, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ApkProgressCardProps {
  pending: boolean;
  className?: string;
}

const PHASES = [
  {
    minPercent: 0,
    maxPercent: 25,
    step: "1/4",
    label: "Verifikasi Berkas & Integritas",
    description: "Memeriksa integritas arsip ZIP, struktur berkas, dan entri classes.dex...",
    icon: FileCode,
  },
  {
    minPercent: 26,
    maxPercent: 60,
    step: "2/4",
    label: "Dekompilasi Bytecode JADX",
    description: "Mendekomposisi berkas sumber Java & mengekstrak AndroidManifest.xml...",
    icon: Cpu,
  },
  {
    minPercent: 61,
    maxPercent: 85,
    step: "3/4",
    label: "Audit Izin & Indikator Forensik",
    description:
      "Memindai izin SMS, overlay perbankan, token bot Telegram, dan endpoint jaringan...",
    icon: ShieldAlert,
  },
  {
    minPercent: 86,
    maxPercent: 99,
    step: "4/4",
    label: "Penilaian Ancaman DeepSeek AI",
    description:
      "Mengevaluasi pola rekayasa sosial, mengkalkulasi skor risiko, dan menyusun laporan...",
    icon: Sparkles,
  },
];

export function ApkProgressCard({ pending, className }: ApkProgressCardProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pending) {
      let timer: NodeJS.Timeout | undefined;
      setProgress((prev) => {
        if (prev > 0) {
          timer = setTimeout(() => setProgress(0), 1200);
          return 100;
        }
        return 0;
      });
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    setProgress(5);
    const startTime = Date.now();
    // Simulate ~32s duration with realistic decelerating curve towards 95%
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress((prev) => {
        if (prev >= 96) return Math.min(97, prev + 0.1);
        // Curve: fast initial, steady middle, slower at 85%+
        if (elapsed < 4000) return Math.min(25, 5 + (elapsed / 4000) * 20);
        if (elapsed < 18000) return Math.min(60, 25 + ((elapsed - 4000) / 14000) * 35);
        if (elapsed < 28000) return Math.min(85, 60 + ((elapsed - 18000) / 10000) * 25);
        return Math.min(96, 85 + ((elapsed - 28000) / 12000) * 11);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [pending]);

  if (!pending && progress === 0) return null;

  const isComplete = progress >= 100;
  const currentPhase =
    PHASES.find((p) => progress >= p.minPercent && progress <= p.maxPercent) ?? PHASES[3];
  const PhaseIcon = isComplete ? CheckCircle2 : currentPhase.icon;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Kemajuan dekompilasi dan analisis APK"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cyan-200/90 bg-gradient-to-br from-cyan-50/80 via-white to-teal-50/50 p-4 shadow-sm transition-all sm:p-5",
        className,
      )}
    >
      {/* Header with Title & Percentage */}
      <div className="flex items-center justify-between gap-3 border-b border-cyan-100/70 pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
              isComplete ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100/80 text-cyan-700",
            )}
          >
            <PhaseIcon
              className={cn("size-4.5", !isComplete && "animate-pulse")}
              aria-hidden="true"
            />
          </span>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-cyan-900 uppercase">
              {isComplete ? "Pemeriksaan Selesai" : "Proses Forensik Berjalan"}
            </h3>
            <p className="text-[11px] font-medium text-slate-500">
              {isComplete
                ? "Menampilkan hasil analisis..."
                : `Tahap ${currentPhase.step}: ${currentPhase.label}`}
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-black tracking-tight text-cyan-900">
            {Math.round(progress)}
          </span>
          <span className="text-xs font-bold text-cyan-700">%</span>
        </div>
      </div>

      {/* Progress Track & Bar */}
      <div className="mt-3.5 space-y-2">
        <div className="h-3 w-full overflow-hidden rounded-full border border-slate-200/70 bg-slate-100/90 p-0.5 shadow-inner">
          <div
            className={cn(
              "relative h-full rounded-full transition-all duration-300 ease-out",
              isComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-500",
            )}
            style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
          >
            {!isComplete && (
              <span className="absolute inset-0 animate-pulse bg-white/25" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Step dots visual indicator */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {PHASES.map((phase, idx) => {
            const stepNum = idx + 1;
            const currentStepNum = Number(currentPhase.step.split("/")[0]);
            const isStepActive = !isComplete && currentStepNum === stepNum;
            const isStepPast = isComplete || currentStepNum > stepNum;
            return (
              <div
                key={phase.step}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors",
                  isStepPast
                    ? "bg-cyan-100/80 text-cyan-800"
                    : isStepActive
                      ? "bg-cyan-600 text-white shadow-2xs"
                      : "bg-slate-100/80 text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                    isStepPast
                      ? "bg-cyan-700 text-white"
                      : isStepActive
                        ? "bg-white text-cyan-700"
                        : "bg-slate-300 text-slate-600",
                  )}
                >
                  {isStepPast ? "✓" : stepNum}
                </span>
                <span className="truncate">{phase.label.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Status Description */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-100/60 bg-white/70 p-2.5 text-xs text-slate-600 shadow-2xs">
        <Activity
          className="mt-0.5 size-3.5 shrink-0 animate-pulse text-cyan-600"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          {isComplete
            ? "Hasil investigasi berhasil disimpan dan siap ditinjau."
            : currentPhase.description}
        </p>
      </div>
    </div>
  );
}
