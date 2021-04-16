package com.reactnativeawsfreertos

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
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
import com.amazonfreertossdk.AmazonFreeRTOSConstants
import com.amazonfreertossdk.BleConnectionStatusCallback
import com.amazonfreertossdk.BleScanResultCallback
import com.amazonfreertossdk.NetworkConfigCallback
import com.amazonfreertossdk.networkconfig.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import java.util.*

class AwsFreertosModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val REQUEST_ENABLE_BT = 1
  private val PERMISSION_REQUEST_FINE_LOCATION = 1

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
            val resultData: WritableMap = WritableNativeMap()
            resultData.putString("macAddr", result.device.address)
            resultData.putString("name", result.device.name)
            sendEvent(BluetoothEvents.DID_DISCOVERED_DEVICE.name,resultData)
        }
      }, 10000);
  }

  private fun sendEvent(eventName: String, params: WritableMap?){
    reactApplicationContext
      .getJSModule(RCTDeviceEventEmitter::class.java)
      .emit(eventName, params);
  }

  @ReactMethod
  fun stopScanBtDevices() {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity);
    mAmazonFreeRTOSManager.stopScanDevices()
  }

  @ReactMethod
  fun connectDevice(macAddress: String, promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)

    val mBleDevice = mBleDevices.find{ it.macAddr == macAddress}

    if(mBleDevice == null) {
      promise.reject(Error("No device found with mac addres: $macAddress"))
      return
    }

    val connectionStatusCallback: BleConnectionStatusCallback = object : BleConnectionStatusCallback() {
      override fun onBleConnectionStatusChanged(connectionStatus: AmazonFreeRTOSConstants.BleConnectionState) {
        if (connectionStatus == AmazonFreeRTOSConstants.BleConnectionState.BLE_INITIALIZED) {
          val resultData: WritableMap = WritableNativeMap()
          resultData.putString("macAddr", mBleDevice.macAddr)
          resultData.putString("name", mBleDevice.name)
          sendEvent(BluetoothEvents.DID_CONNECT_DEVICE.name,resultData)
        } else if (connectionStatus == AmazonFreeRTOSConstants.BleConnectionState.BLE_DISCONNECTED) {
          val resultData: WritableMap = WritableNativeMap()
          resultData.putString("macAddr", mBleDevice.macAddr)
          resultData.putString("name", mBleDevice.name)
          sendEvent(BluetoothEvents.DID_DISCONNECT_DEVICE.name,resultData)
        }
      }
    }

    val credentialsProvider: AWSCredentialsProvider = AWSMobileClient.getInstance()
    mAmazonFreeRTOSManager.connectToDevice(mBleDevice.bluetoothDevice,
      connectionStatusCallback, credentialsProvider, true)
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

  private fun networkResponseToWritableMap(response: ListNetworkResp): WritableMap {
    val resultData: WritableMap = WritableNativeMap()
    resultData.putString("ssid", response.ssid)
    resultData.putInt("status", response.status)
    resultData.putString("bssid", bssidToString(response.bssid))
    resultData.putInt("rssi", response.rssi)
    resultData.putInt("security", response.security)
    resultData.putInt("index", response.index)
    resultData.putBoolean("connected", response.connected)
    return resultData
  }

  private val mBssid2WifiInfoMap = HashMap<String, WifiInfo>()
  val mHandler = Handler(Looper.getMainLooper())
  private val mNetworkConfigCallback: NetworkConfigCallback = object : NetworkConfigCallback() {
    override fun onListNetworkResponse(response: ListNetworkResp) {
      mHandler.post {
        val wifiInfo = WifiInfo(response.ssid, response.bssid,
          response.rssi, response.security, response.index,
          response.connected)

        bssidToString(wifiInfo.bssid)?.let { mBssid2WifiInfoMap.put(it, wifiInfo) }
        sendEvent(WifiEvents.DID_LIST_NETWORK.name, networkResponseToWritableMap(response))
      }
    }
    override fun onSaveNetworkResponse(response: SaveNetworkResp?) {
      Log.i("DEVICE", "Network saved ! status: " + response.toString())

      if(lastConnectedWifiInfo != null){
        val resultData: WritableMap = WritableNativeMap()
        resultData.putString("status", response.toString())// 0 for success
        resultData.putString("ssid", lastConnectedWifiInfo!!.ssid)
        resultData.putString("bssid", bssidToString(lastConnectedWifiInfo!!.bssid))
        resultData.putInt("rssi", lastConnectedWifiInfo!!.rssi)
        resultData.putInt("security", lastConnectedWifiInfo!!.networkType)
        resultData.putInt("index", lastConnectedWifiInfo!!.index)
        resultData.putBoolean("connected", lastConnectedWifiInfo!!.connected)
        sendEvent(WifiEvents.DID_SAVE_NETWORK.name,resultData)
      }
    }

    override fun onDeleteNetworkResponse(response: DeleteNetworkResp?) {
      sendEvent(WifiEvents.DID_DELETE_NETWORK.name, null)
    }

    override fun onEditNetworkResponse(response: EditNetworkResp?) {
      sendEvent(WifiEvents.DID_EDIT_NETWORK.name, null)
    }
  }
  private var lastConnectedWifiInfo: WifiInfo? = null
  @ReactMethod
  fun saveNetworkOnConnectedDevice(macAddr: String, bssid: String, pw: String, promise: Promise) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);
    val saveNetworkReq = SaveNetworkReq();
    val wifiInfo = mBssid2WifiInfoMap[bssid];
    if(wifiInfo == null) {
      promise.reject(Error("INVALID BSSID"))
      return
    }

    saveNetworkReq.ssid = wifiInfo.ssid;
    saveNetworkReq.bssid = wifiInfo.bssid;
    saveNetworkReq.security = wifiInfo.networkType;
    saveNetworkReq.index = wifiInfo.index;
    saveNetworkReq.psk = pw;

    lastConnectedWifiInfo = wifiInfo
    connectedDevice?.saveNetwork(saveNetworkReq, mNetworkConfigCallback)
  }

  @ReactMethod
  fun disconnectNetworkOnConnectedDevice(macAddr: String, bssid: String) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);
    val saveNetworkReq = SaveNetworkReq();
    val wifiInfo = mBssid2WifiInfoMap[bssid];

    if(wifiInfo == null){
      Log.e("DISCONNECT NETWORK", "Wifi network is not found. $bssid")
      return
    }

    val deleteNetworkReq = DeleteNetworkReq()
    deleteNetworkReq.index = wifiInfo.index
    if (connectedDevice != null) {
      connectedDevice.deleteNetwork(deleteNetworkReq, mNetworkConfigCallback)
    } else {
      Log.e("DISCONNECT NETWORK", "Device is not found. $macAddr")
    }
    lastConnectedWifiInfo = wifiInfo
    connectedDevice?.saveNetwork(saveNetworkReq, mNetworkConfigCallback)
  }

  private fun bytesToHexString(bytes: ByteArray): String? {
    val sb = java.lang.StringBuilder(bytes.size * 2)
    val formatter = Formatter(sb)
    for (i in bytes.indices) {
      formatter.format("%02x", bytes[i])
      if (i > 10) {
        break
      }
    }
    return sb.toString()
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
  fun getConnectedDeviceAvailableNetworks(macAddr: String) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);
    val mDevice = connectedDevice;

    val listNetworkReq = ListNetworkReq()
    listNetworkReq.maxNetworks = 20
    listNetworkReq.timeout = 5

    mDevice?.listNetworks(listNetworkReq, mNetworkConfigCallback)
      ?: Log.e("ERR: ", "No device connected.")
  }

  @ReactMethod
  fun getConnectedDeviceSavedNetworks(macAddr: String) {
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
          if(response.connected)
            sendEvent(WifiEvents.DID_LIST_NETWORK.name, networkResponseToWritableMap(response))
        }
      }
    }
    mDevice?.listNetworks(listNetworkReq, mNetworkConfigCallback)
      ?: Log.e("ERR: ", "No device connected.")
  }

  var readQueueIndex = 0
  var readQueue: ArrayList<BluetoothGattCharacteristic>? = null
  @ReactMethod
  fun getGattCharacteristicsFromServer(macAddr: String, serviceUuidString: String) {
    val mAmazonFreeRTOSManager = AmazonFreeRTOSAgent.getAmazonFreeRTOSManager(currentActivity)
    val connectedDevice = mAmazonFreeRTOSManager.getConnectedDevice(macAddr);

    val mGattCallback: BluetoothGattCallback = object : BluetoothGattCallback() {
      override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
        Handler(Looper.getMainLooper()).post {
          val service = gatt?.getService(UUID.fromString(serviceUuidString))

          readQueueIndex= 0
          readQueue = ArrayList<BluetoothGattCharacteristic>()

          if(service != null) {
            for (mCharacteristic in service.getCharacteristics()) {
              Log.i("DEVICE", "Found Characteristic: " + mCharacteristic.uuid.toString())
              Log.i("DEVICE", "Found Characteristic val: " + mCharacteristic.value)
              readQueue?.add(mCharacteristic)
            }
            readQueueIndex = readQueue!!.size - 1
            gatt.readCharacteristic(readQueue!!.get(readQueueIndex))
          }
        }
      }
      override fun onCharacteristicChanged(gatt: BluetoothGatt,
                                           characteristic: BluetoothGattCharacteristic) {
        val responseBytes = characteristic.value
        Log.d("DEVICE", "->->-> Characteristic uuid: " + characteristic.uuid.toString())
        Log.d("DEVICE", "->->-> Characteristic changed for: "
          + AmazonFreeRTOSConstants.uuidToName[characteristic.uuid.toString()]
          + " with data: " + bytesToHexString(responseBytes))
      }
      override fun onCharacteristicRead(gatt: BluetoothGatt,
                                        characteristic: BluetoothGattCharacteristic,
                                        status: Int) {
        Log.d("DEVICE", "->->-> onCharacteristicRead status: " + if (status == 0) "Success. " else status)
        if (status == BluetoothGatt.GATT_SUCCESS) {
          val responseBytes = characteristic.value
          Log.d("DEVICE", "->->-> onCharacteristicRead: " + bytesToHexString(responseBytes))

          val resultData: WritableMap = WritableNativeMap()
          val valueData = WritableNativeArray()
          for( byte in responseBytes){
            valueData.pushInt(byte.toInt())
          }
          resultData.putArray("value", valueData)
          resultData.putString("uuid",characteristic.uuid.toString())

          sendEvent(BluetoothEvents.DID_READ_CHARACTERISTIC_FROM_SERVICE.name, resultData)
        }
        readQueue?.remove(readQueue?.get(readQueueIndex));
        if (readQueue?.size!! >= 0) {
          readQueueIndex--;
          if (readQueueIndex == -1) {
            Log.i("Read Queue: ", "Complete");
          }
          else {
            Handler(Looper.getMainLooper()).post {
              gatt.readCharacteristic(readQueue?.get(readQueueIndex))
            }
          }
        }
      }
    }
    val gattService = connectedDevice.mBluetoothDevice.connectGatt(currentActivity,false,mGattCallback)
    Handler(Looper.getMainLooper()).post {
      gattService.discoverServices()
    }
  }

}
