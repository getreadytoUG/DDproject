import React, { Component } from 'react';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Alert, View, Text, BackHandler, SafeAreaView, TouchableOpacity, Modal } from 'react-native';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.webview = React.createRef();
    this.state = {
      url: "",
      canGoBack:false,
      locationPermissionGranted: false,
      isPermissionModalVisible: false,
    };
  }

  componentDidMount() {
    this.getLocation();
    BackHandler.addEventListener("hardwareBackPress", this.handleBackButton);
  }

  getLocation = async () => {
    try {
      const response = await Location.requestForegroundPermissionsAsync();
  
      if (response.status === 'granted') {
        this.setState({ locationPermissionGranted: true, isPermissionModalVisible: false });
        const location = await Location.getCurrentPositionAsync();
        console.log(`위도: ${location.coords.latitude}, 경도: ${location.coords.longitude}`);
      } else {
        this.setState({ locationPermissionGranted: false, isPermissionModalVisible: true });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      this.setState({ locationPermissionGranted: false, isPermissionModalVisible: true });
    }
  };

  // 뒤로가기 이벤트 동작
  handleBackButton = () => {
    if (this.state.canGoBack) {
      if (this.state.url === "https://web-ddpfront-iad5e2alq1winnk.sel4.cloudtype.app/mapPage.html") {
        close();
      } else {
        this.webview.current.goBack();
      }
    } else {
      close();
    }
    return true;
  };

  render() {
    const { locationPermissionGranted, isPermissionModalVisible } = this.state;
    if (!locationPermissionGranted) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>위치 권한이 필요합니다.</Text>
          <TouchableOpacity onPress={() => this.setState({ isPermissionModalVisible: true })}>
            <Text style={{ color: 'blue', marginTop: 10 }}>위치 권한 허용</Text>
          </TouchableOpacity>
          <Modal
            transparent={true}
            visible={isPermissionModalVisible}
            onRequestClose={() => this.setState({ isPermissionModalVisible: false })}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                <Text>앱을 사용하려면 위치 권한을 허용해주세요.</Text>
                <TouchableOpacity
                  style={{ backgroundColor: 'blue', padding: 10, marginTop: 10, borderRadius: 5 }}
                  onPress={() => {
                    this.getLocation();
                    this.setState({ isPermissionModalVisible: false });
                  }}
                >
                  <Text style={{ color: 'white' }}>위치 권한 허용</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      );
    }

    return (
        <WebView
          style={{flex: 1}}
          source={{ uri: 'https://web-ddpfront-iad5e2alq1winnk.sel4.cloudtype.app/index.html' }}
          ref={this.webview}
          useWebKit={true} // useWebKit을 true로 설정하여 화면 확대를 막음
          onNavigationStateChange={(navState) => {
            this.setState({ url: navState.url, canGoBack: navState.canGoBack });
          }}
        />
    );
  }
}

// 종료 창
function close() {
  Alert.alert("종료하시겠어요?", "확인을 누르면 종료합니다.", [
    {
      text: "취소",
      onPress: () => {},
      style: "cancel",
    },
    { text: "확인", onPress: () => BackHandler.exitApp() },
  ]);
}