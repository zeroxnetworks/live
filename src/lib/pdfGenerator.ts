import html2pdf from "html2pdf.js";
import { PrivacyPolicyData, ReviewItem } from "../types";

export async function generatePolicyAndReviewsPDF(
  policyData: PrivacyPolicyData,
  reviews: ReviewItem[]
) {
  const approvedReviews = reviews.filter((r) => r.status === "APPROVED");
  const totalCount = approvedReviews.length;
  const avgRating =
    totalCount > 0
      ? (approvedReviews.reduce((a, b) => a + b.rating, 0) / totalCount).toFixed(1)
      : "5.0";

  // Create temporary container for PDF rendering
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "800px";
  container.style.padding = "40px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";

  const sectionsHTML = policyData.sections
    .map(
      (sec, idx) => `
      <div style="margin-bottom: 24px; page-break-inside: avoid; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
          ${idx + 1}. ${sec.title}
        </h3>
        <p style="font-size: 11px; line-height: 1.6; color: #334155; white-space: pre-line;">
          ${sec.content}
        </p>
      </div>
    `
    )
    .join("");

  const reviewsHTML = approvedReviews
    .slice(0, 15) // Top 15 reviews for PDF
    .map(
      (rev) => `
      <div style="margin-bottom: 16px; padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div>
            <strong style="font-size: 12px; color: #0f172a;">${rev.username}</strong>
            <span style="font-size: 10px; color: #64748b; margin-left: 8px;">(${rev.category})</span>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #d97706;">
            ${rev.rating}.0 ★
          </div>
        </div>
        <h4 style="font-size: 12px; font-weight: 700; color: #1e293b; margin: 4px 0;">${rev.title}</h4>
        <p style="font-size: 11px; color: #475569; margin: 4px 0; line-height: 1.5;">${rev.comment}</p>
        ${
          rev.adminReply
            ? `<div style="margin-top: 8px; padding: 8px; background-color: #eff6ff; border-left: 3px solid #00AEEF; font-size: 10px; color: #1e3a8a;">
                <strong>Response from ZeroX Team:</strong> ${rev.adminReply}
              </div>`
            : ""
        }
      </div>
    `
    )
    .join("");

  container.innerHTML = `
    <div style="padding: 20px;">
      
      <!-- Document Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00AEEF; padding-bottom: 16px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; tracking-tight: -0.5px;">
            ZeroX Network
          </h1>
          <p style="font-size: 11px; color: #00AEEF; font-weight: 700; margin: 2px 0 0 0;">
            OFFICIAL PRIVACY POLICY & CUSTOMER REVIEWS REPORT
          </p>
        </div>
        <div style="text-align: right; font-size: 10px; color: #64748b;">
          <div><strong>Date:</strong> ${policyData.lastUpdated}</div>
          <div><strong>Contact:</strong> ${policyData.contactEmail}</div>
          <div><strong>Website:</strong> https://zeroxnetwork.ai.studio</div>
          <div><strong>Organization:</strong> A project of Injazify (https://www.injazify.com/)</div>
        </div>
      </div>

      <!-- Policy Overview -->
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          ${policyData.title}
        </h2>
        <p style="font-size: 11px; color: #475569; margin-bottom: 16px;">
          ${policyData.subtitle}
        </p>
        
        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 10px; color: #334155;">
          <strong>Legal Statement:</strong> This official document contains the current privacy policy, data encryption standards, user term agreements, and verified customer review summary for ZeroX Network services.
        </div>
      </div>

      <!-- Section 1: Privacy Policy Terms -->
      <div style="margin-bottom: 32px;">
        <h2 style="font-size: 14px; font-weight: 900; color: #00AEEF; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px;">
          Part I: Terms & Privacy Policy
        </h2>
        ${sectionsHTML}
      </div>

      <!-- Section 2: Customer Reviews Summary -->
      <div style="margin-bottom: 24px; page-break-before: always;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="font-size: 14px; font-weight: 900; color: #00AEEF; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
            Part II: Verified Customer Feedback & Ratings
          </h2>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">
            Average Rating: ${avgRating} / 5.0 ★ (${totalCount} Verified Reviews)
          </div>
        </div>
        ${reviewsHTML}
      </div>

      <!-- Document Footer -->
      <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; pt: 16px; text-align: center; font-size: 9px; color: #94a3b8;">
        © ${new Date().getFullYear()} ZeroX Network. All Rights Reserved. Confidential & Official Public Document.
      </div>

    </div>
  `;

  document.body.appendChild(container);

  const opt = {
    margin: 10,
    filename: `ZeroX_Privacy_Policy_And_Reviews_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.warn("PDF generation error, falling back to window print", err);
    window.print();
  } finally {
    document.body.removeChild(container);
  }
}
