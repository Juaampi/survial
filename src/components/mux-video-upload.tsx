"use client";

import { useRef, useState } from "react";

declare global {
  interface Window {
    UpChunk?: {
      createUpload: (options: { endpoint: string; file: File; chunkSize: number }) => {
        on: (event: string, callback: (event: { detail?: number | { message?: string } }) => void) => void;
      };
    };
  }
}

function loadUpChunk() {
  if (window.UpChunk) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-upchunk]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo preparar la carga reanudable.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mux/upchunk@2";
    script.async = true;
    script.dataset.upchunk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo preparar la carga reanudable."));
    document.head.appendChild(script);
  });
}

export function MuxVideoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState("");

  async function waitForVideo(uploadId: string) {
    for (let attempt = 0; attempt < 144; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
      const response = await fetch(`/api/mux/uploads/${uploadId}`, { cache: "no-store" });
      const result = (await response.json()) as { status?: string; playbackId?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo verificar el procesamiento.");
      if (result.playbackId) {
        setUrl(`mux://${result.playbackId}`);
        setStatus("ready");
        setMessage("Video listo para guardar y reproducir en la clase.");
        return;
      }
      if (result.status === "errored") throw new Error("Mux no pudo procesar este video. Probá con un MP4 H.264.");
    }
    throw new Error("El video sigue procesándose. Esperá unos minutos e intentá nuevamente.");
  }

  async function startUpload(file: File) {
    if (file.size > 30 * 1024 * 1024 * 1024) {
      setStatus("error");
      setMessage("El video supera el máximo de 30 GB.");
      return;
    }
    setStatus("uploading");
    setProgress(0);
    setUrl("");
    setMessage("Preparando carga reanudable...");
    try {
      const createResponse = await fetch("/api/mux/uploads", { method: "POST" });
      const directUpload = (await createResponse.json()) as { id?: string; url?: string; error?: string };
      if (!createResponse.ok || !directUpload.id || !directUpload.url) throw new Error(directUpload.error || "No se pudo iniciar la carga.");
      await loadUpChunk();
      const upload = window.UpChunk?.createUpload({ endpoint: directUpload.url, file, chunkSize: 30_720 });
      if (!upload) throw new Error("No se pudo iniciar la carga reanudable.");
      upload.on("progress", (event) => setProgress(Math.round(Number(event.detail || 0))));
      upload.on("error", (event) => {
        setStatus("error");
        const detail = event.detail as { message?: string } | undefined;
        setMessage(detail?.message || "La carga se interrumpió. Podés seleccionarlo nuevamente para reanudarla.");
      });
      upload.on("success", () => {
        setStatus("processing");
        setMessage("Video cargado. Mux lo está preparando para reproducir...");
        void waitForVideo(directUpload.id! ).catch((error: unknown) => {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "No se pudo procesar el video.");
        });
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar la carga.");
    }
  }

  return (
    <div className="cloudinary-upload">
      <input name="hostedMediaUrl" type="hidden" value={url} readOnly />
      <input name="hostedMediaMimeType" type="hidden" value="video/mux" readOnly />
      <button className="button button--ghost button--small" type="button" onClick={() => inputRef.current?.click()} disabled={status === "uploading" || status === "processing"}>
        {status === "uploading" ? `Subiendo ${progress}%` : status === "processing" ? "Procesando video..." : "Subir video privado"}
      </button>
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void startUpload(file); }} />
      {message ? <p className={`form-helper ${status === "error" ? "form-message--error" : ""}`}>{message}</p> : null}
    </div>
  );
}
