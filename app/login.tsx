import { View, Text, StyleSheet, TextInput, ActivityIndicator} from 'react-native';
import { Button } from '@rneui/themed';
import React, { useState } from 'react';
import { FIREBASE_AUTH } from '@/FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const router = useRouter();

  const signIn = async () => {
    setLoading(true);

    try {
      const response = await signInWithEmailAndPassword(auth, email, password);

      setEmail('');
      setPassword('');

      router.push('/profile');
    } catch (error: any) {
      console.log(error.message);
        if(error.message == "Firebase: Error (auth/missing-password)."){
          alert('Login failed: Please enter a password');
        } else if(error.message == "Firebase: Error (auth/invalid-email)."){
          alert('Login failed: Please enter a valid email');
        } else if(error.message == "Firebase: Error (auth/invalid-credential)."){
          alert('Login failed: Invalid credentials');
        }

    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in to save matches</Text>
      <TextInput 
        placeholder="Email"
        keyboardType="email-address"
        style={styles.textInput}
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput 
        placeholder="Password"
        secureTextEntry={true}
        style={styles.textInput}
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      { loading ? <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#1db954"/> :
        <View>
          <Button 
            buttonStyle={{ 
              width: 280,
              height: 50,
              borderColor: '#EDEDED',
              borderRadius: 10,
              marginTop: 24,
              backgroundColor: "#1E1E1E"
            }}
            title="Login"
            titleStyle={{ fontSize: 20, color: '#EDEDED' }}
            onPress={() => signIn()}
          />
          <Text style={styles.registerTxt}>
              Don't have an account? 
              {" "}
              <Text 
                style={{ fontWeight: 'bold' }}
                onPress={() => router.push('/register')}
              >
                 Register
              </Text>
          </Text>
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 20,
    color: '#EDEDED',
  },
  textInput: {
    width: 280,              
    height: 50,              
    fontSize: 16,            
    paddingHorizontal: 12,
    borderColor: '#EDEDED',
    borderWidth: 0.5,
    borderRadius: 10,
    marginTop: 20,
    color: '#EDEDED',
    backgroundColor: "#1E1E1E",
  },
  registerTxt: {
    color: '#EDEDED',
    textAlign: 'center',
    marginTop: 10
  }
});
