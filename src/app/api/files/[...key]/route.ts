import { readUpload } from "@/lib/storage";

export async function GET(_request: Request, context: RouteContext<"/api/files/[...key]">) {
  const params = await context.params;
  const key = params.key.join("/");
  const file = await readUpload(key);

  if (!file) {
    return new Response("Archivo no encontrado", { status: 404 });
  }

  return new Response(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
