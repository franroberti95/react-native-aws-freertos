import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import AwsFreertos, { eventKeys } from 'react-native-aws-freertos';
import { useWifiProvisioningStore } from '../store/WifiProvisioningStore';
import EStyleSheet from 'react-native-extended-stylesheet';
import { routes } from '../constants/routes';

const RECONNECT_TIMEOUT = 10000;
const IOS_SEARCH_CONNECTED_DEVICE_INTERVAL_MS = 4000;

const ConnectingDevice = observer(() => {
  const navigation = useNavigation();
  const store = useWifiProvisioningStore();

  useEffect(() => {
    if (!store.deviceSelected) return;

    AwsFreertos.connectDevice(store.deviceSelected?.macAddr);
    const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
    let deviceConnectedInterval: NodeJS.Timeout | null = null;
    const saveBtDeviceEvent = eventEmitter.addListener(
      eventKeys.DID_CONNECT_DEVICE,
      () => {
        if (Platform.OS === 'android') {
          navigation.navigate(routes.selectWifiScreen,{deviceName: store.deviceSelected?.name});
        } else {
          if (deviceConnectedInterval) {
            clearInterval(deviceConnectedInterval);
          }

          deviceConnectedInterval = setInterval(() => {
            if (store.deviceSelected)
              AwsFreertos.deviceIsConnected(store.deviceSelected?.macAddr).then(
                (r: boolean) => {
                  if (r) {
                    deviceConnectedInterval &&
                      clearInterval(deviceConnectedInterval);
                    navigation.navigate(routes.selectWifiScreen,{deviceName: store.deviceSelected?.name});
                  }
                }
              );
          }, IOS_SEARCH_CONNECTED_DEVICE_INTERVAL_MS);
        }
      }
    );
    const reconnectInterval = setInterval(() => {
      //if (store.deviceSelected)
        //AwsFreertos.connectDevice(store.deviceSelected.macAddr);
    }, RECONNECT_TIMEOUT);
    return () => {
      deviceConnectedInterval && clearInterval(deviceConnectedInterval);
      clearInterval(reconnectInterval);
      saveBtDeviceEvent && saveBtDeviceEvent.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.scanningContainer}>
        <Text style={styles.scanningText}>Connecting</Text>
        <ActivityIndicator color={'black'} />
      </View>
    </SafeAreaView>
  );
});

const styles = EStyleSheet.create({
  safeArea: {
    flex: 1,
  },
  connectingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  connectingText: {
    marginRight: '1rem',
  },
});

export default ConnectingDevice;
