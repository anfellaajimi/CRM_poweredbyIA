import React from 'react';
import { createPortal } from 'react-dom';
import { UIContrat } from '../services/api';

interface ContratPrintProps {
  contrat: UIContrat;
}

export const ContratPrint: React.FC<ContratPrintProps> = ({ contrat }) => {
  const content = (
    <div className="contrat-print-container">
      <style>{`
        @media screen {
          .contrat-print-container { display: none !important; }
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
            line-height: 1.5;
            color: #111827;
          }

          #root, .modal-overlay, .no-print { 
            display: none !important; 
          }

          .contrat-print-container {
            display: block !important;
            width: 100%;
          }

          /* Header */
          .header-wrapper {
            padding-bottom: 20px;
            margin-bottom: 35px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #1e3a8a;
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

          .doc-identity {
            text-align: right;
          }

          .doc-identity h2 {
            font-size: 1.7rem;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0 0 8px 0;
            text-transform: uppercase;
          }

          .doc-identity p {
            margin: 2px 0;
            font-size: 8.5pt;
            color: #4b5563;
          }

          /* Sections */
          .parties-section {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 40px;
             margin-bottom: 40px;
             padding: 20px;
             background: #f8fafc;
             border-radius: 12px;
          }

          .party-box h4 {
             font-size: 8pt;
             font-weight: 800;
             color: #64748b;
             text-transform: uppercase;
             margin: 0 0 8px 0;
             letter-spacing: 0.05em;
          }

          .party-name {
             font-size: 11pt;
             font-weight: 800;
             color: #1e3a8a;
          }

          .contract-title {
             text-align: center;
             margin-bottom: 40px;
          }

          .contract-title h3 {
             font-size: 1.4rem;
             font-weight: 800;
             color: #111827;
             margin: 0 0 5px 0;
          }

          .contract-title .subtitle {
             font-size: 9pt;
             color: #6b7280;
             font-weight: 500;
          }

          .section-block {
             margin-bottom: 30px;
             page-break-inside: avoid;
          }

          .section-title {
             font-size: 10pt;
             font-weight: 800;
             color: #1e3a8a;
             text-transform: uppercase;
             margin-bottom: 12px;
             display: flex;
             align-items: center;
             gap: 10px;
          }

          .section-title::after {
             content: "";
             flex: 1;
             height: 1px;
             background: #e2e8f0;
          }

          .section-content {
             font-size: 10pt;
             color: #334155;
             line-height: 1.6;
             text-align: justify;
          }

          /* Financial Table */
          .financial-summary {
             margin: 40px 0;
             padding: 20px;
             border: 2px solid #e2e8f0;
             border-radius: 12px;
             page-break-inside: avoid;
          }

          .summary-grid {
             display: grid;
             grid-template-columns: repeat(3, 1fr);
             gap: 20px;
          }

          .metric h5 {
             font-size: 7.5pt;
             font-weight: 800;
             color: #94a3b8;
             text-transform: uppercase;
             margin: 0 0 5px 0;
          }

          .metric p {
             font-size: 11pt;
             font-weight: 800;
             color: #1e3a8a;
             margin: 0;
          }

          /* Signatures */
          .signatures-grid {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 60px;
             margin-top: 60px;
             page-break-inside: avoid;
          }

          .signature-box {
             border-top: 1px solid #e2e8f0;
             padding-top: 15px;
          }

          .signature-label {
             font-size: 8pt;
             font-weight: 800;
             color: #64748b;
             text-transform: uppercase;
             margin-bottom: 15px;
             display: block;
          }

          .signature-space {
             height: 100px;
             display: flex;
             align-items: center;
             justify-content: center;
             margin-bottom: 15px;
          }

          .signature-img {
             max-height: 80px;
             max-width: 100%;
             object-fit: contain;
          }

          .signature-placeholder {
             font-size: 8pt;
             color: #cbd5e1;
             font-style: italic;
          }

          .signature-meta {
             font-size: 7.5pt;
             color: #94a3b8;
          }

          .corporate-stamp {
             position: absolute;
             width: 140px;
             height: 140px;
             border: 3px solid #1e40af;
             border-radius: 50%;
             display: flex;
             flex-direction: column;
             align-items: center;
             justify-content: center;
             transform: rotate(-15deg);
             opacity: 0.7;
             pointer-events: none;
             z-index: 2;
             background: transparent;
             color: #1e40af;
             text-align: center;
             padding: 10px;
          }

          .stamp-brand {
             font-size: 10pt;
             font-weight: 900;
             text-transform: uppercase;
             margin-bottom: 2px;
             letter-spacing: 0.05em;
          }

          .stamp-logo-diamond {
             width: 28px;
             height: 28px;
             background: #1e40af;
             transform: rotate(45deg);
             display: flex;
             align-items: center;
             justify-content: center;
             margin: 8px 0;
          }

          .stamp-logo-inner {
             width: 12px;
             height: 12px;
             background: white;
          }

          .stamp-footer {
             font-size: 7.5pt;
             font-weight: 800;
             text-transform: uppercase;
             line-height: 1.2;
          }

          /* Footer */
          .footer-orchestrator {
            position: fixed;
            bottom: 0;
            left: 15mm;
            right: 15mm;
            height: 40px;
            border-top: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7.5pt;
            color: #94a3b8;
          }

          .page-nr:after { content: "Page " counter(page); }
          body { counter-reset: page; }
          .main-table { width: 100%; border-collapse: collapse; }
          .tfoot-group { display: table-footer-group; }
        }
      `}</style>

      <table className="main-table">
        <thead className="table-header-group">
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
                <div className="doc-identity">
                  <h2>CONTRAT</h2>
                  <p>Référence: <strong>{contrat.id}</strong></p>
                  <p>Date: <strong>{new Date().toLocaleDateString('fr-FR')}</strong></p>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <div className="contract-title">
                <h3>{contrat.titre}</h3>
                <p className="subtitle">{contrat.type}</p>
              </div>

              <div className="parties-section">
                <div className="party-box">
                  <h4>Entre le Prestataire</h4>
                  <p className="party-name">QUETRATECH S.A.R.L</p>
                  <p style={{ fontSize: '8pt', color: '#64748b' }}>MF: 1694357/R - Siège Social: MAHDIA</p>
                </div>
                <div className="party-box">
                  <h4>Et le Client</h4>
                  <p className="party-name">{contrat.clientName}</p>
                  <p style={{ fontSize: '8pt', color: '#64748b' }}>Identifiant: {contrat.clientId}</p>
                </div>
              </div>

              <div className="section-block">
                <h4 className="section-title">1. Objet du Contrat</h4>
                <div className="section-content">{contrat.objet || "Le présent contrat définit les termes et conditions de la collaboration entre les deux parties."}</div>
              </div>

              <div className="section-block">
                <h4 className="section-title">2. Obligations des Parties</h4>
                <div className="section-content">{contrat.obligations || "Les parties s'engagent à respecter mutuellement leurs engagements techniques et financiers."}</div>
              </div>

              <div className="section-block">
                <h4 className="section-title">3. Responsabilités</h4>
                <div className="section-content">{contrat.responsabilites || "Chaque partie est responsable de la mise en oeuvre des moyens nécessaires à l'aboutissement du projet."}</div>
              </div>

              <div className="section-block">
                <h4 className="section-title">4. Conditions Générales</h4>
                <div className="section-content">{contrat.conditions || "Toute modification du présent contrat doit faire l'objet d'un avenant signé par les deux parties."}</div>
              </div>

              <div className="financial-summary">
                <div className="summary-grid">
                  <div className="metric">
                    <h5>Valeur du contrat</h5>
                    <p>{Number(contrat.value).toLocaleString('fr-FR')} {contrat.devise}</p>
                  </div>
                  <div className="metric">
                    <h5>Date de début</h5>
                    <p>{contrat.dateDebut}</p>
                  </div>
                  <div className="metric">
                    <h5>Échéance</h5>
                    <p>{contrat.dateFin}</p>
                  </div>
                </div>
              </div>

              <div className="signatures-grid">
                <div className="signature-box">
                  <span className="signature-label">Signature Client</span>
                  <div className="signature-space">
                    {contrat.signatureClient ? (
                      <img src={contrat.signatureClient} alt="Signature Client" className="signature-img" />
                    ) : (
                      <span className="signature-placeholder">En attente de signature</span>
                    )}
                  </div>
                  <div className="signature-meta">
                    <p>Fait à ............................, le ............................</p>
                    <p>Mention "Lu et approuvé"</p>
                  </div>
                </div>

                <div className="signature-box">
                  <span className="signature-label">Signature Prestataire</span>
                  <div className="signature-space" style={{ position: 'relative' }}>
                    {contrat.signatureProvider && (
                      <div className="corporate-stamp">
                        <div className="stamp-brand">QUETRATECH</div>
                        <div className="stamp-logo-diamond">
                          <div className="stamp-logo-inner"></div>
                        </div>
                        <div className="stamp-footer">
                          MF: 1694357/R<br />
                          MAHDIA, TUNISIE
                        </div>
                      </div>
                    )}
                    {contrat.signatureProvider ? (
                      <img src={contrat.signatureProvider} alt="Signature Prestataire" className="signature-img" style={{ position: 'relative', zIndex: 3 }} />
                    ) : (
                      <span className="signature-placeholder">En attente de signature</span>
                    )}
                  </div>
                  <div className="signature-meta">
                    <p>Fait à Mahdia, le {new Date().toLocaleDateString('fr-FR')}</p>
                    <p>Pour la société QUETRATECH</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot className="tfoot-group">
          <tr>
            <td>
               <div style={{ height: '50px' }}></div>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="footer-orchestrator">
        <div>QUETRATECH - Solutions Logicielles & Cloud - contact@quetratech.com</div>
        <div className="page-nr"></div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
