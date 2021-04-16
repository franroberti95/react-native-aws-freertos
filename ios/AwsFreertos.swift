import Foundation
import AmazonFreeRTOS
import AWSMobileClient

@objc(AwsFreertos)
class AwsFreertos: RCTEventEmitter {
    
    var lastConnectedDevice: AmazonFreeRTOSDevice?

    @objc
    override func supportedEvents() -> [String]! {
        return [
            EventsEnum.DID_DISCOVERED_DEVICE,
            EventsEnum.DID_CONNECT_DEVICE,
            EventsEnum.DID_DELETE_NETWORK,
            EventsEnum.DID_DISCONNECT_DEVICE,
            EventsEnum.DID_EDIT_NETWORK,
            EventsEnum.DID_FAIL_TO_CONNECT_DEVICE,
            EventsEnum.DID_LIST_NETWORK,
            EventsEnum.DID_READ_CHARACTERISTIC_FROM_SERVICE,
            EventsEnum.DID_SAVE_NETWORK,
            EventsEnum.DID_UPDATE_BLE_POWER_STATE
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
    
    
    @objc(didFailToConnectDevice)
    func didFailToConnectDevice() -> Void {
        self.sendEvent(withName:EventsEnum.DID_FAIL_TO_CONNECT_DEVICE, body: "FAIL");
    }
    
    @objc(didSaveNetwork)
    func didSaveNetwork() -> Void {
        let result: NSMutableDictionary = [:]
        result["macAddr"] = lastConnectedDevice.peripheral.identifier.uuidString
        result["name"] = lastConnectedDevice.peripheral.name
        self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE, body: result);
        self.sendEvent(withName:EventsEnum.DID_SAVE_NETWORK, body: "FAIL");
    }
    
    @objc(didFailToConnectDevice)
    func didFailToConnectDevice() -> Void {
        self.sendEvent(withName:EventsEnum.DID_FAIL_TO_CONNECT_DEVICE, body: "FAIL");
    }
    
    @objc(didConnectDevice)
    func didConnectDevice() -> Void {
        let result: NSMutableDictionary = [:]
        result["macAddr"] = lastConnectedDevice?.peripheral.identifier.uuidString
        result["name"] = lastConnectedDevice?.peripheral.name
        self.sendEvent(withName:EventsEnum.DID_CONNECT_DEVICE, body: result);
    }
    
    @objc(didDisconnectDevice)
    func didDisconnectDevice() -> Void {
        if(lastConnectedDevice){
            let result: NSMutableDictionary = [:]
            result["macAddr"] = lastConnectedDevice.peripheral.identifier.uuidString
            result["name"] = lastConnectedDevice.peripheral.name
            self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE, body: result);
        }else{
            self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE, body: "A device dcted");
        }
    }
    
    @objc(didUpdateState)
    func didUpdateState() -> Void {
        let result: NSMutableDictionary = [:]
        result["powered"] = AmazonFreeRTOSManager.shared.central?.state == .poweredOn
        self.sendEvent(withName:EventsEnum.DID_UPDATE_BLE_POWER_STATE, body: result);
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
        self.sendEvent(withName:EventsEnum.DID_DISCOVERED_DEVICE, body: result);
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
            self.sendEvent(withName:EventsEnum.DID_LIST_NETWORK, body: result);
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
    
    @objc(getConnectedDeviceNetworks:withResolver:withRejecter:)
    func getConnectedDeviceNetworks(_ uuid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            device.listNetwork(ListNetworkReq(maxNetworks: 10, timeout: 3))
            resolve("OK")
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
}
