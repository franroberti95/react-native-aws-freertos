#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>


@interface RCT_EXTERN_MODULE(AwsFreertos,RCTEventEmitter)

RCT_EXTERN_METHOD(startScanBtDevices)

RCT_EXTERN_METHOD(stopScanBtDevices)

RCT_EXTERN_METHOD(requestBtPermissions:
                 (RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(connectDevice:(NSString *)uuid
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnectDevice:(NSString *)uuid
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveNetworkOnConnectedDevice:
                  (NSString *)uuid
                  withBssid:(NSString *)bssid
                  withPw:(NSString *)pw
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnectNetworkOnConnectedDevice:
                  (NSString *)uuid
                  withIndex:(NSInteger)index
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getGattCharacteristicsFromServer:
                  (NSString *)macAddress
                  withServiceUuidString:(NSString *)serviceUuidString)

RCT_EXTERN_METHOD(deviceIsConnected:
                  (NSString *)uuid
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(getConnectedDeviceAvailableNetworks:
                  (NSString *)uuid
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

@end
