import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  NativeModules,
  NativeEventEmitter,
  Text,
  Alert,
} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import AwsFreertos, { eventKeys, WifiInfo } from 'react-native-aws-freertos';
import { useWifiProvisioningStore } from '../store/WifiProvisioningStore';
import { routes } from '../constants/routes';
import Button from '../components/Button';
import SelectableList, { OptionInterface } from '../components/SelectableList';

const SelectNetwork = observer(() => {
  const store = useWifiProvisioningStore();

  useEffect(() => {
    startScan();
    const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
    let scanEventEmitter = eventEmitter.addListener(
      eventKeys.DID_LIST_NETWORK,
      (network: WifiInfo | WifiInfo[]) => {
        if (Array.isArray(network))
          network.forEach((net) => store.addNetworkFound(net));
        else store.addNetworkFound(network);
      }
    );
    return () => {
      scanEventEmitter && scanEventEmitter.remove();
    };
  }, []);
  const navigation = useNavigation();

  const startScan = () => {
    if (store.deviceSelected) {
      AwsFreertos.getConnectedDeviceAvailableNetworks(
        store.deviceSelected.macAddr
      );
    }
  };
  const onConfirmNetwork = () => {
    if (store.deviceSelected && store.networkSelected?.connected) {
      Alert.alert(
        'Wifi already saved',
        "Press 'Disconnect' to disconnect from that wifi network",
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'Disconnect',
            onPress: () => {
              AwsFreertos.disconnectNetworkOnConnectedDevice(
                store.deviceSelected?.macAddr,
                store.networkSelected?.index
              );
            },
          },
          {
            text: 'Continue',
            onPress: () => {
              navigation.navigate(routes.successScreen);
            },
            style: 'cancel',
          },
        ]
      );
    } else {
      navigation.navigate(routes.wifiPassword);
    }
  };
  const onSelectNetwork = (network: OptionInterface) =>
    store.setNetworkSelected(network.w);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.pageContentContainer}>
        <SelectableList
          onChange={onSelectNetwork}
          options={store.wifiNetworksFound.map((w) => ({
            label: w.ssid,
            value: w.bssid,
            image: () => <Text>{w.rssi}</Text>,
            title: w.connected ? 'Wi-Fi already saved.' : null,
            w,
          }))}
          value={store.networkSelected && store.networkSelected.bssid}
        />
      </ScrollView>
      <View style={styles.bottomContainer}>
        <Button
          disabled={!store.networkSelected}
          color={'black'}
          variant={'outlined'}
          onPress={onConfirmNetwork}
          text={'Connect to Selected Wi-Fi'}
        />
      </View>
    </SafeAreaView>
  );
});

const styles = EStyleSheet.create({
  safeArea: {
    flex: 1,
  },
  pageContentContainer: {
    marginTop: '1.56rem',
  },
  loadingIndicator: {
    height: '2.25rem',
    width: '2.25rem',
    color: 'black',
  },
  loadingTitle: {
    color: 'white',
    fontSize: '1.125rem',
  },
  loadingSubtitle: {
    color: 'grey',
    fontSize: '0.875rem',
  },
  loadingContainerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: '1.5rem',
    marginBottom: '1.5rem',
  },
  buttonContainer: {
    marginBottom: '2rem',
  },
});

export default SelectNetwork;
