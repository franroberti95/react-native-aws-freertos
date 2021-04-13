import React, { useState } from 'react';
import AwsFreertos, { WifiInfo } from 'react-native-aws-freertos';
import { Alert, Button, SafeAreaView, ScrollView } from 'react-native';
import {
  NativeEventEmitter,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Input from "./components/Input";

const WifiScreen = ({ route }) => {
  const [isScanningDeviceWifiNetworks, setIsScanningDeviceWifiNetworks] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [wifiNetworks, setWifiNetworks]:[WifiInfo[],any] = useState([]);
  const SCAN_DEVICE_NETWORKS_EVENT_KEY = 'SCAN_DEVICE_NETWORKS';
  const { deviceMacAddress } = route.params;
  const wifiScannedNetworks: WifiInfo[] = [];

  React.useEffect(() => {
    try {
      AwsFreertos.getConnectedDeviceNetworks(deviceMacAddress);
      setIsScanningDeviceWifiNetworks(true);
      const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
      const wifiEvent = eventEmitter.addListener(
        SCAN_DEVICE_NETWORKS_EVENT_KEY,
        onNetworkDiscovered
      );
      const wifiInterval = setInterval(()=>{
        if(wifiScannedNetworks.length !== wifiNetworks.length)
          setWifiNetworks(wifiScannedNetworks);
      }, 1000)

      return () => {
        clearInterval(wifiInterval);
        wifiEvent.remove();
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);
  const onNetworkDiscovered = (network: WifiInfo) => {
    if (wifiNetworks.find((r) => network.ssid === r.ssid)) return;
    wifiScannedNetworks.push(network);
  }

  const onConnectToNetwork = (network: WifiInfo) => () => {
    AwsFreertos.saveNetworkOnConnectedDevice(deviceMacAddress, network.bssid, pwValue);
  };

  return (
    <SafeAreaView style={{flex:1}}>
      {isScanningDeviceWifiNetworks && <Text>Scanning wifi networks</Text>}
      <Text>Wifi networks</Text>
      {wifiNetworks && wifiNetworks.length > 0 && (
        <ScrollView style={{height: 300, display: 'flex', flexDirection: 'column'}}>
          {wifiNetworks.map((network, k) => (
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
