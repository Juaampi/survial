import { requireRole } from "@/lib/auth";
import { getMuxUploadStatus } from "@/lib/mux";

export async function GET(_request: Request, context: RouteContext<"/api/mux/uploads/[id]">) {
  await requireRole("ADMIN");
  try {
    const { id } = await context.params;
    return Response.json(await getMuxUploadStatus(id));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No pudimos consultar el video." }, { status: 500 });
  }
}
