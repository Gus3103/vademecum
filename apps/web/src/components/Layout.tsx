import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Colors } from '../theme';

const NAV_TABS = [
  { path: '/', label: '🔍 Buscar' },
  { path: '/interactions', label: '⚡ Interacciones' },
  { path: '/history', label: '📋 Historial' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ backgroundColor: Colors.primary, padding: '12px 16px', color: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/')}>
          💊 Vademécum
        </h1>
      </header>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: '16px' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        display: 'flex',
        backgroundColor: '#fff',
        borderTop: `1px solid ${Colors.border}`,
        position: 'sticky',
        bottom: 0,
      }}>
        {NAV_TABS.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: 'none',
                background: active ? Colors.primaryLight : 'transparent',
                color: active ? Colors.primary : Colors.textSecondary,
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
