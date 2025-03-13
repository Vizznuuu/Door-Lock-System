import React, { useState, useEffect } from 'react';
import './App.css'; 
import axios from 'axios';
import { db } from './firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function App() {
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('1234'); // Default password
  const [lockStatus, setLockStatus] = useState('Locked');
  const [passwordVisible, setPasswordVisible] = useState(true); // State to control password input visibility
  const [logs, setLogs] = useState([]); // State to store unlock/lock logs
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); //New state for button disable

  const flaskServerUrl = 'http://192.168.137.225:5000'; // Replace <YOUR_RASPBERRY_PI_IP> with the Pi's IP address

  const getLocation = (callback) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const attempts = 3;

    const getLocationOnce = (attempt = 1) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          callback(latitude, longitude);
        },
        (error) => {
          console.error(`Error getting location attempt ${attempt}:`, error);
          if (attempt < attempts) {
            getLocationOnce(attempt + 1);
          } else {
            alert('Unable to retrieve accurate location. Please enable location services.');
          }
        },
        options
      );
    };

    getLocationOnce();
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      return response.data.display_name || 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Error retrieving address';
    }
  };

  const fetchLogs = async () => {
    const querySnapshot = await getDocs(collection(db, 'unlockLogs'));
    const logsData = querySnapshot.docs.map(doc => doc.data());
    logsData.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
    setLogs(logsData);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleUnlock = async () => {
    if (password === storedPassword) {
      setIsProcessing(true);
      try {
        const response = await axios.post(`${flaskServerUrl}/unlock`);
        if (response.data.status === 'Unlocked') {
          setLockStatus('Unlocked');
          setPassword('');
          setPasswordVisible(false);

          getLocation(async (latitude, longitude) => {
            const address = await getAddressFromCoordinates(latitude, longitude);

            try {
              await addDoc(collection(db, 'unlockLogs'), {
                action: 'Unlock',
                timestamp: new Date(),
                location: { latitude, longitude },
                address,
              });
              alert('Door Unlocked');
              fetchLogs();
            } catch (error) {
              console.error('Error logging unlock:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error unlocking door:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert('Incorrect Password');
    }
  };

  const handleLock = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post(`${flaskServerUrl}/lock`);
      if (response.data.status === 'Locked') {
        setLockStatus('Locked');
        setPasswordVisible(true);

        getLocation(async (latitude, longitude) => {
          const address = await getAddressFromCoordinates(latitude, longitude);

          try {
            await addDoc(collection(db, 'unlockLogs'), {
              action: 'Lock',
              timestamp: new Date(),
              location: { latitude, longitude },
              address,
            });
            alert('Door Locked');
            fetchLogs();
          } catch (error) {
            console.error('Error logging lock:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error locking door:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    if (oldPassword === storedPassword && newPassword) {
      const imageCaptured = await captureImage();
      getLocation(async (latitude, longitude) => {
        const address = await getAddressFromCoordinates(latitude, longitude);

        try {
          await addDoc(collection(db, 'unlockLogs'), {
            action: 'Password Changed',
            timestamp: new Date(),
            location: { latitude, longitude },
            address,
            image: imageCaptured,
          });

          setStoredPassword(newPassword);
          setOldPassword('');
          setNewPassword('');
          setShowChangePassword(false);
          alert('Password changed successfully');
          fetchLogs();
        } catch (error) {
          console.error('Error logging password change:', error);
        }
      });
    } else {
      alert('Incorrect old password or new password is invalid');
    }
  };

  const captureImage = async () => {
    return 'captured-image-placeholder';
  };

  return (
    <div className="App">
      <h1>Door Lock System</h1>
      <p>Status: {lockStatus}</p>

      {passwordVisible && (
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
      )}

      <button onClick={lockStatus === 'Locked' ? handleUnlock : handleLock} disabled={isProcessing}>
        {lockStatus === 'Locked' ? 'Unlock' : 'Lock'}
      </button>
      <button onClick={() => setShowChangePassword(true)}>Change Password</button>

      {showChangePassword && (
        <div>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter old password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <button onClick={handleChangePassword}>Submit</button>
          <button onClick={() => setShowChangePassword(false)}>Cancel</button>
        </div>
      )}

      <h2>Unlock/Lock Logs</h2>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Timestamp</th>
            <th>Location</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{log.action}</td>
              <td>{new Date(log.timestamp.seconds * 1000).toLocaleString()}</td>
              <td>Lat: {log.location.latitude}, Lon: {log.location.longitude}</td>
              <td>{log.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
