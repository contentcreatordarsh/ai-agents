import { Dashboard } from "@/components/Dashboard";
import { buildNewspaper } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await buildNewspaper("daily", null);
  return <Dashboard initialData={initialData} />;
}
