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

  // CUSTOM SERVICE WORKER REGISTRATION
  const { 
    updateServiceWorker,
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    registration
  } = useRegisterSW({
    onRegistered(r) {
      // Skip the onNeedRefresh hook by setting immediate to false
      // and registering our own update check
      if (!r) return;
      
      // Check for updates periodically but don't show default prompt
      setInterval(() => {
        console.log("Checking for updates...");
        setUpdateInfo(prev => ({ ...prev, checking: true }));
        r.update().then(() => {
          // Do the version check which will also check for service worker updates
          checkVersionUpdates();
        }).catch(err => {
          console.error("Update check failed:", err);
          setUpdateInfo(prev => ({ ...prev, checking: false }));
        });
      }, 60 * 60 * 1000); // Check every hour
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    }
  });

  // VERSION CHECK
  const checkVersionUpdates = async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, checking: true }));
      
      // First, check if there's a waiting service worker that indicates a new version
      const hasWaitingSW = registration?.waiting !== null;
      
      // Then check version notes
      let newVersions = [];
      try {
        const response = await fetch('/versionNotes.json?' + new Date().getTime()); // Add cache buster
        if (response.ok) {
          const notesData = await response.json();
          const storedVersion = localStorage.getItem('appVersion') || '0.0.0';
          
          // Only consider versions newer than our current one
          // Important fix: Compare against CURRENT_VERSION not just storedVersion
          newVersions = notesData.filter(note => 
            versionCompare(note.version, CURRENT_VERSION) > 0
          ).sort((a, b) => versionCompare(b.version, a.version));
        }
      } catch (error) {
        console.error('Version notes fetch failed:', error);
        // Continue execution even if version notes fail
      }
      
      // Set update info - only available if there's a new version or waiting SW
      const hasUpdate = newVersions.length > 0 || hasWaitingSW;
      console.log("Update status:", { 
        currentVersion: CURRENT_VERSION,
        hasWaitingSW, 
        notesLength: newVersions.length, 
        hasUpdate,
        newVersions
      });
      
      setUpdateInfo({
        available: hasUpdate,
        notes: newVersions,
        checking: false
      });
    } catch (error) {
      console.error('Version check error:', error);
      setUpdateInfo(prev => ({ ...prev, checking: false }));
    }
  };

  // Check for updates manually (can be triggered by user)
  const checkForUpdates = () => {
    // If already checking, don't start another check
    if (updateInfo.checking) return;
    
    if (registration) {
      setUpdateInfo(prev => ({ ...prev, checking: true }));
      registration.update()
        .then(() => {
          checkVersionUpdates();
        })
        .catch(error => {
          console.error('Update check failed:', error);
          setUpdateInfo(prev => ({ ...prev, checking: false }));
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
      // Show updating state
      setIsUpdating(true);
      
      // Update the stored version before reload
      const latestVersion = updateInfo.notes.length > 0 
        ? updateInfo.notes[0].version 
        : CURRENT_VERSION;
      
      localStorage.setItem('appVersion', latestVersion);
      
      // Set a flag that we're in the middle of an update
      sessionStorage.setItem('app_updating', 'true');
      
      // If there's a waiting service worker, activate it
      if (registration?.waiting) {
        // Create a promise that resolves when the controller changes
        const controllerChangePromise = new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
        
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        try {
          // Wait for the controller change (with a timeout)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Update timeout')), 5000)
          );
          
          await Promise.race([controllerChangePromise, timeoutPromise]);
        } catch (error) {
          console.warn("Controller change timeout, attempting reload anyway");
        }
        
        // Reload the page
        window.location.reload();
      } else {
        // No waiting service worker, just reload
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
      // Reset updating state
      setIsUpdating(false);
      sessionStorage.removeItem('app_updating');
      
      alert('The update failed. Please try again or reload the app manually.');
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
    // Check if we're returning from an update
    const wasUpdating = sessionStorage.getItem('app_updating') === 'true';
    if (wasUpdating) {
      // Clear the flag
      sessionStorage.removeItem('app_updating');
      // Show a success message
      setTimeout(() => {
        alert('App successfully updated to the latest version!');
      }, 500);
    }
    
    // Set the current version in local storage if not set or if newer
    const storedVersion = localStorage.getItem('appVersion');
    if (!storedVersion || versionCompare(CURRENT_VERSION, storedVersion) > 0) {
      localStorage.setItem('appVersion', CURRENT_VERSION);
    }
    
    // Initial version check on mount after a small delay
    // (to ensure service worker registration is complete)
    setTimeout(checkVersionUpdates, 1000);
  }, []);

  // Watch for registration changes
  useEffect(() => {
    if (registration) {
      // Check if there's a waiting service worker on registration change
      if (registration.waiting) {
        console.log("Detected waiting service worker");
        
        // Fix: Only set update available if the waiting service worker 
        // actually represents a new version (additional check)
        checkVersionUpdates();
      }
    }
  }, [registration]);

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

  // Reset the built-in PWA prompts - we'll handle them ourselves
  useEffect(() => {
    if (needRefresh) {
      console.log("needRefresh detected, handling manually");
      // Update our own state but reset the built-in one
      setNeedRefresh(false);
      checkVersionUpdates(); // Recheck since something triggered needRefresh
    }
    if (offlineReady) {
      // Just reset this one, we don't need to show anything
      setOfflineReady(false);
    }
  }, [needRefresh, offlineReady, setNeedRefresh, setOfflineReady]);

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