# Real-time Chat App

A modern, responsive real-time chat application with integrated audio and video calling features. This project leverages the power of Node.js, Express, Socket.io, and WebRTC to provide a seamless communication experience.

## 🚀 Features

- **Real-time Messaging**: Instant text communication powered by Socket.io.
- **Audio/Video Calls**: Peer-to-peer calling functionality using WebRTC.
- **User Authentication**: Secure signup and login with JWT and bcryptjs.
- **Online Presence**: Real-time status indicators showing which users are online.
- **Message Status**: Delivered and read receipts for all messages.
- **Responsive Design**: Premium, glassmorphic UI that works beautifully on mobile and desktop.
- **Persistent Storage**: All messages and user data are stored in a MongoDB database.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Embedded JavaScript templates), Vanilla CSS
- **Real-time**: Socket.io
- **Communication**: WebRTC
- **Database**: MongoDB (via Mongoose)
- **Security**: JWT (JSON Web Tokens), bcryptjs
- **Dev Tools**: Nodemon

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Real-time Chat App"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=3005
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the application**:
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

## 🖥️ Usage

1. Open your browser and navigate to `http://localhost:3005`.
2. Register a new account or log in with existing credentials.
3. Start chatting with online users in real-time.
4. Use the call buttons to initiate audio or video sessions.

## 📄 License

This project is licensed under the ISC License.
