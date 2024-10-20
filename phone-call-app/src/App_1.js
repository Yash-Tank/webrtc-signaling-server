import React, { useState, useRef } from 'react';

function App() {
  const [callStatus, setCallStatus] = useState('Idle');
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const servers = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302', // Google's public STUN server
      },
    ],
  };

  const handleSuccess = (stream) => {
    localStreamRef.current.srcObject = stream; // Set stream to the audio element
    peerConnectionRef.current = new RTCPeerConnection(servers);
    peerConnectionRef.current.addStream(stream);

    // Handle incoming ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate to signaling server (to be implemented)
        console.log('New ICE candidate:', event.candidate);
      }
    };

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log('Remote stream received:', remoteStream);
    };

    setCallStatus('Ready to call');
  };

  const startCall = () => {
    setCallStatus('Calling...');
    // Exchange SDP with signaling server (to be implemented)
  };

  const endCall = () => {
    peerConnectionRef.current.close();
    setCallStatus('Call Ended');
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      handleSuccess(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallStatus('Error accessing microphone');
    }
  };

  return (
    <div className="App">
      <h1>WebRTC Phone Call App</h1>
      <div className="call-status">
        <p>{callStatus}</p>
      </div>
      <div className="call-controls">
        <button onClick={getMedia}>Access Microphone</button>
        <button onClick={startCall}>Start Call</button>
        <button onClick={endCall}>End Call</button>
      </div>
      <audio ref={localStreamRef} autoPlay playsInline></audio>
    </div>
  );
}

export default App;
