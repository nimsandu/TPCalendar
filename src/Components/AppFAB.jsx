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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
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

  // IMPROVED UPDATE HANDLER
  const handleUserUpdate = async () => {
    // If no updates are available, just close the modal
    if (!updateInfo.available) {
      toggleModal('update', false);
      return;
    }
    
    try {
      // Close the update modal first
      toggleModal('update', false);
      
      // Show updating state
      setIsUpdating(true);
      
      // Update the stored version before reload
      const latestVersion = updateInfo.notes.length > 0 
        ? updateInfo.notes[0].version 
        : CURRENT_VERSION;
      
      localStorage.setItem('appVersion', latestVersion);
      
      // Set a flag that we're in the middle of an update
      sessionStorage.setItem('app_updating', 'true');
      
      // Different handling based on service worker state
      if (registration?.waiting) {
        // Create a promise that resolves when the controller changes
        const controllerChangePromise = new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
        
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Wait for the controller change (with a timeout)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update timeout')), 5000)
        );
        
        await Promise.race([controllerChangePromise, timeoutPromise]);
        
        // Reload the page
        window.location.reload();
      } else {
        // Use the update function from the hook
        await updateServiceWorker(true); // true = skip waiting
        
        // Reload after a short delay to ensure the new SW is active
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Update failed:', error);
      // Reset updating state
      setIsUpdating(false);
      sessionStorage.removeItem('app_updating');
      
      // Show error message
      setShowUpdateSuccess({ success: false, message: 'Update failed. Please try again.' });
      setTimeout(() => setShowUpdateSuccess(false), 3000);
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

  // Close the update success message
  const closeUpdateSuccess = () => {
    setShowUpdateSuccess(false);
  };

  // VERSION EFFECT - On component mount
  useEffect(() => {
    // Check if we're returning from an update
    const wasUpdating = sessionStorage.getItem('app_updating') === 'true';
    if (wasUpdating) {
      // Clear the flag
      sessionStorage.removeItem('app_updating');
      // Show success message
      setShowUpdateSuccess({ 
        success: true, 
        message: 'App successfully updated to the latest version!' 
      });
      setTimeout(() => setShowUpdateSuccess(false), 5000);
    }
    
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
    <>
      {/* Update overlay - shown during updates */}
      {isUpdating && (
        <div className="update-overlay">
          <div className="update-modal">
            <div className="spinner"></div>
            <h3>Updating App</h3>
            <p>Please wait while we install the latest version...</p>
          </div>
        </div>
      )}
      
      {/* Update success message */}
      {showUpdateSuccess && (
        <div className="update-toast-container">
          <div className={`update-toast ${showUpdateSuccess.success ? 'success' : 'error'}`}>
            <div className="update-toast-icon">
              {showUpdateSuccess.success ? '✓' : '✕'}
            </div>
            <div className="update-toast-message">
              {showUpdateSuccess.message}
            </div>
            <button className="update-toast-close" onClick={closeUpdateSuccess}>
              &times;
            </button>
          </div>
        </div>
      )}
    
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
                <div className="checking-updates">
                  <div className="spinner-small"></div>
                  <p>Checking for updates...</p>
                </div>
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
                    <button 
                      className="primary-button" 
                      onClick={handleUserUpdate}
                      disabled={isUpdating}
                    >
                      Install Update Now
                    </button>
                    <button 
                      className="secondary-button"
                      onClick={() => toggleModal('update', false)}
                      disabled={isUpdating}
                    >
                      Remind Me Later
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="up-to-date">
                    <span className="checkmark">✓</span>
                    <p>Your app is up to date!</p>
                  </div>
                  <p><strong>Current Version:</strong> {CURRENT_VERSION}</p>
                  <div className="modal-buttons">
                    <button 
                      className="secondary-button" 
                      onClick={checkForUpdates}
                    >
                      Check Again
                    </button>
                    <button 
                      className="secondary-button"
                      onClick={() => toggleModal('update', false)}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
              
              <button 
                className="modal-close-button" 
                onClick={() => toggleModal('update', false)}
                aria-label="Close update modal"
                disabled={isUpdating}
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
    </>
  );
};

export default AppFAB;