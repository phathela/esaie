'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import './Dashboard.css';

type HubCardProps = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

const HubCard = ({ title, description, href, badge }: HubCardProps) => {
  return (
    <Link href={href} className="hub-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {badge ? (
          <span
            style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 9999,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#0f172a',
              whiteSpace: 'nowrap'
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <p style={{ marginTop: 8, marginBottom: 0, color: '#475569' }}>{description}</p>
    </Link>
  );
};

export default function DashboardPage() {
  // Mock user state (replace later with real AuthContext if you have it)
  const [credits] = useState<number>(100);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const hubs = useMemo(
    () => [
      {
        title: 'Smart Office',
        description: 'Documents, Excel insights, translate, transcribe, smart files.',
        href: '/smart-office/documents',
        badge: 'Phase 4'
      },
      {
        title: 'Comms Centre',
        description: 'Chat, groups, meetings, tasks, calls.',
        href: '/comms-centre/chat',
        badge: 'Phase 5'
      },
      {
        title: 'Security',
        description: 'Access controls, audit trail, and security settings.',
        href: '/security',
        badge: 'Soon'
      },
      {
        title: 'AI Assist',
        description: 'General assistant, workflows, and automations.',
        href: '/ai-assist',
        badge: 'Soon'
      },
      {
        title: 'Analytics',
        description: 'Usage, performance, and reporting dashboards.',
        href: '/analytics',
        badge: 'Soon'
      },
      {
        title: 'Admin',
        description: 'Team, billing, plans, roles, and configuration.',
        href: '/admin',
        badge: 'Soon'
      }
    ],
    []
  );

  return (
    <div className="dashboard">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ marginTop: 6, marginBottom: 0, color: '#64748b' }}>
            Choose a hub to get started.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Credits */}
          <div className="credits-display">
            <strong style={{ color: '#0f172a' }}>Credits:</strong>{' '}
            <span style={{ color: '#0f172a' }}>{credits}</span>
          </div>

          {/* User Menu */}
          <div className="user-menu" style={{ position: 'relative' }}>
            <button
              type="button"
              className="user-menu-button"
              onClick={() => setShowMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              phathela ▾
            </button>

            {showMenu ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 220,
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  background: '#ffffff',
                  boxShadow: '0 10px 30px rgba(2, 6, 23, 0.12)',
                  overflow: 'hidden',
                  zIndex: 50
                }}
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  style={{ display: 'block', padding: 12, color: '#0f172a', textDecoration: 'none' }}
                  onClick={() => setShowMenu(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  role="menuitem"
                  style={{ display: 'block', padding: 12, color: '#0f172a', textDecoration: 'none' }}
                  onClick={() => setShowMenu(false)}
                >
                  Settings
                </Link>
                <div style={{ height: 1, background: '#e2e8f0' }} />
                <button
                  type="button"
                  role="menuitem"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 12,
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#b91c1c'
                  }}
                  onClick={() => {
                    setShowMenu(false);
                    // Replace with real logout
                    alert('Logout placeholder');
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hub cards */}
      <div className="hub-cards" style={{ marginTop: 20 }}>
        {hubs.map((hub) => (
          <HubCard
            key={hub.title}
            title={hub.title}
            description={hub.description}
            href={hub.href}
            badge={hub.badge}
          />
        ))}
      </div>

      {/* Helpful note */}
      <div style={{ marginTop: 20, color: '#64748b', fontSize: 14 }}>
        Backend API is deployed separately (Railway service on port 8001). The frontend calls it via{' '}
        <code>NEXT_PUBLIC_API_URL</code>.
      </div>
    </div>
  );
}
