import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export default function VideoCall({ socket, roomId, userName, isAiMode }) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);

  const [camOn,  setCamOn]  = useState(true);
  const [micOn,  setMicOn]  = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    startMedia();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (!socket || isAiMode) {
      if (isAiMode) setConnected(true);
      return;
    }

    // Peer ready — initiate call
    socket.on('webrtc_peer_ready', async ({ from }) => {
      await createOffer(from);
    });

    // Receive offer
    socket.on('webrtc_offer', async ({ offer, from }) => {
      await handleOffer(offer, from);
    });

    // Receive answer
    socket.on('webrtc_answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    // ICE candidate
    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (_e) {}
      }
    });

    // Notify others I'm ready
    socket.emit('webrtc_ready', { roomId });

    return () => {
      socket.off('webrtc_peer_ready');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
    };
  }, [socket, isAiMode, roomId]);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (_err) {
      setError('Camera/Mic access denied. Please allow permissions.');
    }
  };

  const createPeerConnection = (to) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          roomId,
          candidate: event.candidate,
          to
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setConnected(true);
      if (pc.connectionState === 'disconnected') setConnected(false);
    };

    pcRef.current = pc;
    return pc;
  };

  const createOffer = async (to) => {
    const pc = createPeerConnection(to);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc_offer', { roomId, offer, to });
  };

  const handleOffer = async (offer, from) => {
    const pc = createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc_answer', { roomId, answer, to: from });
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200
                    dark:border-gray-800 rounded-2xl overflow-hidden">

      {/* Videos */}
      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>

        {/* Remote video — full (only if not AI mode) */}
        {!isAiMode && (
          <video
            ref={remoteVideoRef}
            autoPlay playsInline
            className="w-full h-full object-cover"
            style={{ display: connected ? 'block' : 'none' }}
          />
        )}

        {/* AI mode background or Waiting screen */}
        {(!connected || isAiMode) && (
          <div className="absolute inset-0 flex flex-col items-center
                          justify-center bg-gray-900">
            {isAiMode ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center
                                justify-center mb-3 mx-auto">
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="text-gray-400 text-sm">
                  AI Interviewer is analyzing...
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center
                                justify-center mb-3">
                  <svg width="28" height="28" fill="none" stroke="#9ca3af"
                       strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">
                  Waiting for other participant...
                </p>
              </>
            )}
          </div>
        )}

        {/* Local video — full size in AI mode, bottom right in Admin mode */}
        <div className={`absolute overflow-hidden bg-gray-800 ${
          isAiMode
            ? 'inset-0'
            : 'bottom-3 right-3 w-28 h-20 rounded-xl border-2 border-gray-600'
        }`}>
          <video
            ref={localVideoRef}
            autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!camOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center
                            justify-center">
              <span className="text-gray-400 text-xs">Cam Off</span>
            </div>
          )}
        </div>

        {/* Name tag */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-lg">
            {userName}
          </span>
        </div>

        {/* Connected indicator */}
        {connected && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5
                          bg-black/60 rounded-lg px-2 py-1">
            <span className="w-2 h-2 bg-green-400 rounded-full
                             animate-pulse"/>
            <span className="text-white text-xs">Connected</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-3
                      bg-gray-50 dark:bg-gray-800">

        {/* Mic */}
        <button onClick={toggleMic}
          className="w-10 h-10 rounded-full flex items-center justify-center
                     transition-colors"
          style={{
            backgroundColor: micOn ? '#374151' : '#ef4444'
          }}>
          {micOn ? (
            <svg width="16" height="16" fill="none" stroke="white"
                 strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="white"
                 strokeWidth="2" viewBox="0 0 24 24">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
              <path d="M15 9.34V4a3 3 0 0 0-5.94-.6"/>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2"/>
              <path d="M19 10v2a7 7 0 0 1-.11 1.23"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>

        {/* Camera */}
        <button onClick={toggleCam}
          className="w-10 h-10 rounded-full flex items-center justify-center
                     transition-colors"
          style={{
            backgroundColor: camOn ? '#374151' : '#ef4444'
          }}>
          {camOn ? (
            <svg width="16" height="16" fill="none" stroke="white"
                 strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="white"
                 strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>
              <polygon points="23 7 16 12 23 17 23 7"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>

        {/* Status */}
        <span className="text-xs text-gray-400 ml-2">
          {connected ? '🟢 Video Connected' : '⏳ Connecting...'}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-center">
          <p className="text-red-500 text-xs">{error}</p>
          <button onClick={startMedia}
            className="text-xs text-red-500 underline mt-1">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}