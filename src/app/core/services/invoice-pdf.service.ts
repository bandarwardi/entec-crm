import { Injectable } from '@angular/core';
import { Order } from '../services/sales.service';
import { formatDate } from '@angular/common';
import { SOCKET_URL, UPLOADS_URL } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class InvoicePdfService {

  constructor() {}

  generateInvoice(order: Order) {
    const html = this.buildInvoiceHtml(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Give fonts time to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 800);
    }
  }

  private buildInvoiceHtml(order: Order): string {
    const customerName = order.customer?.name || 'N/A';
    const customerPhone = order.customer?.phone || '';
    const customerEmail = order.customer?.email || '';
    const orderDate = order.createdAt ? formatDate(order.createdAt, 'MM/dd/yyyy', 'en-US') : 'N/A';
    const expirationDate = order.appExpiryDate ? formatDate(order.appExpiryDate, 'MM/dd/yyyy', 'en-US') : 'N/A';
    const serverExpiry = order.serverExpiryDate ? formatDate(order.serverExpiryDate, 'MM/dd/yyyy', 'en-US') : 'N/A';
    const paymentMethod = order.paymentMethod || 'N/A';
    const amount = order.amount || 0;
    const serverName = order.serverName || 'N/A';
    const appType = order.appType || 'N/A';
    const appYears = order.appYears || 1;
    const warrantyMonths = appYears * 12;
    const invoiceNumber = `#INV-${order.id}`;
    const notes = order.notes || '';
    const bgUrl = `${UPLOADS_URL}/invoice-bg.png`;

    // Build devices HTML
    let devicesHtml = '';
    if (order.devices && order.devices.length > 0) {
      order.devices.forEach((d, i) => {
        devicesHtml += `
          <div style="margin-bottom:6mm; padding:4mm 6mm; background:rgba(255,255,255,0.6); border-left:3px solid var(--gold); border-radius:4px;">
            <div style="font-size:10pt; font-weight:800; color:#1a4fa0; margin-bottom:2mm;">Device ${i + 1}: ${d.deviceName || 'N/A'}</div>
            <div style="display:flex; gap:10mm; flex-wrap:wrap;">
              <div class="order-field">MAC: ${d.macAddress || 'N/A'}</div>
              <div class="order-field">Key: ${d.deviceKey || 'N/A'}</div>
            </div>
          </div>`;
      });
    } else {
      devicesHtml = '<p style="color:#999; font-style:italic;">No devices registered</p>';
    }

    // Build attachments HTML
    let attachmentsHtml = '';
    if (order.attachments && order.attachments.length > 0) {
      order.attachments.forEach(url => {
        let fullUrl = url;
        if (url.startsWith('/uploads')) {
          fullUrl = SOCKET_URL + url;
        }
        attachmentsHtml += `<img class="screenshot-img" src="${fullUrl}" alt="Attachment" style="height:160px; width:auto; max-width:46%; object-fit:contain; border-radius:6px; box-shadow:0 4px 16px rgba(0,0,0,0.28);">`;
      });
    } else {
      attachmentsHtml = '<p style="color:#999; font-style:italic; text-align:center;">No attachments</p>';
    }

    // Build the header block (reused on every page)
    const headerBlock = `
      <div class="header">
        <div class="contact-info">info@entec.store<br>+1 (223) 203-0312</div>
        <div class="logo-block">
          <div class="logo-title">EN TEC</div>
          <div class="logo-subtitle">
            <span>MARKETING</span>
            <div class="divider"></div><span>COMPANY</span>
          </div>
          <div class="tagline">Our word is a guarantee</div>
        </div>
        <div class="badge-wrap">
          <div class="premium-badge">
            <span class="badge-text-top">Premium</span>
            <span class="badge-text-pct">100%</span>
          </div>
        </div>
      </div>`;

    const referralFooter = `
      <div class="referral-footer">
        When you refer a customer, <span class="gold">3 months will be added to your subscription.</span><br>
        If you refer 4 customers, <span class="gold">a free year will be added to your subscription.</span>
      </div>`;

    return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EN TEC - Invoice ${invoiceNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --gold: #c8960c; --page-bg: #ffffff; --text-dark: #111111; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Montserrat', sans-serif; background: #e0e0e0; }

    .page {
      width: 297mm; min-height: 210mm; background: var(--page-bg);
      margin: 0 auto 12mm; position: relative; overflow: hidden;
      page-break-after: always;
    }
    .map-bg {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center; opacity: 0.45;
      z-index: 0; pointer-events: none;
    }
    .content {
      position: relative; z-index: 2; width: 100%; height: 100%;
      display: flex; flex-direction: column; padding: 10mm 14mm 8mm;
    }
    .header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 6mm;
    }
    .contact-info {
      font-size: 9pt; font-weight: 600; color: var(--text-dark);
      line-height: 1.7; min-width: 44mm;
    }
    .logo-block { text-align: center; flex: 1; padding: 0 8mm; }
    .logo-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 44pt;
      letter-spacing: 6px; color: #111; line-height: 1; margin-bottom: 2px;
    }
    .logo-subtitle { display: flex; align-items: center; justify-content: center; }
    .logo-subtitle span {
      font-size: 7pt; letter-spacing: 5px; color: #555;
      font-weight: 600; text-transform: uppercase;
    }
    .logo-subtitle .divider {
      flex: 1; height: 1px; background: #bbb; max-width: 30mm; margin: 0 4mm;
    }
    .tagline {
      font-size: 11pt; font-weight: 800; color: var(--text-dark);
      margin-top: 3px; letter-spacing: 0.5px;
    }
    .badge-wrap {
      min-width: 44mm; display: flex; align-items: flex-start; justify-content: flex-end;
    }
    .premium-badge {
      width: 52px; height: 52px;
      background: radial-gradient(circle at 35% 35%, #ffe066, #c8960c 60%, #8a6000);
      border-radius: 50%; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      border: 3px solid #f5c842; box-shadow: 0 0 0 2px #c8960c;
      position: relative; margin-top: 14px;
    }
    .premium-badge::before {
      content: '★ ★ ★'; position: absolute; top: -14px;
      font-size: 7px; color: var(--gold); letter-spacing: 3px;
    }
    .premium-badge .badge-text-top {
      font-size: 6.5pt; font-weight: 800; color: #fff;
      letter-spacing: 1px; text-transform: uppercase;
    }
    .premium-badge .badge-text-pct {
      font-size: 10pt; font-weight: 800; color: #fff; line-height: 1;
    }
    .center-area {
      flex: 1; display: flex; align-items: center; justify-content: center;
    }
    .thankyou-text {
      font-family: 'Bebas Neue', sans-serif; font-size: 90pt;
      color: #1a4fa0; letter-spacing: 3px; transform: rotate(-3deg);
      line-height: 1; text-shadow: 3px 3px 0 rgba(26,79,160,0.12);
    }
    .order-block { width: 100%; }
    .order-block h2 {
      font-size: 12pt; font-weight: 800; margin-bottom: 4mm; color: var(--text-dark);
    }
    .order-block p {
      font-size: 9pt; font-weight: 700; line-height: 1.75;
      margin-bottom: 3mm; color: var(--text-dark);
    }
    .order-row {
      display: flex; gap: 10mm; margin: 5mm 0 4mm; flex-wrap: wrap;
    }
    .order-field { font-size: 9pt; font-weight: 800; color: var(--text-dark); }
    .payment-note {
      border-left: 3px solid var(--gold); background: rgba(255,255,255,0.55);
      padding: 4mm 6mm; font-size: 9pt; font-weight: 700;
      line-height: 1.75; color: var(--text-dark); margin-top: 3mm;
    }
    .device-block { width: 100%; }
    .device-block h2 {
      font-size: 12pt; font-weight: 800; margin-bottom: 4mm; color: var(--text-dark);
    }
    .screenshots-row {
      display: flex; align-items: center; justify-content: center;
      gap: 10mm; width: 100%; flex-wrap: wrap;
    }
    .notice-block { width: 100%; padding: 0 12mm; text-align: center; }
    .notice-block h2 {
      font-size: 18pt; font-weight: 800; margin-bottom: 8mm; color: var(--text-dark);
    }
    .notice-block p {
      font-size: 10pt; font-weight: 700; line-height: 1.8;
      margin-bottom: 5mm; color: var(--text-dark);
    }
    .referral-footer {
      text-align: center; padding: 4mm 0 0; font-size: 9pt;
      font-weight: 800; line-height: 1.7; color: var(--text-dark);
    }
    .referral-footer .gold { color: var(--gold); }

    @media print {
      body { background: white; }
      .page { margin: 0; page-break-after: always; box-shadow: none; }
    }
    @media screen {
      body { padding: 20px; }
      .page { box-shadow: 0 4px 24px rgba(0,0,0,0.18); border-radius: 2px; }
    }
  </style>
</head>
<body>

  <!-- PAGE 1 — THANK YOU -->
  <div class="page">
    <div class="content">
      ${headerBlock}
      <div class="center-area">
        <div class="thankyou-text">Thank you!</div>
      </div>
      ${referralFooter}
    </div>
  </div>

  <!-- PAGE 2 — ORDER CONFIRMATION -->
  <div class="page">
    <div class="content">
      ${headerBlock}
      <div class="center-area" style="align-items:flex-start;padding-top:2mm;">
        <div class="order-block">
          <h2>Order Confirmation — ${invoiceNumber}</h2>
          <p>
            Thank you for subscribing, <strong>${customerName}</strong>. We appreciate your
            choice and are committed to delivering exceptional value.
          </p>
          <p><strong>Customer:</strong> ${customerName} | ${customerPhone} | ${customerEmail}</p>
          <p><strong>Order Details:</strong></p>
          <div class="order-row">
            <div class="order-field">Order Date: ${orderDate}</div>
            <div class="order-field">Expiration: ${expirationDate}</div>
            <div class="order-field">Method: ${paymentMethod}</div>
            <div class="order-field">Amount: $${amount}</div>
          </div>
          <div class="order-row">
            <div class="order-field">Server: ${serverName}</div>
            <div class="order-field">App: ${appType}</div>
            <div class="order-field">Term: ${appYears} Year(s)</div>
          </div>
          <div class="payment-note">
            Your subscription payment has been processed successfully via <strong>${paymentMethod}</strong>.
            You can now access your subscription benefits by logging into the app, where your
            subscription status will be visible in account settings. For any questions or assistance, feel free
            to reply to this email or contact customer support. We are here to help.
          </div>
          ${notes ? `<div style="margin-top:4mm; padding:3mm 6mm; background:rgba(26,79,160,0.05); border-radius:4px; font-size:9pt; font-weight:600; color:#333;"><strong>Notes:</strong> ${notes}</div>` : ''}
        </div>
      </div>
      ${referralFooter}
    </div>
  </div>

  <!-- PAGE 3 — DEVICE INFORMATION -->
  <div class="page">
    <div class="content">
      ${headerBlock}
      <div class="center-area" style="align-items:flex-start;padding-top:2mm;">
        <div class="device-block">
          <h2>Device Information:</h2>
          ${devicesHtml}
        </div>
      </div>
      ${referralFooter}
    </div>
  </div>

  <!-- PAGE 4 — ATTACHMENTS -->
  <div class="page">
    <div class="content">
      <div class="center-area">
        <div class="screenshots-row">
          ${attachmentsHtml}
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 5 — NOTICE -->
  <div class="page">
    <div class="content">
      <div class="center-area">
        <div class="notice-block">
          <h2>NOTICE</h2>
          <p>
            In case the screens work at the same time, the broadcast will be interrupted until all the screens
            are turned off, one screen is returned on the same account and everything returns to work by 100%
          </p>
          <p>
            In case you request to activate another application on the same account with a different device id
            and device key, the cost of copying the account and activating the application will be <strong>$25</strong>.
          </p>
          <p>
            We are genuinely thrilled to welcome you as a subscriber. If you encounter any
            issues or need guidance, feel free to reach out. We are excited to provide you with a seamless and
            enriching experience. Best regards, <strong>EN TEC Team</strong>
          </p>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;
  }
}
