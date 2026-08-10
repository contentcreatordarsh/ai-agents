import { QuestBoard } from "@/components/QuestBoard";
import { MISSIONS } from "@/lib/missions";

export const dynamic = "force-dynamic";

export default function Home() {
  return <QuestBoard initialMissions={MISSIONS} />;
}
