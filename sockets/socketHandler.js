const Message = require('../models/Message');

const users = {}; // Maps socket.id to userId
const onlineUsers = {}; // Maps userId to socket.id

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Register user
    socket.on('register', (userId) => {
      // Clean up previous socket if user reconnects from same browser
      const previousSocketId = onlineUsers[userId];
      if (previousSocketId && previousSocketId !== socket.id) {
        delete users[previousSocketId];
      }
      
      users[socket.id] = userId;
      onlineUsers[userId] = socket.id;
      io.emit('onlineUsers', Object.keys(onlineUsers));
    });

    // Handle text messages
    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, text } = data;
      
      try {
        // Save to DB
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text
        });

        // Send to receiver if online
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', message);
        }
      } catch (err) {
        console.error('Error saving message', err);
      }
    });

    // WebRTC Signaling
    socket.on('callUser', (data) => {
      const { userToCall, signalData, from, name } = data;
      const receiverSocketId = onlineUsers[userToCall];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('callUser', { signal: signalData, from, name });
      }
    });

    socket.on('answerCall', (data) => {
      const { to, signal } = data;
      const callerSocketId = onlineUsers[to];
      if (callerSocketId) {
        io.to(callerSocketId).emit('callAccepted', signal);
      }
    });
    
    socket.on('endCall', (data) => {
      const { to } = data;
      const callerSocketId = onlineUsers[to];
      if (callerSocketId) {
        io.to(callerSocketId).emit('callEnded');
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = users[socket.id];
      if (userId) {
        delete onlineUsers[userId];
        delete users[socket.id];
        io.emit('onlineUsers', Object.keys(onlineUsers));
      }
      console.log('User disconnected:', socket.id);
    });
  });
};
