const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 9191;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://deepak:Deepak9279@ac-vljdacg-shard-00-00.tneo3dq.mongodb.net:27017,ac-vljdacg-shard-00-01.tneo3dq.mongodb.net:27017,ac-vljdacg-shard-00-02.tneo3dq.mongodb.net:27017/kargarsetu?ssl=true&replicaSet=atlas-k0b9n3-shard-0&authSource=admin&appName=Cluster0";

let db = null;
let usersCollection = null;
let chatsCollection = null;

const INITIAL_ARTISANS = [
  {
    id: "usr_artisan_ramesh",
    personalId: "ART-1042",
    name: "Ramesh Kumar",
    email: "ramesh.pottery@gmail.com",
    role: "artisan",
    phone: "9810234567",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    bio: "Master terracotta potter from Gorakhpur with 20+ years of clay pottery experience.",
    followersCount: 128,
    followingCount: 34,
    createdAt: 1700000000000,
  },
  {
    id: "usr_artisan_sunita",
    personalId: "ART-2891",
    name: "Sunita Devi",
    email: "sunita.madhubani@gmail.com",
    role: "artisan",
    phone: "9820345678",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    bio: "Traditional Madhubani folk artist creating authentic handmade Mithila paintings.",
    followersCount: 215,
    followingCount: 42,
    createdAt: 1700100000000,
  },
  {
    id: "usr_artisan_rajesh",
    personalId: "ART-3574",
    name: "Rajesh Sharma",
    email: "rajesh.bluepottery@gmail.com",
    role: "artisan",
    phone: "9830456789",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    bio: "Jaipur Blue Pottery artisan specializing in glazed ceramic plates, vases & home decor.",
    followersCount: 194,
    followingCount: 29,
    createdAt: 1700200000000,
  },
  {
    id: "usr_artisan_meenakshi",
    personalId: "ART-4920",
    name: "Meenakshi Sundaram",
    email: "meenakshi.handloom@gmail.com",
    role: "artisan",
    phone: "9840567890",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    bio: "Master Kanchipuram handloom weaver creating pure silk sarees & heritage textiles.",
    followersCount: 310,
    followingCount: 56,
    createdAt: 1700300000000,
  },
  {
    id: "usr_artisan_vikram",
    personalId: "ART-6105",
    name: "Vikramaditya Singh",
    email: "vikram.dhokra@gmail.com",
    role: "artisan",
    phone: "9850678901",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
    bio: "Bastar tribal Dhokra brass metal casting craftsman preserving ancient lost-wax art.",
    followersCount: 167,
    followingCount: 21,
    createdAt: 1700400000000,
  },
  {
    id: "usr_member_priya",
    personalId: "USR-7821",
    name: "Priya Verma",
    email: "priya.verma@gmail.com",
    role: "user",
    phone: "9860789012",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    bio: "Indian handicraft collector & patron of authentic indigenous cultural arts.",
    followersCount: 89,
    followingCount: 74,
    createdAt: 1700500000000,
  },
  {
    id: "usr_member_amit",
    personalId: "USR-8934",
    name: "Amit Patel",
    email: "amit.patel@gmail.com",
    role: "user",
    phone: "9870890123",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
    bio: "Art & design enthusiast discovering authentic handcrafted Indian treasures.",
    followersCount: 76,
    followingCount: 65,
    createdAt: 1700600000000,
  },
];

async function initMongoDB() {
  try {
    console.log("Connecting to MongoDB Atlas (kargarsetu)...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("kargarsetu");
    usersCollection = db.collection("users");
    chatsCollection = db.collection("chats");

    console.log("Connected to MongoDB Atlas database: kargarsetu");

    // Upsert initial verified community members if not present
    for (const artisan of INITIAL_ARTISANS) {
      await usersCollection.updateOne(
        { email: artisan.email.toLowerCase() },
        { $setOnInsert: artisan },
        { upsert: true }
      );
    }
    const count = await usersCollection.countDocuments();
    console.log(`MongoDB currently has ${count} registered users.`);
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err);
  }
}

