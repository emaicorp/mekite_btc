const app = require('./app'); // Import the app from app.js
const PORT = process.env.PORT || 5000;
const http = require('http');
const socketIo = require('socket.io');

// Create an HTTP server and attach the Express app
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
const io = socketIo(server);

let onlineUsers = {}; // An object to track online users

// Notify all admins when a user goes online
io.on('connection', (socket) => {
  socket.on('userOnline', (userId) => {
    // Mark the user as online
    onlineUsers[userId] = true;

    // Emit a notification to all admins (you can adjust this part as needed)
    io.emit('notification', { message: `User ${userId} is online` });

    console.log(`User ${userId} is online.`);
  });

  socket.on('disconnect', () => {
    // Clean up when a user disconnects
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }
  });
});

// Start the server with socket.io
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
