import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (!API_URL) {
    return NextResponse.json(
      { error: 'API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/love-notes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({
        error: 'Failed to fetch love notes',
      }));
      return NextResponse.json(
        { error: errorPayload.error || 'Failed to fetch love notes' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Network error while fetching love notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { error: 'API URL is not configured.' },
      { status: 500 }
    );
  }

  let payload: {
    name?: string;
    message?: string;
    emoji?: string;
    color?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/love-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward IP headers for rate limiting
        ...(request.headers.get('x-forwarded-for') && {
          'x-forwarded-for': request.headers.get('x-forwarded-for')!,
        }),
        ...(request.headers.get('x-real-ip') && {
          'x-real-ip': request.headers.get('x-real-ip')!,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({
        error: 'Failed to create love note',
      }));

      // Handle rate limiting with Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return NextResponse.json(
          { error: errorPayload.error || 'Too many requests' },
          {
            status: 429,
            headers: retryAfter ? { 'Retry-After': retryAfter } : {},
          }
        );
      }

      return NextResponse.json(
        { error: errorPayload.error || 'Failed to create love note' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Network error while creating love note' },
      { status: 500 }
    );
  }
}
