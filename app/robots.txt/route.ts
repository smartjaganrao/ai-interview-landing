export const dynamic = 'force-static';

// RFC 9309: a crawler obeys only its most specific matching group — named
// groups do NOT inherit the `*` rules, so the disallow list is repeated in
// every named group below (search/citation bots and training bots alike).
const DISALLOW = `Disallow: /api/
Disallow: /dashboard
Disallow: /auth
Disallow: /checkout
Disallow: /creator`;

export function GET() {
  const body = `User-agent: *
Content-Signal: search=yes, ai-train=no, use=reference
Allow: /
${DISALLOW}

# AI answer-engine / citation crawlers - kept allowed so JavihAI can still
# be cited in ChatGPT Search, Perplexity, and Claude answers.
User-agent: OAI-SearchBot
Allow: /
${DISALLOW}

User-agent: ChatGPT-User
Allow: /
${DISALLOW}

User-agent: Claude-SearchBot
Allow: /
${DISALLOW}

User-agent: Claude-User
Allow: /
${DISALLOW}

User-agent: PerplexityBot
Allow: /
${DISALLOW}

# Model-training crawlers/tokens - opted out (matches the ai-train=no
# Content-Signal above), no effect on Search or AI Overviews eligibility
# since those run on Googlebot, not these bots.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

# Worst-behaved scraper - widely ignores disallow rules anyway, but stated
# for compliant clients.
User-agent: Bytespider
Disallow: /

Sitemap: https://javihai.in/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
