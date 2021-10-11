/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { TextInput, Button, Title } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar, FAB, Switch } from 'react-native-paper';

//Test
function LoginScreen(props) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const mountedRef = useRef(true);

  const handleLogin = useCallback((email, password) => {
    if (email != null && password != null) {
      auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          if (!mountedRef.current) return null
          props.setIsLogin(true)
          props.navigation.navigate("Home")
        })
        .catch(error => {
          if (!mountedRef.current) return null
          if (error.code === 'auth/email-already-in-use') {
            console.log('That email address is already in use!');
          }

          if (error.code === 'auth/invalid-email') {
            console.log('That email address is invalid!');
          }

          console.error(error);
        });
    }
  })

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

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
      <Button style={styles.input} icon="login" mode="contained" onPress={() => handleLogin(email, password)}>
        Login
      </Button>
    </SafeAreaView>
  );
}
const Tab = createBottomTabNavigator();

function CustomNavigationBar(props) {
  const mountedRef = useRef(true);

  const handleLogout = useCallback(() => {
    auth()
      .signOut()
      .then(() => {
        if (props.user) {
          if (!mountedRef.current) return null
          props.setIsLogin(false)
          props.navigation.navigate("Login")
        }
      })
      .catch(error => {
        if (!mountedRef.current) return null
        console.error(error);
      });
  })

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <Appbar.Header>
      {props.route.name != "Home" &&
        <Appbar.BackAction onPress={() => props.navigation.goBack()} />}
      <Appbar.Content title={props.route.name} subtitle={''} />
      {props.route.name == "Home" &&
        <Appbar.Action icon="logout" onPress={handleLogout} />}
    </Appbar.Header>
  );
}

function HomeScreen(props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Home Screen</Text>
    </SafeAreaView>
  );
}

function PemilikScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Menu" component={MenuScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="food" color={color} size={26} />
          ),
        }} />
      <Tab.Screen name="Penjualan" component={PenjualanScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Penjualan',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="currency-usd" color={color} size={26} />
          ),
        }} />
    </Tab.Navigator>
  );
}

function MenuScreen(props) {

  function handleMakanan() {
    props.navigation.navigate("List Makanan")
  }

  function handleMinuman() {
    props.navigation.navigate("List Minuman")
  }

  return (
    <SafeAreaView style={styles.containerHome}>
      <TouchableOpacity style={[styles.touchImage, styles.elevation]} onPress={handleMakanan}>
        <Image
          resizeMode="contain"
          style={styles.image}
          source={require('./assets/images/food.png')}
        />
        <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 32 }}>Makanan</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.touchImage, styles.elevation]} onPress={handleMinuman}>
        <Image
          resizeMode="contain"
          style={styles.image}
          source={require('./assets/images/drink.png')}
        />
        <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 32 }}>Minuman</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const Item = ({ name, backgroundColor, textColor, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.item, styles.elevation, backgroundColor]}>
    <Text style={[styles.titleItem, textColor]}>{name}</Text>
  </TouchableOpacity>
);

