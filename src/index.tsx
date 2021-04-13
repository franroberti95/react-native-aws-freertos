import { NativeModules } from 'react-native';

type AwsFreertosType = {
  startScanBtDevices(): void;
  requestBtPermissions(): Promise<any>;
  connectDevice(macAddress: string): Promise<any>;
  disconnectDevice(macAddress: string): Promise<any>;
  saveNetworkOnConnectedDevice(
    macAddr: string,
    bssid: string,
    pw: string
  ): Promise<any>;
  getConnectedDeviceNetworks(macAddress: string): Promise<WifiInfo[]>;
  sendMyEvent(): void;
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
