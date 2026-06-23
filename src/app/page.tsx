import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/es'); }
export const dynamic = 'force-dynamic';
