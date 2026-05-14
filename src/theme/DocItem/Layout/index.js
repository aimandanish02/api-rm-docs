import React, { useState, useEffect } from "react";
import Layout from "@theme-original/DocItem/Layout";
import { useDoc } from "@docusaurus/theme-common/internal";
import ApiPlayground from "@site/src/components/ApiPlayground";
import ApiExamples from "@site/src/components/ApiExamples";
import { useApiSharedState } from "@site/src/components/ApiPlayground/UseApiSharedState";
import { publishTOC } from "@site/src/utils/tocBridge";
import styles from "./styles.module.css";

function ApiPanel({ api, isVisible, onToggle }) {
  const shared = useApiSharedState({
    method: api.method,
    url: api.url?.sandbox ?? api.url ?? "",
    body: api.body,
    requiresSignature: api.requiresSignature ?? true,
    requiresAccessToken: api.requiresAccessToken ?? true,
    useServerSigning: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isVisible && window.innerWidth <= 996) {
      document.body.classList.add('mobile-playground-open');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-playground-open');
      document.documentElement.style.overflow = '';
    }
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
  const { frontMatter, toc } = useDoc();
  const api = frontMatter?.api;
  const [playgroundVisible, setPlaygroundVisible] = useState(false);

  // Publish current page TOC to the sidebar via module-level bridge.
  // The sidebar renders outside DocProvider so it can't call useDoc() directly.
  useEffect(() => {
    publishTOC(toc ?? []);
  }, [toc]);

  if (!api) {
    // Regular doc page — natural page scroll so useTOCHighlight works on document.
    return <Layout {...props} />;
  }

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
