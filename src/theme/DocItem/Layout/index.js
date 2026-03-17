import React from "react";
import Layout from "@theme-original/DocItem/Layout";
import { useDoc } from "@docusaurus/theme-common/internal";
import ApiPlayground from "@site/src/components/ApiPlayground";
import ApiExamples from "@site/src/components/ApiExamples";
import { useApiSharedState } from "@site/src/components/ApiPlayground/UseApiSharedState";
import styles from "./styles.module.css";

export default function LayoutWrapper(props) {
  const { frontMatter } = useDoc();
  const api = frontMatter?.api;

  const sharedState = api ? useApiSharedState(api) : null;

  if (!api || !sharedState) {
    return <Layout {...props} />;
  }

  return (
    <div className={`${styles.apiLayout} api-page-layout`}>
      <div className={styles.docContent}>
        <Layout {...props} />
      </div>
      <aside className={styles.playground}>
        <ApiPlayground shared={sharedState} />
        <ApiExamples shared={sharedState} />
      </aside>
    </div>
  );
}