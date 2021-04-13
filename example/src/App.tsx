import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { routes } from './constants/routes';
import BluetoothScreen from './BluetoothScreen';
import WifiScreen from './WifiScreen';
import { Text } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={routes.bluetoothScreen}>
        <Stack.Screen name={routes.bluetoothScreen} component={BluetoothScreen} />
        <Stack.Screen
          options={({ route }) => {
            const { deviceMacAddress } = route.params;
            return {
              headerTitle: () => <Text>{deviceMacAddress}</Text>,
          }}}
          name={routes.wifiScreen}
          component={WifiScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
