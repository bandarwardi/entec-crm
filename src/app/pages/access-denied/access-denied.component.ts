import { Component } from '@angular/core';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fff; color: #333; padding: 20px; text-align: center;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dcdde1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 30px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h2 style="font-size: 1.6rem; font-weight: 500; margin-bottom: 15px; color: #1a1a1a;">This site can’t be reached</h2>
      <p style="font-size: 1.05rem; color: #5f6368; max-width: 450px; line-height: 1.5; margin: 0 auto 30px auto;">
        The connection has timed out. The server at <b>entec-crm.web.app</b> is taking too long to respond.
      </p>
      
      <div style="text-align: left; background-color: #f8f9fa; border-radius: 8px; padding: 20px; width: 100%; max-width: 450px; border: 1px solid #eee;">
        <p style="font-size: 0.95rem; font-weight: 500; margin-bottom: 10px; color: #3c4043;">Try:</p>
        <ul style="font-size: 0.9rem; color: #5f6368; padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 8px;">Checking the connection</li>
          <li style="margin-bottom: 8px;">Checking the proxy and the firewall</li>
          <li>Running Windows Network Diagnostics</li>
        </ul>
      </div>
      
      <div style="margin-top: 30px; width: 100%; max-width: 450px; text-align: left;">
        <p style="font-size: 0.85rem; color: #70757a;">ERR_CONNECTION_TIMED_OUT</p>
        <button onclick="window.location.reload()" style="margin-top: 15px; background-color: #1a73e8; border: none; padding: 10px 24px; border-radius: 4px; color: #fff; cursor: pointer; font-size: 0.9rem; font-weight: 500; box-shadow: 0 1px 2px rgba(60,64,67,0.3);">Reload</button>
      </div>
    </div>
  `,
})
export class AccessDeniedComponent { }
