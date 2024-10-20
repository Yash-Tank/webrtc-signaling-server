const express = require('express');
const cors = require('cors')
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // The origin of your frontend (React app)
      methods: ["GET", "POST"],
    },
  });
  

app.use(cors())

const PORT = process.env.PORT || 5000;

// Serve static files (React frontend will be here later)
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected: ', socket.id);

  // Listen for an offer and broadcast it to the other peer
  socket.on('offer', (offer) => {
    console.log('Received offer:', offer);
    socket.broadcast.emit('offer', offer);
  });

  // Listen for an answer and broadcast it to the other peer
  socket.on('answer', (answer) => {
    console.log('Received answer:', answer);
    socket.broadcast.emit('answer', answer);
  });

  // Listen for ICE candidates and broadcast them
  socket.on('ice-candidate', (candidate) => {
    console.log('Received ICE candidate:', candidate);
    socket.broadcast.emit('ice-candidate', candidate);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
