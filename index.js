const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("kilnTask");
    const taskCollection = db.collection("tasks");

    app.post("/api/v1/addTask", async (req, res) => {
      const body = req.body;
      await taskCollection.insertOne(body);
      res.status(201).json({
        success: true,
        message: "Task added successfully",
      });
    });

    app.get("/api/v1/tasks", async (req, res) => {
      try {
        const status = req.query.status;
        const search = req.query.search;
        let query = {};

        if (status) {
          query.status = status;
        }

        if (search) {
          query.title = { $regex: search, $options: "i" };
        }

        const result = await taskCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("An error occurred while fetching tasks");
      }
    });

    app.get("/api/v1/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await taskCollection.find(filter).toArray();
      res.send(result);
    });
    app.put("/api/v1/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { updates } = req.body;

        // Validate the ID format
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }

        // Ensure updates is not empty
        if (!updates || Object.keys(updates).length === 0) {
          return res
            .status(400)
            .json({ error: "No fields provided for update" });
        }

        // Build the filter and update object
        const filter = { _id: new ObjectId(id) };
        const update = { $set: updates };

        // Perform the update
        const result = await taskCollection.updateOne(filter, update);

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task updated successfully" });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/api/v1/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = taskCollection.deleteOne(filter);
      res.send(result);
    });
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
