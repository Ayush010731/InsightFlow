
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Dataset from '../models/Dataset.js';

const router = Router();

router.use(requireAuth);

const AGENT_URL =
  process.env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000';

// Safely escape CSV values.
function escapeCsv(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

// Convert the selected MongoDB dataset into CSV text.
function datasetToCsv(dataset) {
  const columns = (dataset.columns || []).map(column => column.name);
  const rows = dataset.rows || [];

  if (!columns.length) {
    throw new Error('The selected dataset has no columns.');
  }

  if (!rows.length) {
    throw new Error('The selected dataset has no data rows.');
  }

  const header = columns.map(escapeCsv).join(',');

  const csvRows = rows.map(row =>
    columns
      .map(column => escapeCsv(row?.[column]))
      .join(',')
  );

  return [header, ...csvRows].join('\n');
}

router.post('/', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    const datasetId = req.body.datasetId;

    if (!message) {
      return res.status(400).json({
        message: 'Please enter a question.'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        message: 'Question must be 2,000 characters or fewer.'
      });
    }

    if (!datasetId) {
      return res.status(400).json({
        message: 'Please select a dataset before asking a question.'
      });
    }

    // Fetch only the dataset belonging to the logged-in user.
    const dataset = await Dataset.findOne({
      _id: datasetId,
      userId: req.user.id
    });

    if (!dataset) {
      return res.status(404).json({
        message: 'Selected dataset was not found.'
      });
    }

    // Convert MongoDB rows into CSV text.
    const csvText = datasetToCsv(dataset);

    if (csvText.length > 2_000_000) {
      return res.status(413).json({
        message: 'Dataset is too large for one AI request.'
      });
    }

    console.log('Dataset attached:', Boolean(csvText));
    console.log('Dataset name:', dataset.originalName);
    console.log('CSV preview:', csvText.slice(0, 200));

    // Send both the question and CSV data to the Python agent.
    const response = await fetch(`${AGENT_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        csv_text: csvText
      }),
      signal: AbortSignal.timeout(120000)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        'InsightFlow agent error:',
        response.status,
        data
      );

      return res.status(502).json({
        message:
          data.detail ||
          'The InsightFlow AI agent could not process your request.'
      });
    }

    return res.json({
      answer: data.answer || 'The AI agent returned an empty response.',
      chart: data.chart || null,
      mode: data.mode || 'agent'
    });

  } catch (error) {
    console.error('AI Analyst error:', error);

    return res.status(502).json({
      message:
        error.message ||
        'Unable to connect to the InsightFlow AI service.',
      details: error.cause?.message || null
    });
  }
});

export default router;
