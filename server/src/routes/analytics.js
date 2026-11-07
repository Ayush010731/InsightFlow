import express from "express";
import Dataset from "../models/Dataset.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found" });
    }

    const rows = dataset.rows || [];
    const columns = dataset.columns || [];

    const numericColumns = columns
      .filter((column) =>
        rows.some(
          (row) =>
            row[column.name] !== "" &&
            row[column.name] !== null &&
            row[column.name] !== undefined &&
            Number.isFinite(Number(row[column.name]))
        )
      )
      .map((column) => {
        const values = rows
          .map((row) => row[column.name])
          .filter(
            (value) =>
              value !== "" &&
              value !== null &&
              value !== undefined &&
              Number.isFinite(Number(value))
          )
          .map(Number);

        const total = values.reduce((sum, value) => sum + value, 0);

        return {
          name: column.name,
          count: values.length,
          total,
          average: values.length ? total / values.length : 0,
          minimum: values.length ? Math.min(...values) : null,
          maximum: values.length ? Math.max(...values) : null,
        };
      });

    res.json({
      dataset: dataset.originalName,
      rowCount: rows.length,
      columnCount: columns.length,
      numericColumns,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Failed to calculate analytics" });
  }
});

export default router;