// 1. Health check endpoint
app.get("/health", async (req, res) => {
  const isConnected = !!db;
  const userCount = isConnected ? await usersCollection.countDocuments() : 0;
  res.json({
    status: "ok",
    database: isConnected ? "connected (kargarsetu)" : "disconnected",
    usersCount: userCount,
    timestamp: new Date().toISOString(),
  });
});

// 2. GET /users - Fetch all registered users from MongoDB
app.get("/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const users = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .project({ _id: 0 })
      .toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users from MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /users - Save or update user in MongoDB
app.post("/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const userData = req.body;
    if (!userData || !userData.id) {
      return res.status(400).json({ error: "Invalid user data: id required" });
    }

    const filter = userData.email
      ? { $or: [{ id: userData.id }, { email: userData.email.toLowerCase() }] }
      : { id: userData.id };

    const updateDoc = {
      $set: {
        ...userData,
        email: (userData.email || "").toLowerCase(),
        updatedAt: Date.now(),
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc, {
      upsert: true,
    });

    console.log(
      `MongoDB User saved: ${userData.name} (${userData.personalId || userData.id})`
    );
    res.json({ success: true, result });
  } catch (err) {
    console.error("Error saving user to MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /chats - Fetch all chats from MongoDB
app.get("/chats", async (req, res) => {
  try {
    if (!chatsCollection) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const chats = await chatsCollection.find({}).project({ _id: 0 }).toArray();
    const chatsMap = {};
    chats.forEach((c) => {
      chatsMap[c.chatKey] = c.messages || [];
    });
    res.json(chatsMap);
  } catch (err) {
    console.error("Error fetching chats from MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /messages - Save chat message to MongoDB
app.post("/messages", async (req, res) => {
  try {
    if (!chatsCollection) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const { chatKey, message } = req.body;
    if (!chatKey || !message) {
      return res.status(400).json({ error: "chatKey and message required" });
    }

    await chatsCollection.updateOne(
      { chatKey },
      {
        $push: { messages: message },
        $set: { lastUpdated: Date.now() },
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving message to MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// Active in-memory calls map for ultra-fast signaling
const activeCalls = new Map();

// 6. POST /calls/start - Start a new live call
app.post("/calls/start", (req, res) => {
  try {
    const session = req.body;
    if (!session || !session.callId || !session.callerId || !session.receiverId) {
      return res.status(400).json({ error: "Invalid call session data" });
    }

    session.status = "ringing";
    session.createdAt = Date.now();
    activeCalls.set(session.callId, session);

    console.log(`📞 Call Ringing: ${session.callerName} -> ${session.receiverName} (${session.callId})`);
    res.json({ success: true, session });
  } catch (err) {
    console.error("Error starting call:", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /calls/active and /calls/active/:userId - Poll for active calls
const handleActiveCall = (req, res) => {
  try {
    const userId = (req.query.userId || req.params.userId || "").toString().trim().toLowerCase();
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // Clean up stale ringing calls older than 60s
    const now = Date.now();
    for (const [id, call] of activeCalls.entries()) {
      if (call.status === "ringing" && now - (call.createdAt || 0) > 60000) {
        call.status = "ended";
        activeCalls.delete(id);
      }
    }

    let userCall = null;
    for (const call of activeCalls.values()) {
      const cReceiverId = (call.receiverId || "").toString().trim().toLowerCase();
      const cCallerId = (call.callerId || "").toString().trim().toLowerCase();
      const cReceiverPid = (call.receiverPersonalId || "").toString().trim().toLowerCase();
      const cCallerPid = (call.callerPersonalId || "").toString().trim().toLowerCase();

      if (
        (cReceiverId === userId ||
         cCallerId === userId ||
         cReceiverPid === userId ||
         cCallerPid === userId) &&
        (call.status === "ringing" || call.status === "connected")
      ) {
        userCall = call;
        break;
      }
    }

    res.json({ success: true, activeCall: userCall || null });
  } catch (err) {
    console.error("Error getting active call:", err);
    res.status(500).json({ error: err.message });
  }
};

app.get("/calls/active", handleActiveCall);
app.get("/calls/active/:userId", handleActiveCall);

// 8. POST /calls/answer - Answer an incoming call
app.post("/calls/answer", (req, res) => {
  try {
    const { callId } = req.body;
    if (!callId) {
      return res.status(400).json({ error: "callId required" });
    }

    let call = activeCalls.get(callId);
    if (call) {
      call.status = "connected";
      call.startTime = Date.now();
      activeCalls.set(callId, call);

      console.log(`📞 Call Answered & Connected: ${callId}`);
      return res.json({ success: true, session: call });
    }

    res.status(404).json({ error: "Call not found" });
  } catch (err) {
    console.error("Error answering call:", err);
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /calls/end - End or decline a call
app.post("/calls/end", (req, res) => {
  try {
    const { callId, status } = req.body;
    if (!callId) {
      return res.status(400).json({ error: "callId required" });
    }

    const finalStatus = status === "declined" ? "declined" : "ended";
    let call = activeCalls.get(callId);
    if (call) {
      call.status = finalStatus;
      call.endedAt = Date.now();
      activeCalls.set(callId, call);
      setTimeout(() => activeCalls.delete(callId), 8000);
    }

    console.log(`📞 Call Terminated (${finalStatus}): ${callId}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error ending call:", err);
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /call-room/:callId/:role - WebRTC 2-Way Live Voice Audio Room
app.get("/call-room/:callId/:role", (req, res) => {
  const { callId, role } = req.params;
  const myPeerId = `artverse_${callId}_${role}`;
  const otherPeerId = `artverse_${callId}_${role === "caller" ? "receiver" : "caller"}`;

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ArtVerse Live Voice</title>
</head>
<body style="background:#0b1120;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
  <div style="text-align:center;">
    <h3 style="margin:0 0 10px;color:#38bdf8;">ArtVerse Voice Channel</h3>
    <p id="status" style="font-size:14px;color:#94a3b8;">Connecting secure audio channel...</p>
    <audio id="remoteAudio" autoplay playsinline></audio>
  </div>

  <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
  <script>
    const statusEl = document.getElementById("status");
    const remoteAudio = document.getElementById("remoteAudio");
    const myId = "${myPeerId}";
    const otherId = "${otherPeerId}";
    const isCaller = "${role}" === "caller";

    let connected = false;
    let callInterval = null;

    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    }).then(stream => {
      statusEl.innerText = "Microphone active. Connecting...";

      const peer = new Peer(myId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      function handleStream(remoteStream) {
        if (connected) return;
        connected = true;
        if (callInterval) clearInterval(callInterval);
        remoteAudio.srcObject = remoteStream;
        remoteAudio.play().catch(e => console.log(e));
        statusEl.innerText = "✓ Voice Connected! You can talk now.";
      }

      function attemptCall() {
        if (connected) return;
        try {
          const call = peer.call(otherId, stream);
          if (call) {
            call.on('stream', handleStream);
            call.on('error', e => console.warn(e));
          }
        } catch(e) {
          console.warn(e);
        }
      }

      peer.on('open', () => {
        statusEl.innerText = isCaller ? "Connecting to partner..." : "Ready. Receiving call...";

        if (isCaller) {
          attemptCall();
          let count = 0;
          callInterval = setInterval(() => {
            count++;
            if (!connected && count < 35) {
              attemptCall();
            } else {
              clearInterval(callInterval);
            }
          }, 1500);
        }
      });

      peer.on('call', call => {
        call.answer(stream);
        call.on('stream', handleStream);
      });

      peer.on('error', err => {
        console.warn("PeerJS note:", err);
      });
    }).catch(err => {
      statusEl.innerText = "Microphone note: " + err.message;
    });
  </script>
</body>
</html>`);
});

// Start Express server and connect to MongoDB
initMongoDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`🚀 ArtVerse MongoDB Backend API is running!`);
    console.log(`📡 Local URL:   http://localhost:${PORT}`);
    console.log(`📱 LAN / Phone: http://10.185.48.160:${PORT}`);
    console.log(`🗄️ Database:    MongoDB Atlas (kargarsetu)`);
    console.log(`===============================================`);
  });
});
