const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");
const asyncHandler = require("../../middleware/asyncHandler");
const { authRequired } = require("../../middleware/auth");

const router = express.Router();

/* ============================================================
   HELPERS
============================================================ */
const badRequest = (res, msg, details) =>
  res.status(400).json({ ok: false, error: msg, details });

const notFound = (res, msg) =>
  res.status(404).json({ ok: false, error: msg });

/* ============================================================
   IMAGE UPLOAD CONFIG
============================================================ */
const uploadPath = path.join(__dirname, "../../uploads/sales");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"));
    }
    cb(null, true);
  },
});

/* ============================================================
   RLS CONTEXT
============================================================ */
router.use(
  authRequired,
  asyncHandler(async (req, _res, next) => {
    await req.db.query(
      `SELECT set_config('app.user_id', $1, true)`,
      [req.user.id]
    );
    next();
  })
);

/* ============================================================
   BASE SELECT (REUSED EVERYWHERE)
============================================================ */
const BASE_SELECT = `
SELECT
  si.id,
  si.number,
  si.item,
  si.product_image_url,
  si.diamond_pcs,
  si.diamond_carat,
  si.rate,
  si.total_diamond_price,
  si.gold,
  si.gold_price,
  si.labour_charge,
  si.total_making_cost,
  si.selling_price,
  si.created_at,
  si.updated_at,

  p.id AS product_id,
  p.title AS product_title,
  p.sku AS product_sku,

  cu.id AS customer_id,
  cu.name AS customer_name,
  cu.phone AS customer_phone,

  cr.id AS craftsman_id,
  cr.name AS craftsman_name,
  cr.code AS craftsman_code

FROM sales_items si
LEFT JOIN products p ON p.id = si.product_id
LEFT JOIN customers cu ON cu.id = si.customer_id
LEFT JOIN craftsmen cr ON cr.id = si.craftsman_id
`;