function MakananListScreen(props) {
  const [list, setList] = useState([]);
  const mountedRef = useRef(true);
  function handleTambah() {
    props.navigation.navigate("Tambah Makanan")
  }

  const renderItem = ({ item }) => {
    const backgroundColor = item.available ? "#f9c2ff" : "#6e3b6e";
    const color = item.available ? "black" : "white";
    return (
      <Item name={item.name} backgroundColor={{backgroundColor}} textColor={{color}} onPress={() => props.navigation.navigate("Edit Makanan", {
      itemId: item.id
    })}/>
  )};

  useEffect(() => {
    const subscribe = database()
      .ref('/foods')
      .on('value', snapshot => {
        const data = snapshot.val();
        let datas = [];
        if (data != null) {
          for (const [key, item] of Object.entries(data)) {
            const newData = {
              available: item.available,
              discount: item.discount,
              name: item.name,
              price: item.price,
              id: key
            }
            datas = [...datas, newData]
          }
        }
        setList(datas)
      });

    return () => {
      mountedRef.current = false
      subscribe
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={handleTambah}
      />
    </SafeAreaView>
  );
}

function MakananAddScreen(props) {
  const [name, setName] = useState();
  const [price, setPrice] = useState();

  function handleTambah() {
    if (name != null && price != null) {
      const newReference = database().ref('/foods').push();
      newReference
        .set({
          name: name,
          price: Number(price),
          discount: 0,
          available: true
        })
        .then(() => props.navigation.navigate('List Makanan'));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        label="Nama Makanan"
        value={name}
        onChangeText={text => setName(text)}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        label="Harga Makanan"
        value={price}
        onChangeText={text => setPrice(text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button style={styles.input} mode="contained" onPress={handleTambah}>
        Save
      </Button>
    </SafeAreaView>
  );
}

function MakananEditScreen(props) {
  const { itemId } = props.route.params;
  const [name, setName] = useState();
  const [price, setPrice] = useState();
  const [discount, setDiscount] = useState();
  const [isAvailable, setIsAvailable] = useState(false);
  const mountedRef = useRef(true);

  function handleTambah() {
    if (name != null && price != null && discount != null) {
      database().ref('/foods/' + itemId).update({
        name: name,
        price: Number(price),
        discount: Number(discount),
        available: isAvailable
      })
      .then(() => props.navigation.navigate('List Makanan'));
    }
  }

  const onToggleSwitch = () => setIsAvailable(!isAvailable);

  useEffect(() => {
    const subscribe = database().ref("/foods/" + itemId).once("value").then((snapshot) => {
      setName(snapshot.val().name);
      setPrice(snapshot.val().price.toString());
      setDiscount(snapshot.val().discount.toString());
      setIsAvailable(snapshot.val().available);
    });

    return () => {
      mountedRef.current = false
      subscribe
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        label="Nama Makanan"
        value={name}
        onChangeText={text => setName(text)}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        label="Harga Makanan"
        value={price}
        onChangeText={text => setPrice(text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Diskon"
        value={discount}
        onChangeText={text => setDiscount(text)}
        style={styles.input}
        keyboardType="numeric"
        right={<TextInput.Affix text="%" />}
      />
      <View style={styles.switchContainer}>
        <View style={styles.switchBox}><Text style={{fontWeight: "bold"}}>Available</Text></View>
        <Switch style={styles.switchBox} value={isAvailable} onValueChange={onToggleSwitch} />
      </View>
      <Button style={styles.input} mode="contained" onPress={handleTambah}>
        Save
      </Button>
    </SafeAreaView>
  );
}

function MinumanListScreen(props) {
  const [list, setList] = useState([]);
  const mountedRef = useRef(true);
  function handleTambah() {
    props.navigation.navigate("Tambah Minuman")
  }

  const renderItem = ({ item }) => {
    const backgroundColor = item.available ? "#f9c2ff" : "#6e3b6e";
    const color = item.available ? "black" : "white";
    return (
      <Item name={item.name} backgroundColor={{backgroundColor}} textColor={{color}} onPress={() => props.navigation.navigate("Edit Minuman", {
      itemId: item.id
    })}/>
  )};

  useEffect(() => {
    const subscribe = database()
      .ref('/drinks')
      .on('value', snapshot => {
        const data = snapshot.val();
        let datas = [];
        if (data != null) {
          for (const [key, item] of Object.entries(data)) {
            const newData = {
              available: item.available,
              discount: item.discount,
              name: item.name,
              price: item.price,
              id: key
            }
            datas = [...datas, newData]
          }
        }
        setList(datas)
      });

    return () => {
      mountedRef.current = false
      subscribe
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={handleTambah}
      />
    </SafeAreaView>
  );
}

function MinumanAddScreen(props) {
  const [name, setName] = useState();
  const [price, setPrice] = useState();

  function handleTambah() {
    if (name != null && price != null) {
      const newReference = database().ref('/drinks').push();
      newReference
        .set({
          name: name,
          price: Number(price),
          discount: 0,
          available: true
        })
        .then(() => props.navigation.navigate('List Minuman'));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        label="Nama Minuman"
        value={name}
        onChangeText={text => setName(text)}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        label="Harga Minuman"
        value={price}
        onChangeText={text => setPrice(text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button style={styles.input} mode="contained" onPress={handleTambah}>
        Save
      </Button>
    </SafeAreaView>
  );
}

function MinumanEditScreen(props) {
  const { itemId } = props.route.params;
  const [name, setName] = useState();
  const [price, setPrice] = useState();
  const [discount, setDiscount] = useState();
  const [isAvailable, setIsAvailable] = useState(false);
  const mountedRef = useRef(true);

  function handleTambah() {
    if (name != null && price != null && discount != null) {
      database().ref('/drinks/' + itemId).update({
        name: name,
        price: Number(price),
        discount: Number(discount),
        available: isAvailable
      })
      .then(() => props.navigation.navigate('List Minuman'));
    }
  }

  const onToggleSwitch = () => setIsAvailable(!isAvailable);

  useEffect(() => {
    const subscribe = database().ref("/drinks/" + itemId).once("value").then((snapshot) => {
      setName(snapshot.val().name);
      setPrice(snapshot.val().price.toString());
      setDiscount(snapshot.val().discount.toString());
      setIsAvailable(snapshot.val().available);
    });

    return () => {
      mountedRef.current = false
      subscribe
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        label="Nama Minuman"
        value={name}
        onChangeText={text => setName(text)}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        label="Harga Minuman"
        value={price}
        onChangeText={text => setPrice(text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Diskon"
        value={discount}
        onChangeText={text => setDiscount(text)}
        style={styles.input}
        keyboardType="numeric"
        right={<TextInput.Affix text="%" />}
      />
      <View style={styles.switchContainer}>
        <View style={styles.switchBox}><Text style={{fontWeight: "bold"}}>Available</Text></View>
        <Switch style={styles.switchBox} value={isAvailable} onValueChange={onToggleSwitch} />
      </View>
      <Button style={styles.input} mode="contained" onPress={handleTambah}>
        Save
      </Button>
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
          header: (props) => <CustomNavigationBar {...props} user={user} setIsLogin={setIsLogin} />,
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
                  return <PemilikScreen {...props} />
                } else if (role == "Pegawai") {
                  return <HomeScreen {...props} />
                } else {
                  return null;
                }
              }}
            </Stack.Screen>
            {role == "Pemilik" &&
              <Stack.Screen name="Tambah Makanan">
                {props => <MakananAddScreen {...props} />}
              </Stack.Screen>}
            {role == "Pemilik" &&
              <Stack.Screen name="Edit Makanan">
                {props => <MakananEditScreen {...props} />}
              </Stack.Screen>}
            {role == "Pemilik" &&
              <Stack.Screen name="List Makanan">
                {props => <MakananListScreen {...props} />}
              </Stack.Screen>}
            {role == "Pemilik" &&
              <Stack.Screen name="Tambah Minuman">
                {props => <MinumanAddScreen {...props} />}
              </Stack.Screen>}
            {role == "Pemilik" &&
              <Stack.Screen name="Edit Minuman">
                {props => <MinumanEditScreen {...props} />}
              </Stack.Screen>}
            {role == "Pemilik" &&
              <Stack.Screen name="List Minuman">
                {props => <MinumanListScreen {...props} />}
              </Stack.Screen>}
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
  },
  image: {
    height: 200
  },
  touchImage: {
    backgroundColor: "white",
    width: "90%",
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 50
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 8
  },
  shadowProp: {
    shadowColor: '#171717',
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  elevation: {
    elevation: 8,
    shadowColor: '#52006A',
  },
  titleItem: {
    fontSize: 28,
  },
  switchContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    padding: 12,
    height: "auto"
  },
  switchBox: {
    flex: 1,
    margin: 2,
    height: 32,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  }
});

export default App;
