import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import Dataset from '../models/Dataset.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    cb(allowed ? null : new Error('Only CSV files are supported right now.'), allowed);
  }
});
router.use(requireAuth);

function isNumeric(value) {
  if (value === null || value === undefined || String(value).trim() === '') return false;
  return Number.isFinite(Number(value));
}

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a CSV file to upload.' });
    const rows = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
    if (!rows.length) return res.status(400).json({ message: 'The CSV has no data rows.' });
    const names = Object.keys(rows[0] || {});
    if (!names.length) return res.status(400).json({ message: 'Could not find column headers in this CSV.' });
    const columns = names.map(name => {
      const values = rows.map(row => row[name]);
      const present = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
      const numericValues = present.filter(isNumeric).map(Number);
      return {
        name,
        type: present.length && numericValues.length / present.length > 0.8 ? 'numeric' : 'text',
        missing: rows.length - present.length,
        unique: new Set(present.map(String)).size
      };
    });
    const numericSummary = columns.filter(c => c.type === 'numeric').map(col => {
      const values = rows.map(r => r[col.name]).filter(isNumeric).map(Number);
      const sum = values.reduce((a, b) => a + b, 0);
      return { name: col.name, count: values.length, min: Math.min(...values), max: Math.max(...values), mean: Number((sum / values.length).toFixed(2)) };
    });
console.log("Columns before save:", JSON.stringify(columns, null, 2));

const columnsPath = Dataset.schema.path("columns");
console.log(
  "Columns schema type:",
  columnsPath ? columnsPath.instance : "Schema path not found"
);
    const dataset = await Dataset.create({
      userId: req.user.id, originalName: req.file.originalname, rowCount: rows.length,
      columnCount: names.length, columns, rows, preview: rows.slice(0, 10), numericSummary
    });
    res.status(201).json({ dataset });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const datasets = await Dataset.find({ userId: req.user.id }).sort({ createdAt: -1 }).select('-preview');
    res.json({ datasets });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, userId: req.user.id });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found.' });
    res.json({ dataset });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const dataset = await Dataset.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!dataset) return res.status(404).json({ message: 'Dataset not found.' });
    res.json({ message: 'Dataset deleted.' });
  } catch (error) { next(error); }
});

export default router;
