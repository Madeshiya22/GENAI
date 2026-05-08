import { useEffect, useRef } from "react";

export const useAutoScroll = (dependency) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [dependency]);

  return endRef;
};
