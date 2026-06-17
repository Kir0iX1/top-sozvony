import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SettingsContextType {
  videoDeviceId: string;
  setVideoDeviceId: (id: string) => void;
  audioDeviceId: string;
  setAudioDeviceId: (id: string) => void;
  volume: number;
  setVolume: (v: number) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  meetingsCount: number;
  incrementMeetings: () => void;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  noiseSuppression: boolean;
  setNoiseSuppression: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [videoDeviceId, setVideoDeviceId] = useState(localStorage.getItem('videoDeviceId') || '');
  const [audioDeviceId, setAudioDeviceId] = useState(localStorage.getItem('audioDeviceId') || '');
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume') || '1'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Гость');
  const [meetingsCount, setMeetingsCount] = useState(() => parseInt(localStorage.getItem('meetingsCount') || '0', 10));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem('avatarUrl') || null);
  const [noiseSuppression, setNoiseSuppression] = useState(() => localStorage.getItem('noiseSuppression') !== 'false');

  useEffect(() => {
    localStorage.setItem('videoDeviceId', videoDeviceId);
    localStorage.setItem('audioDeviceId', audioDeviceId);
    localStorage.setItem('volume', volume.toString());
    localStorage.setItem('userName', userName);
    localStorage.setItem('meetingsCount', meetingsCount.toString());
    localStorage.setItem('noiseSuppression', noiseSuppression.toString());
    if (avatarUrl) {
      localStorage.setItem('avatarUrl', avatarUrl);
    } else {
      localStorage.removeItem('avatarUrl');
    }
  }, [videoDeviceId, audioDeviceId, volume, userName, meetingsCount, avatarUrl, noiseSuppression]);

  const incrementMeetings = () => setMeetingsCount(prev => prev + 1);

  return (
    <SettingsContext.Provider value={{
      videoDeviceId, setVideoDeviceId,
      audioDeviceId, setAudioDeviceId,
      volume, setVolume,
      isSettingsOpen, setIsSettingsOpen,
      userName, setUserName,
      meetingsCount, incrementMeetings,
      avatarUrl, setAvatarUrl,
      noiseSuppression, setNoiseSuppression
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
