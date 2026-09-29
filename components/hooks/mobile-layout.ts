"use client";

import { useEffect, useState } from "react";

export default function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (!window) return;
      if (window.matchMedia("(max-width: 768px)").matches) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}
