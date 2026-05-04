import React, { useState, useEffect } from "react";
import Layout from "@theme-original/DocItem/Layout";
import { useDoc } from "@docusaurus/theme-common/internal";
import ApiPlayground from "@site/src/components/ApiPlayground";
import ApiExamples from "@site/src/components/ApiExamples";
import DocTOC from "@site/src/components/DocTOC";
import { useApiSharedState } from "@site/src/components/ApiPlayground/UseApiSharedState";
import styles from "./styles.module.css";

// Separate component so hooks are always called unconditionally
function ApiPanel({ api, isVisible, onToggle }) {
  const shared = useApiSharedState({
    method: api.method,
    url: api.url?.sandbox ?? api.url ?? "",
    body: api.body,
    requiresSignature: api.requiresSignature ?? true,
    requiresAccessToken: api.requiresAccessToken ?? true,
    useServerSigning: true,
  });

  // Lock body scroll when playground is open on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isVisible && window.innerWidth <= 996) {
      // Lock body scroll
      document.body.classList.add('mobile-playground-open');
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Unlock body scroll
      document.body.classList.remove('mobile-playground-open');
      document.documentElement.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-playground-open');
      document.documentElement.style.overflow = '';
    };
  }, [isVisible]);

  return (
    <>
      <aside className={`${styles.playground} ${isVisible ? styles.playgroundVisible : ''}`}>
        <ApiPlayground shared={shared}>
          <ApiExamples />
        </ApiPlayground>
      </aside>
      <button
        className={`${styles.mobileToggle} ${isVisible ? styles.mobileToggleActive : ''}`}
        onClick={onToggle}
        aria-label={isVisible ? "Close API Playground" : "Open API Playground"}
      >
        {isVisible ? "✕ Close Playground" : "🔧 Try API"}
      </button>
    </>
  );
}

export default function LayoutWrapper(props) {
  const { frontMatter } = useDoc();
  const api = frontMatter?.api;
  const [playgroundVisible, setPlaygroundVisible] = useState(false);

  if (!api) {
    // Regular doc page — TOC above content, scrolls with article
    return (
      <div className={styles.docItemWrapper}>
        <div className={styles.tocWrapper}>
          <DocTOC />
        </div>
        <div className={styles.articleWrapper}>
          <Layout {...props} />
        </div>
      </div>
    );
  }

  // API page with playground
  return (
    <div className={`${styles.apiLayout} api-page-layout`}>
      <div className={styles.docContent}>
        <Layout {...props} />
      </div>
      <ApiPanel 
        api={api} 
        isVisible={playgroundVisible}
        onToggle={() => setPlaygroundVisible(!playgroundVisible)}
      />
    </div>
  );
}