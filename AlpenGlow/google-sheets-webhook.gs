/**
 * google-sheets-webhook.gs
 * ─────────────────────────────────────────────────────────────
 * SETUP STEPS:
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Paste this entire file into the editor
 *  3. Click Deploy → New Deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. Copy the Web App URL
 *  5. In Supabase Dashboard → Edge Functions → Secrets,
 *     add: GOOGLE_SHEETS_WEBHOOK_URL = <your web app URL>
 *
 * The sheet will auto-create a header row on first hit.
 * Each lead from the website appears as a new row instantly.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data  = JSON.parse(e.postData.contents);

    // Create header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Source', 'Name', 'Email', 'Phone',
        'Message', 'Package', 'Offer Code'
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#9d2420').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Append new lead row
    sheet.appendRow([
      data.timestamp   || new Date().toISOString(),
      data.source      || '',
      data.name        || '',
      data.email       || '',
      data.phone       || '',
      data.message     || '',
      data.package_name || '',
      data.offer_code  || '',
    ]);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 8);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Webhook error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run from the Apps Script editor to verify setup
function testWebhook() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp:    new Date().toISOString(),
        source:       'contact_form',
        name:         'Test User',
        email:        'test@example.com',
        phone:        '+91 98765 43210',
        message:      'Test lead from Apps Script',
        package_name: '',
        offer_code:   '',
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
