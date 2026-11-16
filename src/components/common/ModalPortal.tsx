'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * ModalPortal: Teleportasi elemen modal langsung ke <body> DOM root
 * Mencegah CSS Stacking Context trap dari kontainer bertingkat (overflow-x, z-index isolation),
 * memastikan backdrop menutupi 100% viewport layar secara sempurna termasuk TopNavbar & Sidebar.
 */
export default function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
