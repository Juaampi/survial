import { getAdminMaterials } from "@/lib/queries";

export default async function AdminMaterialsPage() {
  const materials = await getAdminMaterials();

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--compact">
        <div>
          <p className="eyebrow">Materiales</p>
          <h1>Biblioteca de archivos</h1>
          <p>Listado claro de todo lo cargado en el campus para revisar, abrir y ubicar rápido.</p>
        </div>
      </section>

      <section className="stack-layout">
        {materials.length === 0 ? (
          <article className="panel-card">
            <h2>Todavía no hay materiales cargados</h2>
            <p>Cuando adjuntes PDFs, archivos o recursos desde Contenidos, van a aparecer acá.</p>
          </article>
        ) : (
          materials.map((material) => (
            <article className="panel-card material-library-card" key={material.id}>
              <div>
                <span className="panel-kicker">{material.kind}</span>
                <h2>{material.title}</h2>
              </div>
              <p>
                {material.lesson.module.course.title} / {material.lesson.module.title} / {material.lesson.title}
              </p>
              <div className="material-library-card__meta">
                <span>{material.mimeType || "Archivo"}</span>
                <span>{new Date(material.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
              <a className="button button--ghost" href={material.url} target="_blank" rel="noreferrer">
                Abrir material
              </a>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
