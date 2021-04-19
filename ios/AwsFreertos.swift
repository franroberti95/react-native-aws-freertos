import Foundation
import AmazonFreeRTOS
import AWSMobileClient


enum EventsEnum: String {
    case DID_UPDATE_BLE_POWER_STATE = "DID_UPDATE_BLE_POWER_STATE"
    case DID_DISCONNECT_DEVICE = "DID_DISCONNECT_DEVICE"
    case DID_DISCOVERED_DEVICE = "DID_DISCOVERED_DEVICE"
    case DID_CONNECT_DEVICE = "DID_CONNECT_DEVICE"
    case DID_FAIL_TO_CONNECT_DEVICE = "DID_FAIL_TO_CONNECT_DEVICE"
    case DID_READ_CHARACTERISTIC_FROM_SERVICE = "DID_READ_CHARACTERISTIC_FROM_SERVICE"
    case DID_LIST_NETWORK = "DID_LIST_NETWORK"
    case DID_SAVE_NETWORK = "DID_SAVE_NETWORK"
    case DID_EDIT_NETWORK = "DID_EDIT_NETWORK"
    case DID_DELETE_NETWORK = "DID_DELETE_NETWORK"
}


@objc(AwsFreertos)
class AwsFreertos: RCTEventEmitter {
    
    var lastConnectedDevice: AmazonFreeRTOSDevice?

    @objc
    override func supportedEvents() -> [String]! {
        return [
            EventsEnum.DID_DISCOVERED_DEVICE.rawValue,
            EventsEnum.DID_CONNECT_DEVICE.rawValue,
            EventsEnum.DID_DELETE_NETWORK.rawValue,
            EventsEnum.DID_DISCONNECT_DEVICE.rawValue,
            EventsEnum.DID_EDIT_NETWORK.rawValue,
            EventsEnum.DID_FAIL_TO_CONNECT_DEVICE.rawValue,
            EventsEnum.DID_LIST_NETWORK.rawValue,
            EventsEnum.DID_READ_CHARACTERISTIC_FROM_SERVICE.rawValue,
            EventsEnum.DID_SAVE_NETWORK.rawValue,
            EventsEnum.DID_UPDATE_BLE_POWER_STATE.rawValue
        ];
    }
    
