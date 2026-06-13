import { NextRequest, NextResponse } from 'next/server';

// Adzuna free tier: 250 req/month. Register at developer.adzuna.com
// Env vars: ADZUNA_APP_ID, ADZUNA_APP_KEY
// Fallback: curated static jobs if env vars not set (good enough for MVP)

const STATIC_JOBS = [
  { id: '1', title: 'Software Engineer', company: 'Flipkart', location: 'Bangalore', salary: '₹18–28 LPA', type: 'Full-time', skills: ['Java', 'Spring Boot', 'Microservices'], postedAt: '2 days ago', applyUrl: 'https://flipkartcareers.com', description: 'Build scalable backend systems for Flipkart marketplace serving 400M+ users.' },
  { id: '2', title: 'Frontend Engineer', company: 'Swiggy', location: 'Bangalore', salary: '₹20–32 LPA', type: 'Full-time', skills: ['React', 'TypeScript', 'Node.js'], postedAt: '1 day ago', applyUrl: 'https://bytes.swiggy.com/careers', description: 'Own the consumer app frontend used by 10M+ daily active users.' },
  { id: '3', title: 'Backend Engineer', company: 'Razorpay', location: 'Bangalore', salary: '₹22–35 LPA', type: 'Full-time', skills: ['Go', 'Kafka', 'PostgreSQL'], postedAt: '3 days ago', applyUrl: 'https://razorpay.com/jobs', description: 'Build the payment infrastructure processing ₹5L Cr+ annually.' },
  { id: '4', title: 'Full Stack Engineer', company: 'CRED', location: 'Bangalore', salary: '₹25–40 LPA', type: 'Full-time', skills: ['React', 'Python', 'AWS'], postedAt: '5 hours ago', applyUrl: 'https://careers.cred.club', description: 'Build fintech products for India\'s high-trust credit-card user base.' },
  { id: '5', title: 'ML Engineer', company: 'Meesho', location: 'Bangalore', salary: '₹20–30 LPA', type: 'Full-time', skills: ['Python', 'TensorFlow', 'Spark'], postedAt: '1 day ago', applyUrl: 'https://meesho.io/careers', description: 'Build recommendation and ranking models for India\'s social commerce platform.' },
  { id: '6', title: 'DevOps Engineer', company: 'Ola', location: 'Bangalore', salary: '₹18–26 LPA', type: 'Full-time', skills: ['Kubernetes', 'Terraform', 'AWS'], postedAt: '4 days ago', applyUrl: 'https://olaelectric.com/careers', description: 'Scale infrastructure supporting millions of rides and EV fleet management.' },
  { id: '7', title: 'Software Engineer II', company: 'PhonePe', location: 'Bangalore', salary: '₹20–34 LPA', type: 'Full-time', skills: ['Java', 'Kafka', 'Redis'], postedAt: '2 days ago', applyUrl: 'https://phonepe.com/en-in/life-at-phonepe.html', description: 'Build the payments platform serving 500M+ registered users.' },
  { id: '8', title: 'React Native Engineer', company: 'Zepto', location: 'Mumbai', salary: '₹16–25 LPA', type: 'Full-time', skills: ['React Native', 'TypeScript', 'Redux'], postedAt: '6 hours ago', applyUrl: 'https://zeptonow.com/careers', description: 'Build the consumer app delivering groceries in 10 minutes across Indian cities.' },
  { id: '9', title: 'Data Engineer', company: 'Groww', location: 'Bangalore (Remote OK)', salary: '₹18–28 LPA', type: 'Full-time', skills: ['Python', 'dbt', 'BigQuery'], postedAt: '3 days ago', applyUrl: 'https://groww.in/p/careers', description: 'Build the data platform for India\'s largest retail investing platform.' },
  { id: '10', title: 'Senior Frontend Engineer', company: 'Zomato', location: 'Gurgaon', salary: '₹28–45 LPA', type: 'Full-time', skills: ['React', 'Next.js', 'GraphQL'], postedAt: '1 day ago', applyUrl: 'https://www.zomato.com/careers', description: 'Lead frontend engineering for Zomato\'s consumer products used by 80M+ users.' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query    = searchParams.get('q')?.toLowerCase() ?? '';
  const location = searchParams.get('location')?.toLowerCase() ?? '';

  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  // If Adzuna credentials exist, proxy to their API
  if (appId && appKey) {
    try {
      const params = new URLSearchParams({
        app_id:  appId,
        app_key: appKey,
        results_per_page: '20',
        what: query || 'software engineer',
        where: location || 'india',
        content_type: 'application/json',
      });
      const res  = await fetch(`https://api.adzuna.com/v1/api/jobs/in/search/1?${params}`);
      const json = await res.json() as { results?: unknown[] };
      return NextResponse.json({ jobs: json.results ?? [], source: 'adzuna' });
    } catch {
      // fall through to static
    }
  }

  // Fallback: filter static list
  const filtered = STATIC_JOBS.filter(j => {
    const haystack = `${j.title} ${j.company} ${j.skills.join(' ')} ${j.description}`.toLowerCase();
    const locHay   = j.location.toLowerCase();
    const qMatch   = !query    || haystack.includes(query);
    const lMatch   = !location || locHay.includes(location);
    return qMatch && lMatch;
  });

  return NextResponse.json({ jobs: filtered, source: 'static' });
}
