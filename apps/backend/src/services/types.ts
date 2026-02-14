// SMTP2GO API request payload
export interface SMTP2GOEmailRequest {
  sender: string;
  to: string[];
  subject: string;
  html_body?: string;
  text_body?: string;
}

// SMTP2GO API response
export interface SMTP2GOResponse {
  data: {
    succeeded: number;
    failed: number;
    failures?: Array<{
      email: string;
      error: string;
    }>;
  };
  request_id?: string;
}

// Email service parameters
export interface SendEmailParams {
  to: string | string[];
  sender: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
}

// Contact submission data for email templates
export interface ContactSubmissionData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
}

// Intake submission data for email templates
export interface IntakeSubmissionData {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  service_type?: 'bedrijfsjuristen' | 'trust_formation' | 'belastingadvies';
  message?: string;
  createdAt: string;
}
