import { NativeModules } from 'react-native';

type AwsFreertosType = {
  startScanBtDevices(): void;
  stopScanBtDevices(): void;
  requestBtPermissions(): Promise<any>;
  connectDevice(macAddress: string): Promise<any>;
  disconnectDevice(macAddress: string): Promise<any>;
  disconnectNetworkOnConnectedDevice(
    macAddress: string,
    index: number
  ): Promise<any>;
  saveNetworkOnConnectedDevice(
    macAddress: string,
    bssid: string,
    pw: string
  ): Promise<any>;
  getConnectedDeviceAvailableNetworks(macAddress: string): Promise<WifiInfo[]>;
  triggerDidListNetwork(): void;
  getConnectedDeviceSavedNetworks(macAddress: string): Promise<WifiInfo[]>;
  deviceIsConnected(macAddress: string): Promise<boolean> /*Only ios*/;
  getGattCharacteristicsFromServer(
    macAddress: string,
    serviceUuidString: string
  ): void;
  //ios only
  getDeviceServices(deviceUuid: string): Promise<any[]>;
  setAdvertisingServiceUUIDs(uuids: string[]): void;
};

const { AwsFreertos } = NativeModules;
export interface BtDevice {
  name: string;
  macAddr: string;
}
export interface WifiInfo {
  ssid: string;
  bssid: string;
  rssi: string;
  networkType: string;
  index: number;
  connected: boolean;
}

export interface Characteristic {
  uuid: string;
  value: number[];
}

export const eventKeys = {
  // Bluetooth events
  DID_UPDATE_BLE_POWER_STATE: 'DID_UPDATE_BLE_POWER_STATE',
  DID_DISCONNECT_DEVICE: 'DID_DISCONNECT_DEVICE',
  DID_DISCOVERED_DEVICE: 'DID_DISCOVERED_DEVICE',
  DID_CONNECT_DEVICE: 'DID_CONNECT_DEVICE',
  DID_FAIL_TO_CONNECT_DEVICE: 'DID_FAIL_TO_CONNECT_DEVICE',
  DID_READ_CHARACTERISTIC_FROM_SERVICE: 'DID_READ_CHARACTERISTIC_FROM_SERVICE',

  // Wifi events of paired up device
  DID_LIST_NETWORK: 'DID_LIST_NETWORK',
  DID_SAVE_NETWORK: 'DID_SAVE_NETWORK',
  ERROR_SAVE_NETWORK: 'ERROR_SAVE_NETWORK',
  DID_EDIT_NETWORK: 'DID_EDIT_NETWORK',
  DID_DELETE_NETWORK: 'DID_DELETE_NETWORK',
};

export default AwsFreertos as AwsFreertosType;
