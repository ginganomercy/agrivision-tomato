import React, { useState, useEffect } from 'react';
import { InteractiveTomato3D } from './components/InteractiveTomato3D';
import { DiagnosticStudio } from './components/DiagnosticStudio';
import { 
  Gamepad2, 
  Sparkles, 
  ExternalLink, 
  Cpu, 
  Server, 
  GitBranch, 
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3d' | 'scanner'>('3d');
  const [healthStatus, setHealthStatus] = useState<{ isOnline: boolean; latency: number | null }>({
    isOnline: false,
    latency: null
  });

  // Polling /health status secara berkala
  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      try {
        const res = await fetch('https://agrivision.pbjt.ac.id/health');
        const end = performance.now();
        if (res.ok) {
          setHealthStatus({ isOnline: true, latency: Math.round(end - start) });
        } else {
          setHealthStatus({ isOnline: false, latency: null });
        }
      } catch {
        setHealthStatus({ isOnline: false, latency: null });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut (Press 1 for 3D Tomato, Press 2 for Scanner)
  useEffect(() => {
    const handleKeyShortcut = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === '1') setActiveTab('3d');
      if (e.key === '2') setActiveTab('scanner');
    };
    window.addEventListener('keydown', handleKeyShortcut);
    return () => window.removeEventListener('keydown', handleKeyShortcut);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070A12',
      color: '#F8FAFC',
      backgroundImage: `
        radial-gradient(circle at 10% 15%, rgba(244, 63, 94, 0.14) 0%, transparent 45%),
        radial-gradient(circle at 90% 15%, rgba(16, 185, 129, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 50% 85%, rgba(56, 189, 248, 0.10) 0%, transparent 55%)
      `,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. Global Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 36px',
        background: 'rgba(7, 10, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32, filter: 'drop-shadow(0 0 14px rgba(244, 63, 94, 0.7))' }}>🍅</span>
          <div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: -0.5,
              background: 'linear-gradient(135deg, #FFF 30%, #F43F5E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              AgriVision AI Studio
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, letterSpacing: 0.3 }}>
              Tomato Pathology & 3D Interactive Edge Engine
            </div>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            background: healthStatus.isOnline ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${healthStatus.isOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: healthStatus.isOnline ? '#34D399' : '#FCA5A5'
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: healthStatus.isOnline ? '#10B981' : '#EF4444',
              boxShadow: `0 0 10px ${healthStatus.isOnline ? '#10B981' : '#EF4444'}`
            }} />
            <span>
              {healthStatus.isOnline ? `Swarm Node Online (${healthStatus.latency}ms)` : 'Connecting API...'}
            </span>
          </div>

          <a
            href="https://agrivision.pbjt.ac.id/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#CBD5E1',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <span>Swagger Docs</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* 2. Hero Section & Feature Switcher */}
      <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 9999,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: 13,
            fontWeight: 600,
            color: '#38BDF8',
            marginBottom: 16
          }}>
            <Sparkles size={14} />
            <span>MobileNetV2 Edge Deep Learning + Three.js Physics Engine</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: 900,
            letterSpacing: -1.2,
            lineHeight: 1.15,
            marginBottom: 14
          }}>
            Eksplorasi Tomat 3D & <span style={{
              background: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Diagnosis Daun Cerdas</span>
          </h1>

          <p style={{
            fontSize: 16,
            color: '#94A3B8',
            maxWidth: 680,
            margin: '0 auto 28px auto',
            lineHeight: 1.6
          }}>
            Kendalikan simulasi tomat 3D dengan tombol <strong>WASD</strong>, tekan <strong>Spasi</strong> untuk melompat, tahan <strong>Shift</strong> untuk Turbo Boost, atau pindai daun tanaman tomat Anda secara langsung untuk diagnosis patologi instan.
          </p>

          {/* Mode Tabs Switcher */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: 6,
            borderRadius: 18,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35)'
          }}>
            <button
              onClick={() => setActiveTab('3d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 14,
                border: 'none',
                background: activeTab === '3d' ? 'linear-gradient(135deg, #F43F5E, #E11D48)' : 'transparent',
                color: activeTab === '3d' ? '#FFF' : '#94A3B8',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === '3d' ? '0 4px 16px rgba(244, 63, 94, 0.45)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Gamepad2 size={18} />
              <span>🎮 Tomat 3D Interaktif (WASD)</span>
              <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: 4, opacity: 0.8 }}>[1]</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 14,
                border: 'none',
                background: activeTab === 'scanner' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
                color: activeTab === 'scanner' ? '#FFF' : '#94A3B8',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === 'scanner' ? '0 4px 16px rgba(16, 185, 129, 0.45)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <HeartHandshake size={18} />
              <span>🔬 AI Scanner Daun Tomat</span>
              <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: 4, opacity: 0.8 }}>[2]</span>
            </button>
          </div>
        </div>

        {/* 3. Main Display Container */}
        {activeTab === '3d' ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            overflow: 'hidden',
            height: '580px',
            boxShadow: '0 14px 44px rgba(0, 0, 0, 0.45)',
            position: 'relative'
          }}>
            <InteractiveTomato3D />
          </div>
        ) : (
          <DiagnosticStudio />
        )}

        {/* 4. Architecture Specs Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginTop: 40
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Cpu size={22} color="#F43F5E" />
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ML Engine</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>MobileNetV2 (CPU)</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Server size={22} color="#10B981" />
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Orchestration</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Docker Swarm (2 Rep)</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <GitBranch size={22} color="#38BDF8" />
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Tracing Standard</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Twitter Snowflake</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <ShieldCheck size={22} color="#A855F7" />
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Edge Security</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Cloudflare Zero Trust</div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        color: '#64748B',
        fontSize: 13
      }}>
        © 2026 AgriVision AI • Production Tomato Pathology Platform • Protected by Cloudflare Zero Trust
      </footer>
    </div>
  );
};

export default App;
