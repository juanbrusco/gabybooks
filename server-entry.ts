import { app } from './server/app';

// Vercel function entry. Bundled by esbuild to api/index.js (see "build" script).
export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };
