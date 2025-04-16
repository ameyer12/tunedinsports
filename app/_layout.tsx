import { Tabs } from 'expo-router';
import { View, Text, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/FirebaseConfig';
import { Icon, Button, Image } from '@rneui/themed';

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlistLink, setPlaylistLink] = useState("");

  const handleViewPlaylist = async () => {
    try {
      const response = await fetch('http://100.110.187.30:3001/api/create-playlist');
      const data = await response.json(); 
  
      if (data.playlistUrl) {
        setPlaylistLink(data.playlistUrl); // still useful if you want to show/share it elsewhere
        Linking.openURL(data.playlistUrl);
      }
    } catch (error) {
      console.error("Error opening playlist:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Feed', 
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={{ width: 75, height: 50, marginLeft: -10 }}
                resizeMode="contain"
              />
              <View style={{ flexDirection: 'column', marginLeft: -5 }}>
                <Text style={{ color: '#EDEDED', fontSize: 18, fontWeight: 'bold' }}>
                  Today's Headlines
                </Text>
                <Text style={{ color: '#B0B0B0', fontSize: 14 }}>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ),
          headerTitleAlign: 'left',
          headerRight: () => (
            <Button
              title="Today's Playlist"
              onPress={handleViewPlaylist}
              buttonStyle={{
                backgroundColor: '#1db954',
                borderWidth: 0.2,
                borderColor: 'white',
                borderRadius: 30,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
              containerStyle={{
                height: 34,
                width: 130,
                marginTop: 20,
                marginRight: 7,
              }}
              titleStyle={{
                color: '#EDEDED',
                fontSize: 14,
                fontWeight: '600'
              }}
            />
          ),
          tabBarActiveTintColor: '#1db954',
          headerStyle: { backgroundColor: '#121212' },
          headerTitleStyle: { color: '#EDEDED', fontSize: 24},
          tabBarIcon: ({ color, size }) => (
            <Icon name="newspaper-o" type="font-awesome" color={color} size={size} />
          )
        }} 
      />

      <Tabs.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          tabBarActiveTintColor: '#1db954',
          headerShown: false,
          href: isLoggedIn ? null : '/login',
          tabBarIcon: ({ color, size }) => (
            <Icon name="sign-in" type="font-awesome" color={color} size={size} />
          )
        }} 
      />

      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarActiveTintColor: '#1db954',
          headerShown: false,
          href: isLoggedIn ? '/profile' : null,
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" type="font-awesome" color={color} size={size} />
          )
        }} 
      />

      <Tabs.Screen 
        name="register" 
        options={{ 
          title: 'Register',
          headerShown: false,
          href: null
        }} 
      />
    </Tabs>
  );
}
