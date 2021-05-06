import React, { useEffect, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import EStyleSheet from 'react-native-extended-stylesheet';
import Input from '../components/Input';
import Button from '../components/Button';
import AwsFreertos, { Characteristic, eventKeys } from 'react-native-aws-freertos';
import { useWifiProvisioningStore } from '../store/WifiProvisioningStore';

const Success = observer(() => {
  const [
    searchCharsButtonIsDisabled,
    setSearchCharsButtonIsDisabled,
  ] = useState(false);
  const [sv, setSv] = useState('');
  const store = useWifiProvisioningStore();

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
    const readCharacteristicsEvent = eventEmitter.addListener(
      eventKeys.DID_READ_CHARACTERISTIC_FROM_SERVICE,
      (newCharacteristic: Characteristic | Characteristic[]) => {
        console.log('Reading characteristic: ', newCharacteristic);
        if (Array.isArray(newCharacteristic)) {
          newCharacteristic.forEach((char) => addCharacteristicToStore(char));
        } else {
          addCharacteristicToStore(newCharacteristic);
        }
      }
    );
    return () => {
      readCharacteristicsEvent.remove();
    };
  }, []);

  const addCharacteristicToStore = (newCharacteristic) => {
    store.addCharacteristic(
      newCharacteristic.uuid.toUpperCase(),
      newCharacteristic.value.map((i) => String.fromCharCode(i)).join('')
    );
  };

  const onSearchCharsClick = () => {
    setSearchCharsButtonIsDisabled(true);
    console.log('Read from server: ', sv);

    setTimeout( () => setSearchCharsButtonIsDisabled(false), 5000);
    AwsFreertos.getGattCharacteristicsFromServer(
      store.deviceSelected?.macAddr,
      sv
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.successText}>
        Now your device is connected to wifi.
      </Text>
      <Text style={styles.successSubtitle}>
        You are able to read characteristics now.
      </Text>
      <View style={styles.inputContainer}>
        <Input
          label={'Server UUID'}
          onChangeText={(newSv) => setSv(newSv)}
          value={sv}
          autoFocus={true}
          toggleVisibility={false}
        />
        <View style={styles.spacer}/>
        <Button
          disabled={searchCharsButtonIsDisabled}
          color={'black'}
          variant={'outlined'}
          loading={searchCharsButtonIsDisabled}
          onPress={onSearchCharsClick}
          text={'Search Characteristics for server'}
        />
      </View>
      <ScrollView style={styles.charsContainer}>
        {
          store.characteristics &&
          Object.keys(store.characteristics).map( key =>
            <View style={styles.characteristic} key={key}>
              <Text>Key: {key}</Text>
              <Text>Value: {store.characteristics[key]}</Text>
            </View>
          )
        }
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = EStyleSheet.create({
  safeArea: {
    flex: 1,
  },
  inputContainer: {
    marginVertical: '1rem',
    paddingHorizontal: '1.5rem'
  },
  spacer: {
    height: '1rem'
  },
  successText: {
    fontSize: '1.2rem',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: '0.875rem',
    textAlign: 'center'
  },
  charsContainer: {
    flex: 1,
    paddingHorizontal: '1.5rem'
  },
  characteristic: {
    borderColor: "black",
    borderBottomWidth: 1,
    borderStyle: "solid",
    marginBottom: '0.5rem',
    paddingBottom: '0.25rem'
  }
});

export default Success;
