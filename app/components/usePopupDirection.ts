import { useEffect, useRef, useState } from "react";

// Estimate is intentionally generous — better to flip slightly too eagerly
// than to render a popup that gets clipped by the viewport edge.
const ESTIMATED_POPUP_HEIGHT = 280;

export function usePopupDirection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [open, setOpen] = useState(false);

  function measureAndOpen() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      setDirection("down");
    } else {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Prefer below (natural reading direction) unless there isn't room
      // for it but there IS room above — then flip up.
      setDirection(spaceBelow < ESTIMATED_POPUP_HEIGHT && spaceAbove > spaceBelow ? "up" : "down");
    }
    setOpen(true);
  }

  function closePopup() {
    setOpen(false);
  }

  // Touch devices have no mouseleave, so tapping the trigger is the only
  // way in — and tapping anywhere else has to be the way out, or the
  // popover is stuck open until the next tap on the same badge.
  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return { triggerRef, direction, open, measureAndOpen, closePopup };
}
