
export const generateReceiptHtml = (data: {
    poleId: string;
    techName: string;
    faultCategory: string;
    timestamp: string;
    beforePhoto: string;
    afterPhoto: string;
    workNotes?: string;
    ugLogo: string;
}) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <title>Maintenance Receipt - ${data.poleId}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

            *, *::before, *::after { box-sizing: border-box; }

            body { 
                background: #f0f4f8; 
                color: #1e293b; 
                margin: 0; 
                padding: 16px;
                font-family: 'Inter', sans-serif;
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
            }

            .page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 16px;
                padding: 0 4px;
                flex-wrap: wrap;
            }
            .page-title {
                font-size: 14px;
                font-weight: 700;
                color: #1A365D;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .print-btn {
                background: #1A365D;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                letter-spacing: 0.02em;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .print-btn:hover { background: #2a4a7f; }
            .print-btn svg { width: 16px; height: 16px; fill: none; stroke: white; stroke-width: 2; }

            .certificate {
                max-width: 820px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 24px rgba(0,0,0,0.07);
            }

            .header {
                display: flex;
                align-items: center;
                gap: 16px;
                border-bottom: 3px solid #1A365D;
                padding-bottom: 24px;
                margin-bottom: 32px;
                flex-wrap: wrap;
            }
            .logo { width: 64px; height: auto; flex-shrink: 0; }
            .header-text h1 { 
                margin: 0; 
                color: #1A365D; 
                text-transform: uppercase; 
                letter-spacing: -0.01em;
                font-size: clamp(16px, 3vw, 22px);
                font-weight: 900;
                line-height: 1.2;
            }
            .header-text p { 
                margin: 5px 0 0; 
                color: #64748b; 
                font-size: clamp(11px, 1.8vw, 13px); 
                font-weight: 600; 
            }
            
            .meta {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 32px;
            }
            .meta-item {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 14px 16px;
            }
            .meta-item label {
                display: block;
                text-transform: uppercase;
                font-size: 10px;
                font-weight: 900;
                color: #94a3b8;
                letter-spacing: 0.1em;
                margin-bottom: 4px;
            }
            .meta-item p {
                margin: 0;
                font-size: clamp(13px, 2vw, 16px);
                font-weight: 700;
                color: #1A365D;
                word-break: break-word;
            }

            .section-title {
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #94a3b8;
                margin-bottom: 12px;
            }

            .photos {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 32px;
            }
            .photo-box {
                background: #f1f5f9;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .photo-box img {
                width: 100%;
                height: 220px;
                object-fit: cover;
                display: block;
            }
            .photo-label {
                padding: 10px 12px;
                background: #1A365D;
                color: white;
                text-align: center;
                font-size: 10px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }

            .notes {
                padding: 20px;
                background: #f8fafc;
                border-left: 4px solid #1A365D;
                border-radius: 0 10px 10px 0;
                margin-bottom: 32px;
            }
            .notes h3 {
                margin: 0 0 8px;
                font-size: 11px;
                text-transform: uppercase;
                color: #1A365D;
                letter-spacing: 0.08em;
                font-weight: 900;
            }
            .notes p {
                margin: 0;
                font-size: 14px;
                color: #475569;
                font-style: italic;
                line-height: 1.6;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
                border-radius: 20px;
                padding: 6px 14px;
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 24px;
            }
            .badge-dot {
                width: 8px;
                height: 8px;
                background: #22c55e;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }

            .footer {
                text-align: center;
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
                font-size: 11px;
                color: #94a3b8;
                line-height: 1.7;
            }
            .footer strong { color: #64748b; }

            /* ── Mobile ── */
            @media (max-width: 600px) {
                body { padding: 12px; }
                .certificate { padding: 20px 16px; border-radius: 12px; }
                .header { gap: 12px; padding-bottom: 18px; margin-bottom: 20px; }
                .logo { width: 48px; }
                .meta { grid-template-columns: 1fr 1fr; gap: 10px; }
                .meta-item { padding: 10px 12px; }
                .photos { grid-template-columns: 1fr; gap: 14px; }
                .photo-box img { height: 200px; }
            }

            @media (max-width: 380px) {
                .meta { grid-template-columns: 1fr; }
                .header-text h1 { font-size: 15px; }
            }

            @media print {
                body { padding: 0; background: white; }
                .certificate { border: none; box-shadow: none; border-radius: 0; }
                .page-header { display: none; }
                .photos { grid-template-columns: 1fr 1fr !important; }
                .photo-box img { height: 240px; }
            }
        </style>
    </head>
    <body>
        <div class="page-header">
            <span class="page-title">Maintenance Completion Record</span>
            <button class="print-btn" onclick="window.print()">
                <svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                Print / Save PDF
            </button>
        </div>

        <div class="certificate">
            <div class="header">
                <img src="${data.ugLogo}" class="logo" alt="UG Logo" />
                <div class="header-text">
                    <h1>Maintenance Completion Record</h1>
                    <p>University of Ghana Physical Development &amp; Municipal Services Directorate</p>
                </div>
            </div>

            <div class="badge">
                <span class="badge-dot"></span>
                Repair Completed Successfully
            </div>

            <p class="section-title">Job Details</p>
            <div class="meta">
                <div class="meta-item">
                    <label>Asset ID</label>
                    <p>${data.poleId}</p>
                </div>
                <div class="meta-item">
                    <label>Assigned Technician</label>
                    <p>${data.techName}</p>
                </div>
                <div class="meta-item">
                    <label>Fault Category</label>
                    <p>${data.faultCategory}</p>
                </div>
                <div class="meta-item">
                    <label>Completion Date</label>
                    <p>${data.timestamp}</p>
                </div>
            </div>

            <p class="section-title">Photo Documentation</p>
            <div class="photos">
                <div class="photo-box">
                    <img src="${data.beforePhoto}" alt="Before Repair" />
                    <div class="photo-label">Initial Assessment (Before)</div>
                </div>
                <div class="photo-box">
                    <img src="${data.afterPhoto}" alt="After Repair" />
                    <div class="photo-label">Completion Status (After)</div>
                </div>
            </div>

            ${data.workNotes ? `
            <p class="section-title">Technician Remarks</p>
            <div class="notes">
                <h3>Work Notes</h3>
                <p>${data.workNotes}</p>
            </div>
            ` : ''}

            <div class="footer">
                <p>This document serves as <strong>digital evidence of maintenance completion</strong>.</p>
                <p>Campus Glow · University of Ghana &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
