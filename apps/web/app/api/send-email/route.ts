import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function maskApiKey(key: string): string {
  if (key.length <= 8) return '********';
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY || '';
  console.log('Resend API Key (masked):', maskApiKey(apiKey));

  const resend = new Resend(apiKey);

  try {
    const { to, sandboxUrl } = await request.json();
    console.log('Sending email to:', to);
    console.log('Sandbox URL:', sandboxUrl);

    const data = await resend.emails.send({
      from: 'SQL Sandbox <noreply@imnotfun.com>',
      to: [to],
      subject: 'Your SQL Sandbox Link',
      html: `<p>Here's your SQL Sandbox link: <a href="${sandboxUrl}">${sandboxUrl}</a></p>`
    });

    console.log('Resend API Response:', data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}