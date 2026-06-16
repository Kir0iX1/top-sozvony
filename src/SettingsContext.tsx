import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SettingsContextType {
  videoDeviceId: string;
  setVideoDeviceId: (id: string) => void;
  audioDeviceId: string;
  setAudioDeviceId: (id: string) => void;
  volume: number;
  setVolume: (v: number) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [videoDeviceId, setVideoDeviceId] = useState(() => localStorage.getItem('videoDeviceId') || '');
  const [audioDeviceId, setAudioDeviceId] = useState(() => localStorage.getItem('audioDeviceId') || '');
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume') || '1'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => { localStorage.setItem('videoDeviceId', videoDeviceId); }, [videoDeviceId]);
  useEffect(() => { localStorage.setItem('audioDeviceId', audioDeviceId); }, [audioDeviceId]);
  useEffect(() => { localStorage.setItem('volume', volume.toString()); }, [volume]);

  return (
    <SettingsContext.Provider value={{ videoDeviceId, setVideoDeviceId, audioDeviceId, setAudioDeviceId, volume, setVolume, isSettingsOpen, setIsSettingsOpen }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
