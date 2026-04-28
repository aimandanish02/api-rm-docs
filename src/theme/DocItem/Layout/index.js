import React from "react";
import Layout from "@theme-original/DocItem/Layout";
import { useDoc } from "@docusaurus/theme-common/internal";
import ApiPlayground from "@site/src/components/ApiPlayground";
import ApiExamples from "@site/src/components/ApiExamples";
import DocTOC from "@site/src/components/DocTOC";
import { useApiSharedState } from "@site/src/components/ApiPlayground/UseApiSharedState";
import styles from "./styles.module.css";

// Separate component so hooks are always called unconditionally
function ApiPanel({ api }) {
  const shared = useApiSharedState({
    method: api.method,
    url: api.url?.sandbox ?? api.url ?? "",
    body: api.body,
    requiresSignature: api.requiresSignature ?? true,
    requiresAccessToken: api.requiresAccessToken ?? true,
    useServerSigning: true,
  });

  return (
    <aside className={styles.playground}>
      <ApiPlayground shared={shared}>
        <ApiExamples />
      </ApiPlayground>
    </aside>
  );
}

export default function LayoutWrapper(props) {
  const { frontMatter } = useDoc();
  const api = frontMatter?.api;

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
      <ApiPanel api={api} />
    </div>
  );
}