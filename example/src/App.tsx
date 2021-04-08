import React, { useState } from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import AwsFreertos, { BtDevice } from 'react-native-aws-freertos';

export default function App() {
  const [result, setResult] = useState<BtDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  let btEventEmitter: any = null;
  React.useEffect(() => {
    try {
      AwsFreertos.requestBtPermissions();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const onScanBtDevices = () => {
    setScanning(true);
    AwsFreertos.startScanBtDevices();

    const eventEmitter = new NativeEventEmitter(NativeModules.ToastExample);
    btEventEmitter = eventEmitter.addListener('SCAN_BT_DEVICE', (device) => {
      if (result.some((r) => device.macAddr === r.macAddr)) return;
      setResult([...result, device]);
    });
  };

  const onStopScan = () => {
    btEventEmitter && btEventEmitter.remove();
  };

  const onConnectToDevice = (device: BtDevice) => () => {
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
      {scanning && <Text>Scanning</Text>}
      {result.map((r) => (
        <TouchableOpacity
          style={styles.deviceTextContainer}
          onPress={onConnectToDevice(r)}
        >
          <Text style={styles.deviceText}>{r.macAddr}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

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
