require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Render frontend
app.get('/', (req, res) => {
  res.render('index');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

require('./sockets/socketHandler')(io);

const port = process.env.PORT || 3005;
server.listen(port, () => {
  console.log("server started at port " + port);
  connectDB();
});
