// app/api/validate-key/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const groq = new Groq({ apiKey: apiKey.trim() });

    // Make a minimal request to validate the key
    await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    });

    return NextResponse.json({ valid: true });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error('Key validation error:', err);
    
    // If it's a strict authentication error, reject it
    if (err?.status === 401 || err?.error?.message?.toLowerCase().includes('invalid api key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your key at console.groq.com/keys' }, 
        { status: 401 }
      );
    }
    
    // If it failed for ANY other reason (rate limit, model down, out of tokens),
    // the key itself is technically valid, so let them into the app.
    // The main generation API handles rate limit warnings gracefully anyway.
    return NextResponse.json({ valid: true });
  }
}
