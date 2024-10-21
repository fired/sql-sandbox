import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

// Define the expected shape of the request body
const emailSchema = z.object({
  to: z.string().email(),
  sandboxUrl: z.string().url()
});

class EmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailSendError';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, sandboxUrl } = emailSchema.parse(body);

    const data = await resend.emails.send({
      from: 'SQL Sandbox <noreply@imnotfun.com>',
      to: [to],
      subject: 'Your SQL Sandbox Link',
      html: `<p>Here's your SQL Sandbox link: <a href="${sandboxUrl}">${sandboxUrl}</a></p>`
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to send email:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    if (error instanceof EmailSendError) {
      return NextResponse.json({ success: false, error: 'Failed to send email', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }
}