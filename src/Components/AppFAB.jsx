import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLocation } from 'react-router-dom';
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
  // ROUTE DETECTION
  const location = useLocation();
  const isRoot = location.pathname === '/';

  // STATE
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ 
    available: false, 
    notes: [],
    checking: false
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

  // MODIFIED SERVICE WORKER SETUP
  const { 
    needRefresh: [needRefresh, setNeedRefresh], 
    updateServiceWorker,
    registration 
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      if (!r) return;
      // Check for updates hourly, but don't apply them automatically
      setInterval(() => {
        console.log("Checking for updates...");
        setUpdateInfo(prev => ({ ...prev, checking: true }));
        r.update();
      }, 60 * 60 * 1000);
    },
    onNeedRefresh: () => {
      // Just flag that an update is available, but don't refresh automatically
      console.log("Update available!");
      checkVersionUpdates();
      // Don't call updateServiceWorker() here - let the user decide
    },
  });

  // VERSION CHECK
  const checkVersionUpdates = async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, checking: true }));
      
      const response = await fetch('/versionNotes.json');
      if (!response.ok) throw new Error('Failed to fetch version notes');
      
      const notesData = await response.json();
      const storedVersion = localStorage.getItem('appVersion') || '0.0.0';
      
      const newVersions = notesData.filter(note => 
        versionCompare(note.version, storedVersion) > 0
      );

      // Set update info but don't auto-update
      setUpdateInfo({
        available: newVersions.length > 0 || needRefresh,
        notes: newVersions.sort((a, b) => versionCompare(b.version, a.version)),
        checking: false
      });
    } catch (error) {
      console.error('Version check failed:', error);
      setUpdateInfo(prev => ({ ...prev, checking: false }));
    }
  };

  // Check for updates manually (can be triggered by user)
  const checkForUpdates = () => {
    // If already checking, don't start another check
    if (updateInfo.checking) return;
    
    if (registration) {
      setUpdateInfo(prev => ({ ...prev, checking: true }));
      registration.update().then(() => {
        checkVersionUpdates();
      });
    } else {
      checkVersionUpdates();
    }
  };

  // MODIFIED UPDATE HANDLER - Only called when user clicks "Install Update Now"
  const handleUserUpdate = async () => {
    // If no updates are available, just close the modal
    if (!updateInfo.available) {
      toggleModal('update', false);
      return;
    }
    
    try {
      // If there's a waiting service worker, activate it
      if (registration?.waiting) {
        // Set up the reload listener before sending the message
        const reloadListener = () => {
          console.log("Controller changed, reloading page...");
          localStorage.setItem('appVersion', CURRENT_VERSION);
          window.location.reload();
        };
        
        // Add listener for when the new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', reloadListener, { once: true });
        
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Otherwise use the update function from the hook
        await updateServiceWorker(true); // true = skip waiting
        localStorage.setItem('appVersion', CURRENT_VERSION);
      }
      
      // Close the modal
      toggleModal('update', false);
    } catch (error) {
      console.error('Update failed:', error);
      // Don't force reload on error
      toggleModal('update', false);
    }
  };

  // MODAL TOGGLE
  const toggleModal = (modalName, state) => {
    // If opening the update modal, check for updates first
    if (modalName === 'update' && state === true) {
      checkForUpdates();
    }
    
    setModals(prev => ({ ...prev, [modalName]: state }));
    setShowAppMenu(false);
  };

  // VERSION EFFECT - On component mount
  useEffect(() => {
    // Set the current version in local storage if not set or if newer
    const storedVersion = localStorage.getItem('appVersion');
    if (!storedVersion || versionCompare(CURRENT_VERSION, storedVersion) > 0) {
      localStorage.setItem('appVersion', CURRENT_VERSION);
    }
    
    // Initial version check on mount
    checkVersionUpdates();
  }, []);

  // Watch for needRefresh changes and update our updateInfo state
  useEffect(() => {
    if (needRefresh) {
      setUpdateInfo(prev => ({
        ...prev,
        available: true
      }));
    }
  }, [needRefresh]);

  // Check for updates when the app becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersionUpdates();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className={`app-fab-container ${isRoot ? 'root-position' : 'other-position'}`}>
      <button 
        className="app-fab" 
        onClick={() => setShowAppMenu(!showAppMenu)}
        aria-label="Open app menu"
      >
        {updateInfo.available && <div className="red-dot" />} 🔔
      </button>
  
      {showAppMenu && (
        <div className="app-menu">
          <button 
            className={`app-menu-item ${updateInfo.available ? 'with-dot' : ''}`}
            onClick={() => toggleModal('update', true)}
          >
            Check for Updates
            {updateInfo.available && <div className="red-dot-small" />}
          </button>
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
            <h3>Updates</h3>
            
            {updateInfo.checking ? (
              <p>Checking for updates...</p>
            ) : updateInfo.available ? (
              <>
                <h4>New Updates Available!</h4>
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
                  <p>A new version of the app is available.</p>
                )}
                <div className="modal-buttons">
                  <button onClick={handleUserUpdate}>Install Update Now</button>
                  <button onClick={() => toggleModal('update', false)}>Remind Me Later</button>
                </div>
              </>
            ) : (
              <>
                <p>Your app is up to date!</p>
                <p><strong>Current Version:</strong> {CURRENT_VERSION}</p>
                <div className="modal-buttons">
                  <button onClick={checkForUpdates}>Check Again</button>
                  <button onClick={() => toggleModal('update', false)}>Close</button>
                </div>
              </>
            )}
            
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