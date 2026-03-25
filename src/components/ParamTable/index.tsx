import React, { useState } from "react";
import styles from "./styles.module.css";

export interface ParamRow {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  example?: string;
}

interface ParamTableProps {
  title?: string;
  rows?: ParamRow[];
}

export default function ParamTable({
  title = "Parameters",
  rows = [],
}: ParamTableProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.wrapper}>
      {/* Rows */}
      <div className={`${styles.body} ${open ? styles.bodyOpen : styles.bodyClose}`}>
        <div className={styles.inner}>
          {rows.map((row, i) => (
            <ParamRowItem key={i} row={row} last={i === rows.length - 1} />
          ))}
        </div>
      </div>

      {/* Toggle footer */}
      <button
        className={styles.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        type="button"
      >
        <svg
          className={`${styles.toggleIcon} ${open ? styles.toggleIconOpen : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{open ? `Hide ${title}` : `Show ${title}`}</span>
      </button>
    </div>
  );
}

function ParamRowItem({ row, last }: { row: ParamRow; last: boolean }) {
  const typeKey = `type_${(row.type ?? "").toLowerCase()}` as keyof typeof styles;

  return (
    <div className={`${styles.row} ${last ? styles.rowLast : ""}`}>
      {/* Name + type + required on one line */}
      <div className={styles.meta}>
        <code className={styles.paramName}>{row.name}</code>
        {row.type && (
          <span className={`${styles.typeLabel} ${styles[typeKey] ?? ""}`}>
            {row.type}
          </span>
        )}
        {row.required && (
          <span className={styles.requiredLabel}>required</span>
        )}
      </div>

      {/* Description */}
      {row.description && (
        <p className={styles.description}>{row.description}</p>
      )}

      {/* Example */}
      {row.example && (
        <p className={styles.example}>
          <span className={styles.exampleLabel}>Example: </span>
          <code className={styles.exampleValue}>{row.example}</code>
        </p>
      )}
    </div>
  );
}
