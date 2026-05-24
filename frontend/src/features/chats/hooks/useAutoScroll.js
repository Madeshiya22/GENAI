import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

export const useAutoScroll = (dependency) => {
  const endRef = useRef(null);
  const { streaming } = useSelector((state) => state.chat);
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    if (!endRef.current) return;

    // Use "auto" behavior (instant) during active streaming to prevent jitter and scroll fights.
    // Use "smooth" only when streaming ends or new messages are initially added.
    const behavior = streaming ? "auto" : "smooth";

    const container = endRef.current.parentElement;
    if (container) {
      const threshold = 150; // pixels from the bottom
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

      // Only scroll if the user is near the bottom, or if streaming just started,
      // allowing them to scroll up manually to read history.
      if (isNearBottom || (streaming && !wasStreamingRef.current)) {
        endRef.current.scrollIntoView({
          behavior,
          block: "end",
        });
      }
    } else {
      endRef.current.scrollIntoView({
        behavior,
      });
    }

    wasStreamingRef.current = streaming;
  }, [dependency, streaming]);

  return endRef;
};
