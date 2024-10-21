import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, sandboxUrl } = await request.json();

    const data = await resend.emails.send({
      from: 'SQL Sandbox <noreply@imnotfun.com>',
      to: [to],
      subject: 'Your SQL Sandbox Link',
      html: `<p>Here's your SQL Sandbox link: <a href="${sandboxUrl}">${sandboxUrl}</a></p>`
    });

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