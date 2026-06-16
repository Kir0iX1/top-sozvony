import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check, Users, MessageSquare, Settings } from 'lucide-react';
import { useSettings } from './SettingsContext';
import './index.css';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { videoDeviceId, audioDeviceId, volume, setIsSettingsOpen } = useSettings();

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
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
  }, []);

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
    navigate('/');
  };

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        <div className="video-grid">
          <div className="video-wrapper">
            {error ? (
              <div className="video-placeholder error">
                <p>{error}</p>
              </div>
            ) : isVideoOff ? (
              <div className="video-placeholder">
                <div className="avatar bg-1" style={{ width: 100, height: 100, fontSize: '3rem', margin: 0 }}>ВЫ</div>
              </div>
            ) : null}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted // Always mute local video so user doesn't hear themselves
              className={`video-element ${isVideoOff ? 'hidden' : ''}`}
            />
            <div className="video-label">Вы</div>
          </div>
        </div>
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
          <button className="btn-icon" title="Участники">
            <Users size={20} />
          </button>
          <button className="btn-icon" title="Чат">
            <MessageSquare size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
