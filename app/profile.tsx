import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, FlatList} from 'react-native';
import { Button, Image, Card } from '@rneui/themed';
import { FIREBASE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, DocumentData, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = FIREBASE_AUTH.currentUser;
  const userDoc = doc(FIREBASE_DB, 'users', user.uid);
  const [bookmarkedMatches, setBookmarkedMatches] = useState<DocumentData[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/login');
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const fetchBookmarks = async () => {
    const user = FIREBASE_AUTH.currentUser;

    if(!user) {
      return
    }

    try {
      const q = query(
        collection(FIREBASE_DB, 'matches'),
        where('userId', '==', user.uid)
      );
  
      const querySnapshot = await getDocs(q);
      const bookmarks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
        })
      );
  
      setBookmarkedMatches(bookmarks);
    } catch (error) {
      console.log(error);
    }
  }

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
        where('articleTitle', '==', match.articleTitle)
      );
  
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        alert("No saved match found to remove.");
        return;
      }
  
      const docToDelete = snapshot.docs[0];
      await deleteDoc(docToDelete.ref);
  
      // Remove it from UI state
      setBookmarkedMatches((prev) =>
        prev.filter((item) => item.articleTitle !== match.articleTitle)
      );
    } catch (error) {
      console.error("Error removing match: ", error);
      alert("Something went wrong while removing.");
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true, // base64 encoding built-in
    });
  
    if (!result.canceled && result.assets.length > 0) {
      const base64 = result.assets[0].base64;
      const base64Uri = `data:image/jpeg;base64,${base64}`;
      setProfileImage(base64Uri);
  
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        const userRef = doc(FIREBASE_DB, 'users', user.uid);
        await setDoc(userRef, { profileImageBase64: base64 }, { merge: true });
      }
    }
  };

  useEffect(() => {
    const loadProfileImage = async () => {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) return;
    
      const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
      const data = userDoc.data();
    
      if (data?.profileImageBase64) {
        setProfileImage(`data:image/jpeg;base64,${data.profileImageBase64}`);
      }
    };
  
    loadProfileImage();
    fetchBookmarks();
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.profileHeaderContainer}>
        <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require('@/assets/images/no-profile-image.png')
          }
          style={styles.image}
          resizeMode="cover"
        />
        </TouchableOpacity>
        <Text style={styles.email}>{user?.email}</Text>
        </View>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: 10 }}>
            <Button 
              title="Logout"
              type="outline"
              buttonStyle={{
                borderColor: '#EDEDED',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: '#1E1E1E',
                marginRight: 10
              }}
              titleStyle={{
                fontSize: 14,
                color: '#EDEDED'
              }}
              onPress={handleLogout}
            />
          </View>
          <Text style={styles.savedPostsHeaderTxt}>Saved Matches</Text>
          <FlatList
            data={bookmarkedMatches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card containerStyle={styles.newsCard}>
                <View style={styles.cardContent}>
                  <Text style={styles.newsTitle}>{item.articleTitle}</Text>
                  <Text style={styles.songMatch}>🎵 {item.songTitle}</Text>
                  <View style={styles.btnContainer}>
                    <Button
                      title="Read"
                      titleStyle={{ color: '#EDEDED', fontSize: 14 }}
                      type="outline"
                      buttonStyle={{
                        borderColor: '#EDEDED',
                        borderRadius: 10,
                      }}
                      onPress={() => Linking.openURL(item.articleURL)}
                    />
                    <Button
                      type="outline"
                      buttonStyle={{
                        borderColor: '#EDEDED',
                        borderRadius: 10,
                      }}
                      onPress={() => Linking.openURL(item.spotifyLink)}
                      icon={{
                        name: 'spotify',
                        type: 'font-awesome',
                        color: '#1db954',
                        size: 20,
                      }}
                    />
                    <Button
                      title="Remove"
                      titleStyle={{ color: '#EDEDED', fontSize: 14 }}
                      type="outline"
                      buttonStyle={{
                        borderColor: '#FF3B30',
                        borderRadius: 10,
                      }}
                      onPress={() => removeMatch(item)}
                    />
                  </View>
                </View>
              </Card>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'flex-start',
  },
  profileHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10, 
  },
  image: {
    width: 75,
    height: 75,
    borderRadius: 100,
    overflow: 'hidden',
  },
  email: {
    fontSize: 16,
    color: '#EDEDED',
    marginLeft: 15,
  },
  logoutButton: {
    width: 280,
    height: 50,
    borderColor: '#EDEDED',
    borderRadius: 10,
    backgroundColor: "#1E1E1E",
  },
  savedPostsHeaderTxt: {
    fontSize: 25,
    color: '#EDEDED',
  },
  newsCard: {
    backgroundColor: '#1E1E1E',
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 0,
  },
  cardContent: {
    flexDirection: 'column',
    padding: 14,
    flexGrow: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EDEDED',
    marginBottom: 4,
    lineHeight: 20,
    maxWidth: 350
  },
  songMatch: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 18,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 6,
  },
});

