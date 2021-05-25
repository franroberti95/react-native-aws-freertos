import Foundation
import AmazonFreeRTOS
import AWSMobileClient
import CoreBluetooth

class EventsEnum{
    static var DID_UPDATE_BLE_POWER_STATE: String = "DID_UPDATE_BLE_POWER_STATE"
    static var DID_DISCONNECT_DEVICE: String = "DID_DISCONNECT_DEVICE"
    static var DID_DISCOVERED_DEVICE: String = "DID_DISCOVERED_DEVICE"
    static var DID_CONNECT_DEVICE: String = "DID_CONNECT_DEVICE"
    static var DID_FAIL_TO_CONNECT_DEVICE = "DID_FAIL_TO_CONNECT_DEVICE"
    static var DID_READ_CHARACTERISTIC_FROM_SERVICE = "DID_READ_CHARACTERISTIC_FROM_SERVICE"
    static var DID_LIST_NETWORK: String = "DID_LIST_NETWORK"
    static var DID_SAVE_NETWORK: String = "DID_SAVE_NETWORK"
    static var ERROR_SAVE_NETWORK: String = "ERROR_SAVE_NETWORK"
    static var DID_EDIT_NETWORK: String = "DID_EDIT_NETWORK"
    static var DID_DELETE_NETWORK: String = "DID_DELETE_NETWORK"
}

@objc(AwsFreertos)
class AwsFreertos: RCTEventEmitter {
    
    var lastConnectedDevice: AmazonFreeRTOSDevice?
    var lastConnectedDeviceUuidString: String?
    var lastGattServiceUuid: String?

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
            EventsEnum.ERROR_SAVE_NETWORK,
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
        
