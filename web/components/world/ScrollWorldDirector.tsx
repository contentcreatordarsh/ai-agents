"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useWorldScene } from "./WorldSceneContext";
import { WORLD_CAMERAS } from "@/lib/art-direction";

gsap.registerPlugin(ScrollTrigger);

const SCENE_TRIGGERS: { id: string; key: keyof typeof WORLD_CAMERAS }[] = [
  { id: "hero", key: "hero" },
  { id: "world", key: "world" },
  { id: "battles", key: "battles" },
  { id: "systems", key: "world" },
  { id: "territory", key: "territory" },
  { id: "multiplayer", key: "multiplayer" },
  { id: "mission", key: "mission" },
  { id: "kinetic", key: "territory" },
];

export default function ScrollWorldDirector() {
  const { setCamera, setScrollScene } = useWorldScene();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const triggers: ScrollTrigger[] = [];

    for (const scene of SCENE_TRIGGERS) {
      const el = document.getElementById(scene.id);
      if (!el) continue;
      const cam = WORLD_CAMERAS[scene.key];
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => {
            setScrollScene(scene.key);
            setCamera(cam);
          },
          onEnterBack: () => {
            setScrollScene(scene.key);
            setCamera(cam);
          },
        }),
      );
    }

    const kinetic = document.getElementById("kinetic");
    if (kinetic) {
      triggers.push(
        ScrollTrigger.create({
          trigger: kinetic,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            const words = kinetic.querySelectorAll<HTMLElement>(".kinetic-word");
            words.forEach((word, i) => {
              const start = i / words.length;
              const end = (i + 1) / words.length;
              const t = gsap.utils.clamp(0, 1, (self.progress - start) / (end - start));
              word.style.opacity = String(t);
              word.style.transform = `translate3d(${(1 - t) * 80}px, 0, 0) scale(${0.92 + t * 0.08})`;
            });
          },
        }),
      );
    }

    return () => triggers.forEach((t) => t.kill());
  }, [setCamera, setScrollScene]);

  return null;
}
