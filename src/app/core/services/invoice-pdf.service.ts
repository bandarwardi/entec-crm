import { Injectable } from '@angular/core';
import { Order } from '../services/sales.service';
import { formatDate } from '@angular/common';
import { UPLOADS_URL } from '../constants/api.constants';

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
    const invoiceNumber = order.id.slice(0, 6).toUpperCase();
    const notes = order.notes || '';

    // Build devices HTML
    let devicesHtml = '';
    if (order.devices && order.devices.length > 0) {
      order.devices.forEach((d, i) => {
        devicesHtml += `
          <tr>
            <td>${i + 1}</td>
            <td style="font-family: monospace;">${d.macAddress || 'N/A'}</td>
            <td style="font-family: monospace;">${d.deviceKey || 'N/A'}</td>
            <td>${d.deviceName || 'N/A'}</td>
          </tr>
        `;
      });
    } else {
      devicesHtml = '<tr><td colspan="4" style="text-align: center; color: #64748b;">No devices linked.</td></tr>';
    }

    // Build attachments HTML
    let attachmentsHtml = '';
    if (order.attachments && order.attachments.length > 0) {
      let imgs = '';
      order.attachments.forEach(url => {
        imgs += `<img src="${url}" alt="Attachment" style="height:140px; width:auto; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.1); margin-right:15px; margin-bottom:15px; border: 1px solid #e2e8f0;">`;
      });
      attachmentsHtml = `
        <div style="margin-top: 30px;">
          <h4 style="font-size: 13px; color: var(--secondary); font-weight: 800; margin-bottom: 10px; text-transform: uppercase;">Attachments</h4>
          <div style="display:flex; flex-wrap:wrap;">${imgs}</div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

    :root {
      --primary: #059669;
      --secondary: #0f172a;
      --gray-50: #f8fafc;
      --gray-200: #e2e8f0;
      --gray-500: #64748b;
      --gray-700: #334155;
      --white: #ffffff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Tajawal', sans-serif;
      background-color: var(--white);
      color: var(--gray-700);
      line-height: 1.5;
    }

    .page {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      background: var(--white);
      position: relative;
    }

    .content {
      padding: 40px;
      display: flex;
      flex-direction: column;
    }

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid var(--gray-200);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .logo-area { display: flex; align-items: center; gap: 15px; }
    .company h1 { color: var(--secondary); font-size: 28px; font-weight: 900; margin-bottom: 4px; letter-spacing: 1px; }
    .company p { color: var(--primary); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 36px; font-weight: 900; color: var(--primary); letter-spacing: 2px; margin-bottom: 4px; }
    .invoice-title p { font-size: 16px; color: var(--gray-500); font-weight: 700; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .info-box { background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 12px; padding: 15px; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; color: var(--primary); margin-bottom: 10px; font-weight: 800; border-bottom: 1px solid var(--gray-200); padding-bottom: 5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .info-row span:first-child { color: var(--gray-500); font-weight: 500; }
    .info-row span:last-child { color: var(--secondary); font-weight: 700; text-align: right; }

    .table-container { border-radius: 12px; overflow: hidden; border: 1px solid var(--gray-200); margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead { background-color: var(--secondary); color: var(--white); }
    th { padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    td { padding: 12px 15px; font-size: 13px; font-weight: 600; border-bottom: 1px solid var(--gray-200); color: var(--secondary); }
    tbody tr:nth-child(even) { background-color: var(--gray-50); }
    tbody tr:last-child td { border-bottom: none; }

    .bottom-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      margin-top: 20px;
    }

    .notes h4, .payment h4 { font-size: 13px; color: var(--secondary); font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
    .notes-box { background: var(--gray-50); border-left: 4px solid var(--primary); padding: 15px; font-size: 13px; font-weight: 500; border-radius: 0 8px 8px 0; min-height: 60px; }
    
    .notice { margin-top: 15px; font-size: 11px; color: #10b981; background: #f0fdf4; padding: 12px; border-radius: 8px; font-weight: 600; line-height: 1.5; }

    .total-box { background: var(--secondary); color: var(--white); border-radius: 12px; padding: 25px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .total-label { font-size: 15px; font-weight: 700; color: var(--gray-200); }
    .total-val { font-size: 32px; font-weight: 900; color: #10b981; }
    .pm { margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; font-size: 13px; }
    .pm span:last-child { font-weight: 800; color: var(--white); }

    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid var(--gray-200); text-align: center; }
    .rules { font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
    .contact { font-size: 12px; color: var(--gray-500); font-weight: 600; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content">
      
      <div class="header">
        <div class="logo-area">
          <div class="company">
            <h1>EN TEC</h1>
            <p>Our word is a guarantee</p>
          </div>
        </div>
        <div class="invoice-title">
          <h2>INVOICE</h2>
          <p>#${invoiceNumber}</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Customer Details</h3>
          <div class="info-row"><span>Name:</span> <span>${customerName}</span></div>
          <div class="info-row"><span>Phone:</span> <span dir="ltr">${customerPhone}</span></div>
          <div class="info-row"><span>Email:</span> <span>${customerEmail}</span></div>
        </div>
        <div class="info-box">
          <h3>Timeline</h3>
          <div class="info-row"><span>Order Date:</span> <span>${orderDate}</span></div>
          <div class="info-row"><span>App Expiry:</span> <span>${expirationDate}</span></div>
          <div class="info-row"><span>Server Expiry:</span> <span>${serverExpiry}</span></div>
        </div>
        <div class="info-box">
          <h3>Service Info</h3>
          <div class="info-row"><span>App Type:</span> <span>${appType} (${appYears}y)</span></div>
          <div class="info-row"><span>Server Name:</span> <span>${serverName}</span></div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 35%;">MAC Address</th>
              <th style="width: 30%;">Device Key</th>
              <th style="width: 30%;">Device Name</th>
            </tr>
          </thead>
          <tbody>
            ${devicesHtml}
          </tbody>
        </table>
      </div>

      <div class="bottom-grid">
        <div class="notes">
          ${notes ? `
            <h4>Order Notes</h4>
            <div class="notes-box">${notes}</div>
          ` : ''}
          <div class="notice">
            <p style="margin-bottom:8px;">Dear Customer, please be aware that MAC address subscriptions cannot be changed or transferred to another device or application.</p>
            <p>In case you request to activate another application on the same account with a different MAC Address and Device Key, the cost of copying the account and activating the application will be <strong>$25</strong>.</p>
          </div>
        </div>

        <div class="payment">
          <h4>Payment Summary</h4>
          <div class="total-box">
            <div class="total-row"><span class="total-label">Total Amount</span></div>
            <div class="total-row"><span class="total-val">$${amount}</span></div>
            <div class="pm">
              <span>Method:</span>
              <span>${paymentMethod}</span>
            </div>
          </div>
        </div>
      </div>

      ${attachmentsHtml}

      <div class="footer">
        <div class="rules">🌟 When you refer a customer, 3 months will be added to your subscription. &nbsp;|&nbsp; 🎁 If you refer 4 customers, a free year will be added.</div>
        <div class="contact">info@entec.store &nbsp;&nbsp;&bull;&nbsp;&nbsp; +1 (223) 203-0312</div>
      </div>

    </div>
  </div>
</body>
</html>`;
  }
}
