// app/api/apollowebhook/route.js
import { NextResponse } from 'next/server';

let latestRevealedPhones = {}; // TEMP in-memory storage (replace with DB in production)

export async function POST(req) {
  try {
    const data = await req.json();

    const personId = data?.person?.id;
    const phone = data?.person?.phone_numbers?.[0]?.sanitized_number || data?.person?.phone || null;

    if (!personId || !phone) {
      return NextResponse.json({ message: "Missing personId or phone" }, { status: 400 });
    }

    // Store revealed phone temporarily (production = use Redis, DB, etc.)
    latestRevealedPhones[personId] = phone;

    console.log(`📞 Webhook: Received phone for person ${personId}: ${phone}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Optional GET endpoint to allow your frontend to retrieve revealed phone
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get('personId');

  if (!personId) {
    return NextResponse.json({ error: 'Missing personId' }, { status: 400 });
  }

  const phone = latestRevealedPhones[personId];

  if (!phone) {
    return NextResponse.json({ error: 'Phone not revealed yet' }, { status: 404 });
  }

  return NextResponse.json({ phone });
}
