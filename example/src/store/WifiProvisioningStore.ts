import {makeAutoObservable} from 'mobx';
import {BtDevice, WifiInfo} from 'react-native-aws-freertos';

class WifiProvisioningStore {
  deviceSelected: BtDevice | null = null;
  networkSelected: WifiInfo | null = null;
  characteristics: any = {};

  wifiNetworksFound: WifiInfo[] = [];
  btDevicesFound: BtDevice[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  reset = () => {
    this.clearBtDevices();
    this.clearWifiNetworksFound();
    this.deviceSelected = null;
    this.networkSelected = null;
    this.characteristics = {};
  };

  clearBtDevices = () => (this.btDevicesFound = []);
  clearWifiNetworksFound = () => (this.wifiNetworksFound = []);
  addCharacteristic = (uuid: string, value: any) =>
    (this.characteristics[uuid] = value);
  addNetworkFound = (network: WifiInfo) => {
    if (!this.wifiNetworksFound.some((w) => w.bssid === network.bssid)) {
      this.wifiNetworksFound.push(network);
    }
  };
  addBtDeviceFound = (device: BtDevice) => {
    if (!device.macAddr || !device.name) {
      return;
    }
    if (!this.btDevicesFound.some((d) => d.macAddr === device.macAddr)) {
      this.btDevicesFound.push(device);
    }
  };
  setDeviceType = (deviceType: any) => (this.deviceType = deviceType);
  setDeviceSelected = (deviceSelected: BtDevice) =>
    (this.deviceSelected = deviceSelected);
  setNetworkSelected = (networkSelected: WifiInfo) =>
    (this.networkSelected = networkSelected);
}

let wifiProvisioningStore = new WifiProvisioningStore();
export const useWifiProvisioningStore = () => wifiProvisioningStore;
