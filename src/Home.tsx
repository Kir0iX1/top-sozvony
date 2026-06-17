import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Keyboard, Settings, HelpCircle, User, Plus, X } from 'lucide-react';
import { useSettings } from './SettingsContext';

export default function Home() {
  const [meetingCode, setMeetingCode] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { setIsSettingsOpen, userName, setUserName, meetingsCount, incrementMeetings, avatarUrl, setAvatarUrl } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Генерирует уникальный красивый код формата "abc-defg-hij"
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segment = (length: number) => Array.from({ length }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  const handleCreateMeeting = () => {
    // Каждое нажатие генерирует абсолютно новый и уникальный номер комнаты
    incrementMeetings();
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

  const handleJoinMeeting = () => {
    const code = meetingCode.trim();
    if (code) {
      incrementMeetings();
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
          <button className="btn-icon" aria-label="Help" onClick={() => setIsHelpOpen(true)}>
            <HelpCircle size={20} />
          </button>
          <button className="btn-icon" aria-label="User Profile" onClick={() => setIsProfileOpen(true)}>
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

      {/* Модальное окно информации */}
      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>О проекте</h2>
              <button className="btn-icon" onClick={() => setIsHelpOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
              <p style={{ marginBottom: '1.2rem' }}>
                Добро пожаловать в <strong>Топовые созвоны</strong>! Мы создали эту платформу, чтобы ваше общение было максимально комфортным и безопасным.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>🔒</div>
                  <div>
                    <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>Надежность и доверие</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>Ваши звонки надежно защищены. Мы не храним ваши данные и гарантируем полную приватность общения. Нам можно доверять!</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>🚀</div>
                  <div>
                    <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>Отличная работа</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>Платформа оптимизирована для быстрой работы без задержек и подвисаний. Качество связи всегда на высоте.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>💎</div>
                  <div>
                    <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Абсолютно бесплатно</strong>
                    <span style={{ color: 'var(--text)' }}>Мы не требуем подписок, не ставим лимиты на время звонка и не берем деньги за премиум-функции. Всё это доступно вам бесплатно и навсегда.</span>
                  </div>
                </div>
              </div>
              
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsHelpOpen(false)}>
                Понятно, спасибо!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно профиля */}
      {isProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Профиль</h2>
              <button className="btn-icon" onClick={() => setIsProfileOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', 
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', fontWeight: 'bold', color: 'white',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Изменить аватарку"
              >
                {!avatarUrl && (userName ? userName.charAt(0).toUpperCase() : 'Г')}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <label>Ваше имя</label>
                <input 
                  type="text" 
                  className="text-input" 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Как вас называть?"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Проведено встреч:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{meetingsCount}</span>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
