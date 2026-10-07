import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { authOptions } from '../auth/[...nextauth]/route';

// Categorize email based on subject and snippet
function categorizeEmail(subject: string, snippet: string): { label: string; color: string } {
  const text = (subject + ' ' + snippet).toLowerCase();

  if (text.includes('offer') || text.includes('congratulations') || text.includes('pleased to offer') || text.includes('selected')) {
    return { label: 'Offer 🎉', color: 'bg-green-100 text-green-800' };
  }
  if (text.includes('interview') || text.includes('schedule') || text.includes('availability') || text.includes('next steps') || text.includes('meet')) {
    return { label: 'Interview 📅', color: 'bg-blue-100 text-blue-800' };
  }
  if (text.includes('unfortunately') || text.includes('not moving forward') || text.includes('not selected') || text.includes('regret') || text.includes('other candidates')) {
    return { label: 'Rejected ❌', color: 'bg-red-100 text-red-800' };
  }
  if (text.includes('application was sent') || text.includes('applied') || text.includes('application received') || text.includes('thank you for applying') || text.includes('we received your')) {
    return { label: 'Applied ✅', color: 'bg-purple-100 text-purple-800' };
  }
  return { label: 'Job Related 📧', color: 'bg-gray-100 text-gray-700' };
}

export async function GET(request: Request) {
  // Support both web (NextAuth session) and mobile (Bearer token)
  let accessToken: string | null = null;

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7);
  } else {
    const session = await getServerSession(authOptions);
    accessToken = (session as any)?.accessToken ?? null;
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Broad search: catches both outgoing application confirmations AND incoming company replies
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'subject:(application OR applied OR interview OR "job offer" OR offer OR hiring OR "moving forward" OR "next steps" OR unfortunately OR "not selected" OR "your application" OR recruiter) OR from:(linkedin.com OR careers OR jobs OR hr OR recruit OR talent OR hiring)',
      maxResults: 20,
    });


    const messages = response.data.messages || [];

    const emails = await Promise.all(
      messages.map(async (msg) => {
        const msgDetails = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });

        const headers = msgDetails.data.payload?.headers;
        const subject = headers?.find((h) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers?.find((h) => h.name === 'From')?.value || 'Unknown';
        const date = headers?.find((h) => h.name === 'Date')?.value || '';

        const snippet = msgDetails.data.snippet || '';
        const category = categorizeEmail(subject, snippet);

        return {
          id: msg.id,
          subject,
          from,
          date,
          snippet,
          category,
        };
      })
    );

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
