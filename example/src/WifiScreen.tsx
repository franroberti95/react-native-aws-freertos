import React, { useState } from 'react';
import AwsFreertos, { eventKeys, WifiInfo } from 'react-native-aws-freertos';
import { Alert, Button, EmitterSubscription, SafeAreaView, ScrollView } from 'react-native';
import {
  NativeEventEmitter,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Input from "./components/Input";
import { routes } from './constants/routes';
import { arrayUtils } from './utils/array';

const WifiScreen = ({ route, navigation }) => {
  const [isScanningDeviceWifiNetworks, setIsScanningDeviceWifiNetworks] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [pwValue, setPwValue] = useState('Enzoni10');
  const [availableWifiNetworks, setAvailableWifiNetworks]:[WifiInfo[],any] = useState([]);
  const [savedWifiNetworks, setSavedWifiNetworks]:[WifiInfo[],any] = useState([]);
  const [networkToDelete, setNetworkToDelete]:[WifiInfo|null,any] = useState(null);
  const { deviceMacAddress } = route.params;
  const wifiAvailableScannedNetworks: WifiInfo[] = [];
  const wifiSavedScannedNetworks: WifiInfo[] = [];

  React.useEffect(() => {
    try {
      AwsFreertos.getConnectedDeviceAvailableNetworks(deviceMacAddress);
      setIsScanningDeviceWifiNetworks(true);
      const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
      const wifiEvents: EmitterSubscription[] = [];

      wifiEvents.push(eventEmitter.addListener(
        eventKeys.DID_LIST_NETWORK,
        (network: WifiInfo) => {
          if(network.connected)
            wifiAvailableScannedNetworks.push(network);
          else
            wifiSavedScannedNetworks.push(network)
        }
      ));
      wifiEvents.push(eventEmitter.addListener(
        eventKeys.DID_SAVE_NETWORK,
        (wifi: WifiInfo) => {
          navigation.navigate(routes.successScreen, {
            deviceMacAddress,
            wifiSsid: wifi && wifi.ssid
          });
        }
      ));

      wifiEvents.push(eventEmitter.addListener(
        eventKeys.DID_DELETE_NETWORK,
        () => {
          setSavedWifiNetworks(savedWifiNetworks.filter( wifi => wifi.bssid !== networkToDelete?.bssid))
          setNetworkToDelete(null);
        }
      ));

      const wifiInterval = setInterval(()=>{
        setAvailableWifiNetworks(arrayUtils.uniqBy(wifiAvailableScannedNetworks, (item) => item.bssid));
        setSavedWifiNetworks(arrayUtils.uniqBy(wifiSavedScannedNetworks, (item) => item.bssid));
      }, 2000)

      return () => {
        clearInterval(wifiInterval);
        wifiEvents.forEach( event => event.remove());
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const onConnectToNetwork = (network: WifiInfo) => () => {
    AwsFreertos.saveNetworkOnConnectedDevice(deviceMacAddress, network.bssid, pwValue);
  };

  const disconnectFromNetwork = (network: WifiInfo) => () => {
    if(networkToDelete) return;
    setNetworkToDelete(network)
    AwsFreertos.disconnectNetwork(deviceMacAddress,network.bssid)
  }

  return (
    <SafeAreaView style={{flex:1}}>
      {isScanningDeviceWifiNetworks && <Text>Scanning wifi networks</Text>}
      <Text>Wifi connected networks</Text>
      {savedWifiNetworks && savedWifiNetworks.length > 0 && (
        <ScrollView style={{height: 500}}>
          {availableWifiNetworks.map((network) => (
            <View key={network.bssid}>
              <TouchableOpacity
                key={network.bssid}
                style={styles.networkTextContainer}
                onPress={disconnectFromNetwork(network)}
              >
                <Text>
                  {
                    networkToDelete && networkToDelete.bssid === network.bssid ?
                      `Disconnecting from network: ${network.ssid}`:
                      `-> Touch to disconnect from: ${network.ssid}`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <Text>Wifi available networks</Text>
      {availableWifiNetworks && availableWifiNetworks.length > 0 && (
        <ScrollView style={{height: 500}}>
          {availableWifiNetworks.map((network, k) => (
            <View key={network.bssid}>
              <TouchableOpacity
                key={network.bssid}
                style={styles.networkTextContainer}
                onPress={()=> selectedNetwork && selectedNetwork.bssid === network.bssid ? setSelectedNetwork(null):setSelectedNetwork(network)}
              >
                <Text>
                  -> Touch to connect to: {network.ssid}
                </Text>
              </TouchableOpacity>
              {
                selectedNetwork && selectedNetwork.bssid === network.bssid &&
                  <>
                    <Input
                      value={pwValue}
                      onChangeText={val =>setPwValue(val)}
                      autoFocus={true}
                      label={"Password"}
                      toggleVisibility={true}
                    />
                    <Button title='OK' onPress={onConnectToNetwork(network)}/>
                  </>
              }
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  networkTextContainer: {
    paddingVertical: 16
  }
});

export default WifiScreen;
