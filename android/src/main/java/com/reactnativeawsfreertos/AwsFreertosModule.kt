package com.reactnativeawsfreertos

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.ScanResult
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat.requestPermissions
import androidx.core.app.ActivityCompat.startActivityForResult
import com.amazonaws.auth.AWSCredentialsProvider
import com.amazonaws.mobile.client.AWSMobileClient
import com.amazonfreertossdk.*
import com.amazonfreertossdk.networkconfig.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import java.util.*

class AwsFreertosModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val REQUEST_ENABLE_BT = 1
  private val PERMISSION_REQUEST_FINE_LOCATION = 1
  private val SCAN_BT_DEVICE_EVENT_KEY = "SCAN_BT_DEVICE";
  private val SCAN_DEVICE_NETWORKS_EVENT_KEY = "SCAN_DEVICE_NETWORKS";
  //private val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)

  override fun getName(): String {
      return "AwsFreertos"
  }

  fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String?>?, grantResults: IntArray) {
    when (requestCode) {
      PERMISSION_REQUEST_FINE_LOCATION -> {
        if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          Log.i("", "ACCESS_FINE_LOCATION granted.")
        } else {
          Log.w("", "ACCESS_FINE_LOCATION denied")
        }
      }
    }
  }

  @ReactMethod
  fun requestBtPermissions(promise: Promise) {
    //Enabling Bluetooth
    val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
    currentActivity?.let { startActivityForResult(it,enableBtIntent, REQUEST_ENABLE_BT,null) }

    // requesting user to grant permission.
    currentActivity?.let { requestPermissions(it,arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), PERMISSION_REQUEST_FINE_LOCATION) }
    promise.resolve("OK")
  }

  val mBleDevices = ArrayList<BleDevice>()
  @ReactMethod
  fun startScanBtDevices() {
      //Getting AmazonFreeRTOSManager
      val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity);
      mAmazonFreeRTOSManager.startScanDevices(
        object : BleScanResultCallback() {
          @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
          override fun onBleScanResult(result: ScanResult) {
            val thisDevice = BleDevice(result.device.name,
              result.device.address, result.device);
              if (!mBleDevices.contains(thisDevice)) {
                mBleDevices.add(thisDevice);
              }
            sendBleEvent(result);
          }
        }, 10000);
    }

  private fun sendBleEvent(result: ScanResult){
    val resultData: WritableMap = WritableNativeMap()
    resultData.putString("macAddr", result.device.address)
    resultData.putString("name", result.device.name)
    sendEvent(SCAN_BT_DEVICE_EVENT_KEY,resultData)
  }

  private fun sendEvent(eventName: String, params: WritableMap?){
    reactApplicationContext
      .getJSModule(RCTDeviceEventEmitter::class.java)
      .emit(eventName, params);
  }

  @ReactMethod
  fun connectDevice(macAddress: String, promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)

    Log.e(
      "SAD",
      macAddress + " ---- " + mBleDevices.first().macAddr
    )
    val mBleDevice = mBleDevices.find{ it.macAddr == macAddress}

    if(mBleDevice == null) {
      promise.reject(Error("No device found with mac addres: $macAddress"))
      return
    }

    val connectionStatusCallback: BleConnectionStatusCallback = object : BleConnectionStatusCallback() {
      override fun onBleConnectionStatusChanged(connectionStatus: AmazonFreeRTOSConstants.BleConnectionState) {
        Log.e(
          "CONNECTEDD",
          "ITS ALIVE: " + connectionStatus.name
        )
        if (connectionStatus == AmazonFreeRTOSConstants.BleConnectionState.BLE_INITIALIZED) {
          promise.resolve("CONNECTED");
        } else if (connectionStatus == AmazonFreeRTOSConstants.BleConnectionState.BLE_DISCONNECTED) {
          //if (!autoReconnect) {
          //  disconnectDevice()
          //}
        }
      }
    }

    if(mBleDevice != null){
      val credentialsProvider: AWSCredentialsProvider = AWSMobileClient.getInstance()
      mAmazonFreeRTOSManager.connectToDevice(mBleDevice.bluetoothDevice,
        connectionStatusCallback, credentialsProvider, true)
    }
  }

  @ReactMethod
  fun disconnectDevice(macAddr: String, promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);
    if(connectedDevice == null){
      promise.reject(Error("No device connected found for mac: $macAddr"));
      return
    }
    mAmazonFreeRTOSManager.disconnectFromDevice(connectedDevice)
    promise.resolve("OK");
  }


  private val mBssid2WifiInfoMap = HashMap<String, WifiInfo>()
  @ReactMethod
  fun saveNetworkOnConnectedDevice(macAddr: String, bssid: String, pw: String, promise: Promise) {
    Log.e("TESTinsdds", pw);
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);
    val saveNetworkReq = SaveNetworkReq();
    val wifiInfo = mBssid2WifiInfoMap.get(bssid);
    if(wifiInfo == null) {
      promise.reject(Error("INVALID BSSID"))
      return
    }
    saveNetworkReq.ssid = wifiInfo.ssid;
    saveNetworkReq.bssid = wifiInfo.bssid;
    saveNetworkReq.security = wifiInfo.networkType;
    saveNetworkReq.index = wifiInfo.index;
    saveNetworkReq.psk = pw;

    Log.e("TEST", pw);
    val mNetworkConfigCallback: NetworkConfigCallback = object : NetworkConfigCallback() {
      override fun onSaveNetworkResponse(response: SaveNetworkResp?) {
        Log.e("SUCCCESSSS", response?.toString());

        promise.resolve("OK")
      }
    }

    connectedDevice?.saveNetwork(saveNetworkReq, mNetworkConfigCallback)
  }

  private fun bssidToString(bssid: ByteArray): String? {
    val sb = StringBuilder(18)
    for (b in bssid) {
      if (sb.isNotEmpty()) sb.append(':')
      sb.append(String.format("%02x", b))
    }
    return sb.toString()
  }

  @ReactMethod
  fun getConnectedDeviceNetworks(macAddr: String) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);
    val mDevice = connectedDevice;

    val listNetworkReq = ListNetworkReq()
    listNetworkReq.maxNetworks = 20
    listNetworkReq.timeout = 5

    val mHandler = Handler(Looper.getMainLooper())
    val mNetworkConfigCallback: NetworkConfigCallback = object : NetworkConfigCallback() {
      override fun onListNetworkResponse(response: ListNetworkResp) {
        mHandler.post {
          val wifiInfo = WifiInfo(response.ssid, response.bssid,
            response.rssi, response.security, response.index,
            response.connected)

          bssidToString(wifiInfo.bssid)?.let { mBssid2WifiInfoMap.put(it, wifiInfo) }

          val resultData: WritableMap = WritableNativeMap()
          resultData.putString("ssid", response.ssid)
          resultData.putInt("status", response.status)
          resultData.putString("bssid", bssidToString(response.bssid))
          resultData.putInt("rssi", response.rssi)
          resultData.putInt("security", response.security)
          resultData.putInt("index", response.index)
          resultData.putBoolean("connected", response.connected)

          sendEvent(SCAN_DEVICE_NETWORKS_EVENT_KEY, resultData)
        }
      }

    }

    mDevice?.listNetworks(listNetworkReq, mNetworkConfigCallback)
      ?: Log.e("ERR: ", "No device connected.")
  }
}
