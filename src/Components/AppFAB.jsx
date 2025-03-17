import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './AppFAB.css';
import './AppMenu.css';
import './Modal.css';

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';

const versionCompare = (a, b) => {
  const cleanVersion = (v) => v.replace(/[^0-9.]/g, '').split('.').map(Number);
  const _a = cleanVersion(a);
  const _b = cleanVersion(b);
  
  for (let i = 0; i < Math.max(_a.length, _b.length); i++) {
    const n1 = _a[i] || 0;
    const n2 = _b[i] || 0;
    if (n1 !== n2) return n1 - n2;
  }
  return 0;
};

const AppFAB = () => {
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ 
    available: false, 
    notes: [] 
  });
  const [modals, setModals] = useState({
    update: false,
    about: false,
    privacy: false,
    feedback: false,
    notices: false
  });
  const [notices] = useState([
    { 
      id: 1, 
      title: 'Welcome to the App!', 
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' 
    },
    { 
      id: 2, 
      title: 'New Features Released', 
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' 
    },
  ]);

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      setInterval(async () => {
        if (!registration.installing && navigator.onLine) {
          await registration.update();
        }
      }, 60000);
    },
    onNeedRefresh: () => checkVersionUpdates(),
  });

  const checkVersionUpdates = async () => {
    try {
      const response = await fetch('/versionNotes.json');
      if (!response.ok) throw new Error('Failed to fetch version notes');
      
      const notesData = await response.json();
      const storedVersion = localStorage.getItem('appVersion') || '0.0.0';
      
      const newVersions = notesData.filter(note => 
        versionCompare(note.version, storedVersion) > 0
      );

      setUpdateInfo({
        available: newVersions.length > 0,
        notes: newVersions.sort((a, b) => versionCompare(b.version, a.version))
      });
    } catch (error) {
      console.error('Version check failed:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateServiceWorker();
      localStorage.setItem('appVersion', CURRENT_VERSION);
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      window.location.reload();
    }
  };

  const toggleModal = (modalName, state) => {
    setModals(prev => ({ ...prev, [modalName]: state }));
    setShowAppMenu(false);
  };

  useEffect(() => {
    const storedVersion = localStorage.getItem('appVersion');
    if (!storedVersion || versionCompare(CURRENT_VERSION, storedVersion) > 0) {
      localStorage.setItem('appVersion', CURRENT_VERSION);
    }
  }, []);

  return (
    <div className="app-fab-container">
      <button 
        className="app-fab" 
        onClick={() => setShowAppMenu(!showAppMenu)}
        aria-label="Open app menu"
      >
        {updateInfo.available && <div className="red-dot" />}
      </button>

      {showAppMenu && (
        <div className="app-menu">
          {updateInfo.available && (
            <button 
              className="app-menu-item with-dot"
              onClick={() => toggleModal('update', true)}
            >
              Update Available
              <div className="red-dot-small" />
            </button>
          )}
          <button className="app-menu-item" onClick={() => toggleModal('privacy', true)}>
            Privacy Policy
          </button>
          <button className="app-menu-item" onClick={() => toggleModal('about', true)}>
            About App
          </button>
          <button className="app-menu-item" onClick={() => toggleModal('feedback', true)}>
            Send Feedback
          </button>
          <button 
            className="app-menu-item with-dot" 
            onClick={() => toggleModal('notices', true)}
          >
            Notices
            {notices.length > 0 && <div className="yellow-dot-small" />}
          </button>
        </div>
      )}

      {/* Update Modal */}
      {modals.update && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Updates Available!</h3>
            {updateInfo.notes.length > 0 ? (
              updateInfo.notes.map((note) => (
                <div key={note.version} className="version-note">
                  <h4>Version {note.version} ({note.releaseDate})</h4>
                  <ul>
                    {note.notes.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p>No new version notes found.</p>
            )}
            <div className="modal-buttons">
              <button onClick={handleUpdate}>Install Update</button>
              <button onClick={() => toggleModal('update', false)}>Later</button>
            </div>
            <button 
              className="modal-close-button" 
              onClick={() => toggleModal('update', false)}
              aria-label="Close update modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {modals.about && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>About App</h3>
            <p>Your application description here.</p>
            <p><strong>Current Version:</strong> {CURRENT_VERSION}</p>
            <button 
              className="modal-close-button" 
              onClick={() => toggleModal('about', false)}
              aria-label="Close about modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {modals.privacy && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Privacy Policy</h3>
            <p>Your privacy policy content here.</p>
            <button 
              className="modal-close-button" 
              onClick={() => toggleModal('privacy', false)}
              aria-label="Close privacy modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {modals.feedback && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Send Feedback</h3>
            <p>Contact us at: <a href="mailto:feedback@example.com">feedback@example.com</a></p>
            <button 
              className="modal-close-button" 
              onClick={() => toggleModal('feedback', false)}
              aria-label="Close feedback modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Notices Modal */}
      {modals.notices && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Notices</h3>
            {notices.length > 0 ? (
              notices.map((notice) => (
                <div key={notice.id} className="notice-item">
                  <h4>{notice.title}</h4>
                  <p>{notice.content}</p>
                </div>
              ))
            ) : (
              <p>No current notices.</p>
            )}
            <button 
              className="modal-close-button" 
              onClick={() => toggleModal('notices', false)}
              aria-label="Close notices modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppFAB;