'use client';

import { useState, type ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { ImportActivity } from '@/components/layout/ImportActivity';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar onCartToggle={() => setCartOpen((prev) => !prev)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ImportActivity />
    </div>
  );
}
