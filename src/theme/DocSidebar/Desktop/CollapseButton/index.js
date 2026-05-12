import React from 'react';
import { translate } from '@docusaurus/Translate';
import styles from './styles.module.css';

export default function CollapseButton({ onClick, collapsed }) {
  return (
    <button
      type="button"
      title={translate({
        id: collapsed
          ? 'theme.docs.sidebar.expandButtonTitle'
          : 'theme.docs.sidebar.collapseButtonTitle',
        message: collapsed ? 'Expand sidebar' : 'Collapse sidebar',
      })}
      aria-label={translate({
        id: collapsed
          ? 'theme.docs.sidebar.expandButtonAriaLabel'
          : 'theme.docs.sidebar.collapseButtonAriaLabel',
        message: collapsed ? 'Expand sidebar' : 'Collapse sidebar',
      })}
      className={styles.collapseSidebarButton}
      onClick={onClick}
    >
      <svg
        className={styles.collapseSidebarButtonIcon}
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6.5 2L3.5 5L6.5 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
