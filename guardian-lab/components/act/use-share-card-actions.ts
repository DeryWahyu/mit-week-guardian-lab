"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ShareCardData } from "@/lib/share-card/content";
import { exportShareCard } from "@/lib/share-card/export";

export function useShareCardActions(
  cardRef: RefObject<HTMLDivElement | null>,
  card: ShareCardData,
) {
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<{
    file: File | null;
    status: "preparing" | "ready" | "error";
  }>({
    file: null,
    status: "preparing",
  });
  const [operation, setOperation] = useState<"copy" | "share" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const downloadUrls = useRef(new Set<string>());

  useEffect(() => {
    mounted.current = true;
    const urls = downloadUrls.current;
    return () => {
      mounted.current = false;
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setImage({ file: null, status: "preparing" });
    setCanShare(false);
    if (attempt > 0) setFeedback("Menyiapkan ulang gambar…");
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Export timeout")), 20000);
    });
    async function prepare() {
      try {
        if (!cardRef.current) throw new Error("Canvas not ready");
        const file = await Promise.race([exportShareCard(cardRef.current, card.filename), timeout]);
        if (cancelled) return;
        setImage({ file, status: "ready" });
        setFeedback("");
        try {
          setCanShare(
            typeof navigator.share === "function" &&
              Boolean(navigator.canShare?.({ files: [file] })),
          );
        } catch {
          setCanShare(false);
        }
      } catch {
        if (!cancelled) {
          setImage({ file: null, status: "error" });
          toast.error("Gambar belum berhasil disiapkan. Silakan coba lagi.");
        }
      } finally {
        clearTimeout(timer);
      }
    }
    void prepare();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [card, cardRef, attempt]);

  function download() {
    if (!image.file) return;
    try {
      const url = URL.createObjectURL(image.file);
      downloadUrls.current.add(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        downloadUrls.current.delete(url);
      }, 1000);
      setFeedback("Unduhan PNG dimulai. Lampirkan gambar ini di WhatsApp atau aplikasi pesan.");
      toast.success("Unduhan PNG dimulai.");
    } catch {
      setFeedback("Unduhan gagal. Coba unduh kembali.");
      toast.error("Unduhan gagal. Coba lagi.");
    }
  }

  async function copy() {
    if (lock.current) return;
    lock.current = true;
    setOperation("copy");
    setFeedback("");
    try {
      await navigator.clipboard.writeText(card.text);
      if (!mounted.current) return;
      setCopied(true);
      setManualCopy(false);
      setFeedback("Pesan tersalin. Tempelkan di percakapan yang Anda pilih.");
      toast.success("Pesan berhasil disalin.");
    } catch {
      if (!mounted.current) return;
      setManualCopy(true);
      setFeedback("Akses papan klip tidak tersedia. Pilih teks di bawah lalu salin secara manual.");
      toast.error("Pesan belum tersalin. Gunakan salin manual.");
    } finally {
      lock.current = false;
      if (mounted.current) setOperation(null);
    }
  }

  async function share() {
    if (lock.current || !image.file || !canShare) return;
    lock.current = true;
    setOperation("share");
    setFeedback("");
    try {
      // Prepared before this click so the browser retains its user activation.
      await navigator.share({ files: [image.file], title: "Guardian Share Card", text: card.text });
      if (!mounted.current) return;
      setFeedback("Gambar diteruskan ke aplikasi berbagi yang Anda pilih.");
      toast.success("Permintaan berbagi selesai.");
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        setFeedback("Berbagi dibatalkan. Gambar tetap siap diunduh.");
        toast.info("Berbagi dibatalkan.");
      } else {
        setFeedback("Gambar belum dibagikan. Unduh PNG dan lampirkan secara manual.");
        toast.error("Berbagi gagal. Anda dapat mengunduh PNG.");
      }
    } finally {
      lock.current = false;
      if (mounted.current) setOperation(null);
    }
  }

  return {
    status: image.status,
    operation,
    feedback,
    manualCopy,
    copied,
    canShare,
    download,
    copy,
    share,
    retry: () => setAttempt((value) => value + 1),
  };
}
