const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Sentiment = require('sentiment');
const Genius = require("genius-lyrics");
// const Client = new Genius.Client("OsFdWzPGj0TlUTFJi5M700irhs2xjEa6xN6TrXhfebjtmjjC3KZl27SsMDgz7zjz");
const admin = require('firebase-admin');
const qs = require('querystring'); 
// const config = require('../config');
// const serviceAccount = require('./service-account-key.json');

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_KEY, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Node.js backend!');
});

app.get('/api/news', async (req, res) => {
  try {
    let response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        category: 'sports',
        country: 'us',
        apiKey: process.env.NEWS_API_KEY
      }
    });

    console.log("hi")
  
    res.json(response.data);
  } catch (error) {
    throw error;
  }
});

async function getNewsSentiments() {
    // Call the news API
    let newsRes = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        category: 'sports',
        country: 'us',
        apiKey: process.env.NEWS_API_KEY
      }
    });

    // Analyze news sentiment
    const articles = newsRes.data.articles;
    const articleSentiments = {};
    const newsSentiment = new Sentiment();

    for (let i = 0; i < articles.length; i++) {
      let articleSentiment = articles[i].content
        ? newsSentiment.analyze(articles[i].content).score
        : newsSentiment.analyze(articles[i].description || "").score;

      articleSentiments[articles[i].title] = {
        "sentiment": articleSentiment,
        "url": articles[i].url,
        "image": articles[i].urlToImage
      };
    }

    return articleSentiments;
}

async function getSpotifyRecommendations() {
  const genrePool = ["pop", "hip-hop", "rock", "indie", "edm", "rap", "r-n-b"];
  const artistPool = [
    "66CXWjxzNUsdJxJ2JdwvnR", "4oUHIQIBe0LHzYfvXNW4QM", "2YZyLoL8N0Wb9xBt1NhZWg", "74KM79TiuVKeVCqs8QtB0B", "7tYKF4w9nC0nq9CsPZTHyP",
    "7GlBOeep6PqTfFi59PTUUN", "1HY2Jd0NmPuamShAr6KMms", "6qqNVTkY8uBg9cP3Jd7DAH", "699OTQXzgjhIYAHMy9RyPD", "3TVXtAsR1Inumwj472S9r4",
    "33qOK5uJ8AR2xuQQAhHump", "3hcs9uc56yIGFCSy9leWe7", "1Xyo4u8uXC1ZmMpatF05PJ", "06HL4z0CvFAxyc27GXpf02", "0du5cEVh5yTK9QJze8zA0C",
    "4V8LLVI7PbaPR0K2TGSxFF", "4E2rKHVDssGJm2SCDOMMJB", "07D1Bjaof0NFlU32KXiqUP", "718COspgdWOnwOFpJHRZHS", "22wbnEMDvgVIAGdFeek6ET",
    "19k8AgwwTSxeaxkOuCQEJs", "45dkTj5sMRSjrmBSBeiHym", "3gd8FJtBJtkRxdfbTu19U2", "4q3ewBCX7sLwd24euuV69X", "4tuJ0bMpJh08umKkEXKUI5",
    "3y2cIKLjiOlp1Np37WiUdH", "246dkjvS1zLTtiykXe5h60", "2FXC3k01G6Gw61bmprjgqS", "40ZNYROS4zLfyyBSs2PGe2", "0fTSzq9jAh4c36UVb4V7CB",
    "08GQAI4eElDnROBrJRGE0X", "6XyY86QOPPrYVGvF9ch6wz", "4YLtscXsxbVgi031ovDDdh", "67FB4n52MgexGQIG8s0yUH", "2ye2Wgw4gimLv2eAKyk1NB",
    "6olE6TJLqED3rqDCT0FyPh", "3win9vGIxFfBRag9S63wwf", "0C8ZW7ezQVs4URX5aX7Kqx", "3bO19AOone0ubCsfDXDtYt", "5CiGnKThu5ctn9pBxv7DGa",
    "6pV5zH2LzjOUHaAvENdMMa", "0Y5tJX1MQlPlqiwlOH1tJY", "7bXgB6jMjp9ATFy66eO08Z", "2RQXRUsr4IW1f3mKyKsy4B", "6eUKZXaKkcviH0Ku9w2n3V",
    "6qxpnaukVayrQn6ViNvu9I", "5J6L7N6B4nI1M5cwa29mQG", "4Z8W4fKeB5YxbusRsdQVPb", "5eumcnUkdmGvkvcsx1WFNG", "3fMbdgg4jU18AjLCKBhRSm",
    "4FGPzWzgjURDNT7JQ8pYgH", "6Ghvu1VvMGScGpOUJBAHNH", "6M2wZ9GZgrQXHCFfjv46we", "2h93pZq0e7k5yf4dywlkpM", "2qoQgPAilErOKCwE2Y8wOG",
    "1RyvyyTE3xzB2ZywiAwp0i", "2QMsj4XJ7ne2hojxt6v5eb", "4gzpq5DPGxSnKTe4SA8HAU", "7rkW85dBwwrJtlHRDkJDAC", "4Ga1P7PMIsmqEZqhYZQgDo"
  ];
  const trackPool = [
    "11PUdjgVfGEZLG9zs9UeTp", "4iG2gAwKXsOcijVaVXzRPW", "4wajJ1o7jWIg62YqpkHC7S", "0KVWVuutF9Dn8li4HdyAeU", "02srSkeu2pzybuVr2B9TJm",
    "6I9VzXrHxO9rA9A5euc8Ak", "6luBKkFUt5wTwz7hpLhp12", "3UmaczJpikHgJFyBTAJVoz", "3850dYVgOFIXJh5U4BFEWH", "1IzGdhQ17U0r7ufI4qBv7d",
    "4h5x3XHLVYFJaItKuO2rhy", "3E7ZwUMJFqpsDOJzEkBrQ7", "6UO72VSXEONxdfLyABihs9", "6TGd66r0nlPaYm3KIoI7ET", "7H0ya83CMmgFcOhw0UB6ow",
    "003vvx7Niy0yvhvHt4a68B", "2pB49wD5LpB8gYmqOIybTC", "2PpruBYCo4H7WOBJ7Q2EwM", "3iVcZ5G6tvkXZkZKlMpIUs", "1ixbwbeBi5ufN4noUKmW5a",
    "3Rc2ajBMInxeNGVkMPC92Y", "2MvvoeRt8NcOXWESkxWn3g", "2pxCOdnHEZZ3A1XRNxjc1v", "2LMkwUfqC6S6s6qDVlEuzV", "1fDFHXcykq4iw8Gg7s5hG9"
  ];
  
  const seedGenres = genrePool.sort(() => 0.5 - Math.random()).slice(0, 2).join(',');
  const seedArtists = artistPool.sort(() => 0.5 - Math.random()).slice(0, 2).join(',');
  const seedTracks = trackPool[Math.floor(Math.random() * trackPool.length)];

  const options = {
    method: 'GET',
    url: 'https://spotify23.p.rapidapi.com/recommendations/',
    params: {
      limit: '100',
      seed_tracks: seedTracks,
      seed_artists: seedArtists,
      seed_genres: seedGenres
    },
    headers: {
      'x-rapidapi-host': 'spotify23.p.rapidapi.com',
      'x-rapidapi-key': process.env.RAPID_API_KEY
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Error fetching Spotify recommendations:", error.response?.data || error.message);
    throw error;
  }
}

async function getLyricsFromGenius(title, artist) {
  try {
    const searchQuery = `${title} ${artist}`;
    
    // 1. Search Genius
    const searchRes = await axios.get('https://genius-song-lyrics1.p.rapidapi.com/search/', {
      params: { q: searchQuery },
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST,
      },
    });

    const hits = searchRes.data.hits;
    if (!hits || hits.length === 0) {
      console.warn(`❌ No Genius results for "${searchQuery}"`);
      return null;
    }

    const geniusId = hits[0].result.id;

    // 2. Fetch Lyrics by ID
    const lyricsRes = await axios.get('https://genius-song-lyrics1.p.rapidapi.com/song/lyrics/', {
      params: { id: geniusId },
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST,
      },
    });

    const lyrics = lyricsRes.data?.lyrics?.lyrics?.body?.plain;
    if (!lyrics) {
      console.warn(`⚠️ Lyrics not found for Genius ID: ${geniusId}`);
      return null;
    }

    return lyrics;
  } catch (err) {
    console.error(`❌ Genius API failed for "${title}" by "${artist}":`, err.message);
    return null;
  }
}

