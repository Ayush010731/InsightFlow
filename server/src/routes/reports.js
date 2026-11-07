
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Dataset from '../models/Dataset.js';
import Report from '../models/Report.js';
import nodemailer from 'nodemailer';

const router = Router();

router.use(requireAuth);

const AGENT_URL =
  process.env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function escapeCsv(value) {
  if (value === null || value === undefined) return '';

  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function datasetToCsv(dataset) {
  const columns = (dataset.columns || []).map(column => column.name);
  const rows = dataset.rows || [];

  if (!columns.length || !rows.length) {
    throw new Error('Selected dataset has no columns or data rows.');
  }

  const header = columns.map(escapeCsv).join(',');

  const csvRows = rows.map(row =>
    columns.map(column => escapeCsv(row?.[column])).join(',')
  );

  return [header, ...csvRows].join('\n');
}

// 1. Generate AI report and save it to MongoDB.
router.post('/generate', async (req, res) => {
  try {
    const { datasetId } = req.body;

    if (!datasetId || !mongoose.isValidObjectId(datasetId)) {
      return res.status(400).json({
        message: 'Please select a valid dataset.'
      });
    }

    const dataset = await Dataset.findOne({
      _id: datasetId,
      userId: req.user.id
    });

    if (!dataset) {
      return res.status(404).json({
        message: 'Selected dataset was not found.'
      });
    }

    const csvText = datasetToCsv(dataset);

    if (csvText.length > 2_000_000) {
      return res.status(413).json({
        message: 'Dataset is too large for report generation.'
      });
    }

    const response = await fetch(`${AGENT_URL}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataset_name: dataset.originalName,
        csv_text: csvText
      }),
      signal: AbortSignal.timeout(180000)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('AI report service error:', response.status, data);

      return res.status(502).json({
        message: data.detail || 'AI report generation failed.'
      });
    }

    if (typeof data.report !== 'string' || !data.report.trim()) {
      return res.status(502).json({
        message: 'AI service returned an empty report.'
      });
    }

    const savedReport = await Report.create({
      userId: req.user.id,
      datasetId: dataset._id,
      datasetName: dataset.originalName,
      report: data.report
    });

    return res.status(201).json({
      report: data.report,
      datasetName: dataset.originalName,
      reportId: savedReport._id,
      createdAt: savedReport.createdAt,
      mode: data.mode || 'agent'
    });

  } catch (error) {
    console.error('AI report generation error:', error);

    return res.status(502).json({
      message: error.message || 'Unable to generate AI report.'
    });
  }
});

// 2. Get all reports belonging to the logged-in user.
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find({
      userId: req.user.id
    })
      .select('datasetName datasetId createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ reports });

  } catch (error) {
    console.error('Report history error:', error);

    return res.status(500).json({
      message: 'Unable to load report history.'
    });
  }
});

// 3. Get one saved report.
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid report ID.'
      });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        message: 'Report not found.'
      });
    }

    return res.json({ report });

  } catch (error) {
    console.error('Report fetch error:', error);

    return res.status(500).json({
      message: 'Unable to open report.'
    });
  }
});

// 4. Delete a saved report.
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid report ID.'
      });
    }

    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!report) {
      return res.status(404).json({
        message: 'Report not found.'
      });
    }

    return res.json({
      message: 'Report deleted successfully.'
    });

  } catch (error) {
    console.error('Report deletion error:', error);

    return res.status(500).json({
      message: 'Unable to delete report.'
    });
  }
});

// 5. Email a saved report as a PDF attachment using Gmail SMTP.
router.post('/:id/email', async (req, res) => {
  try {
    const { recipientEmail } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid report ID.'
      });
    }

    const email = String(recipientEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid recipient email.'
      });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(503).json({
        message: 'Gmail SMTP is not configured. Check GMAIL_USER and GMAIL_APP_PASSWORD.'
      });
    }

    const savedReport = await Report.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!savedReport) {
      return res.status(404).json({
        message: 'Saved report not found.'
      });
    }

    // Generate PDF using the existing Python service.
    const pdfResponse = await fetch(`${AGENT_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataset_name: savedReport.datasetName,
        report: savedReport.report
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.json().catch(() => ({}));

      console.error('Email PDF generation error:', errorData);

      return res.status(502).json({
        message: 'Unable to generate PDF for email.'
      });
    }

    const contentType = pdfResponse.headers.get('content-type') || '';

    if (!contentType.includes('application/pdf')) {
      return res.status(502).json({
        message: 'PDF service returned an invalid file.'
      });
    }

    const pdfBuffer = Buffer.from(
      await pdfResponse.arrayBuffer()
    );

    const safeName = savedReport.datasetName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const filename = `${safeName}_report.pdf`;

    const safeDatasetName = savedReport.datasetName.replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
    );

    const info = await transporter.sendMail({
      from: {
        name: 'InsightFlow',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: `Your InsightFlow Report - ${savedReport.datasetName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Your InsightFlow Report is Ready!</h2>
          <p>Hello,</p>
          <p>Your data analysis report has been generated successfully.</p>
          <p><strong>Dataset:</strong> ${safeDatasetName}</p>
          <p>Please find your report attached as a PDF.</p>
          <br/>
          <p>Regards,<br/><strong>InsightFlow Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    return res.json({
      message: 'Report emailed successfully.',
      email,
      emailId: info.messageId
    });

  } catch (error) {
    console.error('Email report error:', error);

    return res.status(500).json({
      message: 'Unable to email report. Please try again.'
    });
  }
});

// 6. Generate and download PDF.
router.post('/pdf', async (req, res) => {
  try {
    const { datasetId, report } = req.body;

    if (!datasetId || !mongoose.isValidObjectId(datasetId)) {
      return res.status(400).json({
        message: 'Please select a valid dataset.'
      });
    }

    if (typeof report !== 'string' || !report.trim()) {
      return res.status(400).json({
        message: 'Report content is required.'
      });
    }

    const dataset = await Dataset.findOne({
      _id: datasetId,
      userId: req.user.id
    });

    if (!dataset) {
      return res.status(404).json({
        message: 'Selected dataset was not found.'
      });
    }

    const response = await fetch(`${AGENT_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataset_name: dataset.originalName,
        report
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      console.error('PDF service error:', response.status, errorData);

      return res.status(502).json({
        message: errorData.detail || 'PDF generation failed.'
      });
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/pdf')) {
      return res.status(502).json({
        message: 'PDF service returned an invalid file.'
      });
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    const filename = `${dataset.originalName.replace(/\.[^/.]+$/, '')}_report.pdf`
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF download error:', error);

    return res.status(502).json({
      message: error.message || 'Unable to download PDF.'
    });
  }
});

export default router;
