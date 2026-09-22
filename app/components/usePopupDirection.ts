import { useEffect, useRef, useState } from "react";
import { usePopoverLock } from "./PopoverLock";

// Estimate is intentionally generous — better to flip slightly too eagerly
// than to render a popup that gets clipped by the viewport edge.
const ESTIMATED_POPUP_HEIGHT = 280;

// Keep the popover at least this far from either viewport edge.
const VIEWPORT_MARGIN = 20;

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
  const { setLocked } = usePopoverLock();

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

  // setLocked is set atomically alongside setOpen (not in a useEffect
  // reacting to `open`) so there's no ordering ambiguity between "badge A
  // closing" and "badge B opening" when one tap causes both. Scoped to
  // this row's own PopoverLockProvider (see JobList) — only the 3
  // components in this one job-actions row ever re-render from it, not
  // the whole list, however many jobs there are.
  function openPopover(maxWidth: number) {
    setPlacement(measure(maxWidth));
    setOpen(true);
    setLocked(true);
  }

  function closePopover() {
    setOpen(false);
    setLocked(false);
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
  // what lets the full-viewport scrim (rendered by the badge components
  // while open, to stop the popover being open at the same time as the
  // user accidentally hitting a job link or another badge underneath)
  // close things when tapped — it doesn't need its own handler, it's
  // simply not inside triggerRef, so this listener already covers it.
  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setLocked(false);
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
  // filter change removes the job from the list), release the row's
  // lock — otherwise that row's other controls would stay permanently
  // uninteractive. Safe unconditionally: only one badge per row can be
  // open at a time, so this is a no-op for whichever one wasn't holding it.
  useEffect(() => {
    return () => setLocked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { triggerRef, open, placement, openPopover, closePopover, togglePopover };
}
