/**
 * useProctoring.js — Shared proctoring hook (Phase 2)
 * Handles: camera/mic stream, fullscreen, tab-switch/blur detection,
 * 3-strike disqualification, face-presence check (face-api.js).
 *
 * Face identity verification is explicitly OUT of scope (presence-only, per spec §2.6).
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export function useProctoring({ onDisqualified, active = false }) {
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [violations, setViolations] = useState(0);
  const [warningMsg, setWarningMsg] = useState('');
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceAbsent, setFaceAbsent] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const violationsRef = useRef(0);
  const activeRef = useRef(active);
  const disqualifiedRef = useRef(false);
  const faceAbsentTimerRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const faceApiLoadedRef = useRef(false);

  const MAX_VIOLATIONS = 3;

  // Keep activeRef in sync
  useEffect(() => { activeRef.current = active; }, [active]);

  // ── Request camera + mic ──────────────────────────────────────────────────
  const requestMediaPermissions = useCallback(async () => {
    setPermissionError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setPermissionGranted(true);
      return mediaStream;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera and microphone access is required to start the test. Please allow permissions and try again.'
        : `Media error: ${err.message}`;
      setPermissionError(msg);
      setPermissionGranted(false);
      return null;
    }
  }, []);

  // ── Optional screen share ─────────────────────────────────────────────────
  const requestScreenShare = useCallback(async () => {
    try {
      const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(sStream);
      sStream.getVideoTracks()[0].addEventListener('ended', () => setScreenStream(null));
    } catch {
      // User cancelled — not a violation (per spec §2.3: opt-in only)
    }
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* Some browsers block programmatic fullscreen */ }
  }, []);

  // ── Violation counter ─────────────────────────────────────────────────────
  const recordViolation = useCallback((reason) => {
    if (!activeRef.current || disqualifiedRef.current) return;
    violationsRef.current += 1;
    const n = violationsRef.current;
    setViolations(n);

    if (n >= MAX_VIOLATIONS) {
      disqualifiedRef.current = true;
      setIsDisqualified(true);
      setWarningMsg('');
      if (typeof onDisqualified === 'function') onDisqualified({ violations: n, reason });
    } else {
      setWarningMsg(`⚠️ Warning ${n}/${MAX_VIOLATIONS}: ${reason}. Do not switch tabs or leave fullscreen.`);
      // Auto-dismiss warning after 6s
      setTimeout(() => setWarningMsg(''), 6000);
    }
  }, [onDisqualified]);

  const dismissWarning = useCallback(() => setWarningMsg(''), []);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const handleFsChange = () => {
      if (!document.fullscreenElement && activeRef.current && !disqualifiedRef.current) {
        recordViolation('Exited fullscreen during the test');
        // Prompt re-entry
        setTimeout(() => enterFullscreen(), 300);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [active, recordViolation, enterFullscreen]);

  // ── Tab-switch / visibility / blur ────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const handleVisibility = () => {
      if (document.hidden && activeRef.current && !disqualifiedRef.current) {
        recordViolation('Switched tabs or minimized the window');
      }
    };
    const handleBlur = () => {
      if (activeRef.current && !disqualifiedRef.current) {
        recordViolation('Window lost focus');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [active, recordViolation]);

  // ── Face presence detection using face-api.js ─────────────────────────────
  // Loads face-api.js from CDN (lightweight, client-side only — per spec §2.6)
  // NOTE: Identity verification/matching is explicitly out of scope.
  const loadFaceApi = useCallback(async () => {
    if (faceApiLoadedRef.current) return true;
    return new Promise((resolve) => {
      if (window.faceapi) { faceApiLoadedRef.current = true; resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
      script.onload = async () => {
        try {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
          await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          faceApiLoadedRef.current = true;
          setFaceDetectionReady(true);
          resolve(true);
        } catch { resolve(false); }
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  const startFaceCheck = useCallback(async (videoElement) => {
    const loaded = await loadFaceApi();
    if (!loaded || !videoElement) return;

    const CHECK_INTERVAL_MS = 15000; // check every 15s
    const ABSENT_THRESHOLD_MS = 10000; // flag after 10s continuous absence

    faceCheckIntervalRef.current = setInterval(async () => {
      if (!activeRef.current || disqualifiedRef.current) return;
      if (!window.faceapi || videoElement.readyState < 2) return;

      try {
        const det = await window.faceapi.detectSingleFace(
          videoElement,
          new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        if (!det) {
          // Face not detected
          setFaceAbsent(true);
          if (!faceAbsentTimerRef.current) {
            faceAbsentTimerRef.current = setTimeout(() => {
              if (activeRef.current && !disqualifiedRef.current) {
                recordViolation('No face detected in camera frame for an extended period');
              }
              faceAbsentTimerRef.current = null;
              setFaceAbsent(false);
            }, ABSENT_THRESHOLD_MS);
          }
        } else {
          // Face is visible — clear timer
          setFaceAbsent(false);
          if (faceAbsentTimerRef.current) {
            clearTimeout(faceAbsentTimerRef.current);
            faceAbsentTimerRef.current = null;
          }
        }
      } catch { /* detection error — don't penalise */ }
    }, CHECK_INTERVAL_MS);
  }, [loadFaceApi, recordViolation]);

  const stopFaceCheck = useCallback(() => {
    if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    if (faceAbsentTimerRef.current) clearTimeout(faceAbsentTimerRef.current);
    faceCheckIntervalRef.current = null;
    faceAbsentTimerRef.current = null;
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const stopProctoring = useCallback(() => {
    stopFaceCheck();
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setStream(null);
    setScreenStream(null);
    violationsRef.current = 0;
    disqualifiedRef.current = false;
    activeRef.current = false;
  }, [stream, screenStream, stopFaceCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopFaceCheck();
  }, [stopFaceCheck]);

  return {
    // State
    stream,
    screenStream,
    permissionGranted,
    permissionError,
    violations,
    warningMsg,
    isDisqualified,
    faceDetectionReady,
    faceAbsent,
    videoRef,
    canvasRef,
    // Actions
    requestMediaPermissions,
    requestScreenShare,
    enterFullscreen,
    recordViolation,
    dismissWarning,
    startFaceCheck,
    stopFaceCheck,
    stopProctoring,
  };
}
