import { useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { X } from 'lucide-react';
import './index.css';

export default function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, videoDeviceId, setVideoDeviceId, audioDeviceId, setAudioDeviceId, volume, setVolume } = useSettings();
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SecureContext");
      }
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop()); // Сразу останавливаем
      setPermissionGranted(true);
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
    } catch (err: any) {
      console.error("Permission denied", err);
      if (err.message === "SecureContext") {
        setErrorMsg("Браузер блокирует доступ. Откройте сайт строго по адресу http://localhost:5173 или используйте HTTPS.");
      } else {
        setErrorMsg("Доступ запрещен. Нажмите на значок настроек сайта (слева от адресной строки браузера) и разрешите доступ к камере/микрофону вручную.");
      }
    }
  };

  useEffect(() => {
    if (!isSettingsOpen) return;

    const checkDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = devices.some(d => d.label !== '');
      if (hasLabels) {
        setPermissionGranted(true);
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
        setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
      }
    };
    checkDevices();
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Настройки</h2>
          <button className="btn-icon" onClick={() => setIsSettingsOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {!permissionGranted && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                Для получения списка устройств необходимо дать разрешение на использование камеры и микрофона в браузере.
              </p>
              <button className="btn btn-secondary" onClick={requestPermissions} style={{ width: '100%' }}>
                Запросить разрешение
              </button>
              {errorMsg && (
                <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  {errorMsg}
                </p>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label>Камера</label>
            {videoDevices.length > 0 ? (
              <select className="select-input" value={videoDeviceId} onChange={e => setVideoDeviceId(e.target.value)}>
                <option value="">По умолчанию</option>
                {videoDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0,5)}`}</option>
                ))}
              </select>
            ) : (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                Камеры не найдены. Проверьте подключение или настройки Windows (Конфиденциальность).
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Микрофон</label>
            {audioDevices.length > 0 ? (
              <select className="select-input" value={audioDeviceId} onChange={e => setAudioDeviceId(e.target.value)}>
                <option value="">По умолчанию</option>
                {audioDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.substring(0,5)}`}</option>
                ))}
              </select>
            ) : (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                Микрофоны не найдены. Проверьте подключение или настройки Windows (Конфиденциальность).
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Громкость звонков ({Math.round(volume * 100)}%)</label>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume} 
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="range-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
