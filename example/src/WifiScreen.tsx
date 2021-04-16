import React, { useState } from 'react';
import AwsFreertos, { eventKeys, WifiInfo } from 'react-native-aws-freertos';
import {
  Alert,
  Button,
  EmitterSubscription,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  NativeEventEmitter,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Input from './components/Input';
import { routes } from './constants/routes';
import { arrayUtils } from './utils/array';

const WifiScreen = ({ route, navigation }) => {
  const [
    isScanningDeviceWifiNetworks,
    setIsScanningDeviceWifiNetworks,
  ] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [pwValue, setPwValue] = useState('Enzoni10');
  const [errorSavingNetwork, setErrorSavingNetwork] = useState(false);
  const [availableWifiNetworks, setAvailableWifiNetworks]: [
    WifiInfo[],
    any
  ] = useState([]);
  const [networkToDelete, setNetworkToDelete]: [
    WifiInfo | null,
    any
  ] = useState(null);
  const { deviceMacAddress } = route.params;
  const wifiAvailableScannedNetworks: WifiInfo[] = [];

  React.useEffect(() => {
    try {
      AwsFreertos.getConnectedDeviceAvailableNetworks(deviceMacAddress);
      setIsScanningDeviceWifiNetworks(true);
      const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
      const wifiEvents: EmitterSubscription[] = [];

      wifiEvents.push(
        eventEmitter.addListener(
          eventKeys.DID_LIST_NETWORK,
          (network: WifiInfo) => {
            wifiAvailableScannedNetworks.push(network);
          }
        )
      );
      wifiEvents.push(
        eventEmitter.addListener(
          eventKeys.DID_SAVE_NETWORK,
          (wifi: WifiInfo) => {
            setErrorSavingNetwork(false)
            navigation.navigate(routes.successScreen, {
              deviceMacAddress,
              wifiSsid: wifi && wifi.ssid,
            });
          }
        )
      );

      wifiEvents.push(
        eventEmitter.addListener(eventKeys.ERROR_SAVE_NETWORK, () => {
          setErrorSavingNetwork(true);
        })
      );

      wifiEvents.push(
        eventEmitter.addListener(eventKeys.DID_DELETE_NETWORK, () => {
          setNetworkToDelete(null);
          setAvailableWifiNetworks([]);
          AwsFreertos.getConnectedDeviceAvailableNetworks(deviceMacAddress);
        })
      );

      const wifiInterval = setInterval(() => {
        setAvailableWifiNetworks(
          arrayUtils.uniqBy(
            wifiAvailableScannedNetworks,
            (a, b) => a.bssid === b.bssid
          )
        );
      }, 2000);

      return () => {
        clearInterval(wifiInterval);
        wifiEvents.forEach((event) => event.remove());
      };
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const onConnectToNetwork = (network: WifiInfo) => () => {
    AwsFreertos.saveNetworkOnConnectedDevice(
      deviceMacAddress,
      network.bssid,
      pwValue
    );
  };

  const disconnectFromNetwork = (network: WifiInfo) => {
    if (networkToDelete) return;
    setNetworkToDelete(network);
    AwsFreertos.disconnectNetworkOnConnectedDevice(
      deviceMacAddress,
      network.index
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {errorSavingNetwork && <Text>Error saving network</Text>}
      {isScanningDeviceWifiNetworks && <Text>Scanning wifi networks</Text>}
      <Text>Wifi available networks</Text>
      {availableWifiNetworks && availableWifiNetworks.length > 0 && (
        <ScrollView style={{ height: 250 }}>
          {availableWifiNetworks.map((network, k) => (
            <View key={network.bssid}>
              <View key={network.bssid} style={styles.networkTextContainer}>
                <TouchableOpacity
                  onPress={() => {
                    network.connected
                      ? disconnectFromNetwork(network)
                      : selectedNetwork &&
                        selectedNetwork.bssid === network.bssid
                      ? setSelectedNetwork(null)
                      : setSelectedNetwork(network);
                  }}
                >
                  <Text>
                    {network.connected
                      ? 'Connected, touch to disconnect: ' + network.ssid
                      : 'Touch to connect to : ' + network.ssid}
                  </Text>
                </TouchableOpacity>
                {network.connected && (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate(routes.successScreen, {
                        deviceMacAddress,
                        wifiSsid: network.ssid,
                      });
                    }}
                  >
                    <Text>Skip</Text>
                  </TouchableOpacity>
                )}
              </View>
              {selectedNetwork && selectedNetwork.bssid === network.bssid && (
                <>
                  <Input
                    value={pwValue}
                    onChangeText={(val) => setPwValue(val)}
                    autoFocus={true}
                    label={'Password'}
                    toggleVisibility={true}
                  />
                  <Button title="OK" onPress={onConnectToNetwork(network)} />
                </>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  networkTextContainer: {
    paddingVertical: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default WifiScreen;
