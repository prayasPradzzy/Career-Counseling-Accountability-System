"use client";

/**
 * useMediaQuery
 *
 * Returns true when the given CSS media query matches.
 * Used for responsive behavior in JS (e.g. opening mobile sidebar).
 *
 * @param {string} query — e.g. "(max-width: 768px)"
 * @returns {boolean}
 *
 * @example
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 */

import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event) => setMatches(event.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
