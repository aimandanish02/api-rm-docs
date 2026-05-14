import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { isActiveSidebarItem } from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import { useTOCStore } from '@site/src/utils/tocBridge';
import styles from './styles.module.css';

// Returns the id of the heading currently in view, based on document scroll.
// Iterates headings top-to-bottom; the last one whose top is at/above the
// threshold is "active".  Defaults to the first heading when at the top.
function useActiveHeadingId(tocItems) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!tocItems.length) return;

    const ids = tocItems.map(h => h.id);

    function update() {
      const offset = (document.querySelector('.navbar')?.clientHeight ?? 0) + 10;
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      setActiveId(current || ids[0] || '');
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    return () => window.removeEventListener('scroll', update);
  }, [tocItems]);

  return activeId;
}

function SidebarTOC({ toc }) {
  const items = useMemo(() => toc.filter(h => h.level === 2 || h.level === 3), [toc]);
  const activeId = useActiveHeadingId(items);

  if (!items.length) return null;

  return (
    <ul className={styles.tocList}>
      {items.map(item => (
        <li
          key={item.id}
          className={clsx(styles.tocItem, item.level === 3 && styles.tocItemH3)}
        >
          <a
            href={`#${item.id}`}
            className={clsx(
              styles.tocLink,
              item.id === activeId && styles.tocLinkActive,
            )}
            dangerouslySetInnerHTML={{ __html: item.value }}
          />
        </li>
      ))}
    </ul>
  );
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}) {
  const { href, label, className, autoAddBaseUrl } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  const toc = useTOCStore();
  const filteredToc = useMemo(
    () => toc.filter(h => h.level === 2 || h.level === 3),
    [toc],
  );

  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
    >
      <Link
        className={clsx('menu__link', !isInternalLink && styles.menuExternalLink, {
          'menu__link--active': isActive,
        })}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}
      >
        {label}
        {!isInternalLink && <IconExternalLink />}
      </Link>

      {isActive && filteredToc.length > 0 && <SidebarTOC toc={toc} />}
    </li>
  );
}
