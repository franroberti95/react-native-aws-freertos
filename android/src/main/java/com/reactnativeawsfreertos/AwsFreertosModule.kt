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
import java.util.*

class AwsFreertosModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val REQUEST_ENABLE_BT = 1
  private val PERMISSION_REQUEST_FINE_LOCATION = 1
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
  fun startScanBtDevices(callback: Callback) {
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
            callback(thisDevice);
          }
        }, 10000);
    }

  private var connectedDevice: AmazonFreeRTOSDevice? = null;
  @ReactMethod
  fun connectDevice(macAddress: String, promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    if (connectedDevice !== null) return;
    val credentialsProvider: AWSCredentialsProvider = AWSMobileClient.getInstance()
    val mBleDevice = mBleDevices.find{ it.macAddr === macAddress}


    val connectionStatusCallback: BleConnectionStatusCallback = object : BleConnectionStatusCallback() {
      override fun onBleConnectionStatusChanged(connectionStatus: AmazonFreeRTOSConstants.BleConnectionState) {
        if (connectionStatus === AmazonFreeRTOSConstants.BleConnectionState.BLE_INITIALIZED) {
          promise.resolve("CONNECTED");
        } else if (connectionStatus === AmazonFreeRTOSConstants.BleConnectionState.BLE_DISCONNECTED) {
          //if (!autoReconnect) {
          //  disconnectDevice()
          //}
        }
      }
    }

    if(mBleDevice !== null){
      connectedDevice = mAmazonFreeRTOSManager.connectToDevice(mBleDevice.getBluetoothDevice(),
        connectionStatusCallback, credentialsProvider, false)
    }
  }

  @ReactMethod
  fun disconnectDevice() {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    if (connectedDevice === null) return
    mAmazonFreeRTOSManager.disconnectFromDevice(connectedDevice!!)
    connectedDevice = null
  }


  private val mBssid2WifiInfoMap = HashMap<String, WifiInfo>()
  @ReactMethod
  fun saveNetworkOnConnectedDevice(bssid: String, pw: String, promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val saveNetworkReq = SaveNetworkReq();
    val wifiInfo = mBssid2WifiInfoMap.get(bssid);
    if(wifiInfo === null) {
      promise.reject(Error("INVALID BSSID"))
      return
    }
    saveNetworkReq.ssid = wifiInfo.ssid;
    saveNetworkReq.bssid = wifiInfo.bssid;
    saveNetworkReq.security = wifiInfo.networkType;
    saveNetworkReq.index = wifiInfo.index;
    saveNetworkReq.psk = pw;
    val mHandler = Handler(Looper.getMainLooper())
    val mNetworkConfigCallback: NetworkConfigCallback = object : NetworkConfigCallback() {
      override fun onListNetworkResponse(response: ListNetworkResp) {
        mHandler.post {
          val wifiInfo = WifiInfo(response.ssid, response.bssid,
            response.rssi, response.security, response.index,
            response.connected)

          bssidToString(wifiInfo.bssid)?.let { mBssid2WifiInfoMap.put(it, wifiInfo) }
          promise.resolve(wifiInfo)
        }
      }
      override fun onSaveNetworkResponse(response: SaveNetworkResp?) {
        promise.resolve("OK")
      }

      override fun onDeleteNetworkResponse(response: DeleteNetworkResp?) {
      }

      override fun onEditNetworkResponse(response: EditNetworkResp?) {
      }

    }

    connectedDevice?.saveNetwork(saveNetworkReq, mNetworkConfigCallback)
            ?: Log.e("Save network err: ", "No device connected. ")
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
  fun getConnectedDeviceNetworks(promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
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

          promise.resolve(wifiInfo)
        }
      }
      override fun onSaveNetworkResponse(response: SaveNetworkResp?) {
      }

      override fun onDeleteNetworkResponse(response: DeleteNetworkResp?) {
      }

      override fun onEditNetworkResponse(response: EditNetworkResp?) {
      }

    }

    mDevice?.listNetworks(listNetworkReq, mNetworkConfigCallback)
      ?: Log.e("ERR: ", "No device connected.")
  }
}