    @objc(requestBtPermissions:withRejecter:)
    func requestBtPermissions(_ resolve:RCTPromiseResolveBlock,withRejecter reject:RCTPromiseRejectBlock) -> Void {

        // Bluetooth - Add observe for AmazonFreeRTOSManager NSNotifications
        NotificationCenter.default.addObserver(self, selector: #selector(self.receivedBtDevice), name: .afrCentralManagerDidDiscoverDevice, object: nil)
        
        NotificationCenter.default.addObserver(self, selector: #selector(self.didUpdateState), name: .afrCentralManagerDidUpdateState, object: nil)
        
        NotificationCenter.default.addObserver(self, selector: #selector(self.didDisconnectDevice), name: .afrCentralManagerDidDisconnectDevice, object: nil)
        
        NotificationCenter.default.addObserver(self, selector: #selector(self.didConnectDevice), name: .afrCentralManagerDidConnectDevice, object: nil)

        NotificationCenter.default.addObserver(self, selector: #selector(self.didFailToConnectDevice), name: .afrCentralManagerDidFailToConnectDevice, object: nil)
        
        // Wifi - Add observe for AmazonFreeRTOSManager NSNotifications
        NotificationCenter.default.addObserver(self, selector: #selector(self.didListNetwork), name: .afrDidListNetwork, object: nil)
        
        NotificationCenter.default.addObserver(self, selector: #selector(self.didSaveNetwork), name: .afrDidSaveNetwork, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(self.didEditNetwork), name: .afrDidEditNetwork, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(self.didDeleteNetwork), name: .afrDidDeleteNetwork, object: nil)

        
        resolve("OK")
    }

    @objc(didEditNetwork)
    func didEditNetwork() -> Void {
        self.sendEvent(withName:EventsEnum.DID_EDIT_NETWORK.rawValue, body: "NETWORK EDITED");
    }

    @objc(didDeleteNetwork)
    func didDeleteNetwork() -> Void {
        self.sendEvent(withName:EventsEnum.DID_DELETE_NETWORK.rawValue, body: "NETWORK DELETED");
    }
    
    @objc(didFailToConnectDevice)
    func didFailToConnectDevice() -> Void {
        self.sendEvent(withName:EventsEnum.DID_FAIL_TO_CONNECT_DEVICE.rawValue, body: "FAIL");
    }
    
    @objc(didSaveNetwork)
    func didSaveNetwork() -> Void {
        let result: NSMutableDictionary = [:]
        result["macAddr"] = lastConnectedDevice!.peripheral.identifier.uuidString
        result["name"] = lastConnectedDevice!.peripheral.name
        self.sendEvent(withName:EventsEnum.DID_SAVE_NETWORK.rawValue, body: result);
    }
    
    @objc(didConnectDevice)
    func didConnectDevice() -> Void {
        let result: NSMutableDictionary = [:]
        result["macAddr"] = lastConnectedDevice!.peripheral.identifier.uuidString
        result["name"] = lastConnectedDevice!.peripheral.name
        self.sendEvent(withName:EventsEnum.DID_CONNECT_DEVICE.rawValue, body: result);
    }
    
    @objc(didDisconnectDevice)
    func didDisconnectDevice() -> Void {
        if(lastConnectedDevice != nil){
            let result: NSMutableDictionary = [:]
            result["macAddr"] = lastConnectedDevice!.peripheral.identifier.uuidString
            result["name"] = lastConnectedDevice!.peripheral.name
            self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE.rawValue, body: result);
        }else{
            self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE.rawValue, body: "A device has been disconnected");
        }
    }
    
    @objc(didUpdateState)
    func didUpdateState() -> Void {
        let result: NSMutableDictionary = [:]
        result["powered"] = AmazonFreeRTOSManager.shared.central?.state == .poweredOn
        self.sendEvent(withName:EventsEnum.DID_UPDATE_BLE_POWER_STATE.rawValue, body: result);
    }
    
    @objc(receivedBtDevice)
    func receivedBtDevice() -> Void {
        let result: NSMutableArray = []
        
        for (_, item) in AmazonFreeRTOSManager.shared.devices {
            let auxDic: NSMutableDictionary = [:]
            auxDic["macAddr"] = item.peripheral.identifier.uuidString
            auxDic["name"] = item.peripheral.name
            result.add(auxDic)
        }
        self.sendEvent(withName:EventsEnum.DID_DISCOVERED_DEVICE.rawValue, body: result);
    }
    
    @objc(startScanBtDevices)
    func startScanBtDevices() -> Void {
        if AmazonFreeRTOSManager.shared.central?.state == .poweredOn {
            AmazonFreeRTOSManager.shared.startScanForDevices()
            return
        }

        AmazonFreeRTOSManager.shared.stopScanForDevices()
    }
    
    @objc(stopScanBtDevices)
    func stopScanBtDevices() -> Void {
        AmazonFreeRTOSManager.shared.stopScanForDevices()
    }
    
    @objc(stopScanBtDevices)
    func stopScanBtDevices() -> Void {
        AmazonFreeRTOSManager.shared.stopScanForDevices()
    }
    
    @objc(rescanForBtDevices)
    func rescanForDevices() -> Void {
        AmazonFreeRTOSManager.shared.rescanForDevices()
    }
    
    @objc
    func didListNetwork() {
        let result: NSMutableArray = []
    
        if(lastConnectedDevice != nil && lastConnectedDevice?.scanedNetworks != nil) {
            for item in lastConnectedDevice?.scanedNetworks ?? [] {
              let yourAuxDic: NSMutableDictionary = [:]
                yourAuxDic["bssid"] = item.bssid
                yourAuxDic["ssid"] = item.ssid
                yourAuxDic["rssi"] = item.rssi
                yourAuxDic["networkType"] = item.security
                yourAuxDic["index"] = item.index
                yourAuxDic["connected"] = item.connected
            
              result.add(yourAuxDic)
            }
            self.sendEvent(withName:EventsEnum.DID_LIST_NETWORK.rawValue, body: result);
        }
    }
    
    @objc(connectDevice:withResolver:withRejecter:)
    func connectDevice(_ uuid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            device.connect(reconnect: true, credentialsProvider: AWSMobileClient.default())
            self.lastConnectedDevice = device
            resolve("OK")
            
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
    @objc(disconnectDevice:withResolver:withRejecter:)
    func disconnectDevice(_ uuid: String,resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            device.disconnect()
            resolve("OK")
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
    
    
    @objc(getGattCharacteristicsFromServer:withServiceUuidString:)
    func getGattCharacteristicsFromServer(_ macAddress: String, serviceUuid: String) -> Void {
    }
    
    @objc(disconnectNetworkOnConnectedDevice:withIndex:withResolver:withRejecter:)
    func disconnectNetworkOnConnectedDevice(_ uuid: String, index: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve("OK")
    }
    
    @objc(saveNetworkOnConnectedDevice:widthBssid:withPw:withResolver:withRejecter:)
    func saveNetworkOnConnectedDevice(_ uuid: String, bssid: String, pw: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        
        
        let device = AmazonFreeRTOSManager.shared.devices.values.first(where: {$0.peripheral.identifier.uuidString == uuid})
        if(device == nil){
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
        
        let networks = device?.scanedNetworks
        
        if let network = networks?.first(where: {String(($0.bssid.map { String(format: "%02x", $0) }.joined()).enumerated().map { $0 > 0 && $0 % 2 == 0 ? [":", $1] : [$1] }.joined()) == bssid}) {
            
            device?.saveNetwork(SaveNetworkReq(index: network.index, ssid: network.ssid, bssid: network.bssid, psk: pw, security: network.security, connect: true))
            
            resolve("OK")
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
    
    @objc(getConnectedDeviceAvailableNetworks:withResolver:withRejecter:)
    func getConnectedDeviceAvailableNetworks(_ uuid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            device.listNetwork(ListNetworkReq(maxNetworks: 10, timeout: 3))
            resolve("OK")
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
}
