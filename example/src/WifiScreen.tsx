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
  const [wifiNetworks, setWifiNetworks]:[WifiInfo[],any] = useState([]);
  const { deviceMacAddress } = route.params;
  const wifiScannedNetworks: WifiInfo[] = [];

  React.useEffect(() => {
    try {
      AwsFreertos.getConnectedDeviceNetworks(deviceMacAddress);
      setIsScanningDeviceWifiNetworks(true);
      const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
      const wifiEvents: EmitterSubscription[] = [];

      wifiEvents.push(eventEmitter.addListener(
        eventKeys.DID_LIST_NETWORK,
        (network: WifiInfo) => {
          console.log(network)
          wifiScannedNetworks.push(network);
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

      const wifiInterval = setInterval(()=>{
        setWifiNetworks(arrayUtils.uniqBy(wifiScannedNetworks, (item) => item.bssid));
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
