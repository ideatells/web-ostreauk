import { describe, it, expect } from 'vitest';
import {
  buildContactEmailHTML,
  buildContactEmailText,
  buildIntakeEmailHTML,
  buildIntakeEmailText,
} from '../../../src/services/email-templates';
import type { ContactSubmissionData, IntakeSubmissionData } from '../../../src/services/types';

describe('Email Templates', () => {
  describe('Contact Form Templates', () => {
    const mockContactData: ContactSubmissionData = {
      name: 'Jan de Vries',
      email: 'jan@example.com',
      phone: '06-12345678',
      message: 'Ik heb een vraag over bedrijfsjuristen.',
      createdAt: '2026-02-14T10:30:00.000Z',
    };

    it('should build HTML email for contact submission', () => {
      const html = buildContactEmailHTML(mockContactData);

      expect(html).toContain('Nieuw Contactformulier');
      expect(html).toContain('Jan de Vries');
      expect(html).toContain('jan@example.com');
      expect(html).toContain('06-12345678');
      expect(html).toContain('Ik heb een vraag over bedrijfsjuristen.');
    });

    it('should build text email for contact submission', () => {
      const text = buildContactEmailText(mockContactData);

      expect(text).toContain('NIEUW CONTACTFORMULIER');
      expect(text).toContain('Naam: Jan de Vries');
      expect(text).toContain('E-mail: jan@example.com');
      expect(text).toContain('Telefoon: 06-12345678');
      expect(text).toContain('Bericht:\nIk heb een vraag over bedrijfsjuristen.');
    });

    it('should handle missing phone number in contact form', () => {
      const dataWithoutPhone: ContactSubmissionData = {
        ...mockContactData,
        phone: undefined,
      };

      const html = buildContactEmailHTML(dataWithoutPhone);
      const text = buildContactEmailText(dataWithoutPhone);

      expect(html).not.toContain('Telefoon:');
      expect(text).not.toContain('Telefoon:');
    });

    it('should escape HTML special characters in contact form', () => {
      const dataWithHtml: ContactSubmissionData = {
        ...mockContactData,
        name: '<script>alert("xss")</script>',
        message: 'Test & <b>bold</b>',
      };

      const html = buildContactEmailHTML(dataWithHtml);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;b&gt;');
    });
  });

  describe('Intake Form Templates', () => {
    const mockIntakeData: IntakeSubmissionData = {
      name: 'Maria Jansen',
      email: 'maria@bedrijf.nl',
      phone: '020-1234567',
      company_name: 'Bedrijf BV',
      service_type: 'trust_formation',
      message: 'Wij willen graag een trust oprichten.',
      createdAt: '2026-02-14T14:45:00.000Z',
    };

    it('should build HTML email for intake submission', () => {
      const html = buildIntakeEmailHTML(mockIntakeData);

      expect(html).toContain('Nieuwe Intake Aanvraag');
      expect(html).toContain('Maria Jansen');
      expect(html).toContain('maria@bedrijf.nl');
      expect(html).toContain('020-1234567');
      expect(html).toContain('Bedrijf BV');
      expect(html).toContain('Trust Formation');
      expect(html).toContain('Wij willen graag een trust oprichten.');
    });

    it('should build text email for intake submission', () => {
      const text = buildIntakeEmailText(mockIntakeData);

      expect(text).toContain('NIEUWE INTAKE AANVRAAG');
      expect(text).toContain('Naam: Maria Jansen');
      expect(text).toContain('E-mail: maria@bedrijf.nl');
      expect(text).toContain('Telefoon: 020-1234567');
      expect(text).toContain('Bedrijfsnaam: Bedrijf BV');
      expect(text).toContain('Gewenste dienst: Trust Formation');
      expect(text).toContain('Aanvullende informatie:\nWij willen graag een trust oprichten.');
    });

    it('should handle all service types correctly', () => {
      const serviceTypes: Array<'bedrijfsjuristen' | 'trust_formation' | 'belastingadvies'> = [
        'bedrijfsjuristen',
        'trust_formation',
        'belastingadvies',
      ];

      const expectedLabels = {
        bedrijfsjuristen: 'Bedrijfsjuristen',
        trust_formation: 'Trust Formation',
        belastingadvies: 'Belastingadvies',
      };

      serviceTypes.forEach((serviceType) => {
        const data: IntakeSubmissionData = {
          ...mockIntakeData,
          service_type: serviceType,
        };

        const html = buildIntakeEmailHTML(data);
        const text = buildIntakeEmailText(data);

        expect(html).toContain(expectedLabels[serviceType]);
        expect(text).toContain(expectedLabels[serviceType]);
      });
    });

    it('should handle optional fields in intake form', () => {
      const minimalData: IntakeSubmissionData = {
        name: 'Minimal User',
        email: 'minimal@example.com',
        createdAt: '2026-02-14T15:00:00.000Z',
      };

      const html = buildIntakeEmailHTML(minimalData);
      const text = buildIntakeEmailText(minimalData);

      expect(html).toContain('Minimal User');
      expect(html).not.toContain('Telefoon:');
      expect(html).not.toContain('Bedrijfsnaam:');
      expect(html).not.toContain('Gewenste dienst:');
      expect(html).not.toContain('Aanvullende informatie:');

      expect(text).toContain('Minimal User');
      expect(text).not.toContain('Telefoon:');
      expect(text).not.toContain('Bedrijfsnaam:');
    });

    it('should escape HTML special characters in intake form', () => {
      const dataWithHtml: IntakeSubmissionData = {
        ...mockIntakeData,
        company_name: '<Company & Co>',
        message: 'Test "quotes" & <tags>',
      };

      const html = buildIntakeEmailHTML(dataWithHtml);

      expect(html).toContain('&lt;Company &amp; Co&gt;');
      expect(html).toContain('&quot;quotes&quot;');
      expect(html).toContain('&lt;tags&gt;');
    });
  });
});
