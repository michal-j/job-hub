import { useEffect, useRef, useState } from "react";

// Estimate is intentionally generous — better to flip slightly too eagerly
// than to render a popup that gets clipped by the viewport edge.
const ESTIMATED_POPUP_HEIGHT = 280;

// Keep the popover at least this far from either viewport edge.
const VIEWPORT_MARGIN = 20;

// Set on <body> (see globals.css, `body.popover-open`) while any popover
// anywhere is open, to make the rest of the page's main content
// pointer-events:none. This is a *second* real-device bug fix, not the
// same as the row-scoped one before it: a scrim (z-index-based) and a
// React-Context-driven pointer-events lock (scoped per row) both tested
// as working on Chrome desktop and an iOS Simulator, but real-device
// testing on Chrome iOS found NEITHER actually blocked anything — not
// even the filter pills, which live nowhere near a job row and have no
// relationship to the row-scoped fix at all. Since that's not
// reproducible in any tooling available here, this deliberately avoids
// the two things already tried and suspected: z-index/stacking (the
// scrim) and a React Context whose re-renders were the likely cause of
// an earlier freeze. A plain DOM class + CSS causes zero React
// re-renders anywhere, so it can't reintroduce that failure mode
// regardless of how many jobs are in the list, and pointer-events itself
// (not the scrim) is what's already confirmed working for blocking a
// row's own siblings — this just widens that same mechanism to the
// whole page instead of trying yet another approach.
const BODY_LOCK_CLASS = "popover-open";

interface PopupPlacement {
  direction: "up" | "down";
  // Relative to the trigger's own top-left (the popover is positioned
  // absolute inside the position:relative trigger wrapper) — NOT a
  // viewport pixel value. Computed from viewport-space math so it can be
  // clamped against the actual screen width, then converted back.
  left: number;
}

export function usePopupDirection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<PopupPlacement>({ direction: "down", left: 0 });

  // maxWidth must match the CSS class's own width cap (320 for
  // .popover-anchor, 300 for .popover-anchor.narrow) — it's only used
  // here to work out placement, not to size the element.
  function measure(maxWidth: number): PopupPlacement {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return { direction: "down", left: 0 };

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Prefer below (natural reading direction) unless there isn't room
    // for it but there IS room above — then flip up.
    const direction: "up" | "down" =
      spaceBelow < ESTIMATED_POPUP_HEIGHT && spaceAbove > spaceBelow ? "up" : "down";

    // Anchoring flush with the trigger's right edge (this repo's
    // original design) overflows off the left edge of the screen
    // whenever the trigger isn't close enough to the right edge itself —
    // e.g. when the status select + score + location badges all fit on
    // one line together, the score badge sits in the *middle*, nowhere
    // near the row's right edge. Clamp the left edge into the viewport
    // instead of trusting that anchor blindly.
    const width = Math.min(maxWidth, window.innerWidth - VIEWPORT_MARGIN * 2);
    const naturalLeft = rect.right - width;
    const clampedLeft = Math.max(
      VIEWPORT_MARGIN,
      Math.min(naturalLeft, window.innerWidth - width - VIEWPORT_MARGIN)
    );

    return { direction, left: clampedLeft - rect.left };
  }

  function openPopover(maxWidth: number) {
    setPlacement(measure(maxWidth));
    setOpen(true);
    document.body.classList.add(BODY_LOCK_CLASS);
  }

  function closePopover() {
    setOpen(false);
    document.body.classList.remove(BODY_LOCK_CLASS);
  }

  // Touch devices have no hover, so the trigger itself has to double as
  // an open/close switch — tapping it again should close it exactly like
  // tapping anywhere else outside the popover does.
  function togglePopover(maxWidth: number) {
    if (open) {
      closePopover();
    } else {
      openPopover(maxWidth);
    }
  }

  // Closing on any click/tap outside the trigger+popover. This is also
  // what lets the scrim (rendered by the badge components while open)
  // close things when tapped, and it still works even for a tap that
  // pointer-events:none routed to some other element entirely — it
  // doesn't matter what the click landed on, only that it wasn't inside
  // triggerRef.
  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        document.body.classList.remove(BODY_LOCK_CLASS);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // If this instance unmounts while its own popover was open (e.g. a
  // filter change removes the job from the list), release the lock —
  // otherwise the rest of the page would stay permanently uninteractive.
  // Safe unconditionally: at most one popover is ever open, so this is a
  // no-op for every instance that wasn't holding it.
  useEffect(() => {
    return () => document.body.classList.remove(BODY_LOCK_CLASS);
  }, []);

  return { triggerRef, open, placement, openPopover, closePopover, togglePopover };
}
