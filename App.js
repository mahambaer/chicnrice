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
  FlatList,
  BackHandler,
  Alert,
  SectionList
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { TextInput, Button, Title } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar, FAB, Switch, Avatar } from 'react-native-paper';
import { formatNumber } from 'react-native-currency-input';
import moment from 'moment';

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
    Alert.alert("Tunggu dulu!", "Kamu yakin mau logout?", [
      {
        text: "Batal",
        onPress: () => null,
        style: "cancel"
      },
      {
        text: "Logout", onPress: () => {
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
        }
      }
    ]);
  })

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <Appbar.Header>
      {props.route.name != "Home" && props.route.name != "Tambah Pesanan" &&
        <Appbar.BackAction onPress={() => props.navigation.goBack()} />}
      <Appbar.Content title={props.route.name} subtitle={''} />
      {props.route.name == "Home" &&
        <Appbar.Action icon="logout" onPress={handleLogout} />}
    </Appbar.Header>
  );
}

const Item = ({ name, backgroundColor, textColor, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.item, styles.elevation, backgroundColor]}>
    <Text style={[styles.titleItem, textColor]}>{name}</Text>
  </TouchableOpacity>
);

// const ItemSection = ({ name, backgroundColor, textColor, onPress }) => (
//   <TouchableOpacity onPress={onPress} style={[styles.item, styles.elevation, backgroundColor]}>
//     <Text style={[styles.titleItem, textColor]}>{name}</Text>
//   </TouchableOpacity>
// );
function HomeScreen(props) {
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (props.route.params?.isClicked) {
      setIsClicked(false);
      props.navigation.setParams({
        isClicked: !props.route.params?.isClicked
      })
    }
  }, [props.route.params?.isClicked])

  function handleNewOrder() {
    setIsClicked(true);

    if (!isClicked) {
      const month = moment().month();
      const year = moment().year();
      const newReference = database().ref('/orders/' + year + '/' + month).push();

      newReference
        .set({ created: moment().format('YYYY-MM-DD HH:mm:ss') })
        .then(() => {
          props.navigation.navigate("Tambah Pesanan", {
            orderId: newReference.key,
            year: year,
            month: month,
          })
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  return (
    <SafeAreaView style={styles.containerHome}>
      {!isClicked && props.role == "Pegawai" &&
        <TouchableOpacity onPress={handleNewOrder} style={{ flex: 1, justifyContent: "center" }}>
          <Image
            resizeMode="contain"
            style={styles.image}
            source={require('./assets/images/plus.png')}
          />
          <Text style={styles.title}>Pesanan Baru</Text>
        </TouchableOpacity>
      }
    </SafeAreaView>
  );
}

function TambahPesananScreen(props) {
  const { orderId, month, year } = props.route.params
  const mountedRef = useRef(true);

  useEffect(() => {
    const backAction = async () => {
      Alert.alert("Tunggu dulu!", "Kamu yakin mau kembali?", [
        {
          text: "Batal",
          onPress: () => null,
          style: "cancel"
        },
        {
          text: "Kembali", onPress: async () => {
            await database().ref('/orders/' + year + '/' + month + '/' + orderId).remove();
            props.navigation.navigate("Home", { isClicked: true });
          }
        }
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      mountedRef.current = false;
      backHandler.remove();
    };
  }, []);
  return (
    <Tab.Navigator>
      <Tab.Screen name="Menu"
        options={{
          headerShown: false,
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="food" color={color} size={26} />
          ),
        }}>
        {(props) => <TambahMenuScreen {...props} orderId={orderId} month={month} year={year} />}
      </Tab.Screen>
      <Tab.Screen name="Pesanan"
        options={{
          headerShown: false,
          tabBarLabel: 'Pesanan',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cart" color={color} size={26} />
          ),
        }}>
        {(props) => <TambahKeranjangScreen {...props} orderId={orderId} month={month} year={year} />}
        </Tab.Screen>
    </Tab.Navigator>
  );
}

function TambahMenuScreen(props) {
  const { orderId, month, year } = props;
  const [foods, setFoods] = useState();
  const [drinks, setDrinks] = useState();

  const renderItem = ({ item }) => {
    const backgroundColor = item.available ? "#f9c2ff" : "#6e3b6e";
    const color = item.available ? "black" : "white";
    return (
      <Item name={item.name} backgroundColor={{ backgroundColor }} textColor={{ color }} onPress={() => props.navigation.navigate("Tambah Produk", {
        orderId: orderId,
        month: month,
        year: year,
        id: item.id,
        type: item.type
      })} />
    )
  };

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
              id: key,
              type: "foods"
            }
            datas = [...datas, newData]
          }
          setFoods({ title: "Makanan", data: datas });
          database()
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
                    id: key,
                    type: "drinks"
                  }
                  datas = [...datas, newData]
                }
                setDrinks({ title: "Minuman", data: datas });
              }
            });
        }
      });

    return () => {
      subscribe;
    };
  }, []);

  return (
    <SafeAreaView style={styles.containerHome}>
      {foods != null && drinks != null &&
        <SectionList
          sections={[foods, drinks]}
          keyExtractor={(item, index) => item + index}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.header}>{title}</Text>
          )}
        />}

    </SafeAreaView>
  );
}

