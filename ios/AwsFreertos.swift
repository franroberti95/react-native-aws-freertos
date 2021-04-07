
@objc(AwsFreertos)
class AwsFreertos: NSObject {

    @objc(startScanBtDevices:withResolver:withRejecter:)
    func startScanBtDevices(_ callback:(_: Any) -> Void,resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve("OK")
    }
    @objc(requestBtPermissions:withRejecter:)
    func requestBtPermissions(_ resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve("OK")
    }
    @objc(connectDevice:withResolver:withRejecter:)
    func connectDevice(_ macAddress: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve("OK")
    }
    @objc(disconnectDevice:withRejecter:)
    func disconnectDevice(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve("OK")
    }

    @objc(saveNetworkOnConnectedDevice:withPw:withResolver:withRejecter:)
    func saveNetworkOnConnectedDevice(bssid: String, pw: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve("OK")
    }
    @objc(getConnectedDeviceNetworks:withRejecter:)
    func getConnectedDeviceNetworks(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve([])
    }
}