        // Characteristics
        NotificationCenter.default.addObserver(self, selector: #selector(self.didDiscoveredCharacteristics), name: .afrPeripheralDidDiscoverCharacteristics, object: nil)
        
        NotificationCenter.default.addObserver(self, selector: #selector(self.didDiscoveredServices), name: .afrPeripheralDidDiscoverServices, object: nil)

        
        resolve("OK")
    }
    
    @objc(didDiscoveredServices)
    func didDiscoveredServices() -> Void {
        if lastConnectedDevice != nil {
            lastConnectedDevice!.peripheral.discoverCharacteristics(nil, for: lastConnectedDevice!.peripheral.services![0])
        }
    }
    
    
    @objc(deviceIsConnected:withResolver:withRejecter:)
    func deviceIsConnected(_ uuid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let device = AmazonFreeRTOSManager.shared.devices.values.first(where: {$0.peripheral.identifier.uuidString == uuid})
        if(device == nil){
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
        resolve(device?.peripheral.state == .connected)
    }
    
    @objc(didDiscoveredCharacteristics)
    func didDiscoveredCharacteristics() -> Void {
        
        if(lastConnectedDevice?.peripheral.services == nil || lastGattServiceUuid == nil) {
            return
        }

        if let device = Array(AmazonFreeRTOSManager.shared.devices.values).first(where: {$0.peripheral.identifier.uuidString == lastConnectedDeviceUuidString}) {
        
            let services = Array(device.peripheral.services!)
            if let service = services.first(where: {$0.uuid.uuidString.uppercased() == lastGattServiceUuid!.uppercased()}) {
                let result: NSMutableArray = []
                if(service.characteristics != nil){
                    for item in Array(service.characteristics!) {
                        let auxDic: NSMutableDictionary = [:]
                        auxDic["uuid"] = item.uuid.uuidString
                        service.peripheral.readValue(for: item)
                        
                        if( item.value == nil){
                            auxDic["value"] = nil
                        }else{
                            auxDic["value"] = item.value!.map { $0 }
                        }
                        
                        result.add(auxDic)
                    }
                    self.sendEvent(withName:EventsEnum.DID_READ_CHARACTERISTIC_FROM_SERVICE, body: result);
                }
            }
        }
    }

    @objc(didEditNetwork)
    func didEditNetwork() -> Void {
        self.sendEvent(withName:EventsEnum.DID_EDIT_NETWORK, body: "NETWORK EDITED");
    }

    @objc(didDeleteNetwork)
    func didDeleteNetwork() -> Void {
        self.sendEvent(withName:EventsEnum.DID_DELETE_NETWORK, body: "NETWORK DELETED");
    }
    
    @objc(didFailToConnectDevice)
    func didFailToConnectDevice() -> Void {
        self.sendEvent(withName:EventsEnum.DID_FAIL_TO_CONNECT_DEVICE, body: "FAIL");
    }
    
    @objc(didSaveNetwork)
    func didSaveNetwork() -> Void {
        let result: NSMutableDictionary = [:]
        result["macAddr"] = lastConnectedDevice!.peripheral.identifier.uuidString
        result["name"] = lastConnectedDevice!.peripheral.name
        self.sendEvent(withName:EventsEnum.DID_SAVE_NETWORK, body: result);
    }
    
    @objc(didConnectDevice)
    func didConnectDevice() -> Void {
        let result: NSMutableDictionary = [:]
        print(self.lastConnectedDevice!.peripheral.identifier.uuidString)
        result["macAddr"] = self.lastConnectedDevice!.peripheral.identifier.uuidString
        result["name"] = self.lastConnectedDevice!.peripheral.name
        self.sendEvent(withName:EventsEnum.DID_CONNECT_DEVICE, body: result);
    }
    
    @objc(didDisconnectDevice)
    func didDisconnectDevice() -> Void {
        if(lastConnectedDevice != nil){
            let result: NSMutableDictionary = [:]
            result["macAddr"] = lastConnectedDevice!.peripheral.identifier.uuidString
            result["name"] = lastConnectedDevice!.peripheral.name
            self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE, body: result);
        }else{
            self.sendEvent(withName:EventsEnum.DID_DISCONNECT_DEVICE, body: "A device has been disconnected");
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
        }else{
            AmazonFreeRTOSManager.shared.stopScanForDevices()
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                AmazonFreeRTOSManager.shared.startScanForDevices()
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 10) {                AmazonFreeRTOSManager.shared.stopScanForDevices()
        }
    }
    
    @objc(stopScanBtDevices)
    func stopScanBtDevices() -> Void {
        AmazonFreeRTOSManager.shared.stopScanForDevices()
    }
    
    @objc(rescanForBtDevices)
    func rescanForDevices() -> Void {
        AmazonFreeRTOSManager.shared.rescanForDevices()
    }
    
    @objc(didListNetwork)
    func didListNetwork() {
        let result: NSMutableArray = []
    
        if(lastConnectedDevice == nil) {
            return
        }
        if(lastConnectedDevice?.savedNetworks != nil){
            for item in lastConnectedDevice?.savedNetworks ?? [] {
                let yourAuxDic: NSMutableDictionary = [:]
                let bssidHexStr = item.bssid.map { String(format: "%02x", $0) }.joined()
                yourAuxDic["bssid"] =  String(bssidHexStr.enumerated().map { $0 > 0 && $0 % 2 == 0 ? [":", $1] : [$1] }.joined())
                
                yourAuxDic["ssid"] = item.ssid
                yourAuxDic["rssi"] = item.rssi
                yourAuxDic["networkType"] = item.security
                yourAuxDic["index"] = item.index
                yourAuxDic["connected"] = item.connected
                result.add(yourAuxDic)
            }
        }
            
        if(lastConnectedDevice?.scanedNetworks != nil){
            for item in lastConnectedDevice?.scanedNetworks ?? [] {
              let yourAuxDic: NSMutableDictionary = [:]
                
                let bssidHexStr = item.bssid.map { String(format: "%02x", $0) }.joined()
                yourAuxDic["bssid"] =  String(bssidHexStr.enumerated().map { $0 > 0 && $0 % 2 == 0 ? [":", $1] : [$1] }.joined())
                
                yourAuxDic["ssid"] = item.ssid
                yourAuxDic["rssi"] = item.rssi
                yourAuxDic["networkType"] = item.security
                yourAuxDic["index"] = item.index
                yourAuxDic["connected"] = item.connected
            
              result.add(yourAuxDic)
            }
        }
        self.sendEvent(withName:EventsEnum.DID_LIST_NETWORK, body: result);
    }
    
    @objc(connectDevice:withResolver:withRejecter:)
    func connectDevice(_ uuid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            device.connect(reconnect: true, credentialsProvider: AWSMobileClient.default())
            self.lastConnectedDevice = device
            self.lastConnectedDeviceUuidString = uuid
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
    func getGattCharacteristicsFromServer(_ uuid: String, serviceUuid: String) -> Void {
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            lastGattServiceUuid = serviceUuid
            // device.peripheral.discoverServices([CBUUID(string: serviceUuid)])
            device.peripheral.discoverServices(nil)
        }
    }
    
    @objc(disconnectNetworkOnConnectedDevice:withIndex:withResolver:withRejecter:)
    func disconnectNetworkOnConnectedDevice(_ uuid: String, index: Int, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        
        let device = AmazonFreeRTOSManager.shared.devices.values.first(where: {$0.peripheral.identifier.uuidString == uuid})
        if(device == nil){
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
        device?.deleteNetwork(DeleteNetworkReq(index: index))
    }
    
    @objc(saveNetworkOnConnectedDevice:withBssid:withPw:withResolver:withRejecter:)
    func saveNetworkOnConnectedDevice(_ uuid: String, bssid: String, pw: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        
        let device = AmazonFreeRTOSManager.shared.devices.values.first(where: {$0.peripheral.identifier.uuidString == uuid})
        if(device == nil){
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
        
        var networks = device?.scanedNetworks
        
        if(networks == nil){
            return
        }
        
        if(device?.savedNetworks != nil){
            networks?.append(contentsOf: device?.savedNetworks ?? [])
        }
        
        var networksDict: [String:ListNetworkResp] = [:]
        for net in networks! {
            let bssidHexStr = net.bssid.map { String(format: "%02x", $0) }.joined()
            let bssidStr =  String(bssidHexStr.enumerated().map { $0 > 0 && $0 % 2 == 0 ? [":", $1] : [$1] }.joined())
            networksDict[bssidStr] = net
        }
        
        let network = networksDict[bssid]
        if (network != nil) {
            device?.saveNetwork(SaveNetworkReq(index: network!.index, ssid: network!.ssid, bssid: network!.bssid, psk: pw, security: network!.security, connect: true))
            
            resolve("OK")
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
    
    @objc(getConnectedDeviceAvailableNetworks:withResolver:withRejecter:)
    func getConnectedDeviceAvailableNetworks(_ uuid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let devices = Array(AmazonFreeRTOSManager.shared.devices.values)
    
        if let device = devices.first(where: {$0.peripheral.identifier.uuidString == uuid}) {
            device.listNetwork(ListNetworkReq(maxNetworks: 10, timeout: 5))
            resolve("OK")
        } else {
            reject("ERROR_NOT_FOUND", uuid, NSError(domain: "", code: 200, userInfo: nil))
        }
    }
}
