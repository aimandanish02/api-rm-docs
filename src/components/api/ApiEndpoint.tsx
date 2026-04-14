//api badge
import React from "react";
import clsx from "clsx";
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
      <span className={clsx(styles.badge, styles[method.toLowerCase()])}>
        {method}
      </span>
      <code className={styles.path}>{displayPath}</code>
    </div>
  );
}