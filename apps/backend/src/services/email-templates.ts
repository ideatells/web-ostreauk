import type { ContactSubmissionData, IntakeSubmissionData } from './types';

/**
 * Build HTML email body for contact form submission
 */
export function buildContactEmailHTML(data: ContactSubmissionData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7AAC2D; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nieuw Contactformulier</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Naam:</div>
        <div class="value">${escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="label">E-mail:</div>
        <div class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
      </div>
      ${data.phone ? `
      <div class="field">
        <div class="label">Telefoon:</div>
        <div class="value">${escapeHtml(data.phone)}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Bericht:</div>
        <div class="value">${escapeHtml(data.message).replace(/\n/g, '<br>')}</div>
      </div>
      <div class="field">
        <div class="label">Ontvangen op:</div>
        <div class="value">${new Date(data.createdAt).toLocaleString('nl-NL')}</div>
      </div>
    </div>
    <div class="footer">
      Dit bericht is verzonden via het contactformulier op ostrea.uk
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build plain text email body for contact form submission
 */
export function buildContactEmailText(data: ContactSubmissionData): string {
  return `
NIEUW CONTACTFORMULIER

Naam: ${data.name}
E-mail: ${data.email}
${data.phone ? `Telefoon: ${data.phone}` : ''}

Bericht:
${data.message}

Ontvangen op: ${new Date(data.createdAt).toLocaleString('nl-NL')}

---
Dit bericht is verzonden via het contactformulier op ostrea.uk
  `.trim();
}

/**
 * Build HTML email body for intake form submission
 */
export function buildIntakeEmailHTML(data: IntakeSubmissionData): string {
  const serviceTypeLabels = {
    bedrijfsjuristen: 'Bedrijfsjuristen',
    trust_formation: 'Trust Formation',
    belastingadvies: 'Belastingadvies',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #C9A84C; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; }
    .highlight { background-color: #fff3cd; padding: 10px; border-left: 4px solid #C9A84C; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nieuwe Intake Aanvraag</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Naam:</div>
        <div class="value">${escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="label">E-mail:</div>
        <div class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
      </div>
      ${data.phone ? `
      <div class="field">
        <div class="label">Telefoon:</div>
        <div class="value">${escapeHtml(data.phone)}</div>
      </div>
      ` : ''}
      ${data.company_name ? `
      <div class="field">
        <div class="label">Bedrijfsnaam:</div>
        <div class="value">${escapeHtml(data.company_name)}</div>
      </div>
      ` : ''}
      ${data.service_type ? `
      <div class="field highlight">
        <div class="label">Gewenste dienst:</div>
        <div class="value">${serviceTypeLabels[data.service_type]}</div>
      </div>
      ` : ''}
      ${data.message ? `
      <div class="field">
        <div class="label">Aanvullende informatie:</div>
        <div class="value">${escapeHtml(data.message).replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Ontvangen op:</div>
        <div class="value">${new Date(data.createdAt).toLocaleString('nl-NL')}</div>
      </div>
    </div>
    <div class="footer">
      Dit bericht is verzonden via het intake formulier op ostrea.uk
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build plain text email body for intake form submission
 */
export function buildIntakeEmailText(data: IntakeSubmissionData): string {
  const serviceTypeLabels = {
    bedrijfsjuristen: 'Bedrijfsjuristen',
    trust_formation: 'Trust Formation',
    belastingadvies: 'Belastingadvies',
  };

  return `
NIEUWE INTAKE AANVRAAG

Naam: ${data.name}
E-mail: ${data.email}
${data.phone ? `Telefoon: ${data.phone}` : ''}
${data.company_name ? `Bedrijfsnaam: ${data.company_name}` : ''}
${data.service_type ? `Gewenste dienst: ${serviceTypeLabels[data.service_type]}` : ''}

${data.message ? `Aanvullende informatie:\n${data.message}\n` : ''}
Ontvangen op: ${new Date(data.createdAt).toLocaleString('nl-NL')}

---
Dit bericht is verzonden via het intake formulier op ostrea.uk
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
