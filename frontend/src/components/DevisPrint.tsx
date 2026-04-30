import React from 'react';
import { createPortal } from 'react-dom';
import { UIDevis } from '../services/api';

interface DevisPrintProps {
  devis: UIDevis;
}

export const DevisPrint: React.FC<DevisPrintProps> = ({ devis }) => {
  const taxRate = devis.taxRate ?? 19;
  const fiscalStamp = devis.fiscalStamp ?? 1.0;
  const tvaAmount = (devis.amount ?? 0) * (taxRate / 100);
  const totalTTC = (devis.amount ?? 0) + tvaAmount + fiscalStamp; 

  const content = (
    <div className="devis-print-container">
      <style>{`
        @media screen {
          .devis-print-container { display: none !important; }
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0;
            padding: 12mm 15mm;
            background: white !important;
            font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif;
            font-size: 9.5pt;
            line-height: 1.4;
            color: #111827;
          }

          #root, .modal-overlay, .no-print { 
            display: none !important; 
          }

          .devis-print-container {
            display: block !important;
            width: 100%;
          }

          /* Structure */
          .main-table {
            width: 100%;
            border-collapse: collapse;
          }

          .thead-group { display: table-header-group; }
          .tfoot-group { display: table-footer-group; }

          /* Header Styling */
          .header-wrapper {
            padding-bottom: 20px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .brand-info {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .logo-diamond {
            width: 38px;
            height: 38px;
            background: #1e3a8a;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-inner {
            width: 16px;
            height: 16px;
            background: white;
            transform: rotate(0deg);
          }

          .brand-text h1 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
            letter-spacing: -0.01em;
          }

          .brand-text p {
            font-size: 6.5pt;
            color: #6b7280;
            margin: 2px 0 0 0;
            text-transform: uppercase;
            font-weight: 600;
          }

          .company-meta {
            text-align: right;
            font-size: 8pt;
            color: #374151;
            line-height: 1.3;
          }

          /* Content Section */
          .doc-summary {
            display: flex;
            justify-content: space-between;
            margin-bottom: 35px;
          }

          .doc-identity h2 {
            font-size: 1.7rem;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0 0 8px 0;
          }

          .doc-identity p {
            margin: 2px 0;
            font-size: 8.5pt;
            color: #4b5563;
          }

          .recipient-box {
            text-align: right;
          }

          .recipient-label {
            font-size: 7.5pt;
            color: #9ca3af;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 5px;
            display: block;
          }

          .recipient-name {
            font-size: 1.3rem;
            font-weight: 800;
            color: #111827;
          }

          /* Body Table */
          .items-shifter {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }

          .items-shifter th {
            text-align: left;
            background: #fff;
            padding: 12px 10px;
            font-size: 8.5pt;
            font-weight: 800;
            color: #1e3a8a;
            border-bottom: 2.5px solid #1e3a8a;
            text-transform: uppercase;
          }

          .items-shifter td {
            padding: 12px 10px;
            font-size: 9.5pt;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
          }

          .align-right { text-align: right; }
          .align-center { text-align: center; }

          .observations {
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            margin-top: 10px;
          }

          .observations-label {
            font-size: 8pt;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            margin-bottom: 6px;
            display: block;
          }

          .observations-text {
            font-size: 9pt;
            color: #4b5563;
            margin: 0;
          }

          /* Fixed Footer Strategy */
          .footer-group {
            display: table-footer-group;
          }

          .footer-spacer {
            height: 220px; /* Adjust to match the actual height of the footer-orchestrator */
          }

          .footer-orchestrator {
            position: fixed;
            bottom: 0;
            left: 15mm; /* Match body padding */
            right: 15mm;
            height: 220px;
            background: white !important;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
            z-index: 1000;
          }

          .footer-grid-system {
            display: grid;
            grid-template-columns: 1.3fr 0.7fr 1fr;
            gap: 25px;
            align-items: flex-end;
            margin-bottom: 25px;
          }

          .footer-section-title {
            font-size: 9pt;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            letter-spacing: 0.02em;
          }

          .reglement-details {
            font-size: 8.5pt;
            color: #4b5563;
            line-height: 1.6;
          }

          .timbre-container {
            display: flex;
            width: 140px;
            border: 1.5px solid #2563eb;
            background: #eff6ff;
            border-radius: 6px;
            overflow: hidden;
            margin-top: 12px;
          }

          .timbre-label {
            padding: 6px 10px;
            font-size: 8pt;
            font-weight: 800;
            color: #1e3a8a;
            border-right: 1.5px solid #2563eb;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .timbre-value {
            padding: 6px 10px;
            font-size: 9pt;
            font-weight: 800;
            color: #1e3a8a;
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1;
            align-items: center;
          }

          .stamp-visual {
            display: flex;
            justify-content: center;
          }

          .stamp-circle {
            width: 100px;
            height: 100px;
            border: 2px dashed #3b82f6;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transform: rotate(-12deg);
            opacity: 0.7;
          }

          .summary-card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            background: #fff;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            font-size: 9pt;
            border-bottom: 1px solid #f3f4f6;
          }

          .summary-row:last-child {
            border-bottom: none;
            background: #f8fafc;
            font-weight: 900;
            font-size: 11pt;
            color: #1e3a8a;
            padding: 12px 15px;
          }

          .contact-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 10px;
            border-top: 1px solid #f3f4f6;
            font-size: 7.5pt;
            color: #9ca3af;
          }

          /* Paging rules */
          tr { page-break-inside: avoid; }
          .page-nr:after { content: "Page " counter(page); }
          body { counter-reset: page; }
          .tfoot-group { counter-increment: page; }
        }
      `}</style>

      <table className="main-table">
        <thead className="thead-group">
          <tr>
            <td>
              <div className="header-wrapper">
                <div className="brand-info">
                  <div className="logo-diamond"><div className="logo-inner"></div></div>
                  <div className="brand-text">
                    <h1>QUETRATECH</h1>
                    <p>Solutions Logicielles & Cloud</p>
                  </div>
                </div>
                <div className="company-meta">
                  <p style={{ fontWeight: 800, color: '#111827' }}>Ste Quetratech</p>
                  <p>MF: 1694357/R/A/M/000</p>
                  <p>Mahdia, Tunisie</p>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <div className="doc-summary">
                <div className="doc-identity">
                  <h2>DEVIS</h2>
                  <p>Référence: <strong>{devis.id}</strong></p>
                  <p>Date d'émission: <strong>{devis.createdAt}</strong></p>
                  {devis.validUntil && <p>Validité: <strong>{devis.validUntil}</strong></p>}
                </div>
                <div className="recipient-box">
                  <span className="recipient-label">FACTURE À / DESTINATAIRE</span>
                  <p className="recipient-name">{devis.clientName}</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 800, color: '#374151', fontSize: '10.5pt' }}>{devis.title}</p>
              </div>

              <table className="items-shifter">
                <thead>
                  <tr>
                    <th style={{ width: '55%' }}>Désignation des prestations</th>
                    <th className="align-center" style={{ width: '10%' }}>Qté</th>
                    <th className="align-right" style={{ width: '15%' }}>P.U HT</th>
                    <th className="align-right" style={{ width: '20%' }}>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {(devis.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td className="align-center">{item.quantity}</td>
                      <td className="align-right">{item.unitPrice?.toLocaleString('fr-FR')}</td>
                      <td className="align-right">{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {devis.notes && (
                <div className="observations">
                  <span className="observations-label">Observations :</span>
                  <p className="observations-text">{devis.notes}</p>
                </div>
              )}
              
              {/* Spacer so content doesn't crash into footer on last page if short */}
              <div style={{ height: '30px' }}></div>
            </td>
          </tr>
        </tbody>

        <tfoot className="tfoot-group">
          <tr>
            <td>
              <div className="footer-spacer"></div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* FIXED FOOTER - stays at bottom of every page */}
      <div className="footer-orchestrator">
        <div className="footer-grid-system">
          <div className="reglement-box">
            <h4 className="footer-section-title">Réglement</h4>
            <div className="reglement-details">
              <p>Banque: Attijari Bank Tunisie</p>
              <p>IBAN: TN59 0450 2040 0078 6293 3473</p>
              <p>BIC: BSTUTNTT</p>
            </div>
            <div className="timbre-container">
              <div className="timbre-label">
                <span>Timbre</span>
                <span>Fiscal</span>
              </div>
              <div className="timbre-value">
                <span>{Number(fiscalStamp).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</span>
                <span>{devis.devise}</span>
              </div>
            </div>
          </div>

          <div className="stamp-visual">
            <div className="stamp-circle">
              <span style={{ fontSize: '7.5pt', fontWeight: 900, color: '#3b82f6' }}>QUETRATECH</span>
              <div style={{ width: '12px', height: '12px', background: '#3b82f6', transform: 'rotate(45deg)', margin: '6px 0' }}></div>
              <p style={{ fontSize: '4.5pt', color: '#3b82f6', textAlign: 'center' }}>MF:1694357R<br />TUNISIE</p>
            </div>
          </div>

          <div className="summary-section">
            <h4 className="footer-section-title">Résumé Financier</h4>
            <div className="summary-card">
              <div className="summary-row">
                <span style={{ color: '#6b7280' }}>Total Hors Taxe</span>
                <span style={{ fontWeight: 800 }}>{(devis.amount || 0).toLocaleString('fr-FR')} {devis.devise}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: '#6b7280' }}>TVA ({taxRate}%)</span>
                <span style={{ fontWeight: 800 }}>{tvaAmount.toLocaleString('fr-FR')} {devis.devise}</span>
              </div>
              <div className="summary-row">
                <span>TOTAL TTC</span>
                <span>{totalTTC.toLocaleString('fr-FR')} {devis.devise}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-bar">
          <div>Quetratech S.A.R.L - contact@quetratech.com - Tel: +216 23 564 077</div>
          <div className="page-nr"></div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
