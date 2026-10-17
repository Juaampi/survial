import { SignJWT, importPKCS8 } from "jose";

const MUX_API_URL = "https://api.mux.com/video/v1";

type MuxResponse<T> = { data: T };

function getMuxCredentials() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) throw new Error("Mux no está configurado.");
  return { tokenId, tokenSecret };
}

async function muxRequest<T>(path: string, init?: RequestInit) {
  const { tokenId, tokenSecret } = getMuxCredentials();
  const response = await fetch(`${MUX_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json()) as MuxResponse<T> & { error?: { messages?: Array<{ message: string }> } };
  if (!response.ok) throw new Error(body.error?.messages?.[0]?.message || "Mux no pudo procesar la solicitud.");
  return body.data;
}

export async function createMuxDirectUpload(origin: string) {
  return muxRequest<{ id: string; url: string }>("/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: origin,
      timeout: 604800,
      new_asset_settings: { playback_policies: ["signed"], video_quality: "basic" },
    }),
  });
}

export async function getMuxUploadStatus(uploadId: string) {
  const upload = await muxRequest<{ status: string; asset_id?: string }>(`/uploads/${encodeURIComponent(uploadId)}`);
  if (!upload.asset_id) return { status: upload.status, playbackId: null };
  const asset = await muxRequest<{ status: string; playback_ids?: Array<{ id: string; policy: string }> }>(
    `/assets/${encodeURIComponent(upload.asset_id)}`,
  );
  return {
    status: asset.status,
    playbackId: asset.playback_ids?.find((playback) => playback.policy === "signed")?.id || null,
  };
}

export async function getMuxPlaybackToken(playbackId: string) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const privateKey = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !privateKey) return null;
  const pem = privateKey.includes("BEGIN")
    ? privateKey.replace(/\\n/g, "\n")
    : Buffer.from(privateKey, "base64").toString("utf8");
  const key = await importPKCS8(pem, "RS256");
  return new SignJWT()
    .setProtectedHeader({ alg: "RS256", kid: keyId })
    .setSubject(playbackId)
    .setAudience("v")
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(key);
}

export function getMuxPlaybackId(url: string) {
  return url.startsWith("mux://") ? url.slice("mux://".length) : null;
}
