import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  NativeModules,
  NativeEventEmitter,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import AwsFreertos, { BtDevice, eventKeys } from 'react-native-aws-freertos';
import { useWifiProvisioningStore } from '../store/WifiProvisioningStore';
import SelectableList from '../components/SelectableList';
import EStyleSheet from 'react-native-extended-stylesheet';
import TopContainer from '../components/TopContainer';
import Button from '../components/Button';
import { routes } from '../constants/routes';
import BottomContainer from '../components/BottomContainer';

const ScanDevice = observer(() => {
  const navigation = useNavigation();
  const store = useWifiProvisioningStore();
  const [triggerScanDisabled, setTriggerScanDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const onStartScan = () => {
    setTriggerScanDisabled(true);
    setLoading(true);
    setTimeout(() => {
      setTriggerScanDisabled(false);
      setLoading(false);
    }, 10000);
    AwsFreertos.startScanBtDevices();
  };

  useEffect(() => {
    //Clear prev devices first
    store.clearBtDevices();
    const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
    const discoverDeviceListener = eventEmitter.addListener(
      eventKeys.DID_DISCOVERED_DEVICE,
      (device: BtDevice) => {
        if (Array.isArray(device)) {
          device.forEach((d) => store.addBtDeviceFound(d));
        } else {
          store.addBtDeviceFound(device);
        }
      }
    );

    return () => {
      AwsFreertos.stopScanBtDevices();
      discoverDeviceListener.remove();
    };
  }, []);

  const onConfirmDevice = () => navigation.navigate(routes.connectDevice);

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopContainer text={'Select Device'} />
      {loading ? (
        <View style={styles.scanningContainer}>
          <Text style={styles.scanningText}>Scanning</Text>
          <ActivityIndicator color={'black'} />
        </View>
      ) : null}
      <ScrollView style={styles.pageContentContainer}>
        <SelectableList
          options={store.btDevicesFound.map((device) => ({
            value: device.macAddr,
            label: device.name,
          }))}
          onChange={(option) =>
            store.setDeviceSelected({
              macAddr: option.value.toString(),
              name: option.label,
            })
          }
          value={store.deviceSelected?.macAddr}
        />
      </ScrollView>
      <BottomContainer>
        <Button
          disabled={triggerScanDisabled}
          color={'black'}
          variant={'outlined'}
          onPress={onStartScan}
          text={'Start Scan'}
        />
        <View style={styles.buttonsSpace} />
        <Button
          disabled={!store.deviceSelected}
          color={'black'}
          variant={'outlined'}
          onPress={onConfirmDevice}
          text={'Select Device'}
        />
      </BottomContainer>
    </SafeAreaView>
  );
});

const styles = EStyleSheet.create({
  safeArea: {
    flex: 1,
  },
  pageContentContainer: {
    flexGrow: 1,
    marginTop: '1.56rem',
  },
  buttonsSpace: {
    height: '1rem',
  },
  scanningContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  scanningText: {
    marginRight: '1rem'
  }
});

export default ScanDevice;
