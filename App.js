/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { TextInput, Button, Title } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar } from 'react-native-paper';

function LoginScreen(props) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const handleLogin = (email, password) => {
    if (email != null && password != null) {
      auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          props.setIsLogin(true)
          props.navigation.navigate("Home")
        })
        .catch(error => {
          if (error.code === 'auth/email-already-in-use') {
            console.log('That email address is already in use!');
          }

          if (error.code === 'auth/invalid-email') {
            console.log('That email address is invalid!');
          }

          console.error(error);
        });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Title style={styles.title}>Chic n Rice Box</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={text => setEmail(text)}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        style={styles.input}
        autoCapitalize="none"
        secureTextEntry={true}
      />
      <Button icon="login" mode="contained" onPress={() => handleLogin(email, password)}>
        Login
      </Button>
    </SafeAreaView>
  );
}
const Tab = createMaterialBottomTabNavigator();

function CustomNavigationBar(props) {
  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => {
        if (props.user) {
          props.setIsLogin(false)
          props.navigation.navigate("Login")
        }
      });
  }
  return (
    <Appbar.Header>
      <Appbar.Content title="" subtitle={''} />
      <Appbar.Action icon="logout" onPress={handleLogout} />
    </Appbar.Header>
  );
}

function HomeScreen(props) {
  const handleLogout = () => {
    auth()
      .signOut()
      .then(() => {
        if (props.user) {
          props.setIsLogin(false)
          props.navigation.navigate("Login")
        }
      });
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text>Home Screen</Text>
      <Button icon="logout" mode="contained" onPress={handleLogout}>
        Logout
      </Button>
    </SafeAreaView>
  );
}

function PemilikScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Menu" component={MenuScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="food" color={color} size={26} />
          ),
        }} />
      <Tab.Screen name="Penjualan" component={PenjualanScreen}
        options={{
          tabBarLabel: 'Penjualan',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="currency-usd" color={color} size={26} />
          ),
        }} />
    </Tab.Navigator>
  );
}

function MenuScreen(props) {
  return (
    <SafeAreaView style={styles.containerHome}>
      <Text>Menu Screen</Text>
    </SafeAreaView>
  );
}

function PenjualanScreen(props) {
  return (
    <SafeAreaView style={styles.containerHome}>
      <Text>Penjualan Screen</Text>
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [first, setFirst] = useState();
  const [role, setRole] = useState();
  const [isLogin, setIsLogin] = useState(false);

  function onAuthStateChanged(user) {
    setUser(user);
    if (user) {
      setFirst("Home");
      setIsLogin(true);
      database().ref("/profiles/" + user.uid).once("value").then((snapshot) => {
        setRole(snapshot.val().role);
      });
    }
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={first}
        screenOptions={{
          header: (props) => <CustomNavigationBar {...props} user={user} setIsLogin={setIsLogin}/>,
        }}>
        {!isLogin ?
          <Stack.Group>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {props => <LoginScreen {...props} user={user} setIsLogin={setIsLogin} />}
            </Stack.Screen>
          </Stack.Group>
          :
          <Stack.Group>
            <Stack.Screen name="Home">
              {props => {
                if (role == "Pemilik") {
                  return <PemilikScreen {...props}/>
                } else if (role == "Pegawai") {
                  return <HomeScreen {...props}/>
                } else {
                  return null;
                }
              }}
            </Stack.Screen>
          </Stack.Group>
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  containerHome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    margin: 12
  },
  title: {
    alignSelf: "center",
    paddingBottom: 32,
    paddingTop: 32,
    fontSize: 40,
    fontWeight: "bold"
  }
});

export default App;
