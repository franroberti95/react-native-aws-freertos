import React, { useEffect, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import { observer } from 'mobx-react-lite';
import Button from '../components/Button';
import Input from '../components/Input';
import { useWifiProvisioningStore } from '../store/WifiProvisioningStore';
import { routes } from '../constants/routes';
import { useNavigation } from '@react-navigation/native';
import AwsFreertos, { eventKeys, WifiInfo } from 'react-native-aws-freertos';
import BottomContainer from '../components/BottomContainer';

const WifiPassword = observer(() => {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const store = useWifiProvisioningStore();
  const navigation = useNavigation();
  const [wifiProvisionError, setWifiProvisionError] = useState(false);

  let errorTimeout: NodeJS.Timeout | null = null;
  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
    const saveNetworkEvent = eventEmitter.addListener(
      eventKeys.DID_SAVE_NETWORK,
      (wifi: WifiInfo) => {
        console.log(
          'CONNECTED TO NETWORK! Reading characteristics now -> ',
          wifi.ssid
        );
        clearTimeout(errorTimeout);
        navigation.replace(routes.successScreen);
      }
    );

    const errorEvent = eventEmitter.addListener(
      eventKeys.ERROR_SAVE_NETWORK,
      () => {
        console.log('ERROR CONNECTING TO NETWORK!');
        clearTimeout(errorTimeout);
        setWifiProvisionError(true);
        setLoading(false);
      }
    );
    return () => {
      saveNetworkEvent.remove();
      errorEvent.remove();
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, []);

  const onConfirmPassword = () => {
    errorTimeout = setTimeout(() => {
      setWifiProvisionError(true);
      setLoading(false);
    }, 5000);
    if (store.deviceSelected && store.networkSelected) {
      setWifiProvisionError(false);
      setLoading(true);
      AwsFreertos.saveNetworkOnConnectedDevice(
        store.deviceSelected.macAddr,
        store.networkSelected.bssid,
        pw
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {wifiProvisionError ? (
        <View style={styles.errorContainer}>
          <View>
            <Text style={styles.errorTextTitle}>⚠</Text>
          </View>
          <View style={styles.errorTextsContainer}>
            <Text style={styles.errorTextTitle}>
              Failed to connect to network
            </Text>
            <Text style={styles.errorTextSubtitle}>
              Make sure your password is correct and try again
            </Text>
          </View>
        </View>
      ) : null}
      <ScrollView
        style={[
          styles.pageContentContainer,
          wifiProvisionError ? styles.pageContainerWithError : {},
        ]}
        keyboardShouldPersistTaps={'handled'}
      >
        <Input
          label={"Wi-Fi Password"}
          onChangeText={(pw) => setPw(pw)}
          value={pw}
          autoFocus={true}
          toggleVisibility={true}
        />
      </ScrollView>
      <BottomContainer>
        <Button
          disabled={!pw || pw.length < 8 || loading}
          color={'black'}
          variant={'outlined'}
          loading={loading}
          onPress={onConfirmPassword}
          text={"Connect to Wi-Fi"}
        />
      </BottomContainer>
    </SafeAreaView>
  );
});

const styles = EStyleSheet.create({
  safeArea: {
    flex: 1,
  },
  pageContainerWithError: {
    marginTop: '1.4rem',
  },
  errorContainer: {
    marginTop: '1.5rem',
    marginHorizontal: '1.5rem',
    padding: '1rem',
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#FF5B54',
    borderRadius: 12,
    backgroundColor: 'rgba(217,51,43,0.2)',
  },
  errorTextsContainer: {
    flexGrow: 1,
    paddingRight: '1rem',
    paddingLeft: '0.5rem',
  },
  errorTextTitle: {
    fontWeight: 'bold',
    fontSize: '0.875rem',
    color: 'white',
  },
  errorTextSubtitle: {
    fontSize: '0.875rem',
    color: 'white',
  },
  pageContentContainer: {
    paddingHorizontal: '1.5rem',
    marginTop: '8.5rem',
  },
  loadingIndicator: {
    height: '2.25rem',
    width: '2.25rem',
    color: 'black',
  },
  loadingTitle: {
    color: 'black',
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
  subtitle: {
    fontSize: '1rem',
    color: 'grey',
    textAlign: 'center',
  },
});

export default WifiPassword;
