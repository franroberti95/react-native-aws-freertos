import React, { useEffect, useState } from 'react';
import { NativeEventEmitter, View, NativeModules, SafeAreaView, StyleSheet, Text } from 'react-native';
import AwsFreertos, { Characteristic, eventKeys } from 'react-native-aws-freertos';

const SuccessWifiProvision = ({ route }) => {
  const { deviceMacAddress, wifiSsid } = route.params;
  const [characteristics, setCharacteristic] = useState(null);
  const intervalCharacteristics = [];

  useEffect(() => {
    AwsFreertos.getGattCharacteristicsFromServer(
      deviceMacAddress, 'ad3cee4a-c6d0-4b38-aed6-5459813c5847');
    const eventEmitter = new NativeEventEmitter(NativeModules.AwsFreertos);
    const event = eventEmitter.addListener(
      eventKeys.DID_READ_CHARACTERISTIC_FROM_SERVICE,
      (newCharacteristic: Characteristic) => {
        newCharacteristic.value
        if(newCharacteristic.value){
          console.log("DASDASD -> ", newCharacteristic.value.map( i => String.fromCharCode(i)).join(''))
        }
        intervalCharacteristics.push(newCharacteristic);
      }
    )

    const interval = setInterval( () => {
      setCharacteristic(intervalCharacteristics);
    }, 2000);

    return () => {
      clearInterval(interval)
      event.remove();
    }
  },[])

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Text>Device with Mac Adrr: {deviceMacAddress}</Text>
      <Text>Connected to: {wifiSsid}</Text>
      {
        characteristics &&
          characteristics.map( characteristic =>
            <View style={styles.characteristicsContainer} key={characteristic.uuid}>
              <Text>Characteristic:</Text>
              <Text> > uuid: {characteristic.uuid}</Text>
              <Text> > value: {characteristic.value}</Text>
            </View>
          )
      }
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characteristicsContainer: {
    borderRadius: 12,
    borderColor: 'black',
    borderWidth: 2,
    borderStyle: 'solid',
    padding: 10
  }
});

export default SuccessWifiProvision;
