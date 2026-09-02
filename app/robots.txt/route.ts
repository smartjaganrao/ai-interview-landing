export const dynamic = 'force-static';

export function GET() {
  const body = `User-agent: *
Content-Signal: search=yes, ai-train=no, use=reference
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /auth
Disallow: /checkout
Disallow: /creator

Sitemap: https://javihai.in/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
