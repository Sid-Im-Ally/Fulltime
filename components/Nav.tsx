'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRODUCT_NAME } from '@/lib/brand';

export function Nav() {
  const pathname = usePathname();
  const links = [
    { href: '/methodology', label: 'Methodology' },
    { href: '/about', label: 'About' },
  ];
  return (
    <nav className="app-nav no-print">
      <div className="container app-nav__inner">
        <Link href="/" className="brand">
          <span className="brand__name">{PRODUCT_NAME}</span>
          <span className="brand__tag">Evaluations you can stand behind</span>
        </Link>
        <div className="nav-links">
          {links.map(l => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${active ? ' nav-link--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
