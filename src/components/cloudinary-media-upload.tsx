"use client";

import { useRef, useState } from "react";

type CloudinaryMediaUploadProps = {
  name: string;
  accept?: string;
};

export function CloudinaryMediaUpload({ name, accept = "image/*,video/*" }: CloudinaryMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [mimeType, setMimeType] = useState("");

  async function upload(file: File) {
    setStatus("uploading");
    setMessage("Subiendo archivo...");
    setUrl("");

    try {
      const signatureResponse = await fetch("/api/cloudinary/signature", { method: "POST" });
      const signatureResult = (await signatureResponse.json()) as {
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        signature?: string;
        error?: string;
      };

      if (
        !signatureResponse.ok ||
        !signatureResult.cloudName ||
        !signatureResult.apiKey ||
        !signatureResult.timestamp ||
        !signatureResult.signature
      ) {
        throw new Error(signatureResult.error || "No pudimos autorizar la carga en Cloudinary.");
      }

      const data = new FormData();
      data.append("file", file);
      data.append("api_key", signatureResult.apiKey);
      data.append("timestamp", String(signatureResult.timestamp));
      data.append("signature", signatureResult.signature);
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signatureResult.cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "No se pudo subir el archivo.");
      }

      setUrl(result.secure_url);
      setMimeType(file.type);
      setStatus("ready");
      setMessage(`${file.name} se cargó correctamente.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    }
  }

  return (
    <div className="cloudinary-upload">
      <input name={`${name}Url`} type="hidden" value={url} readOnly />
      <input name={`${name}MimeType`} type="hidden" value={mimeType} readOnly />
      <button className="button button--ghost button--small" type="button" onClick={() => inputRef.current?.click()} disabled={status === "uploading"}>
        {status === "uploading" ? "Subiendo..." : "Subir foto o video"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {message ? <p className={`form-helper ${status === "error" ? "form-message--error" : ""}`}>{message}</p> : null}
    </div>
  );
}
