import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../auth/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import {
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    orderBy,
    limit,
    writeBatch,
    query,
    serverTimestamp
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import defaultAvatar from '../images/avatar.png';
import './Backup.css';
import Loader from './Loader';
import CustomModal from '../components/CustomModal'; // Assuming you have a custom modal component

const Backup = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(true);
    const [lastBackupDate, setLastBackupDate] = useState("Never");
    const [lastImportDate, setLastImportDate] = useState("Never");
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [restoreError, setRestoreError] = useState('');
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [fileDataToRestore, setFileDataToRestore] = useState(null);
    const [poemCount, setPoemCount] = useState(0);
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState('');
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [showBackupWarning, setShowBackupWarning] = useState(false); // State for backup warning modal

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    console.error('User data not found');
                    navigate('/profile');
                }
            } else {
                setUser(null);
                navigate('/signin');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        const fetchLastBackupInfo = async () => {
            if (user?.uid && !passwordSubmitting && !downloading && !restoring) {
                try {
                    const backupsRef = collection(db, 'users', user.uid, 'backups');
                    const qBackup = query(backupsRef, orderBy('timestamp', 'desc'), limit(1));
                    const backupSnapshot = await getDocs(qBackup);
                    if (!backupSnapshot.empty) {
                        const lastBackup = backupSnapshot.docs[0].data().timestamp.toDate();
                        setLastBackupDate(lastBackup.toLocaleDateString() + ' ' + lastBackup.toLocaleTimeString());
                    } else {
                        setLastBackupDate("Never");
                    }

                    const importsRef = collection(db, 'users', user.uid, 'imports');
                    const qImport = query(importsRef, orderBy('timestamp', 'desc'), limit(1));
                    const importSnapshot = await getDocs(qImport);
                    if (!importSnapshot.empty) {
                        const lastImport = importSnapshot.docs[0].data().timestamp.toDate();
                        setLastImportDate(lastImport.toLocaleDateString() + ' ' + lastImport.toLocaleTimeString());
                    } else {
                        setLastImportDate("Never");
                    }
                } catch (error) {
                    console.error('Error fetching last backup/import info:', error);
                }
            }
        };
        fetchLastBackupInfo();
    }, [user, passwordSubmitting, downloading, restoring]);

    useEffect(() => {
        const fetchPoemCount = async () => {
            if (user?.uid && !isPasswordModalOpen && !passwordSubmitting && !downloading && !restoring) {
                try {
                    const poemsCollection = collection(db, 'users', user.uid, 'poems');
                    const poemsSnapshot = await getDocs(poemsCollection);
                    setPoemCount(poemsSnapshot.size);
                } catch (error) {
                    console.error('Error fetching poem count:', error);
                    setPoemCount(0);
                }
            } else {
                setPoemCount(0);
            }
        };
        fetchPoemCount();
    }, [user, isPasswordModalOpen, passwordSubmitting, downloading, restoring]);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSubmitting(true);
        try {
            await signInWithEmailAndPassword(auth, user.email, password);
            setIsPasswordModalOpen(false);
            setPassword('');
        } catch (error) {
            setPasswordError('Incorrect password');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const initiateDownloadBackup = () => {
        setShowBackupWarning(true);
    };

    const handleDownloadBackup = async () => {
        setShowBackupWarning(false);
        if (!user?.uid || downloading) return;

        setDownloading(true);
        setLastBackupDate("Just Now");

        try {
            const poemsCollection = collection(db, 'users', user.uid, 'poems');
            const poemsSnapshot = await getDocs(poemsCollection);
            const poemsData = poemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const backupObject = {
                poems: poemsData,
            };

            const jsonData = JSON.stringify(backupObject, null, 2);
            const filename = `${new Date().toISOString().slice(0, 10)}_Poem_Vault_backup_${userData.firstName}_${userData.lastName}.json`;
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            await addDoc(collection(db, 'users', user.uid, 'backups'), {
                timestamp: serverTimestamp(),
            });

            setSuccessMessage('Backup downloaded successfully!');
            setIsSuccessModalVisible(true);
            setTimeout(() => {
                setIsSuccessModalVisible(false);
            }, 1500);

        } catch (error) {
            console.error('Error downloading backup:', error);
            // Optionally handle error with a custom error message/modal
        } finally {
            setDownloading(false);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setRestoreError('');

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    setFileDataToRestore(data);
                    setIsRestoreConfirmOpen(true);
                } catch (error) {
                    setRestoreError('Invalid JSON file');
                    setFileDataToRestore(null);
                    setIsRestoreConfirmOpen(false);
                }
            };
            reader.onerror = () => {
                setRestoreError('Error reading the file');
                setFileDataToRestore(null);
                setIsRestoreConfirmOpen(false);
            };
            reader.readAsText(file);
        }
    };

    const handleConfirmRestore = async () => {
        setIsRestoreConfirmOpen(false);
        setRestoring(true);
        setRestoreError('');
        setLastImportDate("Just Now");

        if (!user?.uid || !fileDataToRestore?.poems) {
            setRestoring(false);
            setRestoreError('Invalid backup file or user not authenticated.');
            return;
        }

        try {
            const { poems: backupPoems } = fileDataToRestore;
            const poemsCollectionRef = collection(db, 'users', user.uid, 'poems');
            const existingPoemsSnapshot = await getDocs(poemsCollectionRef);
            const existingPoems = existingPoemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const batch = writeBatch(db);

            const existingPoemSet = new Set(existingPoems.map(poem => `${poem.title}__${poem.content}`));
            const importedPoemIds = new Set(); // To track IDs of imported poems

            console.log("Preparing to process backup poems:", backupPoems.length);

            for (const backupPoem of backupPoems) {
                const backupPoemKey = `${backupPoem.title}__${backupPoem.content}`;

                if (!existingPoemSet.has(backupPoemKey)) {
                    // This poem (based on title and content) does not exist currently
                    const newPoemRef = doc(poemsCollectionRef);
                    const timestampToUse = getTimestampForRestore(backupPoem.timestamp);

                    batch.set(newPoemRef, {
                        title: backupPoem.title || "",
                        content: backupPoem.content || "",
                        color: backupPoem.color || "",
                        backstory: backupPoem.backstory || "",
                        timestamp: timestampToUse,
                        imported: true,
                    });
                    importedPoemIds.add(newPoemRef.id);
                    console.log("Importing new poem:", backupPoem.title);
                } else {
                    console.log("Skipping existing poem:", backupPoem.title);
                }
            }

            console.log("Committing batch write...");
            await batch.commit();
            console.log("Batch write committed successfully.");

            await addDoc(collection(db, 'users', user.uid, 'imports'), {
                timestamp: serverTimestamp(),
                importedCount: importedPoemIds.size,
                totalBackupPoems: backupPoems.length,
            });

            setSuccessMessage(`Backup processed. ${importedPoemIds.size} new poems imported.`);
            setIsSuccessModalVisible(true);
            setTimeout(() => {
                setIsSuccessModalVisible(false);
            }, 2500);

        } catch (error) {
            console.error('Error restoring backup:', error);
            setRestoreError('Failed to process backup. Please try again.');
        } finally {
            setRestoring(false);
        }
    };

    const getTimestampForRestore = (timestamp) => {
        if (timestamp) {
            if (typeof timestamp === 'number') return new Date(timestamp);
            if (typeof timestamp === 'string') return new Date(timestamp);
            if (timestamp && typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds / 1000000));
        }
        return serverTimestamp();
    };

    if (loading || passwordSubmitting || downloading || restoring) {
        return <Loader message={passwordSubmitting ? "Verifying Password..." : downloading ? "Downloading Backup..." : restoring ? "Restoring Backup..." : "Loading..."} />;
    }

    if (!userData) {
        return <div>Error loading user data.</div>;
    }

    return (
        <div className="backup-page">
            {isPasswordModalOpen && (
                <div className="password-modal-overlay centered-modal">
                    <div className="password-modal">
                        <div className="modal-header">
                            <h2>Confirm Password</h2>
                            <Link to="/profile" className="modal-close-button">
                                <i className="fas fa-times"></i>
                            </Link>
                        </div>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                placeholder="Your Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {passwordError && <p className="error-message">{passwordError}</p>}
                            <button type="submit" disabled={passwordSubmitting}>
                                {passwordSubmitting ? 'Verifying...' : 'Verify'}
                            </button>
                        </form>
                        <div className="modal-footer">
                            <Link to="/profile" className="back-to-profile-link">
                                <i className="fas fa-arrow-left"></i> Back to Profile
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!isPasswordModalOpen && (
                <div className="backup-content centered-content">
                    <div className="backup-navigation">
                        <Link to="/profile" className="back-to-profile-button">
                            <i className="fas fa-arrow-left"></i> Back to Profile
                        </Link>
                    </div>

                    <div className="user-info-card">
                        <img
                            src={userData.avatar || defaultAvatar}
                            alt="User Avatar"
                            className="backup-avatar"
                        />
                        <div className="user-details">
                            <h2>{userData.firstName} {userData.lastName}</h2>
                            <p>Email: {user.email}</p>
                        </div>
                    </div>

                    <div className="backup-stats-card">
                        <p>Poem Count: {poemCount}</p>
                        <p>Last Backup Downloaded: {lastBackupDate}</p>
                        <p>Last Backup Imported: {lastImportDate}</p>
                    </div>

                    {isRestoreConfirmOpen && fileDataToRestore && (
                        <div className="confirmation-modal-overlay centered-modal">
                            <div className="confirmation-modal" style={{ textAlign: 'left' }}>
                                <h2>Confirm Restore</h2>
                                <p style={{ marginBottom: '15px' }}>Here's what to expect:</p>
                                <ul style={{ listStyleType: 'disc', paddingLeft: '25px', marginBottom: '20px' }}>
                                    <li>Repeated Creations with <span className="bold">exact same title and content</span> will <span className="bold">NOT be imported again</span>.</li>
                                    <li>Any creations <span className="bold">since this backup</span> will <span className="bold">NOT be Affected</span>.</li>
                                    <li>Only <span className="bold">new poems</span> from the backup will be Restored.</li>
                                </ul>
                                <div className="confirmation-buttons" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button onClick={handleConfirmRestore} disabled={restoring} className="custom-modal-confirm-button">
                                        {restoring ? 'Restoring...' : 'Yes, Proceed'}
                                    </button>
                                    <button onClick={() => setIsRestoreConfirmOpen(false)} disabled={restoring} className="custom-modal-cancel-button">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {restoreError && <p className="error-message">{restoreError}</p>}

                    <div className="backup-actions">
                        <button className="download-button" onClick={initiateDownloadBackup} disabled={downloading}>
                            {downloading ? 'Downloading...' : 'Download Backup'}
                        </button>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                        />
                        <button className="restore-button" onClick={triggerFileUpload} disabled={restoring}>
                            {restoring ? 'Restoring...' : 'Restore Backup'}
                        </button>
                    </div>
                </div>
            )}

            {isSuccessModalVisible && (
                <div className="success-modal-overlay centered-modal">
                    <div className="success-modal">
                        <p>{successMessage}</p>
                    </div>
                </div>
            )}

            {/* Backup Warning Modal */}
            <CustomModal
                isOpen={showBackupWarning}
                onClose={() => setShowBackupWarning(false)}
                title="Important Security Warning"
                content="Your backup will be downloaded in an <span class='bold'>unencrypted</span> format. This means the data will not be protected if accessed by unauthorized individuals. Be mindful of where you save this file. Are you sure you want to continue?"
                onConfirm={handleDownloadBackup}
                confirmText="Proceed with Download"
                cancelText="Cancel"
            />
        </div>
    );
};

export default Backup;