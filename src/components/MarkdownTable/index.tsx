import React from "react";
import styles from "./styles.module.css";

interface MarkdownTableProps {
  children: React.ReactNode;
}

export default function MarkdownTable({ children }: MarkdownTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}
