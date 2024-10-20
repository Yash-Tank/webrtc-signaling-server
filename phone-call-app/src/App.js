import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Connect to the signaling server

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('Idle');
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }, // STUN server
    ],
  };

  useEffect(() => {
    // Listen for WebRTC offers, answers, and ICE candidates
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleReceiveIceCandidate);

    return () => {
      // Cleanup socket listeners
      socket.off('offer', handleReceiveOffer);
      socket.off('answer', handleReceiveAnswer);
      socket.off('ice-candidate', handleReceiveIceCandidate);
    };
  }, []);

  const handleInputChange = (event) => {
    setPhoneNumber(event.target.value);
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current.srcObject = stream;
      setCallStatus('Microphone Accessed');
    } catch (error) {
      setCallStatus('Error accessing microphone');
    }
  };

  const setupPeerConnection = () => {
    peerConnectionRef.current = new RTCPeerConnection(servers);
  
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteStreamRef.current) {
        remoteStreamRef.current.srcObject = event.streams[0]; // Assign the received stream to the audio element
        remoteStreamRef.current.play(); // Ensure the audio element starts playing
      }
      console.log('Received remote stream:', event.streams[0]);
    };
  
    // Send ICE candidates to the other peer
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };
  };
  
  const startCall = async () => {
    setCallStatus(`Calling ${phoneNumber}...`);

    if (!peerConnectionRef.current) {
      setupPeerConnection(); // Ensure peer connection is set up
    }

    // Ensure tracks are only added once
    const localStream = localStreamRef.current.srcObject;
    if (localStream) {
      const senders = peerConnectionRef.current.getSenders();
      localStream.getTracks().forEach((track) => {
        if (!senders.find(sender => sender.track === track)) {
          peerConnectionRef.current.addTrack(track, localStream);
        }
      });
    }

    // Create offer and send it to the other peer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit('offer', offer);
  };

  const handleReceiveOffer = async (offer) => {
    if (!peerConnectionRef.current) {
      setupPeerConnection(); // Set up peer connection if not already done
    }

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

    // Ensure tracks are only added once
    const localStream = localStreamRef.current.srcObject;
    if (localStream) {
      const senders = peerConnectionRef.current.getSenders();
      localStream.getTracks().forEach((track) => {
        if (!senders.find(sender => sender.track === track)) {
          peerConnectionRef.current.addTrack(track, localStream);
        }
      });
    }

    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socket.emit('answer', answer);
  };

  const handleReceiveAnswer = async (answer) => {
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleReceiveIceCandidate = async (candidate) => {
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('Added ICE candidate:', candidate);
    } catch (error) {
      console.error('Error adding received ice candidate', error);
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      setCallStatus('Call Ended');
    }
  };

  return (
    <div className="App">
      <h1>Phone Call App</h1>
      <div className="call-dialer">
        <input
          type="tel"
          value={phoneNumber}
          onChange={handleInputChange}
          placeholder="Enter phone number"
        />
        <button onClick={startCall}>Call</button>
        <button className='hangUp' onClick={endCall}>Hang Up</button>
        <button onClick={getMedia}>Access Microphone</button>
      </div>
      <div className="call-status">
        <p>{callStatus}</p>
      </div>
      <audio ref={localStreamRef} autoPlay playsInline></audio>
      <audio ref={remoteStreamRef} autoPlay playsInline></audio>
    </div>
  );
}

export default App;
