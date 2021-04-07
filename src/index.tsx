import { NativeModules } from 'react-native';

type AwsFreertosType = {
  startScanBtDevices(callback: (item: BtDevice) => void): void;
  requestBtPermissions(): Promise<any>;
  connectDevice(macAddress: string): Promise<any>;
  disconnectDevice(): Promise<any>;
  saveNetworkOnConnectedDevice(bssid: string, pw: string): Promise<any>;
  getConnectedDeviceNetworks(): Promise<WifiInfo[]>;
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

export default AwsFreertos as AwsFreertosType;
