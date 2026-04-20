import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!API_URL) {
    return NextResponse.json(
      { error: 'API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/love-notes/${id}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({
        error: 'Failed to fetch comments',
      }));

      // Handle 404 for invalid note ID
      if (response.status === 404) {
        return NextResponse.json(
          { error: errorPayload.error || 'Love note not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: errorPayload.error || 'Failed to fetch comments' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Network error while fetching comments' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!API_URL) {
    return NextResponse.json(
      { error: 'API URL is not configured.' },
      { status: 500 }
    );
  }

  let payload: {
    name?: string;
    comment?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/love-notes/${id}/comments`, {
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
        error: 'Failed to create comment',
      }));

      // Handle 404 for invalid note ID
      if (response.status === 404) {
        return NextResponse.json(
          { error: errorPayload.error || 'Love note not found' },
          { status: 404 }
        );
      }

      // Handle rate limiting with Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return NextResponse.json(
          { error: errorPayload.error || 'Too many comments. Please try again later.' },
          {
            status: 429,
            headers: retryAfter ? { 'Retry-After': retryAfter } : {},
          }
        );
      }

      return NextResponse.json(
        { error: errorPayload.error || 'Failed to create comment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Network error while creating comment' },
      { status: 500 }
    );
  }
}
