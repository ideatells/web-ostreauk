# Backend Services

## SMTP2GO Email Service

Located at `src/services/smtp2go.ts`, this service sends transactional emails via the SMTP2GO REST API.

### Usage

```typescript
import { sendEmail } from './services/smtp2go';
import { buildContactEmailHTML, buildContactEmailText } from './services/email-templates';

// In a lifecycle hook
const emailData = {
  name: event.result.name,
  email: event.result.email,
  phone: event.result.phone,
  message: event.result.message,
  createdAt: event.result.createdAt,
};

await sendEmail({
  to: process.env.ADMIN_NOTIFICATION_EMAIL!,
  sender: process.env.SMTP2GO_SENDER_EMAIL!,
  subject: 'Nieuw Contactformulier',
  htmlBody: buildContactEmailHTML(emailData),
  textBody: buildContactEmailText(emailData),
});
```

### Environment Variables

- `SMTP2GO_API_KEY` - API key from SMTP2GO dashboard
- `SMTP2GO_SENDER_EMAIL` - Verified sender address (e.g., `noreply@ostrea.uk`)
- `ADMIN_NOTIFICATION_EMAIL` - Recipient for form notifications (e.g., `info@ostrea.uk`)

### Error Handling

The service throws `SMTP2GOError` on failures. Email sending is considered critical, so errors should be logged and may block the lifecycle hook if needed.

### Retry Logic

- Maximum 3 attempts
- Exponential backoff (1s, 2s, 4s)
- 10-second timeout per request