function TambahKeranjangScreen(props) {
  const { orderId, month, year } = props;
  const [list, setList] = useState();
  const [total, setTotal] = useState();
  const [totalFormatted, setTotalFormatted] = useState();

  useEffect(() => {
    const onValueChange = database()
      .ref('/orders/' + year + '/' + month + '/' + orderId + '/products')
      .on('value', snapshot => {
        const data = snapshot.val();
        let datas = [];
        let total = 0;
        if (data != null) {
          for (const [key, item] of Object.entries(data)) {
            const newData = {
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              subTotal: item.subTotal,
              id: key
            }
            datas = [...datas, newData]
            total += item.subTotal;
          }
        }
        const totalFormatted = formatNumber(total, {
          separator: ',',
          prefix: 'Rp ',
          precision: 0,
          delimiter: '.',
          signPosition: 'beforePrefix',
        })
        console.log(datas)
        setList(datas)
        setTotal(total)
        setTotalFormatted(totalFormatted)
      });

      return () => database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products').off('value', onValueChange);
  }, []);

  return (
    <SafeAreaView style={styles.containerHome}>
      <Text>{totalFormatted}</Text>
    </SafeAreaView>
  );
}

function TambahProdukScreen(props) {
  const { orderId, month, year, id, type } = props.route.params;
  const [name, setName] = useState();
  const [price, setPrice] = useState();
  const [priceFromatted, setPriceFormatted] = useState();
  const [quantity, setQuantity] = useState(1);

  async function handleTambah() {
    if (name != null && price != null && quantity != 0) {
      database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products/' + id).set({
          name: name,
          price: price,
          quantity: quantity,
          subTotal: price * quantity
        })
        .then(() => props.navigation.goBack())
        .catch(error => {
          console.error(error);
        });
    } else if (quantity == 0) {
        await database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products/' + id).set(null)
        .then(() => props.navigation.goBack())
        .catch(error => {
          console.error(error);
        });
    }
  }

  useEffect(() => {
    if (type == "foods") {
      database().ref("/foods/" + id).once('value').then((snapshot) => {
        setName(snapshot.val().name);
        setPrice(snapshot.val().price);
        const price = formatNumber(snapshot.val().price, {
          separator: ',',
          prefix: 'Rp ',
          precision: 0,
          delimiter: '.',
          signPosition: 'beforePrefix',
        })
        setPriceFormatted(price);
      })
    }
    if (type == "drinks") {
      database().ref("/drinks/" + id).once('value').then((snapshot) => {
        setName(snapshot.val().name);
        setPrice(snapshot.val().price);
        const price = formatNumber(snapshot.val().price, {
          separator: ',',
          prefix: 'Rp ',
          precision: 0,
          delimiter: '.',
          signPosition: 'beforePrefix',
        })
        setPriceFormatted(price);
      })
    }
    const onValueChange = database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products/' + id).on('value', (snapshot) => {
      console.log(snapshot.val())
      if (snapshot.val() != null) {
        setQuantity(snapshot.val().quantity)
      }
    })
    return () => database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products' + id).off('value', onValueChange);
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.productTitle}>{name}</Text>
      <Text style={styles.productTitle}>{priceFromatted}</Text>
      <View style={styles.switchContainerPlus}>
        <TouchableOpacity onPress={() => {if(quantity != 0 ) setQuantity(quantity-1)}}>
          <Avatar.Icon size={64} icon="minus" />
        </TouchableOpacity>
        <View style={styles.switchBoxPlus}><Text style={{ fontSize: 40, fontWeight: "bold", }}>{quantity}</Text></View>
        <TouchableOpacity onPress={() => {if(quantity != 99) setQuantity(quantity+1)}}>
          <Avatar.Icon size={64} icon="plus"/>
        </TouchableOpacity>
      </View>
      <Button style={styles.input} mode="contained" onPress={handleTambah}>
        Save
      </Button>
    </SafeAreaView>
  );
}

