import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Setup Virtual File System for fonts
if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts) {
  pdfMake.vfs = pdfFonts;
}

export const generateTaxSummaryPDF = (formData, oldRegime, newRegime, winnerLabel, savings, reasons, suggestions, winner) => {
  const formatCurr = (val) => `₹${Math.round(val).toLocaleString('en-IN')}`;
  
  // Helper to format values. If 0, make it light gray.
  const valCell = (val, isWinner = false) => {
    if (val === 0 || val === '0') {
      return { text: '₹0', alignment: 'right', color: '#9CA3AF' };
    }
    return { 
      text: val.toString().startsWith('-') ? `- ${formatCurr(Math.abs(val))}` : formatCurr(val), 
      alignment: 'right',
      color: isWinner ? '#10B981' : '#0F172A',
      bold: isWinner
    };
  };

  const tableBody = [
    [
      { text: 'Salary Head / Deductions', style: 'tableHeader' },
      { text: 'Old Regime', style: 'tableHeader', alignment: 'right' },
      { text: 'New Regime', style: 'tableHeader', alignment: 'right' }
    ],
    [{ text: 'Total Reconstructed Gross Income', bold: true }, valCell(oldRegime.gross), valCell(newRegime.gross)],
    ['Standard Deduction', valCell(-oldRegime.stdDeduction), valCell(-newRegime.stdDeduction)],
  ];

  if (oldRegime.hraExemption > 0) tableBody.push([{ text: 'HRA Exemption', color: '#64748B' }, valCell(-oldRegime.hraExemption), valCell(0)]);
  if (oldRegime.deduction80GG > 0) tableBody.push([{ text: '80GG Rent Exemption', color: '#64748B' }, valCell(-oldRegime.deduction80GG), valCell(0)]);
  if (oldRegime.deduction80C > 0) tableBody.push([{ text: '80C Investments (Inc. PF)', color: '#64748B' }, valCell(-oldRegime.deduction80C), valCell(0)]);
  if (oldRegime.deduction80D > 0) tableBody.push([{ text: '80D Health Insurance', color: '#64748B' }, valCell(-oldRegime.deduction80D), valCell(0)]);
  if (oldRegime.deduction80CCD1B > 0) tableBody.push([{ text: '80CCD(1B) Own NPS', color: '#64748B' }, valCell(-oldRegime.deduction80CCD1B), valCell(0)]);
  if (oldRegime.homeLoanDeduction > 0) tableBody.push([{ text: '24(b) Home Loan Interest', color: '#64748B' }, valCell(-oldRegime.homeLoanDeduction), valCell(0)]);
  if (oldRegime.employerNps > 0 || newRegime.employerNps > 0) tableBody.push([{ text: '80CCD(2) Employer NPS', color: '#64748B' }, valCell(-oldRegime.employerNps), valCell(-newRegime.employerNps)]);
  if (oldRegime.deductionTTAorTTB > 0) tableBody.push([{ text: oldRegime.ttaOrTtbLabel || '80TTA/80TTB Interest Deduction', color: '#64748B' }, valCell(-oldRegime.deductionTTAorTTB), valCell(0)]);

  tableBody.push(
    [{ text: 'Taxable Net Income', bold: true, margin: [0, 4, 0, 4] }, { ...valCell(oldRegime.taxableIncome), bold: true, margin: [0, 4, 0, 4] }, { ...valCell(newRegime.taxableIncome), bold: true, margin: [0, 4, 0, 4] }],
    ['Base Slab Tax', valCell(oldRegime.baseTax), valCell(newRegime.baseTax)]
  );

  if (oldRegime.capitalGainsTax > 0 || newRegime.capitalGainsTax > 0) {
    tableBody.push([{ text: 'Special Rate Tax (Capital Gains)', color: '#64748B' }, valCell(oldRegime.capitalGainsTax || 0), valCell(newRegime.capitalGainsTax || 0)]);
  }
  if (oldRegime.rebate > 0 || newRegime.rebate > 0) {
    tableBody.push([{ text: '87A Rebate / Relief', color: '#64748B' }, valCell(-oldRegime.rebate), valCell(-newRegime.rebate)]);
  }
  
  tableBody.push(['4% Cess', valCell(oldRegime.cess), valCell(newRegime.cess)]);

  // Final Net Tax
  tableBody.push([
    { text: 'Final Net Tax Due', bold: true, fontSize: 12, margin: [0, 8, 0, 8] },
    { ...valCell(oldRegime.finalTax, winner === 'old'), fontSize: 12, margin: [0, 8, 0, 8] },
    { ...valCell(newRegime.finalTax, winner === 'new'), fontSize: 12, margin: [0, 8, 0, 8] }
  ]);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [60, 80, 60, 80], // Increased top/bottom margins for header/footer
    header: function(currentPage) {
      if (currentPage !== 1) return null;
      return {
        columns: [
          { width: '*', text: '' }, // left spacer
          {
            width: 'auto',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 24, h: 24, r: 4, color: '#F1F5F9' }
                ]
              },
              { text: '₹', fontSize: 13, color: '#94A3B8', bold: true, margin: [8, -19, 0, 0] }
            ]
          },
          {
            width: 'auto',
            text: 'TaxRegime.in',
            fontSize: 16,
            bold: true,
            color: '#0F172A',
            margin: [8, 2, 0, 0]
          },
          { width: '*', text: '' } // right spacer
        ],
        margin: [60, 30, 60, 0] // Left, Top, Right, Bottom
      };
    },
    footer: function(currentPage, pageCount) {
      return {
        text: '© 2026 TaxRegime.in • Built for Indian Salaried Employees and Freelancers • FY 2025-26 / AY 2026-27',
        alignment: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        margin: [0, 20, 0, 0]
      };
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.5,
      color: '#475569'
    },
    styles: {
      subheader: {
        fontSize: 14,
        bold: true,
        color: '#0F172A',
        margin: [0, 20, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: '#64748B'
      }
    },
    content: [
      // Winner Card (using Canvas for dashed rounded border)
      {
        stack: [
          // Outer Border Canvas
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 475, // 595 (A4) - 120 (margins)
                h: 190,
                r: 12,
                lineColor: '#14B8A6',
                lineWidth: 1,
                dash: { length: 4 }
              }
            ]
          },
          // Card Content overlapping via negative margin
          {
            stack: [
              // Inner Pill
              {
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 220,
                        h: 24,
                        r: 12,
                        lineColor: '#CCFBF1',
                        lineWidth: 1,
                        color: '#F0FDFA'
                      }
                    ],
                    alignment: 'center'
                  },
                  {
                    text: 'WINNER RECOMMENDATION',
                    fontSize: 9,
                    bold: true,
                    color: '#14B8A6',
                    alignment: 'center',
                    margin: [0, -18, 0, 0]
                  }
                ],
                margin: [0, 0, 0, 20]
              },
              // Winner Text
              { text: `Pick the ${winnerLabel}.`, fontSize: 32, bold: true, color: '#14B8A6', alignment: 'center', margin: [0, 0, 0, 8] },
              { text: `You save ${formatCurr(savings)} annually`, fontSize: 18, bold: true, color: '#0F172A', alignment: 'center', margin: [0, 0, 0, 15] },
              { text: 'All calculations ran local-only in your browser. No data was uploaded.', fontSize: 10, color: '#475569', alignment: 'center' }
            ],
            margin: [0, -165, 0, 0] // Pull content up over the canvas!
          }
        ],
        margin: [0, 10, 0, 50] // spacer below winner card
      },
      
      { text: 'Side-by-Side Tax Comparison', style: 'subheader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          hLineWidth: function (i, node) {
            if (i === 0 || i === 1) return 1;
            if (i === node.table.body.length - 1) return 1;
            if (i === node.table.body.length) return 0;
            return 0.5;
          },
          vLineWidth: function () { return 0; },
          hLineColor: function (i, node) {
            return (i === 0 || i === 1 || i === node.table.body.length - 1) ? '#CBD5E1' : '#E2E8F0';
          },
          paddingTop: function() { return 10; },
          paddingBottom: function() { return 10; }
        },
        margin: [0, 0, 0, 30]
      },

      { text: 'Why it wins', style: 'subheader' },
      {
        ul: reasons,
        color: '#475569',
        fontSize: 10,
        lineHeight: 1.6,
        margin: [0, 0, 0, 20]
      },

      suggestions.length > 0 ? { text: 'Tax Saving Next Steps', style: 'subheader' } : null,
      suggestions.length > 0 ? {
        ul: suggestions,
        color: '#14B8A6',
        markerColor: '#14B8A6',
        fontSize: 10,
        lineHeight: 1.6,
        margin: [0, 0, 0, 20]
      } : null
    ].filter(Boolean)
  };

  pdfMake.createPdf(docDefinition).download('Tax_Summary_FY25_26.pdf');
};
