// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { Card, Image, Button, Icon } from '@rneui/themed';
import { FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { query, where, getDocs, doc, collection, addDoc, deleteDoc } from 'firebase/firestore';

export default function HomeScreen() {
  type Match = {
    article: string;
    articleLink: string;
    articleImage: string;
    matchedSong: string;
    spotifyLink: string;
    songSentiment: number;
  };
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookmarkedMatches, setBookmarkedMatches] = useState<{ [key: string]: boolean }>({});
  const user = FIREBASE_AUTH.currentUser;

  const fetchMatches = async () => {
    try {
      setLoading(true);

      const response = await fetch('https://tunedinsports.onrender.com/api/match-songs');
      const data = await response.json();

      setMatches(data);

    } catch (error) {
      console.error("Error fetching matches: ", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveMatch = async (match) => {
    const user = FIREBASE_AUTH.currentUser;
  
    if (!user) {
      alert("Please log in to save matches");
      return;
    }
  
    try {
      await addDoc(collection(FIREBASE_DB, 'matches'), {
        userId: user.uid,
        articleTitle: match.article, 
        articleURL: match.articleLink,
        articleImage: match.articleImage,
        songTitle: match.matchedSong,
        spotifyLink: match.spotifyLink,
        sentimentScore: match.songSentiment,
        timestamp: new Date(),
      });
  
      // alert("Match saved!");

      setBookmarkedMatches((prev) => ({
        ...prev,
        [match.article]: true
      }));
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Something went wrong while saving.");
    }
  };
  
  const removeMatch = async (match) => {
    const user = FIREBASE_AUTH.currentUser;
  
    if (!user) {
      alert("You must be logged in to remove a saved match.");
      return;
    }
  
    try {
      const q = query(
        collection(FIREBASE_DB, 'matches'),
        where('userId', '==', user.uid),
        where('articleTitle', '==', match.article) // assuming articleTitle is unique
      );
  
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        alert("No saved match found to remove.");
        return;
      }
  
      // Delete the first matching document
      const docToDelete = snapshot.docs[0];
      await deleteDoc(docToDelete.ref);
  
      setBookmarkedMatches((prev) => ({
        ...prev,
        [match.article]: false
      }));
  
      // alert("Match removed!");
    } catch (error) {
      console.error("Error removing match: ", error);
      alert("Something went wrong while removing.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      const isUserLoggedIn = !!user;
      setIsLoggedIn(isUserLoggedIn);
  
      if (isUserLoggedIn && user) {
        try {
          const q = query(
            collection(FIREBASE_DB, 'matches'),
            where('userId', '==', user.uid)
          );
  
          const snapshot = await getDocs(q);
          const bookmarks: { [key: string]: boolean } = {};

          snapshot.forEach((doc) => {
            const data = doc.data();
            bookmarks[data.articleTitle] = true;
          });
  
          setBookmarkedMatches(bookmarks); // Will now pre-populate bookmarked states
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        }
      }
    });
  
    fetchMatches(); // still needed
  
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      { loading ? (
          <View style={{ alignItems: 'center', marginTop: 250 }}>
            <ActivityIndicator size="large" color="#1db954" />
            <Text style={{ color: '#EDEDED', marginTop: 12, fontSize: 16 }}>
              Generating matches...
            </Text>
          </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Card containerStyle={styles.newsCard}>
              <View style={styles.cardContent}>
                <Image 
                  source={{ uri: item.articleImage }}
                  style={styles.image}
                  PlaceholderContent={
                        <Image
                        source={require('@/assets/images/no-image-found.jpg')}
                        style={styles.image}
                        resizeMode="contain"
                        />
                      }
                />
                <View style={styles.textContainer}>
                  <Text style={styles.newsTitle}>{item.article}</Text>
                  <Text style={styles.songMatch}>Vibe: {item.matchedSong}</Text>
                </View>
                <View style = {styles.btnContainer}>
                  <Button
                    title = "Read Article"
                    titleStyle = {{color: '#EDEDED'}}
                    type='outline'
                    buttonStyle= {{
                      borderColor: '#EDEDED',
                      borderRadius: 10,
                    }}
                    onPress={() => Linking.openURL(item.articleLink)}
                  >
                  </Button>
                  <Button
                    titleStyle = {{color: '#1db954'}}
                    type='outline'
                    buttonStyle= {{
                      borderColor: '#EDEDED',
                      borderRadius: 10,
                    }}
                    onPress={() => Linking.openURL(item.spotifyLink)}
                  >
                    <Icon 
                      name='spotify' 
                      type='font-awesome' 
                      color='#1db954' 
                      style={styles.btnLogo} 
                    />
                      <Text style={{ color: '#1db954' }}>Play on Spotify</Text>
                  </Button>
                  { !bookmarkedMatches[item.article] ? (
                      <Button
                        titleStyle = {{color: '#1db954'}}
                        type='outline'
                        buttonStyle= {{
                          borderColor: 'transparent',
                        }}
                        onPress={() => handleSaveMatch(item)}
                      >
                        <Icon 
                          name='bookmark-o' 
                          type='font-awesome' 
                          color='#EDEDED' 
                          style={styles.btnLogo} 
                        />
                      </Button>
                    ) : (
                      <Button
                      titleStyle = {{color: '#1db954'}}
                      type='outline'
                      buttonStyle= {{
                        borderColor: 'transparent',
                      }}
                      onPress={() => removeMatch(item)}
                    >
                      <Icon 
                        name='bookmark' 
                        type='font-awesome' 
                        color='#EDEDED' 
                        style={styles.btnLogo} 
                      />
                    </Button>
                    )
                  }
                </View>
              </View>
            </Card>
          )}
        />
        )
       }
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const isSmallPhone = screenWidth < 360;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 20,
  },
  headerText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: isSmallPhone ? 16 : 18,
    fontWeight: 'bold',
    color: '#EDEDED',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  newsCard: {
    backgroundColor: '#1E1E1E',
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 0,
  },
  cardContent: {
    flexDirection: 'column',
    padding: 12,
    flexGrow: 1
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
    maxWidth: 400,
    alignSelf: 'center', 
  },  
  textContainer: {
    flexShrink: 1,
    minHeight: 50,
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: isSmallPhone ? 14 : 16,
    fontWeight: '600',
    color: '#EDEDED',
    marginBottom: 4,
    lineHeight: 20,
    maxWidth: 350
  },
  songMatch: {
    fontSize: isSmallPhone ? 12 : 14,
    color: '#B0B0B0',
    lineHeight: 18,
  },
  btnContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginRight: 6,
    gap: 2 
  },
  btnLogo: {
    marginRight: 4,
  },
});





