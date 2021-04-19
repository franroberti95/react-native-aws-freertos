#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>


@interface RCT_EXTERN_MODULE(AwsFreertos,RCTEventEmitter)

RCT_EXTERN_METHOD(startScanBtDevices)

RCT_EXTERN_METHOD(stopScanBtDevices)

RCT_EXTERN_METHOD(requestBtPermissions:
                 (RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(connectDevice:(String)uuid
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnectDevice:(String)uuid
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveNetworkOnConnectedDevice:(String)uuid
                  withBssid(String)bssid
                  withPw:(String)pw
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnectNetworkOnConnectedDevice:(String)uuid
                  withIndex(Int)index
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getGattCharacteristicsFromServer:(String)macAddress
                  withServiceUuidString(String)serviceUuidString)

RCT_EXTERN_METHOD(getConnectedDeviceAvailableNetworks:(String)uuid
                 withResolver(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

@end
