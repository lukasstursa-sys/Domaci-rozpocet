const express = require('express');
const PDFDocument = require('pdfkit');
const { findByUserId } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/reports/wellmall?month=X&year=Y
router.get('/wellmall', (req, res) => {
  const { month, year } = req.query;
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const expenses = findByUserId('expenses', req.user.id).filter(
    e => e.month === targetMonth && e.year === targetYear && e.amountWellmall > 0
  );

  const monthNames = [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
  ];

  // Generate PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=wellmall-report-${targetYear}-${String(targetMonth).padStart(2, '0')}.pdf`
  );

  doc.pipe(res);

  // Header
  doc.fontSize(20).text('WellMall s.r.o.', { align: 'center' });
  doc.fontSize(14).text(`Report výdajů - ${monthNames[targetMonth - 1]} ${targetYear}`, { align: 'center' });
  doc.moveDown(2);

  // Table header
  doc.fontSize(10);
  const startX = 50;
  let y = doc.y;

  doc.font('Helvetica-Bold');
  doc.text('Položka', startX, y, { width: 200 });
  doc.text('Kategorie', startX + 200, y, { width: 120 });
  doc.text('Částka WellMall', startX + 320, y, { width: 100, align: 'right' });
  doc.text('Celkem', startX + 420, y, { width: 80, align: 'right' });

  doc.moveDown();
  doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke();
  doc.moveDown(0.5);

  // Table rows
  doc.font('Helvetica');
  let totalWellmall = 0;
  let totalAll = 0;

  expenses.forEach(exp => {
    y = doc.y;
    doc.text(exp.title, startX, y, { width: 200 });
    doc.text(exp.categoryId, startX + 200, y, { width: 120 });
    doc.text(`${exp.amountWellmall} Kč`, startX + 320, y, { width: 100, align: 'right' });
    doc.text(`${exp.amountTotal} Kč`, startX + 420, y, { width: 80, align: 'right' });
    doc.moveDown();

    totalWellmall += exp.amountWellmall;
    totalAll += exp.amountTotal;
  });

  // Total
  doc.moveDown();
  doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke();
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold');
  y = doc.y;
  doc.text('CELKEM', startX, y, { width: 200 });
  doc.text(`${totalWellmall} Kč`, startX + 320, y, { width: 100, align: 'right' });
  doc.text(`${totalAll} Kč`, startX + 420, y, { width: 80, align: 'right' });

  doc.moveDown(3);
  doc.fontSize(8).font('Helvetica');
  doc.text(`Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')}`, { align: 'center' });

  doc.end();
});

module.exports = router;