function PemilikScreen(props) {
  const { role } = props;
  return (
    <Tab.Navigator>
      <Tab.Screen name="Menu"
        options={{
          headerShown: false,
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="food" color={color} size={26} />
          ),
        }}>
        {(props) => <MenuScreen {...props} role={role} />}
      </Tab.Screen>
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
  const { role } = props;
  function handleMakanan() {
    props.navigation.navigate("List Makanan")
  }

  function handleMinuman() {
    props.navigation.navigate("List Minuman")
  }

  if (role == "Pemilik") {
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
  } else {
    return null;
  }
}

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
      <Item name={item.name} backgroundColor={{ backgroundColor }} textColor={{ color }} onPress={() => props.navigation.navigate("Edit Makanan", {
        itemId: item.id
      })} />
    )
  };

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
        .then(() => props.navigation.navigate('List Makanan'))
        .catch(error => {
          console.error(error);
        });
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
        .then(() => props.navigation.navigate('List Makanan'))
        .catch(error => {
          console.error(error);
        });
    }
  }

  const onToggleSwitch = () => setIsAvailable(!isAvailable);

  useEffect(() => {
    const subscribe = database().ref("/foods/" + itemId).once("value").then((snapshot) => {
      setName(snapshot.val().name);
      setPrice(snapshot.val().price.toString());
      setDiscount(snapshot.val().discount.toString());
      setIsAvailable(snapshot.val().available);
    })
      .catch(error => {
        console.error(error);
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
        <View style={styles.switchBox}><Text style={{ fontWeight: "bold" }}>Available</Text></View>
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
      <Item name={item.name} backgroundColor={{ backgroundColor }} textColor={{ color }} onPress={() => props.navigation.navigate("Edit Minuman", {
        itemId: item.id
      })} />
    )
  };

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
        .then(() => props.navigation.navigate('List Minuman'))
        .catch(error => {
          console.error(error);
        });
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
        .then(() => props.navigation.navigate('List Minuman'))
        .catch(error => {
          console.error(error);
        });
    }
  }

  const onToggleSwitch = () => setIsAvailable(!isAvailable);

  useEffect(() => {
    const subscribe = database().ref("/drinks/" + itemId).once("value").then((snapshot) => {
      setName(snapshot.val().name);
      setPrice(snapshot.val().price.toString());
      setDiscount(snapshot.val().discount.toString());
      setIsAvailable(snapshot.val().available);
    })
      .catch(error => {
        console.error(error);
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
        <View style={styles.switchBox}><Text style={{ fontWeight: "bold" }}>Available</Text></View>
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
      })
        .catch(error => {
          console.error(error);
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
                  return <PemilikScreen {...props} role={role} />
                } else if (role == "Pegawai") {
                  return <HomeScreen {...props} role={role} />
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
            {role == "Pegawai" &&
              <Stack.Screen name="Tambah Pesanan">
                {props => <TambahPesananScreen {...props} />}
              </Stack.Screen>}
            {role == "Pegawai" &&
              <Stack.Screen name="Tambah Produk">
                {props => <TambahProdukScreen {...props} />}
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
  productTitle: {
    textAlign: "center",
    alignSelf: "center",
    paddingBottom: 32,
    fontSize: 32,
    fontWeight: "bold"
  },
  productQuantity: {
    textAlign: "center",
    alignSelf: "center",
    paddingBottom: 32,
    fontSize: 24,
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
    shadowOffset: { width: -2, height: 4 },
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
  switchContainerPlus: {
    flexDirection: "row",
    flexWrap: "nowrap",
    padding: 24,
    height: "auto",
    alignItems: "center",
    justifyContent: "center",
  },
  switchBox: {
    flex: 1,
    margin: 2,
    height: 32,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  switchBoxPlus: {
    flex: 1,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  header: {
    fontSize: 32,
    padding: 12
  },
});

export default App;
