import html2pdf from "html2pdf.js";
import { InvoiceData } from "./invoiceGenerator";

export function generateSmmReceiptHtml(data: InvoiceData, targetLink: string, refill: boolean, signatureUrl: string, qrCodeUrl: string): string {
  const formattedDate = new Date(data.date || Date.now()).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const generatedDate = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const item = data.items[0];

  return `
  <div style="background: white; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; position: relative;">
    <style>
      * { box-sizing: border-box; }
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 100px;
        color: rgba(0, 174, 239, 0.04);
        z-index: 0;
        pointer-events: none;
        white-space: nowrap;
        font-weight: 900;
      }
      .receipt-container {
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }
      .layout-table { width: 100%; border-collapse: collapse; border: 0; }
      .layout-table td { vertical-align: top; }
      .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
      .header-subtitle { font-size: 11px; color: #64748b; margin: 4px 0 0 0; }
      .receipt-badge { font-size: 20px; font-weight: 900; color: #00AEEF; text-transform: uppercase; text-align: right; margin: 0; }
      .generated-date { font-size: 10px; color: #64748b; text-align: right; margin: 4px 0 0 0; }
      
      .info-panel {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin: 30px 0;
      }
      .info-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; }
      .info-row { margin-bottom: 8px; }
      .info-label { display: inline-block; width: 100px; font-size: 11px; font-weight: 600; color: #64748b; }
      .info-value { font-size: 12px; font-weight: 700; color: #0f172a; }
      
      .service-details {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        margin-bottom: 30px;
      }
      .service-header {
        background: #f8fafc;
        padding: 12px 20px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 11px;
        font-weight: 800;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-radius: 12px 12px 0 0;
      }
      .service-body { padding: 20px; }
      .service-name { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
      .target-link { font-size: 12px; color: #00AEEF; margin: 0 0 20px 0; word-break: break-all; }
      
      .stats-table { width: 100%; border-collapse: collapse; border-top: 1px solid #f1f5f9; }
      .stats-table td { padding: 15px 15px 0 0; vertical-align: top; }
      .stat-label { font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
      .stat-value { font-size: 16px; font-weight: 800; color: #0f172a; }
      
      .footer-table { width: 100%; border-collapse: collapse; margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
      .terms { font-size: 9px; color: #94a3b8; line-height: 1.5; padding-right: 20px; }
      .terms p { margin: 0 0 6px 0; }
      .signature-box { text-align: right; width: 250px; }
      .signature-line { border-top: 1px solid #cbd5e1; margin: 10px 0 5px 0; }
    </style>

    <div class="watermark">ZEROX NETWORK</div>
    <div class="receipt-container">
      
      <!-- Header -->
      <table class="layout-table" style="margin-bottom: 20px;">
        <tr>
          <td style="width: 70px;">
            <div style="width: 56px; height: 56px; background: #0f172a; border-radius: 14px; text-align: center; line-height: 56px;">
              <svg viewBox="0 0 100 100" style="width: 44px; height: 44px; display: inline-block; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg">
                <path d="M 22 22 L 78 22 L 78 34 L 42 66 L 78 66 L 78 78 L 22 78 L 22 66 L 58 34 L 22 34 Z" fill="#ffffff" />
                <path d="M 26 22 L 38 22 L 74 78 L 62 78 Z" fill="#00AEEF" opacity="0.9" />
                <path d="M 74 22 L 62 22 L 26 78 L 38 78 Z" fill="#00AEEF" opacity="0.9" />
              </svg>
            </div>
          </td>
          <td>
            <h1 class="header-title">Zerox Network</h1>
            <p class="header-subtitle">Premium SMM & Digital Services</p>
          </td>
          <td style="text-align: right;">
            <h2 class="receipt-badge">OFFICIAL RECEIPT</h2>
            <p class="generated-date">Generated: ${generatedDate}</p>
          </td>
        </tr>
      </table>

      <!-- Info Panels -->
      <table class="layout-table">
        <tr>
          <td style="padding-right: 15px; width: 50%;">
            <div class="info-panel">
              <h3 class="info-title">Customer Details</h3>
              <div class="info-row"><span class="info-label">Name</span><span class="info-value">${data.customerName}</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-value">${data.customerEmail || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${data.customerPhone || 'N/A'}</span></div>
              <div class="info-row" style="margin-top: 12px;">
                <span class="info-label">Payment</span>
                <span class="info-value" style="color: #10b981; font-size: 10px; font-weight: 900; background: rgba(16, 185, 129, 0.1); padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">PAID • WALLET</span>
              </div>
            </div>
          </td>
          <td style="padding-left: 15px; width: 50%;">
            <div class="info-panel">
              <h3 class="info-title">Order Details</h3>
              <div class="info-row"><span class="info-label">Order ID</span><span class="info-value">#${data.orderId}</span></div>
              <div class="info-row"><span class="info-label">Invoice No.</span><span class="info-value">${data.invoiceNumber}</span></div>
              <div class="info-row"><span class="info-label">Date</span><span class="info-value" style="font-size: 11px;">${formattedDate}</span></div>
              <div class="info-row" style="margin-top: 12px;">
                <span class="info-label">Status</span>
                <span class="info-value" style="color: #0ea5e9; font-size: 10px; font-weight: 900; background: rgba(14, 165, 233, 0.1); padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">PROCESSING</span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Service Details -->
      <div class="service-details">
        <div class="service-header">Service Information</div>
        <div class="service-body">
          <h4 class="service-name">${item.title}</h4>
          <p class="target-link">Target: ${targetLink}</p>
          
          <table class="stats-table">
            <tr>
              <td>
                <div class="stat-label">Quantity</div>
                <div class="stat-value">${item.quantity.toLocaleString()}</div>
              </td>
              <td>
                <div class="stat-label">Refill</div>
                <div class="stat-value" style="font-size: 14px;">${refill ? 'Included' : 'No Refill'}</div>
              </td>
              <td>
                <div class="stat-label">Fees &amp; Cancel Policy</div>
                <div class="stat-value" style="font-size: 12px; color: #10b981; font-weight: 700;">₨ 0 Fee / Free Cancel</div>
              </td>
              <td style="text-align: right;">
                <div class="stat-label">Total Amount Paid</div>
                <div class="stat-value" style="color: #00AEEF;">${data.grandTotalPkr.toFixed(2)} PKR</div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <table class="footer-table">
        <tr>
          <td class="terms" style="vertical-align: bottom;">
            <p><strong>Privacy Policy & Terms:</strong> This is a computer-generated official receipt issued by Zerox Network and requires no physical signature for digital verification. By using our premium SMM services, you agree to our Terms of Service. AI verification is active for all social interactions. SMM links and target URLs are kept strictly confidential.</p>
            <p style="margin-top: 8px;"><strong>Support & Contact:</strong><br>WhatsApp: +44 7868 713315 | Support Email: zeroxnetworks@gmail.com | Web: zeroxnetwork.ai.studio</p>
            <p style="margin-top: 8px; font-family: monospace; font-size: 10px; color: #94a3b8;">Ledger Verification Code: ZX-OFFICIAL-${String(data.orderId).toUpperCase()}-VERIFIED</p>
          </td>
          <td class="signature-box" style="vertical-align: bottom;">
            <div style="font-family: 'Brush Script MT', cursive; font-size: 32px; color: #00AEEF; margin-bottom: 5px;">Rayan Mirza</div>
            <div class="signature-line"></div>
            <p style="font-weight: bold; margin: 0; font-size: 11px; color: #0f172a;">Rayan Mirza</p>
            <p style="color: #64748b; font-size: 9px; margin: 0;">Founder, Zerox Network</p>
          </td>
        </tr>
      </table>
      
    </div>
  </div>
  `;
}

export async function downloadSmmReceiptPdf(data: InvoiceData, targetLink: string, refill: boolean) {
  const htmlContent = generateSmmReceiptHtml(data, targetLink, refill, "", "");
  
  const element = document.createElement("div");
  element.innerHTML = htmlContent;

  const opt = {
    margin: 0,
    filename: `ZeroxNetwork_SMM_${data.invoiceNumber}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  
  // @ts-ignore
  await html2pdf().set(opt).from(element).save();
}
