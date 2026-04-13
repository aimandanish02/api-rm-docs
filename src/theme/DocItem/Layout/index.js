import React from "react";
import Layout from "@theme-original/DocItem/Layout";
import { useDoc } from "@docusaurus/theme-common/internal";
import ApiPlayground from "@site/src/components/ApiPlayground";
import ApiExamples from "@site/src/components/ApiExamples";
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
      <ApiPlayground shared={shared} >
        <ApiExamples />
      </ApiPlayground>
    </aside>
  );
}

export default function LayoutWrapper(props) {
  const { frontMatter } = useDoc();
  const api = frontMatter?.api;

  if (!api) {
    return <Layout {...props} />;
  }

  return (
    <div className={`${styles.apiLayout} api-page-layout`}>
      <div className={styles.docContent}>
        <Layout {...props} />
      </div>
      <ApiPanel api={api} />
    </div>
  );
}