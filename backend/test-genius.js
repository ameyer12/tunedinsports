// test-genius.js
require("dotenv").config();
const Genius = require("genius-lyrics");
const Client = new Genius.Client("OsFdWzPGj0TlUTFJi5M700irhs2xjEa6xN6TrXhfebjtmjjC3KZl27SsMDgz7zjz");

async function testGeniusSearch() {
  try {
    const results = await Client.songs.search("HUMBLE Kendrick Lamar");
    if (results.length === 0) {
      console.log("❌ No results returned.");
      return;
    }

    const song = results[0];
    const lyrics = await song.lyrics();

    console.log("✅ Song found:", song.fullTitle);
    console.log("🎤 Lyrics preview:\n", lyrics.substring(0, 500)); // just show a snippet
  } catch (err) {
    console.error("❌ Genius test failed:", err.response?.data || err.message);
  }
}

testGeniusSearch();
