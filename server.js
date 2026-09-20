const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, '../client', filePath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.ico': 'image/x-icon'
  };

  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocket.Server({ server });

// rooms: { roomId: { clients: Set<ws>, host: ws|null } }
const rooms = {};

function getRoomId(ws) {
  for (const [id, room] of Object.entries(rooms)) {
    if (room.clients.has(ws)) return id;
  }
  return null;
}

function broadcast(roomId, data, excludeWs = null) {
  const room = rooms[roomId];
  if (!room) return;
  const msg = JSON.stringify(data);
  room.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastRoomInfo(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const members = [];
  room.clients.forEach(c => {
    if (c.info) members.push({ name: c.info.name, isHost: c === room.host });
  });
  broadcast(roomId, { type: 'room_info', members, count: members.length });
  // Also send to all including self
  room.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify({ type: 'room_info', members, count: members.length }));
    }
  });
}

wss.on('connection', (ws) => {
  ws.info = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'join': {
        const roomId = msg.room || 'default';
        const name = (msg.name || 'بینونده').slice(0, 30);

        if (!rooms[roomId]) {
          rooms[roomId] = { clients: new Set(), host: null };
        }
        const room = rooms[roomId];
        room.clients.add(ws);
        ws.info = { name, roomId };

        const isHost = room.clients.size === 1;
        if (isHost) room.host = ws;

        ws.send(JSON.stringify({
          type: 'joined',
          isHost,
          roomId,
          name
        }));

        broadcast(roomId, {
          type: 'chat',
          name: '📢 سیستم',
          text: `${name} وارد اتاق شد`,
          system: true,
          time: Date.now()
        }, ws);

        broadcastRoomInfo(roomId);
        break;
      }

      case 'chat': {
        const roomId = getRoomId(ws);
        if (!roomId || !ws.info) return;
        broadcast(roomId, {
          type: 'chat',
          name: ws.info.name,
          text: (msg.text || '').slice(0, 500),
          time: Date.now()
        }, ws);
        break;
      }

      case 'play':
      case 'pause':
      case 'seek': {
        const roomId = getRoomId(ws);
        if (!roomId) return;
        // Only host can control (or if no host)
        const room = rooms[roomId];
        if (room.host && room.host !== ws) return;
        broadcast(roomId, {
          type: msg.type,
          time: msg.time || 0,
          by: ws.info?.name
        }, ws);
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    const roomId = getRoomId(ws);
    if (!roomId) return;
    const room = rooms[roomId];
    room.clients.delete(ws);

    if (room.host === ws) {
      // Pass host to next member
      const next = [...room.clients][0];
      room.host = next || null;
      if (next) {
        next.send(JSON.stringify({ type: 'promoted', message: 'شما میزبان شدید' }));
      }
    }

    if (ws.info) {
      broadcast(roomId, {
        type: 'chat',
        name: '📢 سیستم',
        text: `${ws.info.name} اتاق رو ترک کرد`,
        system: true,
        time: Date.now()
      });
    }

    if (room.clients.size === 0) {
      delete rooms[roomId];
    } else {
      broadcastRoomInfo(roomId);
    }
  });

  ws.on('error', () => {});
});

server.listen(PORT, () => {
  console.log(`✅ SyncWatch running on port ${PORT}`);
});
