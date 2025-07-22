// app/api/apollo/route.js
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q'); // Company search query

  if (!q) {
    return NextResponse.json({ error: 'Company search parameter (q) is required' }, { status: 400 });
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

<<<<<<< Updated upstream
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
        "owner", "founder", "c_suite", "partner", "vp", "head", "director"
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
      webhook_url: "https://apolloscrape.vercel.app/api/apollowebhook"
      // webhook_url: "https://yourdomain.com/api/apollo-webhook" // 🔁 replace with your real public URL
    });
=======
  console.log('🔍 Searching for companies:', q);
  const url = `${BASE_URL}/mixed_companies/search`;
  
  const body = JSON.stringify({
    q_organization_name: q,
    partial_results_only: true,
    partial_results_limit: 10000,
    has_join: false,
    disable_eu_prospecting: true,
    page: 1,
    per_page: 25, // Increased to show more options
  });
>>>>>>> Stashed changes

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: body
    });

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

    // Transform the response to ensure consistent structure
    let transformedData = data;

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

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('🔴 Apollo Proxy Error:', error);
    return NextResponse.json({
      error: `Internal Server Error: ${error.message}`
    }, { status: 500 });
  }
<<<<<<< Updated upstream
}
}
=======
}
>>>>>>> Stashed changes
