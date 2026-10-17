import { requireRole } from "@/lib/auth";
import { createMuxDirectUpload } from "@/lib/mux";

export async function POST(request: Request) {
  await requireRole("ADMIN");
  try {
    const origin = new URL(request.url).origin;
    const upload = await createMuxDirectUpload(origin);
    return Response.json(upload);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo iniciar la carga." }, { status: 500 });
  }
}
