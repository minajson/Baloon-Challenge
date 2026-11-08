"use client";

import { useEffect } from "react";
import { startOffline } from "@/lib/offline";

/**
 * Starts offline support (service worker + file verification) as soon as the
 * app loads. It renders nothing: the offline status lives in the facilitator's
 * Admin panel so it never distracts from the projected game.
 */
export default function PwaStatus() {
  useEffect(() => {
    startOffline();
  }, []);
  return null;
}
