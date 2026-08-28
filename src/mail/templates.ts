export interface MailTemplate {
  subject: string;
  text: string;
  html: string;
}

export function verificationEmailTemplate(verificationUrl: string): MailTemplate {
  const safeUrl = escapeHtml(verificationUrl);

  return {
    subject: 'Verify your EazyShortener email',
    text: [
      'Welcome to EazyShortener.',
      '',
      'Verify your email address by opening this link:',
      verificationUrl,
      '',
      'If you did not create this account, you can ignore this email.',
    ].join('\n'),
    html: [
      '<p>Welcome to EazyShortener.</p>',
      '<p>Verify your email address by opening the link below:</p>',
      `<p><a href="${safeUrl}">Verify email</a></p>`,
      '<p>If you did not create this account, you can ignore this email.</p>',
    ].join(''),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}
