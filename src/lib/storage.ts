import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getStore } from "@netlify/blobs";

import { sanitizeFileName } from "@/lib/utils";

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export type StoredUpload = {
  key: string;
  url: string;
  mimeType: string;
  fileName: string;
};

function isNetlifyBlobMode() {
  return Boolean(process.env.NETLIFY);
}

function getStoreName() {
  return process.env.NETLIFY_BLOBS_STORE || "survial-academia-files";
}

export async function saveUpload(file: File, folder: string): Promise<StoredUpload | null> {
  if (!file || file.size === 0) return null;

  const fileName = sanitizeFileName(file.name || "archivo");
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
  const mimeType = file.type || "application/octet-stream";
  const arrayBuffer = await file.arrayBuffer();

  if (isNetlifyBlobMode()) {
    const store = getStore(getStoreName());
    await store.set(key, arrayBuffer, {
      metadata: {
        contentType: mimeType,
        fileName,
      },
    });
  } else {
    const fullPath = path.join(LOCAL_UPLOAD_ROOT, key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, Buffer.from(arrayBuffer));
  }

  return {
    key,
    url: `/api/files/${key}`,
    mimeType,
    fileName,
  };
}

export async function readUpload(key: string) {
  if (isNetlifyBlobMode()) {
    const store = getStore(getStoreName());
    const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!entry) return null;

    return {
      buffer: Buffer.from(entry.data),
      contentType: String(entry.metadata.contentType || "application/octet-stream"),
      fileName: String(entry.metadata.fileName || path.basename(key)),
    };
  }

  const fullPath = path.join(LOCAL_UPLOAD_ROOT, key);

  try {
    const buffer = await readFile(fullPath);
    return {
      buffer,
      contentType: "application/octet-stream",
      fileName: path.basename(fullPath),
    };
  } catch {
    return null;
  }
}

export function getStorageLabel() {
  return isNetlifyBlobMode() ? "Netlify Blobs" : "Disco local";
}
