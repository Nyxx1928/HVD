import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 10;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase environment variables are missing.' },
      { status: 500 }
    );
  }

  const noteId = id;

  const { data, error } = await supabase
    .from('love_wall_comments')
    .select('id,name,comment,created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = id;
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase environment variables are missing.' },
      { status: 500 }
    );
  }

  const now = Date.now();

  const { data: rateData, error: rateError } = await supabase
    .from('love_wall_rate_limits')
    .select('ip,count,reset_at')
    .eq('ip', clientIp)
    .maybeSingle();

  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: 500 });
  }

  if (!rateData) {
    const { error: insertError } = await supabase.from('love_wall_rate_limits').insert({
      ip: clientIp,
      count: 1,
      reset_at: new Date(now + rateLimitWindowMs).toISOString()
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const resetAt = new Date(rateData.reset_at).getTime();
    if (Number.isNaN(resetAt) || now > resetAt) {
      const { error: resetError } = await supabase
        .from('love_wall_rate_limits')
        .update({
          count: 1,
          reset_at: new Date(now + rateLimitWindowMs).toISOString()
        })
        .eq('ip', clientIp);

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 500 });
      }
    } else if (rateData.count >= rateLimitMaxRequests) {
      const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);
      return NextResponse.json(
        {
          error: `Too many comments. Try again in ${retryAfterSeconds}s.`
        },
        {
          status: 429,
          headers: { 'Retry-After': retryAfterSeconds.toString() }
        }
      );
    } else {
      const { error: bumpError } = await supabase
        .from('love_wall_rate_limits')
        .update({ count: rateData.count + 1 })
        .eq('ip', clientIp);

      if (bumpError) {
        return NextResponse.json({ error: bumpError.message }, { status: 500 });
      }
    }
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

  const name = payload.name?.trim();
  const comment = payload.comment?.trim();

  if (!name || !comment) {
    return NextResponse.json(
      { error: 'Name and comment are required.' },
      { status: 400 }
    );
  }

  if (name.length > 36 || comment.length > 200) {
    return NextResponse.json(
      { error: 'Comment is too long.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('love_wall_comments')
    .insert({
      note_id: noteId,
      name,
      comment
    })
    .select('id,name,comment,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
