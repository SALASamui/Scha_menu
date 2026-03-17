import React, { useState, useRef, useEffect } from "react";
import {MAIN_MENU, THEMES_MENU, WHATS_ON_MENU} from "./data"
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Animated,
} from "react-native";
import Pdf from "react-native-pdf";
import { Asset } from "expo-asset";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const versionNumber = "Version 1.0.0";

function MainApp() {
  const [visible, setVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("main");

  const slideAnim = useRef(new Animated.Value(0)).current;
  const backPressCount = useRef(0);
  const pdfRef = useRef(null);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 3 : 2;
  const spacing = 20;
  const itemSize = (width - spacing * (numColumns + 1)) / numColumns;

  const openPdf = async (pdfModule) => {
    setPdfUri(null);
    setVisible(true);
    const asset = Asset.fromModule(pdfModule);
    await asset.downloadAsync();
    setPdfUri(asset.localUri || asset.uri);
  };

  const navigateTo = (screen) => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen(screen);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const goBack = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentScreen("main");
      slideAnim.setValue(-width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        setVisible(false);
        return true;
      }

      if (currentScreen !== "main") {
        goBack();
        return true;
      }

      if (backPressCount.current === 0) {
        backPressCount.current = 1;
        ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);
        return true;
      } else {
        BackHandler.exitApp();
        return true;
      }
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, [visible, currentScreen]);

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={{
        width: itemSize,
        marginLeft: spacing,
        marginTop: spacing,
      }}
      activeOpacity={0.85}
      onPress={() => {
        if (item.screen) {
          navigateTo(item.screen);
        } else if (item.pdf) {
          openPdf(item.pdf);
        }
      }}
    >
      <View
        style={{
          width: itemSize,
          height: itemSize / 2,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <Image
          source={item.image}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />

        <LinearGradient
          //colors={["transparent", "rgba(0,0,0,0.9)"]}
          colors={["rgba(0,0,0,0.0)","rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
          locations={[0.0,0.3, 0.7, 0.9]}
          style={{
            position: "absolute",
            top: "40%",
            left: 0,
            width: "100%",
            height: "100%",
            //justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={styles.overlayText}>{item.title}</Text>
          <Text style={styles.subText}>{item.sub1}</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const currentData =
    currentScreen === "main"
      ? MAIN_MENU
      : currentScreen === "Themes"
        ? THEMES_MENU
        : WHATS_ON_MENU;
  const version = currentScreen === "main" ? versionNumber : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#9d9d9d" }}>
      <Animated.View
        style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
      >
        <FlatList
          key={numColumns + currentScreen}
          data={currentData}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={renderGridItem}
          contentContainerStyle={{
            paddingBottom: spacing,
          }}
        />
      </Animated.View>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          {!pdfUri ? (
            <ActivityIndicator size="large" style={{ marginTop: 50 }} />
          ) : (
            <Pdf
              ref={pdfRef}
              source={{ uri: pdfUri }}
              style={{ flex: 1 }}
              fitPolicy={0}
              minScale={1.0}
              maxScale={8.0}
              enableAntialiasing={true}
            />
          )}
        </SafeAreaView>
      </Modal>
      <Text style={styles.versionText}>{version}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlayText: {
    fontFamily: "ROBOTO_800Bold",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  subText: {
    color: "#fff",
  },
  versionText: {
    color: "#fff",
    textAlign: "right",
    paddingRight: 10,
  },
});
