import React, { useState } from 'react';

import {
  Text,
  TouchableOpacity,
  SafeAreaView,
  NativeEventEmitter,
  NativeModules,
  StyleSheet,
  EmitterSubscription,
} from 'react-native';
import AwsFreertos, { BtDevice, eventKeys } from 'react-native-aws-freertos';
import { routes } from './constants/routes';

const BluetoothScreen = ({ navigation }) => {
  const [result, setResult] = useState<BtDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingToDevice, setConnectingToDevice] = useState<BtDevice | null>(null);

  React.useEffect(() => {
    try {
      AwsFreertos.requestBtPermissions();
      const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
      const btEvents: EmitterSubscription[] = [];

      btEvents.push(
        eventEmitter.addListener(eventKeys.DID_DISCOVERED_DEVICE, (device) => {

          if(Array.isArray(device)){
            setResult([...result, ...device]);
          }else{
            if (result.some((r) => device.macAddr === r.macAddr)) return;
            setResult([...result, device]);
          }
        })
      );
      btEvents.push(
        eventEmitter.addListener(
          eventKeys.DID_DISCONNECT_DEVICE,
          (device: BtDevice) => {
            console.warn(
              'A device has been disconnected - mac: ' + device.macAddr
            );
          }
        )
      );
      btEvents.push(
        eventEmitter.addListener(
          eventKeys.DID_CONNECT_DEVICE,
          (device: BtDevice) => {
            setConnectingToDevice(false);
            setTimeout(() => {
              navigation.navigate(routes.wifiScreen, {
                  deviceMacAddress: device.macAddr,
                  deviceName: device.name,
                });
            },5000)
          }
        )
      );

      btEvents.push(
        eventEmitter.addListener(
          eventKeys.DID_FAIL_TO_CONNECT_DEVICE,
          (device: BtDevice) => {
            console.warn('FAILED TO CONNECT TO DEVICE ' + device.macAddr);
          }
        )
      );

      return () => {
        AwsFreertos.stopScanBtDevices();
        btEvents.forEach((btEvent) => btEvent.remove());
      };
    } catch (e) {
      console.warn(e);
    }
  }, []);

  let scanTimeout: NodeJS.Timeout | null = null;
  const onScanBtDevices = () => {
    if (scanTimeout !== null) {
      clearTimeout(scanTimeout);
    }
    setScanning(true);
    scanTimeout = setInterval(() => setScanning(false), 10000);
    AwsFreertos.startScanBtDevices();
  };

  const onConnectToDevice = (device: BtDevice) => () => {
    if (connectingToDevice) return;
    setConnectingToDevice(device);
    AwsFreertos.connectDevice(device.macAddr);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.scanButtonContainer}
        onPress={onScanBtDevices}
      >
        <Text style={styles.scanText}>Scan</Text>
      </TouchableOpacity>
      {connectingToDevice && (
        <Text>Connecting to device: {connectingToDevice.name}...</Text>
      )}
      {scanning && <Text>Scanning</Text>}
      {result.map((r) => (
        <TouchableOpacity
          key={r.macAddr}
          style={styles.deviceTextContainer}
          onPress={onConnectToDevice(r)}
        >
          <Text style={styles.deviceText}>{r.name}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
};
export default BluetoothScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scanButtonContainer: {
    borderRadius: 12,
    backgroundColor: '#626060',
    padding: 10,
  },
  scanText: {
    color: 'white',
    textAlign: 'center',
  },
  deviceTextContainer: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'black',
  },
  deviceText: {
    marginVertical: 10,
    fontSize: 16,
  },
});
