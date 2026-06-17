import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check, Users, MessageSquare, Settings, X, Send, Crown, Monitor, MonitorOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useSettings } from './SettingsContext';
import './index.css';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | null>(null);
  const [chatMessages, setChatMessages] = useState<{id: number, sender: string, text: string, isSelf: boolean}[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [participants, setParticipants] = useState<{id: string, userName: string, avatarUrl: string | null, isHost: boolean}[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  const { videoDeviceId, audioDeviceId, volume, setIsSettingsOpen, userName, avatarUrl, noiseSuppression } = useSettings();

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
          audio: audioDeviceId 
            ? { deviceId: { exact: audioDeviceId }, noiseSuppression: noiseSuppression, echoCancellation: true } 
            : { noiseSuppression: noiseSuppression, echoCancellation: true },
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Не удалось получить доступ к камере/микрофону. Проверьте разрешения или используйте localhost.");
      }
    };

    getMedia();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoDeviceId, audioDeviceId, noiseSuppression]);

  // Подключение к Socket.io серверу и настройка WebRTC
  useEffect(() => {
    if (!stream) return;

    socketRef.current = io('https://sozvon-server.onrender.com');

    socketRef.current.emit('join-room', {
      roomId,
      userName: userName || 'Гость',
      avatarUrl
    });

    socketRef.current.on('room-users', (users) => {
      setParticipants(users);
    });

    socketRef.current.on('receive-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    const createPeer = (targetId: string) => {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = (event) => {
        setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }));
      };

      peer.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            target: targetId,
            candidate: event.candidate,
            sender: socketRef.current.id
          });
        }
      };

      return peer;
    };

    socketRef.current.on('user-joined', async (newUser) => {
      const peer = createPeer(newUser.id);
      peersRef.current[newUser.id] = peer;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.emit('offer', { target: newUser.id, sender: socketRef.current?.id, offer });
    });

    socketRef.current.on('offer', async (payload) => {
      const peer = createPeer(payload.sender);
      peersRef.current[payload.sender] = peer;
      await peer.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current?.emit('answer', { target: payload.sender, sender: socketRef.current?.id, answer });
    });

    socketRef.current.on('answer', async (payload) => {
      const peer = peersRef.current[payload.sender];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    });

    socketRef.current.on('ice-candidate', async (payload) => {
      const peer = peersRef.current[payload.sender];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(e => console.error(e));
      }
    });

    socketRef.current.on('user-left', (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
    });

    return () => {
      socketRef.current?.disconnect();
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
    };
  }, [stream, roomId, userName, avatarUrl]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Громкость локального видео игнорируется (muted), но это будет работать для других видеоэлементов
      videoRef.current.volume = volume; 
    }
  }, [stream, volume]);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!stream.getVideoTracks()[0].enabled);
    }
  };

  const leaveRoom = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate('/');
  };

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Остановить демонстрацию
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Возвращаем трек камеры
      const videoTrack = stream?.getVideoTracks()[0];
      if (videoTrack) {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });
      }
      setIsScreenSharing(false);
    } else {
      // Начать демонстрацию
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Заменяем локальное видео
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }

        // Отправляем скриншер пирам
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        setIsScreenSharing(true);

        // Если пользователь нажал "Остановить доступ" в плашке браузера
        screenTrack.onended = () => {
          if (screenStreamRef.current) {
            setIsScreenSharing(true); // Заглушка, чтобы стейт был актуальным перед вызовом toggle
            toggleScreenShare();
          }
        };
      } catch (err) {
        console.error("Ошибка шаринга экрана:", err);
      }
    }
  };

  const togglePanel = (panel: 'chat' | 'participants') => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      const msgText = currentMessage.trim();
      setChatMessages(prev => [
        ...prev, 
        { id: Date.now(), sender: userName || 'Вы', text: msgText, isSelf: true }
      ]);
      socketRef.current?.emit('send-message', msgText);
      setCurrentMessage('');
    }
  };

  return (
    <div className="room-container">
      {/* Header */}
      <header className="room-header glass-panel">
        <div className="logo">
          <img src="./logo.jpg" alt="Logo" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontSize: '1.25rem' }}>Встреча: {roomId}</span>
        </div>
        
        <div className="room-header-actions">
          <button className="btn btn-secondary" onClick={copyLink} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            {copied ? 'Скопировано' : 'Копировать ссылку'}
          </button>
        </div>
      </header>

      {/* Main Video Area */}
      <main className="room-main">
        <div className="video-grid" style={{ flex: 1 }}>
          {/* Local Video */}
          <div className="video-wrapper">
            {error ? (
              <div className="video-placeholder error">
                <p>{error}</p>
              </div>
            ) : isVideoOff ? (
              <div className="video-placeholder">
                <div 
                  className="avatar bg-1" 
                  style={{ 
                    width: 100, height: 100, fontSize: '3rem', margin: 0,
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : undefined
                  }}
                >
                  {!avatarUrl && (userName ? userName.charAt(0).toUpperCase() : 'Вы')}
                </div>
              </div>
            ) : null}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted // Always mute local video so user doesn't hear themselves
              className={`video-element ${isVideoOff ? 'hidden' : ''}`}
            />
            <div className="video-label">{userName || 'Вы'}</div>
          </div>

          {/* Remote Videos */}
          {participants.filter(p => p.id !== socketRef.current?.id).map(p => {
            const remoteStream = remoteStreams[p.id];
            return (
              <div className="video-wrapper" key={p.id}>
                {remoteStream ? (
                  <video 
                    autoPlay 
                    playsInline 
                    className="video-element" 
                    ref={el => { if (el && el.srcObject !== remoteStream) el.srcObject = remoteStream; }}
                  />
                ) : (
                  <div className="video-placeholder">
                    <div 
                      className="avatar bg-1" 
                      style={{ 
                        width: 100, height: 100, fontSize: '3rem', margin: 0,
                        background: p.avatarUrl ? `url(${p.avatarUrl}) center/cover` : undefined,
                        color: p.avatarUrl ? 'transparent' : 'white'
                      }}
                    >
                      {!p.avatarUrl && (p.userName ? p.userName.charAt(0).toUpperCase() : 'Г')}
                    </div>
                  </div>
                )}
                <div className="video-label">{p.userName}</div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        {activePanel && (
          <aside className="room-sidebar glass-panel">
            <div className="sidebar-header">
              <h2>{activePanel === 'chat' ? 'Чат' : 'Участники'}</h2>
              <button className="btn-icon" onClick={() => setActivePanel(null)}>
                <X size={20} />
              </button>
            </div>
            
            {activePanel === 'chat' && (
              <>
                <div className="sidebar-content">
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                      Сообщений пока нет. Будьте первым!
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={`chat-message ${msg.isSelf ? 'self' : ''}`}>
                        <span className="chat-sender">{msg.sender}</span>
                        <div className="chat-bubble">{msg.text}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-input-area">
                  <input 
                    type="text" 
                    className="text-input" 
                    placeholder="Написать сообщение..." 
                    value={currentMessage}
                    onChange={e => setCurrentMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                  />
                  <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={handleSendMessage}>
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}

            {activePanel === 'participants' && (
              <div className="sidebar-content">
                {participants.map(p => (
                  <div key={p.id} className="participant-item">
                    <div 
                      className="avatar bg-1" 
                      style={{ 
                        background: p.avatarUrl ? `url(${p.avatarUrl}) center/cover` : undefined,
                        color: p.avatarUrl ? 'transparent' : 'white'
                      }}
                    >
                      {!p.avatarUrl && (p.userName ? p.userName.charAt(0).toUpperCase() : 'Г')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>
                        {p.userName} {p.id === socketRef.current?.id ? '(Вы)' : ''}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {p.isHost ? 'Организатор' : 'Участник'}
                      </div>
                    </div>
                    {p.isHost && <Crown size={16} color="#f59e0b" />}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Bottom Controls */}
      <footer className="room-controls glass-panel">
        <div className="controls-left">
          <span className="room-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="controls-center">
          <button 
            className={`btn-icon control-btn ${isMuted ? 'danger' : ''}`} 
            onClick={toggleMic}
            title={isMuted ? "Включить микрофон" : "Выключить микрофон"}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button 
            className={`btn-icon control-btn ${isVideoOff ? 'danger' : ''}`} 
            onClick={toggleVideo}
            title={isVideoOff ? "Включить камеру" : "Выключить камеру"}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button 
            className={`btn-icon control-btn`} 
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Остановить демонстрацию" : "Демонстрация экрана"}
            style={{ background: isScreenSharing ? 'var(--accent-primary)' : undefined, color: isScreenSharing ? 'white' : undefined }}
          >
            {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
          </button>

          <button 
            className="btn-icon control-btn end-call" 
            onClick={leaveRoom}
            title="Завершить звонок"
          >
            <PhoneOff size={24} color="white" />
          </button>
        </div>

        <div className="controls-right">
          <button className="btn-icon" title="Настройки" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
          <button 
            className="btn-icon" 
            title="Участники" 
            onClick={() => togglePanel('participants')}
            style={{ background: activePanel === 'participants' ? 'rgba(255,255,255,0.2)' : undefined }}
          >
            <Users size={20} />
          </button>
          <button 
            className="btn-icon" 
            title="Чат" 
            onClick={() => togglePanel('chat')}
            style={{ background: activePanel === 'chat' ? 'rgba(255,255,255,0.2)' : undefined }}
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
