import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Keyboard, Settings, HelpCircle, User, Plus } from 'lucide-react';
import { useSettings } from './SettingsContext';

export default function Home() {
  const [meetingCode, setMeetingCode] = useState('');
  const navigate = useNavigate();
  const { setIsSettingsOpen } = useSettings();

  // Генерирует уникальный красивый код формата "abc-defg-hij"
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segment = (length: number) => Array.from({ length }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  const handleCreateMeeting = () => {
    // Каждое нажатие генерирует абсолютно новый и уникальный номер комнаты
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

  const handleJoinMeeting = () => {
    const code = meetingCode.trim();
    if (code) {
      // Если вставили ссылку целиком (http://.../room/abc-defg-hij), берем только последнюю часть
      // Если просто код, то берем его
      const roomId = code.split('/').pop();
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <>
      <header className="container header">
        <div className="logo animate-fade-in">
          <img src="./logo.jpg" alt="Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          <span>Топовые созвоны</span>
        </div>
        <div className="nav-actions animate-fade-in delay-100">
          <button className="btn-icon" aria-label="Settings" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
          <button className="btn-icon" aria-label="Help">
            <HelpCircle size={20} />
          </button>
          <button className="btn-icon" aria-label="User Profile">
            <User size={20} />
          </button>
        </div>
      </header>

      <main className="container main-content">
        <div className="hero-grid">
          <div className="hero-text">
            <h1 className="animate-fade-in delay-100">
              Премиальные видеовстречи <br />
              <span className="gradient-text">для вашей команды</span>
            </h1>
            <p className="animate-fade-in delay-200">
              Создайте встречу в один клик или присоединитесь к уже существующей. 
              Безопасно, быстро и с потрясающим качеством видео.
            </p>
            
            <div className="action-row animate-fade-in delay-300">
              <button className="btn btn-primary" onClick={handleCreateMeeting}>
                <Plus size={20} />
                Создать встречу
              </button>
              
              <span className="divider">или</span>
              
              <div className="input-group">
                <Keyboard size={20} className="input-icon" />
                <input 
                  type="text" 
                  className="text-input" 
                  placeholder="Введите код или ссылку" 
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
                />
              </div>
              
              <button 
                className="btn btn-secondary" 
                onClick={handleJoinMeeting}
                disabled={!meetingCode.trim()}
                style={{ opacity: meetingCode.trim() ? 1 : 0.5, cursor: meetingCode.trim() ? 'pointer' : 'not-allowed' }}
              >
                Присоединиться
              </button>
            </div>
          </div>
          
          <div className="hero-image-wrapper animate-fade-in delay-200">
            <img 
              src="./hero_illustration.jpg" 
              alt="Video Conference Abstract" 
              className="hero-image"
            />
            
            <div className="glass-panel floating-card">
              <div className="status-dot"></div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Встреча активна</span>
              <div className="avatar-group">
                <div className="avatar bg-1">A</div>
                <div className="avatar bg-2">M</div>
                <div className="avatar bg-3">D</div>
              </div>
            </div>

            <div className="glass-panel floating-card-2">
              <Video size={16} color="#a5b4fc" />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>HD Качество</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
