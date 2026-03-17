// Client-side Javascript logic
document.addEventListener('DOMContentLoaded', () => {
  // === DOM Elements ===
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  
  // Auth Elements
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authError = document.getElementById('auth-error');
  
  // App Elements
  const currentUsername = document.getElementById('current-username');
  const logoutBtn = document.getElementById('logout-btn');
  const usersList = document.getElementById('users-list');
  const chattingWith = document.getElementById('chatting-with');
  const messagesContainer = document.getElementById('messages-container');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const callActions = document.getElementById('call-actions');
  const audioCallBtn = document.getElementById('audio-call-btn');
  const videoCallBtn = document.getElementById('video-call-btn');
  
  // Call Elements
  const callOverlay = document.getElementById('call-overlay');
  const localVideo = document.getElementById('local-video');
  const remoteVideo = document.getElementById('remote-video');
  const callStatus = document.getElementById('call-status');
  const endCallBtn = document.getElementById('end-call-btn');
  const incomingCallModal = document.getElementById('incoming-call-modal');
  const callerName = document.getElementById('caller-name');
  const acceptCallBtn = document.getElementById('accept-call-btn');
  const rejectCallBtn = document.getElementById('reject-call-btn');

  // === State ===
  let currentUser = null;
  let selectedUser = null;
  let socket = null;
  let onlineUsersMap = [];
  
  // WebRTC State
  let peer = null;
  let localStream = null;
  let incomingCallData = null;

  // === Check Auth Status on Load ===
  checkAuth();

  // === Auth Event Listeners ===
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      handleAuthSuccess(data);
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      handleAuthSuccess(data);
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    if (socket) socket.disconnect();
    
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
    localStorage.removeItem('user');
  });

  // === Auth Helpers ===
  function handleAuthSuccess(userData) {
    currentUser = userData;
    localStorage.setItem('user', JSON.stringify(userData));
    initApp();
  }

  function checkAuth() {
    // Basic check against local storage. If not really valid, API calls will fail later.
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      initApp();
    }
  }

  // === App Initialization ===
  function initApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    currentUsername.textContent = currentUser.username;
    
    initSocket();
    fetchUsers();
  }

  // === Socket Initialization ===
  function initSocket() {
    socket = io();
    
    socket.emit('register', currentUser._id);
    
    socket.on('onlineUsers', (users) => {
      onlineUsersMap = users;
      renderUsersList(); // re-render to update dot indicators
    });
    
    socket.on('receiveMessage', (message) => {
      if (selectedUser && message.sender === selectedUser._id) {
        appendMessage(message.text, 'received');
        scrollToBottom();
      }
    });

    // WebRTC Signaling Events
    socket.on('callUser', (data) => {
      console.log('Incoming call', data);
      incomingCallData = data;
      callerName.textContent = `Incoming call from ${data.name}`;
      incomingCallModal.style.display = 'block';
    });

    socket.on('callAccepted', (signal) => {
      console.log('Call accepted', signal);
      callStatus.textContent = "Connected";
      peer.signal(signal);
    });

    socket.on('callEnded', () => {
      endCallCleanup();
    });
  }

  // === Chat Logic ===
  async function fetchUsers() {
    try {
      const res = await fetch('/api/chat/users');
      const users = await res.json();
      
      window.cachedUsers = users; 
      renderUsersList();
    } catch (err) {
      console.error("Failed fetching users", err);
    }
  }

  function renderUsersList() {
    const users = window.cachedUsers || [];
    usersList.innerHTML = '';
    
    users.forEach(user => {
      const li = document.createElement('li');
      const isOnline = onlineUsersMap.includes(user._id);
      
      li.innerHTML = `
        <div class="user-contact-inner">
          <div class="profile-avatar">👤</div>
          <div class="user-contact-info">
            <span class="user-contact-name">${user.username}</span>
            <span class="status-indicator ${isOnline ? 'online' : ''}">${isOnline ? 'online' : 'offline'}</span>
          </div>
        </div>
      `;
      
      if (selectedUser && selectedUser._id === user._id) {
        li.classList.add('active');
      }
      
      li.addEventListener('click', () => selectUser(user));
      usersList.appendChild(li);
    });
  }

  async function selectUser(user) {
    selectedUser = user;
    renderUsersList();
    
    document.getElementById('chat-header-info').style.visibility = 'visible';
    chattingWith.textContent = user.username;
    
    const isOnline = onlineUsersMap.includes(user._id);
    document.getElementById('chatting-status').textContent = isOnline ? 'online' : 'offline';
    
    messageForm.style.display = 'flex';
    callActions.style.display = 'flex';
    
    // Fetch generic history
    try {
      const res = await fetch(`/api/chat/messages/${user._id}`);
      const messages = await res.json();
      
      messagesContainer.innerHTML = '';
      messages.forEach(msg => {
        const type = msg.sender === currentUser._id ? 'sent' : 'received';
        appendMessage(msg.text, type, new Date(msg.createdAt));
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed fetching messages', err);
    }
  }

  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !selectedUser) return;
    
    // Construct message
    const msgData = {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text: text
    };
    
    socket.emit('sendMessage', msgData);
    appendMessage(text, 'sent', new Date());
    scrollToBottom();
    
    messageInput.value = '';
  });

  function appendMessage(text, type, dateObj = new Date()) {
    const div = document.createElement('div');
    div.classList.add('message', type);
    
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
      ${text}
      <span class="message-time">${timeString}</span>
    `;
    messagesContainer.appendChild(div);
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // === WebRTC Logic ===
  
  // Initiate Video Call
  videoCallBtn.addEventListener('click', () => initiateCall(true));
  // Initiate Audio Call
  audioCallBtn.addEventListener('click', () => initiateCall(false));

  async function initiateCall(videoEnabled) {
    if (!selectedUser) return;
    
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: true });
      localVideo.srcObject = localStream;
      localVideo.style.display = videoEnabled ? 'block' : 'none';
      remoteVideo.style.display = videoEnabled ? 'block' : 'none';
      
      document.getElementById('call-overlay-name').textContent = `Calling ${selectedUser.username}`;
      callOverlay.style.display = 'flex';
      callStatus.textContent = "Connecting...";
      
      peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: localStream
      });
      
      peer.on('signal', data => {
        socket.emit('callUser', {
          userToCall: selectedUser._id,
          signalData: data,
          from: currentUser._id,
          name: currentUser.username
        });
      });
      
      peer.on('stream', stream => {
        remoteVideo.srcObject = stream;
      });
      
      peer.on('connect', () => {
         callStatus.textContent = "Connected";
      });
      
      peer.on('close', () => endCallCleanup());
      
    } catch (err) {
      console.error('Failed to get media devices', err);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  }

  // Incoming Call Logic
  acceptCallBtn.addEventListener('click', async () => {
    if (!incomingCallData) return;
    incomingCallModal.style.display = 'none';
    
    try {
      // Typically accept call asks for video based on what type of call it was, we'll try to get both initially
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => 
         navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      );
      
      const hasVideo = localStream.getVideoTracks().length > 0;
      localVideo.srcObject = localStream;
      localVideo.style.display = hasVideo ? 'block' : 'none';
      remoteVideo.style.display = hasVideo ? 'block' : 'none';
      
      document.getElementById('call-overlay-name').textContent = incomingCallData.name;
      callOverlay.style.display = 'flex';
      callStatus.textContent = "Connecting...";
      
      peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: localStream
      });
      
      peer.on('signal', data => {
        socket.emit('answerCall', { signal: data, to: incomingCallData.from });
      });
      
      peer.on('stream', stream => {
        remoteVideo.srcObject = stream;
      });
      
      peer.on('connect', () => {
         callStatus.textContent = "Connected";
      });
      
      peer.on('close', () => endCallCleanup());
      
      peer.signal(incomingCallData.signal);
      
    } catch (err) {
      console.error("Failed answering call", err);
    }
  });

  rejectCallBtn.addEventListener('click', () => {
    incomingCallModal.style.display = 'none';
    socket.emit('endCall', { to: incomingCallData.from });
    incomingCallData = null;
  });

  endCallBtn.addEventListener('click', () => {
    const to = incomingCallData ? incomingCallData.from : (selectedUser ? selectedUser._id : null);
    if (to) {
      socket.emit('endCall', { to });
    }
    endCallCleanup();
  });

  function endCallCleanup() {
    callOverlay.style.display = 'none';
    if (peer) {
      peer.destroy();
      peer = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    incomingCallData = null;
    callStatus.textContent = "Call Ended";
  }
});
