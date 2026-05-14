import { useState, useEffect } from 'react';

// DocSidebar and DocItem end up in different async webpack chunks.
// Module-level variables would be duplicated — each chunk gets its own
// copy, so publishTOC in one chunk never notifies useTOCStore in the other.
// Using window ensures a single shared instance across all chunks.
function getBridge() {
  if (typeof window === 'undefined') {
    return { toc: [], listeners: new Set() };
  }
  if (!window.__rmTocBridge) {
    window.__rmTocBridge = { toc: [], listeners: new Set() };
  }
  return window.__rmTocBridge;
}

export function publishTOC(toc) {
  const bridge = getBridge();
  bridge.toc = toc;
  bridge.listeners.forEach(fn => fn(toc));
}

export function useTOCStore() {
  const [toc, setToc] = useState(() => getBridge().toc);
  useEffect(() => {
    const bridge = getBridge();
    setToc(bridge.toc);
    bridge.listeners.add(setToc);
    return () => void bridge.listeners.delete(setToc);
  }, []);
  return toc;
}
