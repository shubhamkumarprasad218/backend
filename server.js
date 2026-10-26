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
