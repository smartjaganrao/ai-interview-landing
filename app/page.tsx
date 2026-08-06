import { getDynamicPricing } from '@/lib/firebase-admin';
import LandingClient from '@/components/LandingClient';

export default async function Page() {
  const pricing = await getDynamicPricing();

  return <LandingClient initialPricing={pricing} />;
}
