import { useRef, useState } from "react";

// Estimate is intentionally generous — better to flip slightly too eagerly
// than to render a popup that gets clipped by the viewport edge.
const ESTIMATED_POPUP_HEIGHT = 280;

export function usePopupDirection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<"up" | "down">("down");

  function measureAndOpen() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      setDirection("down");
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Prefer below (natural reading direction) unless there isn't room
    // for it but there IS room above — then flip up.
    if (spaceBelow < ESTIMATED_POPUP_HEIGHT && spaceAbove > spaceBelow) {
      setDirection("up");
    } else {
      setDirection("down");
    }
  }

  return { triggerRef, direction, measureAndOpen };
}
