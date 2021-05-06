import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { routes } from './constants/routes';
import ScanDevices from './screens/ScanDevices';
import WifiScreen from './screens/ScanWifi';
import { Text } from 'react-native';
import SuccessWifiProvision from './screens/Success';
import EStyleSheet from 'react-native-extended-stylesheet';
import ConnectingDevice from './screens/ConnectingDevice';
import WifiPassword from './screens/WiFiPassword';

const Stack = createStackNavigator();

EStyleSheet.build();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={routes.scanBluetoothDeviceScreen}>
        <Stack.Screen
          name={routes.scanBluetoothDeviceScreen}
          component={ScanDevices}
        />
        <Stack.Screen
          name={routes.successScreen}
          component={SuccessWifiProvision}
        />
        <Stack.Screen
          name={routes.connectDevice}
          component={ConnectingDevice}
        />
        <Stack.Screen
          name={routes.wifiPassword}
          component={WifiPassword}
        />
        <Stack.Screen
          options={({ route }) => {
            const { deviceName } = route.params;
            return {
              headerTitle: () => <Text>{deviceName}</Text>,
            };
          }}
          name={routes.selectWifiScreen}
          component={WifiScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
