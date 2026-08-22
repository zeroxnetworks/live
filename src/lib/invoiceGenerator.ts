// Dynamic client-side invoice generator

export function calculateOrderCancellationRefund(originalAmountPkr: number, isTimeoutOrBadNumber: boolean = false, cryptoRate: number = 278) {
  if (isTimeoutOrBadNumber) {
    return {
      originalAmountPkr,
      cancelFeePkr: 0,
      processingFeePkr: 0,
      netRefundPkr: originalAmountPkr,
      netRefundUsd: Number((originalAmountPkr / cryptoRate).toFixed(4)),
      policy: "100% Full Refund (Expired/Unreceived SMS or Banned Number)"
    };
  }
  const cancelFeePkr = Number((originalAmountPkr * 0.05).toFixed(2));
  const processingFeePkr = Number((originalAmountPkr * 0.02).toFixed(2));
  const netRefundPkr = Number((originalAmountPkr - cancelFeePkr - processingFeePkr).toFixed(2));
  const netRefundUsd = Number((netRefundPkr / cryptoRate).toFixed(4));
  return {
    originalAmountPkr,
    cancelFeePkr,
    processingFeePkr,
    netRefundPkr,
    netRefundUsd,
    policy: "93% Refund (5% Cancellation Fee + 2% Carrier Processing Fee Deducted)"
  };
}

export function calculateDepositFee(grossAmountPkr: number, isCrypto: boolean = false, cryptoRate: number = 278) {
  const feeRate = isCrypto ? 0.005 : 0.02;
  const feePercent = isCrypto ? 0.5 : 2.0;
  const feePkr = Number((grossAmountPkr * feeRate).toFixed(2));
  const netPkr = Number((grossAmountPkr - feePkr).toFixed(2));
  const netUsd = Number((netPkr / cryptoRate).toFixed(4));
  const feeUsd = Number((feePkr / cryptoRate).toFixed(4));
  return {
    grossPkr: grossAmountPkr,
    feeRate,
    feePercent,
    feePkr,
    netPkr,
    feeUsd,
    netUsd
  };
}

export interface InvoiceItem {
  id: string | number;
  title: string;
  category: "SMS Activation" | "SMM Order" | "OTT Subscription" | "Wallet Deposit" | "Affiliate Payout" | "Affiliate Withdrawal" | "Service";
  details?: string;
  quantity: number;
  unitPriceUsd: number;
  unitPricePkr: number;
  totalUsd: number;
  totalPkr: number;
}

export interface InvoiceFeeBreakdown {
  realtimeNetworkFeePkr?: number;
  processingFeePkr?: number;
  cancellationFeePkr?: number;
  realtimeNetworkFeeUsd?: number;
  processingFeeUsd?: number;
  cancellationFeeUsd?: number;
}

export interface InvoiceRefundDetails {
  isRefunded?: boolean;
  originalAmountPaidPkr?: number;
  originalAmountPaidUsd?: number;
  cancellationFeeChargedPkr?: number;
  processingFeeDeductedPkr?: number;
  netRefundAmountPkr?: number;
  netRefundAmountUsd?: number;
  refundPercentage?: number;
  refundReason?: string;
  refundDestination?: string;
  refundTimestamp?: string;
  refundLedgerRef?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string | number;
  date: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  status: "COMPLETED" | "APPROVED" | "FINISHED" | "PROCESSING" | "PENDING" | "CANCELED" | "CANCELLED" | "BANNED" | "REFUNDED" | "REJECTED" | string;
  items: InvoiceItem[];
  subtotalPkr: number;
  subtotalUsd: number;
  taxPkr?: number;
  discountPkr?: number;
  grandTotalPkr: number;
  grandTotalUsd: number;
  fees?: InvoiceFeeBreakdown;
  refundDetails?: InvoiceRefundDetails;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const formattedDate = new Date(data.date || Date.now()).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const itemsHtml = data.items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 16px; font-weight: 600; color: #1e293b; font-size: 13px;">${idx + 1}</td>
      <td style="padding: 12px 16px; vertical-align: top;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${item.title}</div>
        ${item.details ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; white-space: pre-wrap; word-break: break-all; line-height: 1.4;">${item.details}</div>` : ""}
      </td>
      <td style="padding: 12px 16px; text-align: center;">
        <span style="background: #f1f5f9; color: #334155; font-[800]; font-size: 10px; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">
          ${item.category}
        </span>
      </td>
      <td style="padding: 12px 16px; text-align: center; font-weight: 600; color: #334155; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #334155; font-size: 13px;">₨ ${item.unitPricePkr.toLocaleString()} PKR</td>
      <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #0f172a; font-size: 13px;">₨ ${item.totalPkr.toLocaleString()} PKR</td>
    </tr>
  `
    )
    .join("");

  return `
  <div style="background: white; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; position: relative;">
    <style>
      * { box-sizing: border-box; }
      .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; position: relative; overflow: hidden; }
      .layout-table { width: 100%; border-collapse: collapse; border: 0; margin-bottom: 24px; }
      .layout-table td { vertical-align: top; }
      
