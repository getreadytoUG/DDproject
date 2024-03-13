import React, {useRef} from "react";
import { View, Platform, BackHandler, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as Notifications from "expo-notifications";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.responseListener = React.createRef();
    this.notificationListener = React.createRef();
    this.state = {
      pushToken: "",
      notification: false,
      url: "",
      canGoBack: false,
      isWebViewVisible: true,
    };
    this.webview = React.createRef();
  }

  // 생성된 토큰을 서버로 전송
  sendTokenToServer = async (token, id) => {
    console.log(token);
    console.log(id);
    console.log(JSON.stringify({ token, id }));

    try {
      const response = await fetch('https://port-0-ddproject-iad5e2alq1winnk.sel4.cloudtype.app/api/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, id }),
      });

      if (!response.ok) {
        console.error('Error sending token to server! Status:', response.status);
        return;
      }
      const result = await response.json();
      // console.log(result);
    } catch (error) {
      console.error('Error sending token to server!:', error);
    }
  };

  handleBackButton = () => {
    if (this.state.canGoBack) {
      if (this.state.url === "https://web-ddproject-m-iad5e2alq1winnk.sel4.cloudtype.app/index.html") {
        this.close();
      } else {
        this.webview.current.goBack();
      }
    } else {
      this.close();
    }
    return true;
  };

  close = () => {
    Alert.alert("종료하시겠어요?", "확인을 누르면 종료합니다.", [
      {
        text: "취소",
        onPress: () => { },
        style: "cancel",
      },
      { text: "확인", onPress: () => BackHandler.exitApp() },
    ]);
  };

  async componentDidMount() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== "granted") {
      alert("알림이 거부 되었습니다.");
      console.log("알림 거부");
    } else {
      const { data } = await Notifications.getExpoPushTokenAsync();
      this.setState({ pushToken: data });
      alert("알림이 설정 되었습니다.");
      console.log("알림설정");
    }

    Notifications.addNotificationReceivedListener(async (notification) => {

      const useData = JSON.parse(notification.request.content.body);
      const message = useData.message;
      const userId = useData.userId;
      // WebView 내의 특정 함수 호출 (예: myFunctionInWebView)
      if (this.state.isWebViewVisible) {
        // console.log( result)
        const testData = this.webview.current;
        if(testData){
          const sendData = JSON.stringify({
            message,
            userId
          });
          console.log("sendData", sendData)
          console.log(this.webview.current.postMessage)
          this.webview.current.postMessage(sendData)
        }else {
          console.error("WebView is null. Cannot call postMessage.");
        }
        
      } else {
        // 화면이 꺼져 있을 때 푸시 메시지와 함께 JavaScript 함수 호출
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "승차 알림",
            body: `${useData.message}에서 승차 예정`,
          },
          trigger: null,
        });
      }
    });

    this.notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      this.setState({ notification: notification });
    });

    this.responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // console.log(response);
    });

    BackHandler.addEventListener("hardwareBackPress", this.handleBackButton);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackButton);
    Notifications.removeNotificationSubscription(this.responseListener.current);
    Notifications.removeNotificationSubscription(this.notificationListener.current);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: "https://web-ddproject-m-iad5e2alq1winnk.sel4.cloudtype.app" }}
          ref={this.webview}
          onNavigationStateChange={(navState) => {
            this.setState({ url: navState.url, canGoBack: navState.canGoBack });
          }}
          onLoadStart={() => console.log('WebView is starting to load')}
          onLayout={(event) => console.log('WebView layout event:', event.nativeEvent.layout)}
          onLoadEnd={() => console.log('WebView has finished loading', this.webview.current)}

          // WebView에서 발생한 이벤트 처리
          onMessage={(event) => {
            // 웹뷰에서 전달된 메시지 처리
            const data = JSON.parse(event.nativeEvent.data);
            console.log('Received message:', event.nativeEvent.data);
            if (data.type === 'sendTokenToServer') {
              // WebView에서 보낸 푸시 알림 요청 처리
              if (this.state.pushToken) {
                this.sendTokenToServer(this.state.pushToken, data.message);
              } else {
                console.error('pushToken이 비어 있습니다.');
              }
            }
          }}
        />
      </View>
    );
  }
}