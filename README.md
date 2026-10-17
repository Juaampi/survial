# SurVial Academia

## Fotos y videos propios

Las fotos usan Cloudinary: creá una cuenta, generá un **Upload preset** de tipo **Unsigned** y agregá `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` a las variables de entorno del sitio.

Los videos privados usan Mux. Configurá `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID` y `MUX_SIGNING_PRIVATE_KEY` solo como secretos del servidor. El administrador carga el video directamente a Mux mediante una carga reanudable y, al terminar el procesamiento, queda disponible exclusivamente para alumnos mediante un reproductor con token temporal.

El contenido de texto mantiene los saltos de línea y los espacios ingresados en el editor.

## Estructura

- `index.html`: estructura principal y copy de la landing.
- `styles.css`: estilos, layout responsive y componentes visuales.
- `script.js`: menú mobile, navbar sticky y animaciones de entrada.
- `assets/logo vial.png`: logo actual de la marca.

## Uso

Abrí `index.html` directamente en el navegador o serví la carpeta con cualquier servidor estático.
