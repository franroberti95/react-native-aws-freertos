import React, { useState } from 'react';

import {
  Text,
  TouchableOpacity,
  SafeAreaView,
  NativeEventEmitter,
  NativeModules,
  StyleSheet,
} from 'react-native';
import AwsFreertos, { BtDevice } from 'react-native-aws-freertos';
import { routes } from './constants/routes';

const SCAN_BT_DEVICE_EVENT_KEY = 'SCAN_BT_DEVICE';

const BluetoothScreen = ({ navigation }) => {
  const [result, setResult] = useState<BtDevice[]>([]);
  const [scanning, setScanning] = useState(false);

  React.useEffect(() => {
    try {
      AwsFreertos.requestBtPermissions();
      const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
      const btEvent = eventEmitter.addListener(
        SCAN_BT_DEVICE_EVENT_KEY,
        (device) => {
          if (result.some((r) => device.macAddr === r.macAddr)) return;
          setResult([...result, device]);
        }
      );
      return () => btEvent.remove();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const onScanBtDevices = () => {
    setScanning(true);
    AwsFreertos.startScanBtDevices();
  };

  const onConnectToDevice = (device: BtDevice) => () => {
//    AwsFreertos.disconnectDevice(device.macAddr)
//      .then( () => {
        AwsFreertos.connectDevice(device.macAddr)
          .then(() => {
            navigation.navigate(routes.wifiScreen, {
              deviceMacAddress: device.macAddr,
            });
          })
          .catch((e) => {
            console.warn('COULD NOT CONNECT',e);
          });

//      })
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
          key={r.macAddr}
          style={styles.deviceTextContainer}
          onPress={onConnectToDevice(r)}
        >
          <Text style={styles.deviceText}>{r.macAddr}</Text>
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
