"use client";

import { useRef, useState } from "react";

type CloudinaryMediaUploadProps = {
  name: string;
  accept?: string;
};

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function CloudinaryMediaUpload({ name, accept = "image/*,video/*" }: CloudinaryMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [mimeType, setMimeType] = useState("");

  async function upload(file: File) {
    if (!cloudName || !uploadPreset) {
      setStatus("error");
      setMessage("Falta configurar Cloudinary. Consultá las variables indicadas en el archivo .env.example.");
      return;
    }

    setStatus("uploading");
    setMessage("Subiendo archivo...");
    setUrl("");

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", uploadPreset);
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
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
