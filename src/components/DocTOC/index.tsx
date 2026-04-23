import React, { useState, useEffect, useRef } from 'react';
import { useDoc } from '@docusaurus/theme-common/internal';
import TOCInline from '@theme/TOCInline';
import type { Props } from '@theme/TOCInline';
import styles from './styles.module.css';

export default function DocTOC(): JSX.Element | null {
  const { toc } = useDoc();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Close TOC when scrolling
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isOpen]);
  
  if (!toc || toc.length === 0) {
    return null;
  }

  return (
    <div className={styles.tocWrapper}>
      <div className={`${styles.tocDropdown} ${isOpen ? styles.tocOpen : ''}`}>
        <button 
          className={styles.tocSummary}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle table of contents"
        >
          <span className={styles.tocIcon}>📑</span>
          On This Page
        </button>
        <div className={styles.tocContent}>
          <div className={styles.tocInner}>
            <TOCInline 
              toc={toc} 
              minHeadingLevel={2} 
              maxHeadingLevel={4} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}