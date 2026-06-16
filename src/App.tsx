import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Room from './Room';
import { SettingsProvider } from './SettingsContext';
import SettingsModal from './SettingsModal';
import './index.css';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
        <SettingsModal />
      </Router>
    </SettingsProvider>
  );
}

export default App;
