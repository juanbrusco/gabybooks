
## 1. Project Overview & Tech Stack

### 1.1. Tech Stack & Dependencias Clave
- **Frontend Core**: **React 19** (`19.0.1`), **React DOM** (`19.0.1`).
- **Build Tool & Dev Server**: **Vite 6** (`6.2.3`) con plugin oficial `@vitejs/plugin-react` (`5.0.4`).
- **Styling**: **Tailwind CSS v4** (`4.1.14`) vía plugin oficial `@tailwindcss/vite`.
- **Backend / API**: **Express 4** (`4.21.2`) ejecutado con `tsx` en desarrollo y empaquetado como serverless monolith o bundle Node CJS en producción.
- **Database Driver**: `@neondatabase/serverless` (`1.1.0`) para conexión a **PostgreSQL Serverless en Neon** sobre HTTP/WebSockets con pooling sin conexiones TCP duraderas.
- **Animaciones & UI**: `motion` (`12.23.24`) para transiciones declarativas de alta fidelidad, `lucide-react` (`0.546.0`) para iconografía uniforme.
- **Bundler de Servidor**: `esbuild` (`0.25.0`) para compilar `server.ts` a `dist/server.cjs` en builds de contenedor.
- **Configuración & Env**: `dotenv` (`17.2.3`).

---

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

### Host

1. GoogleAI Studio (desarrollo inicial)
2. NeonDB plan free
3. Vercel plan free
4. GitHub