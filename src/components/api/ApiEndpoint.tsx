import React from "react";
import HttpMethodBadge from "../HttpMethodBadge";
import styles from "./api.module.css";

type Props = {
  method: string;
  path?: string;
  sandbox?: string;
  prod?: string;
};

export default function ApiEndpoint({ method, path, sandbox }: Props) {
  const displayPath = path ?? sandbox ?? "";
  return (
    <div className={styles.wrapper}>
      <HttpMethodBadge method={method} />
      <code className={styles.path}>{displayPath}</code>
    </div>
  );
}