# PrestaHerramienta

Plataforma web estática de alquiler y préstamo colaborativo de herramientas entre vecinos (**Residencial Los Olivos · Jaén**). Toda la persistencia de datos (catálogo, reservas, ampliaciones, reseñas e incidencias) funciona en el navegador mediante `localStorage`, por lo que puede alojarse directamente en **GitHub Pages** sin servidor backend.

## Subir a GitHub y publicar en GitHub Pages (paso a paso)

1. Descarga el proyecto completo y descomprímelo en tu ordenador.
2. Crea un repositorio nuevo en GitHub (por ejemplo, `prestaherramienta`).
3. Sube todos los archivos del proyecto a la rama `main`:
   - **Opción A (desde la web de GitHub):** abre tu repositorio → *Add file* → *Upload files*, arrastra el contenido de la carpeta (incluyendo `.github/` y `src/`, sin `node_modules/` ni `dist/`) y confirma el commit en `main`.
   - **Opción B (con Git en terminal):**
     ```bash
     git init
     git add .
     git commit -m "Versión inicial de PrestaHerramienta"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
     git push -u origin main
     ```
4. En GitHub, entra en **Settings → Pages**.
5. En **Build and deployment → Source**, selecciona **GitHub Actions**.
6. El flujo `.github/workflows/deploy.yml` compilará automáticamente el proyecto (`npm run build`) y publicará la web estática cada vez que actualices la rama `main`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilar versión estática manual

```bash
npm run build
```

Los archivos estáticos listos para publicar se generan en la carpeta `dist/`.
