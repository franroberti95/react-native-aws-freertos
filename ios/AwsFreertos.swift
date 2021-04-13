import Foundation
import AmazonFreeRTOS
import AWSMobileClient

@objc(AwsFreertos)
class AwsFreertos: RCTEventEmitter {
    
    let SCAN_BT_DEVICE_EVENT_KEY = "SCAN_BT_DEVICE";
    let SCAN_DEVICE_NETWORKS_EVENT_KEY = "SCAN_DEVICE_NETWORKS";
    var lastConnectedDevice: AmazonFreeRTOSDevice?
    
    @objc(sendMyEvent)
    func sendMyEvent() {
      self.sendEvent(withName:SCAN_BT_DEVICE_EVENT_KEY, body: "Hello!");
    }

    @objc
    override func supportedEvents() -> [String]! {
      return [SCAN_BT_DEVICE_EVENT_KEY,SCAN_DEVICE_NETWORKS_EVENT_KEY];
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
        self.sendEvent(withName:SCAN_BT_DEVICE_EVENT_KEY, body: result);
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
    
    @objc(requestBtPermissions:withRejecter:)
    func requestBtPermissions(_ resolve:RCTPromiseResolveBlock,withRejecter reject:RCTPromiseRejectBlock) -> Void {

        // Add observe for AmazonFreeRTOSManager NSNotifications
        NotificationCenter.default.addObserver(self, selector: #selector(self.receivedBtDevice), name: .afrCentralManagerDidDiscoverDevice, object: nil)

        NotificationCenter.default.addObserver(self, selector: #selector(didListNetwork), name: .afrDidListNetwork, object: nil)

        resolve("OK")
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
            self.sendEvent(withName:SCAN_DEVICE_NETWORKS_EVENT_KEY, body: result);
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
