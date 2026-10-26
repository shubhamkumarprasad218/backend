const { MongoClient } = require("mongodb");

const uri = "mongodb://deepak:Deepak9279@ac-vljdacg-shard-00-00.tneo3dq.mongodb.net:27017,ac-vljdacg-shard-00-01.tneo3dq.mongodb.net:27017,ac-vljdacg-shard-00-02.tneo3dq.mongodb.net:27017/kargarsetu?ssl=true&replicaSet=atlas-k0b9n3-shard-0&authSource=admin&appName=Cluster0";

async function test() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    console.log("SUCCESS! Connected to MongoDB Atlas kargarsetu database!");
    const db = client.db("kargarsetu");
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.close();
  }
}

test();
