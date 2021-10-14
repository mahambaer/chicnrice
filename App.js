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
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  BackHandler,
  Alert,
  SectionList,
  LogBox
} from 'react-native';

import {
  BLEPrinter,
} from "react-native-thermal-receipt-printer";

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { Modal, Portal, TextInput, Button, Title, ActivityIndicator, Colors } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Appbar, FAB, Switch, Avatar, List } from 'react-native-paper';
import { formatNumber } from 'react-native-currency-input';
import moment from 'moment';

LogBox.ignoreAllLogs();

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

const Item = ({ name, backgroundColor, textColor, onPress, disabled = false }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.item, styles.elevation, backgroundColor]}>
    <Text style={[styles.titleItem, textColor]}>{name}</Text>
  </TouchableOpacity>
);

const ItemSection = ({ name, quantity, subTotal, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.itemSection]}>
    <Text style={[styles.titleItemSection]}>{name}</Text>
    <View style={styles.switchContainerOrder}>
      <View style={styles.switchBoxOrder}><Text style={styles.titleItemSection}>{quantity}</Text></View>
      <View style={styles.switchBoxTotal}><Text style={styles.titleItemSection}>{subTotal}</Text></View>
    </View>
  </TouchableOpacity>
);
function HomeScreen(props) {
  const [isClicked, setIsClicked] = useState(false);
  const [printers, setPrinters] = useState();

  useEffect(() => {
    if (props.route.params?.isClicked) {
      setIsClicked(false);
      props.navigation.setParams({
        isClicked: !props.route.params?.isClicked
      })
    }
    let init = null;
    if (printers == null) {
      init = BLEPrinter.init().then(() => {
        BLEPrinter.getDeviceList().then(setPrinters);
      });
    }

    return () => {
      init
    }
  }, [props.route.params?.isClicked, printers])

  function handleNewOrder() {
    setIsClicked(true);

    if (!isClicked) {
      const month = moment().month();
      const year = moment().year();
      const newReference = database().ref('/orders/' + year + '/' + month).push();
      const today = moment().format('YYYY-MM-DD HH:mm:ss');

      newReference
        .set({ created: today })
        .then(() => {
          props.navigation.navigate("Tambah Pesanan", {
            orderId: newReference.key,
            year: year,
            month: month,
            today: today,
            printer: printers != null && printers.length != 0 ? printers[0] : null
          })
        })
        .catch(error => {
          console.error(error);
        })
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
  const { orderId, month, year, today, printer } = props.route.params
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
        {(props) => <TambahKeranjangScreen {...props} orderId={orderId} month={month} year={year} today={today} printer={printer} />}
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
      <Item name={item.name} backgroundColor={{ backgroundColor }} textColor={{ color }} disabled={!item.available} onPress={() => props.navigation.navigate("Tambah Produk", {
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
    <SafeAreaView style={styles.container}>
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
  const { orderId, month, year, today, printer } = props;
  const [list, setList] = useState();
  const [total, setTotal] = useState();
  const [totalFormatted, setTotalFormatted] = useState();
  const [paid, setPaid] = useState();
  const [ret, setRet] = useState(0);
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = { padding: 20 };

  const handlePrint = () => {
    let datas = "<CM>CHIC\'N RICE BOX</CM>\nDate: " + today + "\n--------------------------------\n";
    list.forEach(element => {
      const formattedPrice = formatNumber(element.price, {
        separator: ',',
        prefix: 'Rp ',
        precision: 0,
        delimiter: '.',
        signPosition: 'beforePrefix',
      })
      const formattedSubtotal = formatNumber(element.subTotal, {
        separator: ',',
        prefix: 'Rp ',
        precision: 0,
        delimiter: '.',
        signPosition: 'beforePrefix',
      })
      datas += element.name + '\n';
      datas += '<R>' + element.quantity + '@' + formattedPrice + ' = ' + formattedSubtotal + '</R>\n';
    });
    datas += "--------------------------------\n";
    datas += 'TOTAL:   ' + totalFormatted;
    BLEPrinter.connectPrinter(printer.inner_mac_address).then(
      (currentPrinter) => currentPrinter && BLEPrinter.printText(datas),
      error => console.warn(error))
  }

  const handleHapus = useCallback(async (id) => {
    Alert.alert("Tunggu dulu!", "Kamu yakin mau hapus?", [
      {
        text: "Batal",
        onPress: () => null,
        style: "cancel"
      },
      {
        text: "Hapus", onPress: async () => {
          showModal();
          await database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products/' + id).remove().then(() => hideModal());
        }
      }
    ]);
  })

  const renderItem = ({ item }) => {
    return (
      <ItemSection name={item.name} quantity={item.quantity + " X " + formatNumber(item.price, {
        separator: ',',
        prefix: 'Rp ',
        precision: 0,
        delimiter: '.',
        signPosition: 'beforePrefix',
      })} subTotal={formatNumber(item.subTotal, {
        separator: ',',
        prefix: 'Rp ',
        precision: 0,
        delimiter: '.',
        signPosition: 'beforePrefix',
      })} onPress={() => handleHapus(item.id)} />
    )
  };

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
        setList(datas)
        setTotal(total)
        setTotalFormatted(totalFormatted)
      });

    return () => { database().ref('/orders/' + year + '/' + month + '/' + orderId + '/products').off('value', onValueChange) };
  }, []);
  function onSaveOrder() {
    const reference = database().ref('/orders/' + year + '/' + month + '/' + orderId + '/total');

    // Execute transaction
    return reference.transaction(currentTotal => {
      if (currentTotal === null) return total;
      return currentTotal + total;
    });
  }
  function onSaveMonth() {
    const reference = database().ref('/orders/' + year + '/' + month + '/total');

    // Execute transaction
    return reference.transaction(currentTotal => {
      if (currentTotal === null) return total;
      return currentTotal + total;
    });
  }
  function onSaveYear() {
    const reference = database().ref('/orders/' + year + '/total');

    // Execute transaction
    return reference.transaction(currentTotal => {
      if (currentTotal === null) return total;
      return currentTotal + total;
    });
  }
  function onSaveAll() {
    const reference = database().ref('/orders/total');

    // Execute transaction
    return reference.transaction(currentTotal => {
      if (currentTotal === null) return total;
      return currentTotal + total;
    });
  }
  function handleSimpan() {
    showModal();
    onSaveOrder().then(transaction => onSaveMonth().then(transaction => onSaveYear().then(transaction => onSaveAll().then(transaction => {
      props.navigation.navigate("Home", { isClicked: true });
      hideModal();
    }))));
  }
  return (
    <SafeAreaView style={styles.container}>
      <Portal>
        <Modal visible={visible} contentContainerStyle={containerStyle}>
          <ActivityIndicator animating={true} color={Colors.red800} size="large" />
        </Modal>
      </Portal>
      <View style={styles.switchContainerOrder}>
        <View style={styles.switchBoxOrder}><Text style={{ fontSize: 24, fontWeight: "bold", }}>Total:</Text></View>
        <View style={styles.switchBoxTotal}><Text style={{ fontSize: 24, fontWeight: "bold" }}>{totalFormatted}</Text></View>
      </View>
      <TextInput
        label="Bayar"
        value={paid}
        onChangeText={text => {
          setPaid(text)
          const number = Number(text);
          if (number >= total) { setRet(number - total) } else { setRet(0) }
        }}
        keyboardType="numeric"
      />
      <View style={styles.switchContainerOrder}>
        <View style={styles.switchBoxOrder}><Text style={{ fontSize: 24, fontWeight: "bold", }}>Kembali:</Text></View>
        <View style={styles.switchBoxTotal}><Text style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(ret, {
          separator: ',',
          prefix: 'Rp ',
          precision: 0,
          delimiter: '.',
          signPosition: 'beforePrefix',
        })}</Text></View>
      </View>
      <View style={styles.switchContainerOrder}>
        <Button style={styles.input} mode="contained" disabled={(paid == null || paid < total) || total == 0} onPress={handleSimpan}>
          Simpan
        </Button>
        <Button style={styles.input} mode="contained" disabled={(paid == null || paid < total) || total == 0} onPress={handlePrint}>
          Cetak
        </Button>
      </View>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
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
        <TouchableOpacity onPress={() => { if (quantity != 0) setQuantity(quantity - 1) }}>
          <Avatar.Icon size={64} icon="minus" />
        </TouchableOpacity>
        <View style={styles.switchBoxPlus}><Text style={{ fontSize: 40, fontWeight: "bold", }}>{quantity}</Text></View>
        <TouchableOpacity onPress={() => { if (quantity != 99) setQuantity(quantity + 1) }}>
          <Avatar.Icon size={64} icon="plus" />
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
  const [totalAll, setTotalAll] = useState();
  const [totalYear, setTotalYear] = useState();
  const [totalMonth, setTotalMonth] = useState();
  const [year, setYear] = useState(moment().year());
  const [month, setMonth] = useState(moment().month());
  const [yearView, setYearView] = useState(moment().year());
  const [monthView, setMonthView] = useState(moment().month());
  const [isClicked, setIsClicked] = useState(true);
  const [yearsPick, setYearsPick] = useState();
  const [monthsPick, setMonthsPick] = useState();
  const [isYearClicked, setIsYearClicked] = useState(false);
  const [isMonthClicked, setIsMonthClicked] = useState(false);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const containerStyle = { backgroundColor: "white", padding: 8, margin: 16 };

  const showModalYear = () => setIsYearClicked(true);
  const showModalMonth = () => setIsMonthClicked(true);
  const hideModal = () => {
    setIsMonthClicked(false);
    setIsYearClicked(false);
  };

  useEffect(() => {

    setYear(year);
    setMonth(month);

    let subscribe = database()
      .ref('/orders')
      .on('value', snapshot => {
        const formatted = formatNumber(snapshot.val().total, {
          separator: ',',
          prefix: 'Rp ',
          precision: 0,
          delimiter: '.',
          signPosition: 'beforePrefix',
        })
        const datas = snapshot.val();
        const { total, ...rest } = datas;

        let years = [];

        for (const [key, item] of Object.entries(rest)) {
          years = [...years, key]
        }
        setYearsPick(years)
        setTotalAll(formatted);
      });

    if (year != null) {
      subscribe = database()
        .ref('/orders/' + year)
        .on('value', snapshot => {
          const formatted = formatNumber(snapshot.val().total, {
            separator: ',',
            prefix: 'Rp ',
            precision: 0,
            delimiter: '.',
            signPosition: 'beforePrefix',
          })
          const datas = snapshot.val();
          const { total, ...rest } = datas;

          let months = [];

          for (const [key, item] of Object.entries(rest)) {
            months = [...months, key]
          }
          setMonthsPick(months);
          if (isClicked) setTotalYear(formatted);
        });
    }

    if (month != null) {
      subscribe = database()
        .ref('/orders/' + year + '/' + month)
        .on('value', snapshot => {
          if (snapshot.val() != null) {
            const formatted = formatNumber(snapshot.val().total, {
              separator: ',',
              prefix: 'Rp ',
              precision: 0,
              delimiter: '.',
              signPosition: 'beforePrefix',
            })
            if (isClicked) setTotalMonth(formatted);
          }
        });
    }

    setIsClicked(false);
    return () => {
      subscribe;
    };
  }, [month, year]);

  function handleClickPicker(value) {
    if (isYearClicked) setYear(value);
    if (isMonthClicked) setMonth(value);
    hideModal();
  }

  function handleCariClick() {
    if (year != null) {
      database()
        .ref('/orders/' + year)
        .on('value', snapshot => {
          const formatted = formatNumber(snapshot.val().total, {
            separator: ',',
            prefix: 'Rp ',
            precision: 0,
            delimiter: '.',
            signPosition: 'beforePrefix',
          })
          setTotalYear(formatted);
          setYearView(year);
        });
    }

    if (month != null) {
      database()
        .ref('/orders/' + year + '/' + month)
        .on('value', snapshot => {
          if (snapshot.val() != null) {
            const formatted = formatNumber(snapshot.val().total, {
              separator: ',',
              prefix: 'Rp ',
              precision: 0,
              delimiter: '.',
              signPosition: 'beforePrefix',
            }) 
            setTotalMonth(formatted);
            setMonthView(month);
          }
        });
    }
  }

  function renderItem(text) {
    return (
      <TouchableOpacity onPress={() => handleClickPicker(text) }>
        {isYearClicked &&
          <List.Item key={text} title={text} style={year == text ? {backgroundColor: 'gray'} : {backgroundColor: 'white'}} titleStyle={year == text ? {color: 'white'} : {color: 'black'}}/>
        }
        {isMonthClicked &&
          <List.Item key={text} title={months[text]} style={month == text ? {backgroundColor: 'gray'} : {backgroundColor: 'white'}} titleStyle={month == text ? {color: 'white'} : {color: 'black'}}/>
        }
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Portal>
        <Modal visible={isYearClicked || isMonthClicked} onDismiss={hideModal} contentContainerStyle={containerStyle}>
          <List.Section>
            {isYearClicked && yearsPick.map((item) => renderItem(item))}
            {isMonthClicked && monthsPick.map((item) => renderItem(item))}
          </List.Section>
        </Modal>
      </Portal>
      <Button mode="outlined" style={{ marginVertical: 8 }} onPress={showModalYear}>
        {year}
      </Button>
      <Button mode="outlined" style={{ marginVertical: 8 }} onPress={showModalMonth}>
        {months[month]}
      </Button>
      <Button mode="contained" style={{ marginVertical: 8 }} onPress={handleCariClick}>
        Cari
      </Button>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>Total Penjualan: {totalAll}</Text>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>Total Tahun {yearView}: {totalYear}</Text>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>Total Tahun {months[monthView]}: {totalMonth}</Text>
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
                  return <SafeAreaView style={styles.containerHome}><ActivityIndicator animating={true} color={Colors.red800} size="large" /></SafeAreaView>;
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
  itemSection: {
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 4,
    borderBottomWidth: 1,
    borderStyle: "dotted"
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
  titleItemSection: {
    fontSize: 16,
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
  switchContainerOrder: {
    flexDirection: "row",
    flexWrap: "nowrap",
    height: "auto",
    alignItems: "center",
    justifyContent: "space-around",
  },
  switchBox: {
    flex: 1,
    margin: 2,
    height: 32,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  switchBoxOrder: {
    flex: 1,
    height: 32,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  switchBoxTotal: {
    flex: 1,
    height: 32,
    justifyContent: "flex-end",
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