      .logo-title { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
      .logo-sub { font-size: 11px; font-weight: 800; color: #00AEEF; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px; }
      .invoice-tag { text-align: right; }
      .invoice-num { font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; }
      .status-badge { display: inline-block; font-weight: 900; font-size: 10px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; margin-top: 6px; letter-spacing: 0.5px; border: 1px solid currentColor; }
      .status-success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
      .status-failed { color: #e11d48; background: rgba(225, 29, 72, 0.1); }
      .status-pending { color: #d97706; background: rgba(217, 119, 6, 0.1); }
      
      .grid-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
      .meta-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
      .meta-val { font-size: 13px; font-weight: 700; color: #0f172a; }
      
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      .items-table th { background: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; padding: 10px 16px; text-align: left; }
      .items-table th:nth-child(3), .items-table th:nth-child(4) { text-align: center; }
      .items-table th:nth-child(5), .items-table th:nth-child(6) { text-align: right; }
      
      .summary-box { margin-left: auto; width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
      .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569; font-weight: 600; }
      .summary-row.total { border-top: 2px solid #00AEEF; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 900; color: #0f172a; }
      
      .watermark { position: absolute; bottom: 80px; right: 40px; opacity: 0.04; font-size: 100px; font-weight: 900; pointer-events: none; text-transform: uppercase; z-index: 0; }
      
      .footer { margin-top: 40px; border-top: 2px solid #00AEEF; padding-top: 20px; }
      .terms { font-size: 9px; color: #94a3b8; line-height: 1.5; padding-right: 20px; text-align: left; }
      .terms p { margin: 0 0 5px 0; }
      .signature-box { text-align: right; width: 200px; }
      .signature-line { border-top: 1px solid #cbd5e1; margin: 10px 0 5px 0; }
      .signature-box p { margin: 0; font-size: 11px; color: #0f172a; }
    </style>

    <div class="invoice-card" style="z-index: 1;">
      <div class="watermark">ZEROX</div>
      
      <!-- Header -->
      <table class="layout-table" style="border-bottom: 2px solid #00AEEF; padding-bottom: 20px;">
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
            <div class="logo-title">ZEROX NETWORK</div>
            <div class="logo-sub">Digital Services & API Platform</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Official Tax Receipt & Transaction Invoice</div>
          </td>
          <td class="invoice-tag">
            <div class="invoice-num">${data.invoiceNumber}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">Issued: ${formattedDate}</div>
            ${(()=>{
  const isFailed = data.status === 'CANCELED' || data.status === 'CANCELLED' || data.status === 'BANNED' || data.status === 'REJECTED' || data.status === 'REFUNDED';
  const isSuccess = data.status === 'COMPLETED' || data.status === 'APPROVED' || data.status === 'FINISHED';
  const statusClass = isSuccess ? 'status-success' : isFailed ? 'status-failed' : 'status-pending';
  return `<div class="status-badge ${statusClass}">${data.status}</div>`;
})()}
          </td>
        </tr>
      </table>

      <!-- Details -->
      <div class="grid-details">
        <table class="layout-table" style="margin-bottom: 0;">
          <tr>
            <td style="width: 50%;">
              <div class="meta-label">Billed To</div>
              <div class="meta-val">${data.customerName}</div>
              ${data.customerEmail ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${data.customerEmail}</div>` : ""}
              ${data.customerPhone ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${data.customerPhone}</div>` : ""}
            </td>
            <td style="width: 50%;">
              <div class="meta-label">Reference ID</div>
              <div class="meta-val" style="margin-bottom: 12px;">#${data.orderId}</div>
              
              <div class="meta-label">Payment Method</div>
              <div class="meta-val">${data.paymentMethod || "Platform Wallet"}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Items -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="border-top-left-radius: 8px; border-bottom-left-radius: 8px;">#</th>
            <th>Description</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th style="border-top-right-radius: 8px; border-bottom-right-radius: 8px;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Summary & Fees Breakdown -->
      <table class="layout-table" style="margin-bottom: 20px;">
        <tr>
          <td style="vertical-align: top; padding-right: 20px;">
            ${(()=>{
              const isFailed = data.status === 'CANCELED' || data.status === 'CANCELLED' || data.status === 'BANNED' || data.status === 'REJECTED' || data.status === 'REFUNDED' || data.status === 'PARTIAL';
              const cancelFee5Percent = data.fees?.cancellationFeePkr ?? (data.grandTotalPkr * 0.05);
              const procFee2Percent = data.fees?.processingFeePkr ?? (data.grandTotalPkr * 0.02);
              const refundAmount = data.refundDetails?.netRefundAmountPkr ?? Math.max(0, data.grandTotalPkr - cancelFee5Percent);
              const refundReason = data.refundDetails?.refundReason || (data.status === 'BANNED' ? 'Virtual Number Blocked / Bad Quality' : data.status === 'CANCELED' || data.status === 'CANCELLED' ? 'SMS Timeout / Unfulfilled Allocation' : 'System Auto-Refund');

              if (isFailed) {
                return `
                <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 12px; padding: 16px; margin-top: 4px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fecdd3; padding-bottom: 8px; margin-bottom: 10px;">
                    <span style="font-size: 11px; font-weight: 900; color: #e11d48; text-transform: uppercase; letter-spacing: 0.5px;">
                      🛡️ Official Refund &amp; Settlement Ledger
                    </span>
                    <span style="font-size: 10px; font-weight: 800; background: #e11d48; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                      REFUND SETTLED
                    </span>
                  </div>
                  <table style="width: 100%; font-size: 11px; color: #475569; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 3px 0; color: #64748b;">Original Paid Amount:</td>
                      <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f172a;">₨ ${data.grandTotalPkr.toLocaleString()} PKR</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 0; color: #64748b;">Processing Fee (2%):</td>
                      <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #64748b;">₨ ${procFee2Percent.toFixed(2)} PKR</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 0; color: #64748b;">Cancellation Fee (5%):</td>
                      <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #e11d48;">- ₨ ${cancelFee5Percent.toFixed(2)} PKR</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px 0; color: #64748b;">Refund Reason:</td>
                      <td style="padding: 3px 0; text-align: right; font-weight: 700; color: #e11d48;">${refundReason}</td>
                    </tr>
                    <tr style="border-top: 1px dashed #fecdd3;">
                      <td style="padding: 6px 0 2px; font-weight: 900; color: #9f1239; font-size: 12px;">Net Credited to Wallet:</td>
                      <td style="padding: 6px 0 2px; text-align: right; font-weight: 900; color: #e11d48; font-size: 13px;">+ ₨ ${refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR</td>
                    </tr>
                  </table>
                  <div style="font-size: 9.5px; color: #9f1239; margin-top: 8px; font-weight: 600;">
                    ✓ Credit Destination: Digital Wallet Balance (Settlement credited after 5% cancellation adjustment)
                  </div>
                </div>
                `;
              }
              const isAffiliate = data.items.some(i => i.category === 'Affiliate Payout' || i.category === 'Affiliate Withdrawal');
              const isDeposit = data.items.some(i => i.category === 'Wallet Deposit');
              const isCrypto = (data.paymentMethod || "").toLowerCase().includes("crypto") || (data.paymentMethod || "").toLowerCase().includes("usdt") || (data.paymentMethod || "").toLowerCase().includes("redotpay");
              const depositFeePct = isCrypto ? 0.5 : 2.0;

              if (isAffiliate) {
                return `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px;">
                  <div style="font-size: 11px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    💎 Verified Partner Payout &amp; Statement
                  </div>
                  <p style="font-size: 10px; color: #15803d; margin: 0; line-height: 1.45;">
                    Affiliate withdrawal processed with a standard <strong>2.0% Processing Fee</strong>. Funds verified by admin and settled directly into the designated client account. Minimum withdrawal threshold: <strong>₨ 100 PKR</strong>.
                  </p>
                </div>
                `;
              }

              if (isDeposit) {
                return `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px;">
                  <div style="font-size: 11px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    💳 Transparent Deposit Policy
                  </div>
                  <p style="font-size: 10px; color: #15803d; margin: 0; line-height: 1.45;">
                    Deposit processed with <strong>${depositFeePct}% ${isCrypto ? 'Crypto Processing Fee' : 'Local Deposit Fee'}</strong>. Standard cancellation fee on virtual number orders is <strong>5%</strong> with automated balance protection.
                  </p>
                </div>
                `;
              }

              return `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px;">
                <div style="font-size: 11px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                  ✓ Transparent Fee Policy &amp; Security
                </div>
                <p style="font-size: 10px; color: #15803d; margin: 0; line-height: 1.45;">
                  All transactions include real-time carrier routing with a standard <strong>Processing Fee (2%)</strong>. Unfulfilled virtual numbers or manual cancellations are subject to <strong>Cancellation Fee (5%)</strong> with immediate automated refund of net remaining funds.
                </p>
              </div>
              `;
            })()}
          </td>

          <td style="width: 330px; vertical-align: top;">
            ${(()=>{
              const isAffiliate = data.items.some(i => i.category === 'Affiliate Payout' || i.category === 'Affiliate Withdrawal');
              const isDeposit = data.items.some(i => i.category === 'Wallet Deposit');
              const isCrypto = (data.paymentMethod || "").toLowerCase().includes("crypto") || (data.paymentMethod || "").toLowerCase().includes("usdt") || (data.paymentMethod || "").toLowerCase().includes("redotpay");
              const depositFeePct = isCrypto ? 0.5 : 2.0;
              const depositFeeAmount = data.subtotalPkr * (depositFeePct / 100);
              const netDepositCredit = Math.max(0, data.subtotalPkr - depositFeeAmount);

              if (isAffiliate) {
                const feePkr = data.fees?.processingFeePkr ?? (data.subtotalPkr * 0.02);
                const netPayoutPkr = data.grandTotalPkr || (data.subtotalPkr - feePkr);
                return `
                <div class="summary-box">
                  <div class="summary-row">
                    <span>Gross Withdrawal Amount</span>
                    <span>₨ ${data.subtotalPkr.toLocaleString()} PKR</span>
                  </div>
                  <div class="summary-row">
                    <span>Processing Fee (2%)</span>
                    <span style="color: #f59e0b; font-weight: 700;">- ₨ ${feePkr.toFixed(2)} PKR</span>
                  </div>
                  <div class="summary-row">
                    <span>Minimum Withdrawal Rule</span>
                    <span style="color: #64748b; font-weight: 600;">₨ 100.00 PKR</span>
                  </div>
                  <div class="summary-row total">
                    <span>Net Dispatched to Account</span>
                    <span style="color: #10b981;">₨ ${netPayoutPkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR</span>
                  </div>
                </div>
                `;
              }

              if (isDeposit) {
                return `
                <div class="summary-box">
                  <div class="summary-row">
                    <span>Gross Deposit</span>
                    <span>₨ ${data.subtotalPkr.toLocaleString()} PKR</span>
                  </div>
                  <div class="summary-row">
                    <span>Deposit Fee (${depositFeePct}%)</span>
                    <span style="color: #f59e0b; font-weight: 700;">- ₨ ${depositFeeAmount.toFixed(2)} PKR</span>
                  </div>
                  <div class="summary-row">
                    <span>Cancellation Fee (5%)</span>
                    <span style="color: #e11d48; font-weight: 700;">5% (On order cancel)</span>
                  </div>
                  <div class="summary-row total">
                    <span>Net Credited to Wallet</span>
                    <span style="color: #10b981;">₨ ${netDepositCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR</span>
                  </div>
                </div>
                `;
              }

              return `
              <div class="summary-box">
                <div class="summary-row">
                  <span>Base Subtotal</span>
                  <span>₨ ${data.subtotalPkr.toLocaleString()} PKR</span>
                </div>
                <div class="summary-row">
                  <span>Real-Time Carrier Fee</span>
                  <span style="color: #16a34a; font-weight: 700;">₨ ${(data.fees?.realtimeNetworkFeePkr || 0).toFixed(2)} (Included)</span>
                </div>
                <div class="summary-row">
                  <span>Processing Fee (2%)</span>
                  <span style="color: #0f172a; font-weight: 700;">₨ ${(data.fees?.processingFeePkr ?? (data.subtotalPkr * 0.02)).toFixed(2)} PKR</span>
                </div>
                <div class="summary-row">
                  <span>Cancellation Fee (5%)</span>
                  <span style="color: #e11d48; font-weight: 700;">₨ ${(data.fees?.cancellationFeePkr ?? (data.subtotalPkr * 0.05)).toFixed(2)} PKR</span>
                </div>
                ${
                  data.discountPkr
                    ? `
                <div class="summary-row" style="color: #16a34a;">
                  <span>Discount Applied</span>
                  <span>- ₨ ${data.discountPkr.toLocaleString()} PKR</span>
                </div>`
                    : ""
                }
                ${
                  data.taxPkr
                    ? `
                <div class="summary-row">
                  <span>Tax (0% GST)</span>
                  <span>₨ ${data.taxPkr.toLocaleString()} PKR</span>
                </div>`
                    : ""
                }
                <div class="summary-row total">
                  <span>Grand Total Paid</span>
                  <span>₨ ${data.grandTotalPkr.toLocaleString()} PKR</span>
                </div>
              </div>
              `;
            })()}
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table class="layout-table footer">
        <tr>
          <td class="terms" style="vertical-align: bottom;">
            <p><strong>Fee Policy &amp; Terms:</strong> This is a digitally verified invoice. Real-time carrier fee, Processing Fee (2%), and Cancellation Fee (5%) are clearly declared. If an SMS activation is canceled or fails unreceived, the refund is calculated and automatically credited to your wallet balance according to policy.</p>
            <p><strong>Customer Support:</strong> zeroxnetworks@gmail.com | WhatsApp: +44 7868 713315 | Portal: zeroxnetwork.ai.studio</p>
          </td>
          <td class="signature-box" style="vertical-align: bottom;">
            <div style="font-family: 'Brush Script MT', cursive; font-size: 28px; color: #00AEEF; margin-bottom: 5px;">Rayan Mirza</div>
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

export async function downloadInvoicePdf(data: InvoiceData) {
  const htmlContent = generateInvoiceHtml(data);
  const element = document.createElement("div");
  element.innerHTML = htmlContent;

  const opt = {
    margin: 0,
    filename: `Zerox_Invoice_${data.invoiceNumber}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2, logging: false, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = (html2pdfModule as any).default || html2pdfModule;
    // @ts-ignore
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("PDF generation error, falling back to print window:", error);
    openInvoicePrintWindow(data);
  }
}

export function openInvoicePrintWindow(data: InvoiceData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const htmlContent = generateInvoiceHtml(data);
  printWindow.document.write("<!DOCTYPE html><html><head><title>Invoice</title></head><body style='margin: 0; padding: 0;'>");
  printWindow.document.write(htmlContent);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 1000);
}
