const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory message store with timestamps
let messages = [];

// Prune messages older than 20 minutes
function pruneOldMessages() {
    const now = Date.now();
    const twentyMinutes = 20 * 60 * 1000;
    messages = messages.filter(msg => now - msg.time <= twentyMinutes);
}

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send the last 20 mins of messages
    pruneOldMessages();
    socket.emit('chat history', messages);

    socket.on('chat message', (text) => {
        const msg = {
            id: socket.id,
            text,
            time: Date.now()
        };
        messages.push(msg);
        pruneOldMessages();
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
