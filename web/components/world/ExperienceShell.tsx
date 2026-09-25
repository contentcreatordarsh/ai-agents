"use client";

import dynamic from "next/dynamic";
import { WorldSceneProvider } from "./WorldSceneContext";
import AtmosphereCanvas from "./AtmosphereCanvas";
import ScrollWorldDirector from "./ScrollWorldDirector";
import CustomCursor from "@/components/site/CustomCursor";
import Soundscape from "@/components/site/Soundscape";

const TacticalWorldMap = dynamic(() => import("./TacticalWorldMap"), { ssr: false });

type Props = { children: React.ReactNode };

export default function ExperienceShell({ children }: Props) {
  return (
    <WorldSceneProvider>
      <div className="experience-root">
        <div className="experience-backdrop">
          <TacticalWorldMap />
          <AtmosphereCanvas />
        </div>
        <div className="experience-foreground">{children}</div>
        <ScrollWorldDirector />
        <CustomCursor />
        <Soundscape />
      </div>
    </WorldSceneProvider>
  );
}
