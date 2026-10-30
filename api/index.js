// server/app.ts
import express from "express";

// server/db.ts
import "dotenv/config";
import path from "path";
import fs from "fs";
import pg from "pg";
import Papa from "papaparse";
pg.types.setTypeParser(1082, (val) => val);
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
function safeDate(val) {
  if (!val || typeof val !== "string" || !val.trim()) return null;
  const s = val.trim().replace(/[Oo]/g, "0");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/(?:(\d{1,2})[-–])?(\d{1,3})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) {
    const [, , dayStr, monthStr, yearStr] = m;
    let day = parseInt(dayStr, 10);
    let month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);
    if (year < 100) year += 2e3;
    else if (year < 1e3) year = 2023;
    if (day > 31 && (dayStr.startsWith("111") || dayStr.startsWith("11"))) day = 11;
    if (month > 12) month = 12;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1990 && year <= 2035) {
      const y = String(year).padStart(4, "0");
      const mo = String(month).padStart(2, "0");
      const d2 = String(day).padStart(2, "0");
      return `${y}-${mo}-${d2}`;
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return null;
}
function safeStars(val) {
  if (val === void 0 || val === null || val === "") return null;
  const num = Number(val);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return Math.round(num);
  }
  return null;
}
function mapRowToBook(row) {
  let fechaStr = "";
  if (row.fecha) {
    if (typeof row.fecha === "string") {
      fechaStr = row.fecha.substring(0, 10);
    } else if (row.fecha instanceof Date) {
      fechaStr = row.fecha.toISOString().split("T")[0];
    }
  }
  let estadoKindle = "no_descargado";
  if (row.estado_kindle === "en_kindle") {
    estadoKindle = "en_kindle";
  } else if (row.estado_kindle === "por_conseguir") {
    estadoKindle = "por_conseguir";
  }
  return {
    id: String(row.id),
    titulo: row.titulo || "",
    autor: row.autor || "",
    leido: Boolean(row.leido),
    calificacionRaw: row.calificacion_raw || "",
    ratingStars: row.calificacion_estrellas ? Number(row.calificacion_estrellas) : 0,
    comentario: row.comentario || "",
    fecha: fechaStr,
    lugar: row.lugar || "",
    descargadoRaw: row.descargado_raw || "",
    estadoKindle
  };
}
async function seedInitialBooksFromCSV() {
  const csvPath = path.join(process.cwd(), "public", "libros_iniciales.csv");
  if (!fs.existsSync(csvPath)) return [];
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  const insertedBooks = [];
  for (const row of parsed.data) {
    const autor = row["AUTOR"] || row["autor"] || "";
    const titulo = row["T\xCDTULO"] || row["TITULO"] || row["titulo"] || "";
    if (!titulo && !autor) continue;
    const descargadoRaw = (row["DESCARGADO"] || row["descargado"] || "").trim();
    const leidoRaw = (row["LE\xCDDO"] || row["leido"] || "").trim();
    const descargadoLower = descargadoRaw.toLowerCase();
    const leidoLower = leidoRaw.toLowerCase();
    let leido = false;
    if ((descargadoLower === "si" || descargadoLower === "s\xED") && (!leidoRaw || leidoLower === "null" || leidoLower === "undefined" || leidoLower === "no")) {
      leido = false;
    } else if (leidoLower === "si" || leidoLower === "s\xED" || leidoLower === "true") {
      leido = true;
    } else {
      leido = false;
    }
    let estadoKindle = "no_descargado";
    if (descargadoLower === "si" || descargadoLower === "s\xED") {
      estadoKindle = "en_kindle";
    } else if (descargadoLower.includes("no conseguido") || descargadoLower.includes("por conseguir")) {
      estadoKindle = "por_conseguir";
    }
    const califRaw = (row["CALIFICACI\xD3N"] || row["calificacion"] || "").trim();
    let ratingStars = 0;
    const match = califRaw.match(/([1-5])/);
    if (match) ratingStars = parseInt(match[1], 10);
    const comentario = (row["COMENTARIO"] || row["comentario"] || "").trim();
    const fecha = safeDate(row["FECHA"] || row["fecha"] || "");
    const lugar = (row["LUGAR"] || row["lugar"] || "").trim();
    const res = await pool.query(
      `INSERT INTO libros (
        titulo, autor, leido, calificacion_estrellas, calificacion_raw,
        comentario, fecha, lugar, estado_kindle, descargado_raw
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        titulo,
        autor,
        leido,
        safeStars(ratingStars),
        califRaw,
        comentario,
        fecha,
        lugar,
        estadoKindle,
        descargadoRaw
      ]
    );
    insertedBooks.push(mapRowToBook(res.rows[0]));
  }
  return insertedBooks;
}
var initPromise = null;
function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS libros (
          id SERIAL PRIMARY KEY,
          titulo TEXT NOT NULL DEFAULT '',
          autor TEXT NOT NULL DEFAULT '',
          leido BOOLEAN NOT NULL DEFAULT FALSE,
          calificacion_estrellas INTEGER,
          calificacion_raw TEXT NOT NULL DEFAULT '',
          comentario TEXT NOT NULL DEFAULT '',
          fecha DATE,
          lugar TEXT NOT NULL DEFAULT '',
          estado_kindle TEXT NOT NULL DEFAULT 'no_descargado',
          descargado_raw TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const res = await pool.query("SELECT COUNT(*) FROM libros");
      const count = parseInt(res.rows[0].count, 10);
      console.log(`[NeonDB] Conectado exitosamente. Total de libros actuales: ${count}`);
      if (count === 0) {
        console.log("[NeonDB] Tabla vac\xEDa. Sembrando cat\xE1logo inicial desde libros_iniciales.csv...");
        const seeded = await seedInitialBooksFromCSV();
        console.log(`[NeonDB] Se insertaron ${seeded.length} libros iniciales.`);
      }
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// server/app.ts
var app = express();
app.use(express.json({ limit: "10mb" }));
var apiRouter = express.Router();
apiRouter.use(["/health", "/books"], async (_req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (err) {
    console.error("[NeonDB] Error al inicializar base de datos:", err);
    res.status(500).json({ error: "Error al conectar con NeonDB", details: err.message });
  }
});
apiRouter.get("/health", async (_req, res) => {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM libros");
    res.json({
      status: "ok",
      db: "connected",
      count: parseInt(countRes.rows[0].count, 10)
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});
apiRouter.get("/books", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM libros ORDER BY created_at DESC, id DESC"
    );
    const books = result.rows.map(mapRowToBook);
    res.json({ books });
  } catch (err) {
    console.error("Error in GET /api/books:", err);
    res.status(500).json({ error: "Error al consultar libros en NeonDB", details: err.message });
  }
});
apiRouter.post("/books", async (req, res) => {
  try {
    const {
      titulo,
      autor,
      leido,
      calificacionRaw,
      ratingStars,
      comentario,
      fecha,
      lugar,
      estadoKindle,
      descargadoRaw
    } = req.body;
    if (!titulo && !autor) {
      res.status(400).json({ error: "El libro debe tener al menos t\xEDtulo o autor" });
      return;
    }
    const parsedFecha = safeDate(fecha);
    const parsedStars = safeStars(ratingStars);
    const result = await pool.query(
      `INSERT INTO libros (
        titulo, autor, leido, calificacion_estrellas, calificacion_raw,
        comentario, fecha, lugar, estado_kindle, descargado_raw
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        titulo || "",
        autor || "",
        Boolean(leido),
        parsedStars,
        calificacionRaw || "",
        comentario || "",
        parsedFecha,
        lugar || "",
        estadoKindle || "no",
        descargadoRaw || ""
      ]
    );
    res.status(201).json({ book: mapRowToBook(result.rows[0]) });
  } catch (err) {
    console.error("Error in POST /api/books:", err);
    res.status(500).json({ error: "Error al crear libro", details: err.message });
  }
});
apiRouter.put("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query("SELECT * FROM libros WHERE id = $1", [id]);
    if (current.rowCount === 0) {
      res.status(404).json({ error: "Libro no encontrado" });
      return;
    }
    const {
      titulo,
      autor,
      leido,
      calificacionRaw,
      ratingStars,
      comentario,
      fecha,
      lugar,
      estadoKindle,
      descargadoRaw
    } = { ...mapRowToBook(current.rows[0]), ...req.body };
    const parsedFecha = safeDate(fecha);
    const parsedStars = safeStars(ratingStars);
    const result = await pool.query(
      `UPDATE libros SET
        titulo = $1,
        autor = $2,
        leido = $3,
        calificacion_estrellas = $4,
        calificacion_raw = $5,
        comentario = $6,
        fecha = $7,
        lugar = $8,
        estado_kindle = $9,
        descargado_raw = $10
      WHERE id = $11
      RETURNING *`,
      [
        titulo || "",
        autor || "",
        Boolean(leido),
        parsedStars,
        calificacionRaw || "",
        comentario || "",
        parsedFecha,
        lugar || "",
        estadoKindle || "no",
        descargadoRaw || "",
        id
      ]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Libro no encontrado" });
      return;
    }
    res.json({ book: mapRowToBook(result.rows[0]) });
  } catch (err) {
    console.error("Error in PUT /api/books/:id:", err);
    res.status(500).json({ error: "Error al actualizar libro", details: err.message });
  }
});
apiRouter.delete("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM libros WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Libro no encontrado" });
      return;
    }
    res.json({ success: true, message: "Libro eliminado de la base de datos" });
  } catch (err) {
    console.error("Error in DELETE /api/books/:id:", err);
    res.status(500).json({ error: "Error al eliminar libro", details: err.message });
  }
});
apiRouter.post("/books/batch", async (req, res) => {
  try {
    const { books, mode } = req.body;
    if (!Array.isArray(books)) {
      res.status(400).json({ error: "Formato inv\xE1lido: se esperaba un arreglo de libros" });
      return;
    }
    if (mode === "replace") {
      await pool.query("DELETE FROM libros");
    }
    const insertedList = [];
    for (const b of books) {
      const titulo = b.titulo || "";
      const autor = b.autor || "";
      if (!titulo && !autor) continue;
      const parsedFecha = safeDate(b.fecha);
      const parsedStars = safeStars(b.ratingStars);
      const r = await pool.query(
        `INSERT INTO libros (
          titulo, autor, leido, calificacion_estrellas, calificacion_raw,
          comentario, fecha, lugar, estado_kindle, descargado_raw
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          titulo,
          autor,
          Boolean(b.leido),
          parsedStars,
          b.calificacionRaw || "",
          b.comentario || "",
          parsedFecha,
          b.lugar || "",
          b.estadoKindle || "no",
          b.descargadoRaw || ""
        ]
      );
      insertedList.push(mapRowToBook(r.rows[0]));
    }
    res.json({
      success: true,
      count: insertedList.length,
      mode
    });
  } catch (err) {
    console.error("Error in POST /api/books/batch:", err);
    res.status(500).json({ error: "Error al procesar lote de libros", details: err.message });
  }
});
apiRouter.post("/books/seed", async (_req, res) => {
  try {
    await pool.query("DELETE FROM libros");
    const seeded = await seedInitialBooksFromCSV();
    res.json({ success: true, count: seeded.length, books: seeded });
  } catch (err) {
    console.error("Error in POST /api/books/seed:", err);
    res.status(500).json({ error: "Error al reiniciar cat\xE1logo", details: err.message });
  }
});
app.use("/api", apiRouter);
app.use("/", apiRouter);

// server-entry.ts
function handler(req, res) {
  return app(req, res);
}
export {
  app,
  handler as default
};