async function getMusicSentiments(recommendations) {
  const musicSentiments = {};
  const musicSentiment = new Sentiment();

  const musicSentimentPromises = recommendations.tracks.map(async (track) => {
    const title = track.name;
    const artist = track.artists;
    const spotifyLink = track["external_urls"]["spotify"];

    const results = getLyricsFromGenius(track, artist);

    // const sentiment = musicSentiment.analyze(lyrics);
    console.log("artist: ", artist, "title: ", title, "lyrics: ", results);
  })

  //   try {
  //     const results = await Client.songs.search(title);
  //     console.log(`🔍 Genius results for "${title}":`, results?.[0]?.fullTitle);

  //     if (!results.length) {
  //       console.warn(`⚠️ No Genius results for "${title}"`);
  //       return;
  //     }

  //     const lyrics = await results[0].lyrics();
  //     const sentiment = musicSentiment.analyze(lyrics);

  //     musicSentiments[title] = {
  //       sentiment: sentiment.score,
  //       spotifyLink
  //     };

  //     console.log(`✅ Sentiment stored for "${title}":`, sentiment.score);
  //   } catch (error) {
  //     console.error(`❌ Genius fetch failed for "${title}":`, error.response?.data || error.message);
  //   }
  // });

  // await Promise.allSettled(musicSentimentPromises);

  return musicSentiments;
}

function sortObjectByValue(obj) {
  const entries = Object.entries(obj);
  entries.sort(([, a], [, b]) => a - b); // Sort by value
  return Object.fromEntries(entries);
}