/* ============================================================
   LIST + FILTER + PAGINATION
============================================================ */
router.get("/", asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    product_id,
    customer_id,
    craftsman_id,
    from_date,
    to_date,
    search,
  } = req.query;

  const where = [];
  const args = [];

  if (product_id) {
    args.push(product_id);
    where.push(`si.product_id = $${args.length}`);
  }

  if (customer_id) {
    args.push(customer_id);
    where.push(`si.customer_id = $${args.length}`);
  }

  if (craftsman_id) {
    args.push(craftsman_id);
    where.push(`si.craftsman_id = $${args.length}`);
  }

  if (from_date) {
    args.push(from_date);
    where.push(`si.created_at >= $${args.length}`);
  }

  if (to_date) {
    args.push(to_date);
    where.push(`si.created_at <= $${args.length}`);
  }

  if (search) {
    args.push(`%${search}%`);
    where.push(`(si.number ILIKE $${args.length} OR si.item ILIKE $${args.length} OR p.title ILIKE $${args.length})`);
  }

  const offset = (page - 1) * limit;

  const query = `
    ${BASE_SELECT}
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY si.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const result = await req.db.query(query, args);

  res.json({
    ok: true,
    page: Number(page),
    limit: Number(limit),
    count: result.rowCount,
    results: result.rows,
  });
}));

/* ============================================================
   GET BY ID
============================================================ */
router.get("/:id", asyncHandler(async (req, res) => {
  const result = await req.db.query(
    `${BASE_SELECT} WHERE si.id = $1`,
    [req.params.id]
  );

  if (!result.rowCount) return notFound(res, "sale_not_found");
  res.json({ ok: true, result: result.rows[0] });
}));

/* ============================================================
   CREATE
============================================================ */
router.post("/", upload.single("product_image"), asyncHandler(async (req, res) => {
  const {
    number,
    item,
    product_id,
    customer_id,
    craftsman_id,
    diamond_pcs = 0,
    diamond_carat = 0,
    rate = 0,
    gold = 0,
    gold_price = 0,
    labour_charge = 0,
  } = req.body;

  if (!number || !item) {
    return badRequest(res, "required_fields_missing", { required: ["number", "item"] });
  }

  const imageUrl = req.file
    ? `/uploads/sales/${req.file.filename}`
    : null;

  const result = await req.db.query(
    `
    INSERT INTO sales_items (
      number, item, product_id,
      customer_id, craftsman_id,
      diamond_pcs, diamond_carat, rate,
      gold, gold_price, labour_charge,
      product_image_url, created_by
    )
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,$10,$11,$12,
      app_user_id_uuid_or_null()
    )
    RETURNING *
    `,
    [
      number, item, product_id || null,
      customer_id || null, craftsman_id || null,
      diamond_pcs, diamond_carat, rate,
      gold, gold_price, labour_charge,
      imageUrl,
    ]
  );

  res.status(201).json({ ok: true, result: result.rows[0] });
}));

/* ============================================================
   UPDATE
============================================================ */
router.put("/:id", upload.single("product_image"), asyncHandler(async (req, res) => {
  const fields = [];
  const args = [];

  // Only update fields that are provided
  const allowedFields = [
    'number', 'item', 'product_id', 'customer_id', 'craftsman_id',
    'diamond_pcs', 'diamond_carat', 'rate', 'gold', 'gold_price', 'labour_charge'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      args.push(req.body[field]);
      fields.push(`${field} = $${args.length}`);
    }
  });

  if (req.file) {
    args.push(`/uploads/sales/${req.file.filename}`);
    fields.push(`product_image_url = $${args.length}`);
  }

  if (!fields.length) return badRequest(res, "no_fields_to_update");

  args.push(req.params.id);

  const result = await req.db.query(
    `UPDATE sales_items SET ${fields.join(", ")}, updated_at = now()
     WHERE id = $${args.length} RETURNING *`,
    args
  );

  if (!result.rowCount) return notFound(res, "sale_not_found");
  res.json({ ok: true, result: result.rows[0] });
}));

/* ============================================================
   DELETE
============================================================ */
router.delete("/:id", asyncHandler(async (req, res) => {
  const r = await req.db.query(
    `DELETE FROM sales_items WHERE id = $1 RETURNING id, product_image_url`,
    [req.params.id]
  );
  
  if (!r.rowCount) return notFound(res, "sale_not_found");
  
  // Delete image file if exists
  if (r.rows[0].product_image_url) {
    const imagePath = path.join(__dirname, "../..", r.rows[0].product_image_url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  res.json({ ok: true });
}));

/* ============================================================
   EXPORT CSV
============================================================ */
router.get("/export/csv", asyncHandler(async (req, res) => {
  const r = await req.db.query(BASE_SELECT + " ORDER BY si.created_at DESC");
  const parser = new Parser();
  res.header("Content-Type", "text/csv");
  res.attachment("sales_items.csv");
  res.send(parser.parse(r.rows));
}));

/* ============================================================
   EXPORT EXCEL
============================================================ */
router.get("/export/excel", asyncHandler(async (req, res) => {
  const r = await req.db.query(BASE_SELECT + " ORDER BY si.created_at DESC");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales");

  if (r.rows.length > 0) {
    ws.columns = Object.keys(r.rows[0]).map(k => ({
      header: k,
      key: k,
      width: 20,
    }));

    r.rows.forEach(row => ws.addRow(row));
  }

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales_items.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  await wb.xlsx.write(res);
  res.end();
}));

/* ============================================================
   EXPORT PDF
============================================================ */
router.get("/export/pdf", asyncHandler(async (req, res) => {
  const r = await req.db.query(BASE_SELECT + " ORDER BY si.created_at DESC");

  const doc = new PDFDocument({ layout: "landscape", margin: 20 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales_items.pdf");

  doc.pipe(res);
  doc.fontSize(16).text("Sales Register", { align: "center" });
  doc.moveDown();

  r.rows.forEach(row => {
    doc.fontSize(8).text(
      `#${row.number} | ${row.item} | ₹${row.selling_price || 0} | ${row.customer_name || 'N/A'}`
    );
    doc.moveDown(0.3);
  });

  doc.end();
}));

module.exports = router;
