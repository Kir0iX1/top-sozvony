const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // В продакшене нужно указать реальный адрес (например, GitHub Pages)
    methods: ['GET', 'POST']
  }
});

// Хранилище комнат: roomId -> { socketId: { userName, avatarUrl, isHost } }
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName, avatarUrl }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }

    // Первый зашедший - организатор
    const isHost = Object.keys(rooms[roomId]).length === 0;

    rooms[roomId][socket.id] = {
      id: socket.id,
      userName,
      avatarUrl,
      isHost
    };

    // Сообщаем всем в комнате, кто сейчас в ней находится (включая нового пользователя)
    io.to(roomId).emit('room-users', Object.values(rooms[roomId]));

    // Сообщаем остальным, что зашел новый пользователь (для WebRTC)
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      userName,
      avatarUrl
    });

    // WebRTC Signaling
    socket.on('offer', (payload) => {
      io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
      io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload) => {
      io.to(payload.target).emit('ice-candidate', payload);
    });

    // Чат
    socket.on('send-message', (message) => {
      // Пересылаем сообщение всем в комнате, кроме отправителя
      socket.to(roomId).emit('receive-message', {
        id: Date.now(),
        sender: userName || 'Гость',
        text: message,
        isSelf: false
      });
    });

    // Обработка отключения
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (rooms[roomId]) {
        delete rooms[roomId][socket.id];
        // Если комната пуста, удаляем ее
        if (Object.keys(rooms[roomId]).length === 0) {
          delete rooms[roomId];
        } else {
          // Если отключился организатор, можно передать права (пока пропускаем)
          io.to(roomId).emit('user-left', socket.id);
          io.to(roomId).emit('room-users', Object.values(rooms[roomId]));
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