function sortObjectByNestedValue(obj, nestedKey) {
  const entries = Object.entries(obj);

  entries.sort(([, a], [, b]) => {
    return (a[nestedKey] ?? 0) - (b[nestedKey] ?? 0);
  });

  return Object.fromEntries(entries);
}

function generateSentimentMatches(obj1, obj2) {
  let matches = [];
  let temp_obj2 = { ...obj2 };
  let articles = Object.keys(obj1);

  if (Object.keys(temp_obj2).length === 0) {
    console.warn("No songs available for matching.");
    return [];
  }

  for (let i = 0; i < articles.length; i++) {
    let closestSentiment = Infinity;
    let chosenTrack = null;

    for (let j = 0; j < Object.keys(temp_obj2).length; j++) {
      const key = Object.keys(temp_obj2)[j];
      const musicSentimentScore = temp_obj2[key]?.sentiment;

      if (musicSentimentScore == null) continue;

      const diff = Math.abs(obj1[articles[i]].sentiment - musicSentimentScore);

      if (diff < closestSentiment) {
        closestSentiment = diff;
        chosenTrack = key;
      }
    }

    if (!chosenTrack || !temp_obj2[chosenTrack]) {
      console.warn(`Could not find match for article: ${articles[i]}`);
      continue;
    }

    matches.push({
      article: articles[i],
      articleSentiment: obj1[articles[i]].sentiment,
      articleLink: obj1[articles[i]].url,
      articleImage: obj1[articles[i]].image,
      matchedSong: chosenTrack,
      songSentiment: temp_obj2[chosenTrack].sentiment,
      spotifyLink: temp_obj2[chosenTrack].spotifyLink,
    });

    delete temp_obj2[chosenTrack];
  }

  return matches;
}

async function getAllSpotifyRecommendations(batchCount = 3) {
  const recommendationPromises = Array.from({ length: batchCount }, () =>
    getSpotifyRecommendations()
  );

  const allResponses = await Promise.all(recommendationPromises);
  const allTracks = allResponses.flatMap(res => res.tracks);

  return { tracks: allTracks };
}

app.get('/api/match-songs', async (req, res) => {
  console.log("🔍 /api/match-songs endpoint called");

  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const docRef = db.collection('dailyMatches').doc(today);

  try {
    const existingDoc = await docRef.get();

    console.log("🔍 /api/match-songs endpoint inside try")

    if (existingDoc.exists) {
      const data = existingDoc.data();
      if (data.matches && data.matches.length > 0) {
        console.log("📄 Returning cached match data");
        return res.json(data.matches);
      } else {
        console.warn("⚠️ Cached doc exists but matches are missing or empty — regenerating.");
        // Let it fall through to regenerate matches
      }
    }

    let newsSentiments = await getNewsSentiments();
    let spotifyRecommendations = await getAllSpotifyRecommendations(3);
    let musicSentiments = await getMusicSentiments(spotifyRecommendations);

    newsSentiments = sortObjectByNestedValue(newsSentiments, "sentiment");
    musicSentiments = sortObjectByNestedValue(musicSentiments, "sentiment");
    console.log("🎯 newsSentiments count:", Object.keys(newsSentiments).length);
    console.log("🎯 musicSentiments count:", Object.keys(musicSentiments).length);


    let sentimentMatches = generateSentimentMatches(newsSentiments, musicSentiments);

    console.log("🎯 sentimentMatches count:", sentimentMatches.length);

    // Save to Firestore
    await docRef.set({
      date: today,
      matches: sentimentMatches
    });

    res.json(sentimentMatches);
  } catch (error) {
    console.log("error message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/api/create-playlist', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const docRef = db.collection('playlists').doc(today);

  try {
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return res.json({ message: 'Playlist already exists for today.', ...docSnap.data() });
    }

    const refreshAccessToken = async () => {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    
      const authBuffer = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
      const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }), {
        headers: {
          Authorization: `Basic ${authBuffer}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
      return response.data.access_token;
    };

    let accessToken = await refreshAccessToken();
    const playlistName = `📰 Vibes for ${today}`;
    const playlistDescription = `Automatically generated playlist for ${today}'s sports news.`;

    const userId = '31oh2y2udhdgatkyk5wuf4nwtxii'; 
    const createPlaylistRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: true
      }),
    });
    const playlistData = await createPlaylistRes.json();

    const matchDoc = await db.collection('dailyMatches').doc(today).get();
    if (!matchDoc.exists) throw new Error("No match data found for today.");

    const matches = matchDoc.data().matches;
    const trackUris = matches.map(match => `spotify:track:${match.spotifyLink.split('/').pop()}`);

    await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    });

    await docRef.set({
      date: today,
      playlistId: playlistData.id,
      playlistUrl: playlistData.external_urls.spotify,
      trackUris
    });

    return res.json({
      message: 'Playlist created successfully!',
      playlistUrl: playlistData.external_urls.spotify,
    });

  } catch (error) {
    console.error("Error creating playlist:", error);
    return res.status(500).json({ error: 'Failed to create playlist.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

