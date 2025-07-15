// app/api/apollo/route.js
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q'); // Company search
  const orgId = searchParams.get('orgId'); // Contact search
  const personId = searchParams.get('personId'); // Enrich person
  const domain = searchParams.get('domain'); // Optional domain fallback

  if (!q && !orgId && !personId) {
    return NextResponse.json({ error: 'A search parameter is required' }, { status: 400 });
  }

  const API_KEY = process.env.APOLLO_API_KEY;
  console.log('🔐 Loaded Apollo Key:', API_KEY?.slice(0, 10), '...');

  if (!API_KEY) {
    return NextResponse.json({ error: 'Apollo API key is missing in environment variables.' }, { status: 500 });
  }

  const BASE_URL = "https://api.apollo.io/api/v1";
  const HEADERS = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'Cache-Control': 'no-cache',
    'Accept': 'application/json'
  };

  let url = '';
  let method = 'POST';
  let body = null;

  // 🔍 1. Search companies by name using mixed_companies/search
  if (q) {
    console.log('🔍 Searching for companies:', q);
    url = `${BASE_URL}/mixed_companies/search`;
    body = JSON.stringify({
      q_organization_name: q,
      partial_results_only: true,
      partial_results_limit: 10000,
      has_join: false,
      disable_eu_prospecting: true,
      page: 1,
      per_page: 15,
    });
  }

  // 🧑‍💼 2. Get contacts for an organization ID using mixed_people/search
  else if (orgId) {
    console.log('🧠 Using mixed_people/search for org ID:', orgId);
    url = `${BASE_URL}/mixed_people/search`;

    if (!domain) {
      return NextResponse.json({ error: 'Domain not provided for orgId-based contact search.' }, { status: 400 });
    }

    body = JSON.stringify({
      q_organization_domains_list: [domain.replace(/^www\./, '')],
      include_similar_titles: true,
      person_seniorities: [
        "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager"
      ],
      contact_email_status: ["verified", "likely to engage"],
      page: 1,
      per_page: 100
    });
  }

  // 📞 3. Enrich person details (get phone number and email)
  else if (personId) {
    console.log('📞 Enriching person:', personId);
    url = `${BASE_URL}/people/match`;
    method = 'POST';

    body = JSON.stringify({
      id: personId,
      reveal_personal_emails: true,
      reveal_phone_number: true,
      webhook_url: "https://apolloscrape.vercel.app/" // 🔁 replace with your real public URL
    });
  }

  try {
    const fetchOptions = method === 'GET'
      ? { method, headers: HEADERS }
      : { method, headers: HEADERS, body };

    console.log('📡 Making request to:', url);
    console.log('📡 Request body:', body);

    const response = await fetch(url, fetchOptions);
    console.log('📊 Apollo status:', response.status, response.statusText);

    const text = await response.text();
    console.log('📊 Apollo raw response length:', text.length);

    if (!text || !text.trim().startsWith('{')) {
      console.error('❌ Invalid response format:', text.substring(0, 200));
      return NextResponse.json({ error: 'Apollo returned an unexpected response.' }, { status: 502 });
    }

    const data = JSON.parse(text);

    if (!response.ok) {
      console.error('❌ Apollo API error:', data);
      return NextResponse.json({ error: data.error || 'Apollo API error' }, { status: response.status });
    }

    if (data.people?.length > 0) {
      console.log('👤 Sample person:', JSON.stringify(data.people[0], null, 2));
    } else {
      console.log('⚠️ No contacts found — try relaxing filters further or verify plan limits.');
    }

    let transformedData = data;

    if (q) {
      console.log('🔧 Transforming company search response');
      console.log('📊 Raw companies data keys:', Object.keys(data));

      if (data.mixed_companies) {
        transformedData = {
          organizations: data.mixed_companies,
          mixed_companies: data.mixed_companies
        };
      } else if (data.organizations) {
        transformedData = {
          organizations: data.organizations,
          mixed_companies: data.organizations
        };
      }

      console.log('✅ Company search found:', transformedData.organizations?.length || 0, 'results');
    }

    else if (orgId) {
      console.log('🔧 Transforming contact search response');
      console.log('📊 Raw contacts data keys:', Object.keys(data));

      transformedData = {
        people: data.people || [],
        contacts: data.people || []
      };

      console.log('✅ Contact search found:', transformedData.people?.length || 0, 'results');
    }

    else if (personId) {
      console.log('🔧 Transforming person enrichment response');
      console.log('📊 Raw person data keys:', Object.keys(data));

      if (data.person) {
        transformedData = data;
      } else if (data.people && data.people.length > 0) {
        transformedData = { person: data.people[0] };
      }

      const phoneNumber = transformedData.person?.phone_numbers?.[0]?.sanitized_number ||
                         transformedData.person?.phone || null;
      const email = transformedData.person?.email || transformedData.person?.emails?.[0] || null;

      console.log('✅ Person enrichment phone:', phoneNumber ? '✓' : '✗');
      console.log('✅ Person enrichment email:', email ? '✓' : '✗');
    }

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('🔴 Apollo Proxy Error:', error);
    return NextResponse.json({
      error: `Internal Server Error: ${error.message}`
    }, { status: 500 });
  }
}
