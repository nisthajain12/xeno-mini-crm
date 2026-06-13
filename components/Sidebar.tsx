'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/customers', label: 'Customers', icon: '◈' },
  { href: '/segments', label: 'Segments', icon: '◎' },
  { href: '/campaigns', label: 'Campaigns', icon: '◆' },
  { href: '/analytics', label: 'Analytics', icon: '◉' },
  { href: '/copilot', label: 'AI Co-pilot', icon: '✦' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      background: '#0A0F1E',
      borderRight: '1px solid #1E2640',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#F1F5F9' }}>
          <span style={{ color: '#6366F1' }}>✦</span> Xeno
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', letterSpacing: '0.08em' }}>
          MINI CRM
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: active ? '600' : '400',
                color: active ? '#F1F5F9' : '#64748B',
                background: active ? '#1E2640' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '16px', color: active ? '#6366F1' : '#475569' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #1E2640' }}>
        <div style={{ fontSize: '11px', color: '#334155' }}>
          Built for Xeno Assignment
        </div>
      </div>
    </aside>
  )
}