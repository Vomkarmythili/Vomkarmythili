const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// Server & Database Configuration
const PORT = 5000;
const DATABASE_NAME = "search";
const MONGO_URI = `mongodb://localhost:27017/${DATABASE_NAME}`;

// Google API Credentials (Replace with actual values)
const GOOGLE_API_KEY = "AIzaSyBPvBaqfAqFMU8TVpUCWKBbeyNuUf10PlU"; 
const SEARCH_ENGINE_ID = "b5dabf8bae5174053"; // Use only CX code

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`✅ Connected to MongoDB: ${DATABASE_NAME}`))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define MongoDB Schema & Model
const searchSchema = new mongoose.Schema({
  query: String,
  name: String,
  description: String,
  image: String,
  websites: Array,
  timestamp: { type: Date, default: Date.now }
});
const SearchResult = mongoose.model("results", searchSchema);

// Google Search API Route
app.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "❌ Query is required" });

  try {
    // Fetch general search results (text-based)
    const textResponse = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query
      }
    });

    // Fetch image search results
    const imageResponse = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        searchType: "image"
      }
    });

    // Extract relevant details
    const firstTextResult = textResponse.data.items?.[0] || {};
    const firstImageResult = imageResponse.data.items?.[0] || {};

    // Prepare data
    const name = firstTextResult.title || "Unknown";
    const description = firstTextResult.snippet || "No description available";
    const source = firstTextResult.link || "#";
    const image = firstImageResult.link || "No image available";
    const websites = textResponse.data.items || [];

    // Store in MongoDB
    const searchResult = new SearchResult({ query, name, description, image, websites });
    await searchResult.save();

    // Send response
    res.json({
      message: "✅ Search successful",
      name,
      description,
      source,
      image,
      websites
    });

  } catch (err) {
    console.error("❌ Search API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "⚠️ Failed to fetch search results" });
  }
});

// Fetch Search History
app.get("/history", async (req, res) => {
  try {
    const historyLimit = Number(req.query.limit) || 100; // Default: 10 results
    const history = await SearchResult.find().sort({ timestamp: -1 }).limit(historyLimit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "⚠️ Failed to fetch search history" });
  }
});

// Fetch Recent Search Results on Page Refresh
app.get("/recent", async (req, res) => {
  try {
    const recentResults = await SearchResult.find().sort({ timestamp: -1 }).limit(1);
    res.json(recentResults.length > 0 ? recentResults[0] : { message: "No recent searches found" });
  } catch (err) {
    res.status(500).json({ error: "⚠️ Failed to fetch recent results" });
  }
});

// Start the Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
