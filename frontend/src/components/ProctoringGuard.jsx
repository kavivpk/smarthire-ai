/**
 * ProctoringGuard.jsx — Wrapper component (Phase 2)
 *
 * Usage:
 *   <ProctoringGuard onSessionStart={() => ...} onDisqualified={(info) => ...}>
 *     {children}  {/* rendered only after test starts *\/}
 *   </ProctoringGuard>
 *
 * Shows a pre-test instructions screen that:
 *  - Checks camera + mic permissions (required before enabling Start Test)
 *  - Offers optional screen share
 *  - Enters fullscreen when Start Test is clicked
 *  - Monitors violations throughout and shows a 3-strike disqualification screen
 *  - Renders a small camera thumbnail in the corner during the test
 *
 * Face identity verification is explicitly OUT OF SCOPE (per spec §2.6).
 * This only checks face *presence*, not identity.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useProctoring } from './useProctoring';

export default function ProctoringGuard({
  children,
  onSessionStart,
  onDisqualified,
  testTitle = 'Interview Test',
  showCameraThumbnail = true,
  renderAsOverlay = false,  // when true: renders overlays only (no children wrapper), for use alongside existing content
  existingStream = null,    // when renderAsOverlay=true, pass the stream from the original ProctoringGuard session
}) {
  // When renderAsOverlay is true, skip instructions and treat as already active.
  // The parent component owns the session lifecycle; we just provide monitoring UI.
  const [phase, setPhase] = useState(renderAsOverlay ? 'active' : 'instructions'); // instructions | active | disqualified
  const [checklist, setChecklist] = useState({ camera: false, mic: false, fullscreen: false });
  const [starting, setStarting] = useState(false);
  const [cameraPreviewVisible, setCameraPreviewVisible] = useState(true);
  const previewVideoRef = useRef(null);

  const handleDisqualified = useCallback((info) => {
    setPhase('disqualified');
    if (typeof onDisqualified === 'function') onDisqualified(info);
  }, [onDisqualified]);

  const proctoring = useProctoring({
    onDisqualified: handleDisqualified,
    active: phase === 'active',
    existingStream: renderAsOverlay ? existingStream : null,
  });

  // Wire stream to preview video element
  useEffect(() => {
    if (previewVideoRef.current && proctoring.stream) {
      previewVideoRef.current.srcObject = proctoring.stream;
    }
  }, [proctoring.stream, previewVideoRef]);

  // Start face detection when test becomes active
  useEffect(() => {
    if (phase === 'active' && previewVideoRef.current && proctoring.stream) {
      proctoring.startFaceCheck(previewVideoRef.current);
    }
  }, [phase, proctoring.stream]);

  // Hide header by toggling class on document element during test/instructions phase
  useEffect(() => {
    if (phase !== 'disqualified') {
      document.documentElement.classList.add('proctoring-active');
    } else {
      document.documentElement.classList.remove('proctoring-active');
    }
    return () => {
      document.documentElement.classList.remove('proctoring-active');
    };
  }, [phase]);


  // ── Step 1: Request permissions ───────────────────────────────────────────
  const handleRequestPermissions = async () => {
    const mediaStream = await proctoring.requestMediaPermissions();
    if (mediaStream) {
      setChecklist(prev => ({ ...prev, camera: true, mic: true }));
    }
  };

  // ── Step 2: Start test ────────────────────────────────────────────────────
  const handleStartTest = async () => {
    setStarting(true);
    await proctoring.enterFullscreen();
    setChecklist(prev => ({ ...prev, fullscreen: true }));
    setPhase('active');
    if (typeof onSessionStart === 'function') onSessionStart({ stream: proctoring.stream });
    setStarting(false);
  };

  const allChecked = checklist.camera && checklist.mic;

  // ═══════════════════════════════════════════════════════════════════
  // DISQUALIFIED SCREEN
  // ═══════════════════════════════════════════════════════════════════

  // In overlay mode, the parent handles disqualification (shows combined results screen).
  // Don't render a full-screen takeover here — just render nothing and let parent take over.
  if (phase === 'disqualified' && renderAsOverlay) {
    return null;
  }

  if (phase === 'disqualified') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.95)' }}>
        <div className="max-w-md mx-4 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)' }}>
            <span style={{ fontSize: 36 }}>🚫</span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 700, color: '#ef4444' }} className="mb-3">
            Disqualified
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#9ca3af', fontSize: 15, lineHeight: 1.6 }} className="mb-2">
            You have been disqualified due to repeated violations ({proctoring.violations}/{3} warnings).
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#6b7280', fontSize: 13 }}>
            Your partial answers have been recorded and submitted. You will receive an email with your results.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRE-TEST INSTRUCTIONS SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6366f1' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#818cf8' }}>Proctored Session</span>
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Before You Begin
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#64748b', marginTop: 8 }}>
              {testTitle}
            </p>
          </div>

          {/* Info card */}
          <div className="rounded-2xl p-6 mb-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
              📋 Test Rules
            </h2>
            <ul style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.8, listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚠</span>
                <span>This test <strong style={{ color: '#ef4444', fontWeight: 700 }}>requires camera and microphone access</strong>. You must allow these permissions before starting.</span>
              </li>
              <li style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#ef4444', flexShrink: 0 }}>🚫</span>
                <span><strong style={{ color: '#ef4444', fontWeight: 700 }}>Do not switch tabs, minimize the window, or exit fullscreen</strong> during the test.</span>
              </li>
              <li style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#ef4444', flexShrink: 0 }}>⛔</span>
                <span>Doing so <strong style={{ color: '#ef4444', fontWeight: 700 }}>3 times will automatically disqualify you</strong> and submit whatever answers you completed.</span>
              </li>
              <li style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>📷</span>
                <span><strong style={{ color: '#ef4444', fontWeight: 700 }}>Stay visible in your camera frame.</strong> If no face is detected for 10+ seconds, it counts as a violation.</span>
              </li>
            </ul>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>
              ✅ Pre-Flight Checklist
            </h2>

            {/* Camera + Mic */}
            <div className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 18 }}>📷</span>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#e2e8f0', fontWeight: 500 }}>Camera detected</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b' }}>Required for proctoring</p>
                </div>
              </div>
              {checklist.camera
                ? <span style={{ color: '#22c55e', fontSize: 20 }}>✅</span>
                : <span style={{ color: '#ef4444', fontSize: 18 }}>❌</span>}
            </div>
            <div className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 18 }}>🎙️</span>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#e2e8f0', fontWeight: 500 }}>Microphone detected</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b' }}>Required for proctoring</p>
                </div>
              </div>
              {checklist.mic
                ? <span style={{ color: '#22c55e', fontSize: 20 }}>✅</span>
                : <span style={{ color: '#ef4444', fontSize: 18 }}>❌</span>}
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 18 }}>🖥️</span>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#e2e8f0', fontWeight: 500 }}>Fullscreen mode ready</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b' }}>Activated on test start</p>
                </div>
              </div>
              <span style={{ color: '#6366f1', fontSize: 18 }}>🔵</span>
            </div>

            {/* Permission error */}
            {proctoring.permissionError && (
              <div className="mt-3 rounded-xl p-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#f87171' }}>
                  {proctoring.permissionError}
                </p>
              </div>
            )}

            {/* Camera preview */}
            {proctoring.stream && (
              <div className="mt-4 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000', maxHeight: 160 }}>
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              </div>
            )}
          </div>

          {/* Optional screen share */}
          <div className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13.5, color: '#e2e8f0', fontWeight: 500 }}>🖥️ Screen Share (Optional)</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b' }}>
                Note: Browsers cannot force screen sharing — this is opt-in only.
              </p>
            </div>
            <button
              onClick={proctoring.requestScreenShare}
              style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                background: proctoring.screenStream ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                border: proctoring.screenStream ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(99,102,241,0.3)',
                color: proctoring.screenStream ? '#4ade80' : '#818cf8',
              }}>
              {proctoring.screenStream ? '✓ Sharing' : 'Share'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {!checklist.camera && (
              <button
                onClick={handleRequestPermissions}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14, cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  transition: 'all 0.2s',
                }}>
                📷 Allow Camera & Microphone
              </button>
            )}
            <button
              onClick={handleStartTest}
              disabled={!allChecked || starting}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, cursor: allChecked ? 'pointer' : 'not-allowed',
                fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff',
                background: allChecked
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(255,255,255,0.05)',
                border: allChecked ? 'none' : '1px solid rgba(255,255,255,0.1)',
                opacity: allChecked ? 1 : 0.5,
                boxShadow: allChecked ? '0 4px 20px rgba(16,185,129,0.4)' : 'none',
                transition: 'all 0.3s',
              }}>
              {starting ? '⏳ Starting...' : '🚀 Start Test'}
            </button>
          </div>

          {!allChecked && (
            <p className="text-center mt-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b' }}>
              Allow camera & microphone access above to enable the Start Test button.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVE TEST — render children with overlays
  // ═══════════════════════════════════════════════════════════════════

  // renderAsOverlay mode: only render the fixed overlays, no wrapper div, no children.
  // The parent renders its own content separately; this just adds violation monitoring UI
  // as fixed-positioned elements over whatever content is currently on screen.
  if (renderAsOverlay) {
    return (
      <>
        {proctoring.warningMsg && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="max-w-sm mx-4 rounded-2xl p-6 text-center"
              style={{ background: '#1e293b', border: '2px solid rgba(239,68,68,0.5)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#f87171', marginBottom: 8 }}>
                Proctoring Violation
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
                {proctoring.warningMsg}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                Violations: {proctoring.violations}/{3}
              </p>
              <button onClick={proctoring.dismissWarning}
                style={{ padding: '10px 28px', borderRadius: 10, fontFamily: 'Inter, sans-serif',
                  fontWeight: 600, fontSize: 14, color: '#fff', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>
                I Understand — Continue
              </button>
            </div>
          </div>
        )}
        {showCameraThumbnail && proctoring.stream && cameraPreviewVisible && (
          <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9980,
            width: 140, height: 105, borderRadius: 12, overflow: 'hidden',
            border: proctoring.faceAbsent ? '2px solid #ef4444' : '2px solid rgba(99,102,241,0.6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)', cursor: 'pointer',
            transition: 'border-color 0.3s' }}
            title="Click to hide/show camera preview"
            onClick={() => setCameraPreviewVisible(false)}>
            <video ref={previewVideoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {proctoring.faceAbsent && (
              <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
                fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
                color: '#ef4444', background: 'rgba(0,0,0,0.7)', padding: '2px 0' }}>
                Face not detected
              </div>
            )}
            <div style={{ position: 'absolute', top: 4, left: 6, fontFamily: 'Inter, sans-serif',
              fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              👁 Monitored · ×close
            </div>
          </div>
        )}
        {showCameraThumbnail && proctoring.stream && !cameraPreviewVisible && (
          <button onClick={() => setCameraPreviewVisible(true)}
            style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9980,
              padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
              color: '#818cf8', background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)' }}>
            📷 Show Camera
          </button>
        )}
        {proctoring.violations > 0 && !proctoring.isDisqualified && (
          <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 9970,
            padding: '4px 10px', borderRadius: 20,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
            color: '#f87171', background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)' }}>
            ⚠ {proctoring.violations}/{3} warnings
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Warning modal */}
      {proctoring.warningMsg && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div className="max-w-sm mx-4 rounded-2xl p-6 text-center"
            style={{ background: '#1e293b', border: '2px solid rgba(239,68,68,0.5)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#f87171', marginBottom: 8 }}>
              Proctoring Violation
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              {proctoring.warningMsg}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              Violations: {proctoring.violations}/{3}
            </p>
            <button
              onClick={proctoring.dismissWarning}
              style={{
                padding: '10px 28px', borderRadius: 10, fontFamily: 'Inter, sans-serif',
                fontWeight: 600, fontSize: 14, color: '#fff', cursor: 'pointer',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none',
              }}>
              I Understand — Continue
            </button>
          </div>
        </div>
      )}

      {/* Camera thumbnail */}
      {showCameraThumbnail && proctoring.stream && cameraPreviewVisible && (
        <div
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9980,
            width: 140, height: 105, borderRadius: 12, overflow: 'hidden',
            border: proctoring.faceAbsent ? '2px solid #ef4444' : '2px solid rgba(99,102,241,0.6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            transition: 'border-color 0.3s',
          }}
          title="Click to hide/show camera preview"
          onClick={() => setCameraPreviewVisible(false)}
        >
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          {proctoring.faceAbsent && (
            <div style={{
              position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
              fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
              color: '#ef4444', background: 'rgba(0,0,0,0.7)', padding: '2px 0'
            }}>
              Face not detected
            </div>
          )}
          <div style={{
            position: 'absolute', top: 4, left: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
          }}>
            👁 Monitored · ×close
          </div>
        </div>
      )}

      {/* Show camera button when thumbnail is hidden */}
      {showCameraThumbnail && proctoring.stream && !cameraPreviewVisible && (
        <button
          onClick={() => setCameraPreviewVisible(true)}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9980,
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
            color: '#818cf8', background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
          }}>
          📷 Show Camera
        </button>
      )}

      {/* Violation counter badge */}
      {proctoring.violations > 0 && !proctoring.isDisqualified && (
        <div style={{
          position: 'fixed', top: 12, right: 16, zIndex: 9970,
          padding: '4px 10px', borderRadius: 20,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          color: '#f87171',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          ⚠ {proctoring.violations}/{3} warnings
        </div>
      )}

      {/* Children (actual test content) */}
      {children}
    </div>
  );
}
