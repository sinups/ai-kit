"use client";

import { useEffect, useRef, useState } from "react";

export function useNearViewport<T extends Element>(margin = "400px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin]);

  return [ref, near] as const;
}
