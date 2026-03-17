# Dashboard Electoral — Distrito 10 NL · Guía de Setup

## 1. Instalar dependencias

```bash
cd C:\Users\naimg\n8ntest\electoral-dashboard
npm install
```

---

## 2. Extraer el shapefile (solo una vez)

Tu shapefile está en dos capas de compresión:

```
Downloads\bgd_19_Shapefile.zip
  └── 19 NUEVO LEON.7z
        └── SECCION.shp, .dbf, .prj, .shx
```

**Pasos:**
1. Extrae `bgd_19_Shapefile.zip` (clic derecho → Extraer aquí o con WinRAR/7-Zip)
2. Extrae `19 NUEVO LEON.7z` (necesitas [7-Zip](https://www.7-zip.org/))
3. Copia `SECCION.shp`, `SECCION.dbf`, `SECCION.prj`, `SECCION.shx` a:
   ```
   electoral-dashboard/scripts/shapefiles/
   ```

**Convierte a GeoJSON:**
```bash
npm run convert-shapefile
```

Verás algo como:
```
📂 Reading: scripts/shapefiles/SECCION.shp
✅ Detected district column: "DISTRITO_F" (sample value: 1)
📊 Total sections in file: 3500
🗺️  Sections in Distrito 10: 87
✅ Written to: public/data/distrito10.geojson (245 KB)
🎉 Done! You can now run: npm run dev
```

---

## 3. Crear tabla en Supabase

Ve a [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor** → **New query** → pega y ejecuta:

```sql
-- 1. Crear tabla
CREATE TABLE seccion_alcance (
  id SERIAL PRIMARY KEY,
  seccion INTEGER UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (acceso público sin login)
ALTER TABLE seccion_alcance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON seccion_alcance FOR ALL USING (true) WITH CHECK (true);

-- 3. Función para incrementar de forma atómica (evita condiciones de carrera)
CREATE OR REPLACE FUNCTION increment_seccion(p_seccion INTEGER)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_count INTEGER;
BEGIN
  INSERT INTO seccion_alcance (seccion, count, updated_at)
  VALUES (p_seccion, 1, NOW())
  ON CONFLICT (seccion)
  DO UPDATE SET count = seccion_alcance.count + 1, updated_at = NOW()
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

-- 4. Cargar datos existentes del CSV
INSERT INTO seccion_alcance (seccion, count, updated_at) VALUES
  (1762, 2, NOW()),
  (1790, 2, NOW()),
  (1804, 1, NOW()),
  (1805, 1, NOW()),
  (1817, 1, NOW()),
  (1828, 1, NOW()),
  (1836, 1, NOW()),
  (1869, 1, NOW())
ON CONFLICT (seccion) DO UPDATE SET count = EXCLUDED.count, updated_at = NOW();
```

### Habilitar Realtime

1. En Supabase Dashboard → **Database** → **Replication**
2. Busca la tabla `seccion_alcance`
3. Activa el toggle (debe quedar en azul)

---

## 4. Probar localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

Prueba:
- El mapa debe mostrar las secciones de San Nicolás de los Garza coloreadas
- Las 8 secciones del CSV deben aparecer en naranja
- Escribe `1804` y presiona Enter → debe incrementar a 2 y el mapa actualizar
- Abre en otra pestaña → ambas deben actualizarse al mismo tiempo (Realtime)

---

## 5. Desplegar en Vercel

```bash
# Instala Vercel CLI (si no la tienes)
npm install -g vercel

# Login
vercel login

# Deploy (desde la carpeta del proyecto)
vercel
```

O vía GitHub:
1. Crea repo en GitHub: `electoral-dashboard-d10`
2. `git init && git add . && git commit -m "init" && git remote add origin ... && git push`
3. Ve a [vercel.com](https://vercel.com) → **Add New Project** → importa el repo
4. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://zgmhesniestfkihjjbru.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGci...` (el valor completo)
5. Click **Deploy**

**Importante:** `public/data/distrito10.geojson` debe estar commiteado en git (no es dato sensible).
El `.env.local` NO debe commitearse (ya está en .gitignore).

---

## Estructura de archivos

```
electoral-dashboard/
├── scripts/
│   ├── shapefiles/          ← coloca los archivos .shp aquí
│   └── convert-shapefile.js ← script de conversión
├── public/data/
│   └── distrito10.geojson   ← generado por el script
├── lib/supabase.ts           ← cliente Supabase
├── hooks/useAlcance.ts       ← hook con Realtime
├── components/
│   ├── ElectoralMap.tsx      ← mapa coroplético
│   ├── CaptureForm.tsx       ← formulario de captura
│   └── LogReciente.tsx       ← historial de sesión
├── app/
│   ├── page.tsx              ← página principal
│   ├── layout.tsx
│   ├── globals.css
│   └── api/alcance/route.ts  ← API POST para incrementar
├── .env.local                ← variables de entorno (no commitear)
├── package.json
└── next.config.js
```
