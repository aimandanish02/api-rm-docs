import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import styles from './styles.module.css';

export default function DocSidebarDesktop({ path, sidebar, isHidden }) {
  const {
    navbar: { hideOnScroll },
    docs: {
      sidebar: { hideable },
    },
  } = useThemeConfig();

  // Load collapsed state from localStorage
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('docusaurus.sidebar.collapsed') === 'true';
  });

  // Save to localStorage and set a data attribute on body for CSS targeting.
  // Intentionally NOT calling onCollapse — letting Docusaurus's parent toggle
  // its own Hidden class causes the hover/peek glitch and flicker.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('docusaurus.sidebar.collapsed', String(collapsed));

    if (collapsed) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
      document.body.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
      document.body.removeAttribute('data-sidebar-collapsed');
    }

    window.dispatchEvent(
      new CustomEvent('sidebar-collapse-change', { detail: { collapsed } })
    );
  }, [collapsed]);

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={clsx(
        styles.sidebar,
        hideOnScroll && styles.sidebarWithHideableNavbar,
        isHidden && styles.sidebarHidden,
        collapsed && styles.sidebarCollapsed
      )}
    >
      <div className={styles.sidebarMenu}>
        {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
        <Content path={path} sidebar={sidebar} />
      </div>
      {hideable && <CollapseButton onClick={handleCollapse} collapsed={collapsed} />}
    </div>
  );
}