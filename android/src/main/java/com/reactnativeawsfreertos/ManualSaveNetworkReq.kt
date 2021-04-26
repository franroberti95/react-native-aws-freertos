package com.reactnativeawsfreertos

import android.util.Log
import co.nstant.`in`.cbor.CborBuilder

import co.nstant.`in`.cbor.CborEncoder

import co.nstant.`in`.cbor.CborException

import com.amazonfreertossdk.AmazonFreeRTOSConstants
import com.amazonfreertossdk.networkconfig.SaveNetworkReq
import java.io.ByteArrayOutputStream

/**
 * Save network request.
 */
class ManualSaveNetworkReq {
  /**
   * SSID of the network to be saved.
   */
  var ssid: String? = null

  /**
   * Password of the network to be saved.
   */
  var psk: String? = null
  /**
   * Connect immediately or just save for later.
   */
  var connect = true


  private val TAG = "SaveNetworkRequest"
  private val SSID_KEY = "r"
  private val PSK_KEY = "m"
  private val TYPE_KEY = "w"
  private val CONNECT_KEY = "y"

  fun encode(): ByteArray? {
    var SaveNetworkRequestBytes: ByteArray? = null
    try {
      val baos = ByteArrayOutputStream()
      CborEncoder(baos).encode(CborBuilder()
        .addMap()
        .put(TYPE_KEY, AmazonFreeRTOSConstants.SAVE_NETWORK_REQ.toLong())
        .put(SSID_KEY, ssid)
        .put(PSK_KEY, psk)
        .put(CONNECT_KEY, connect)
        .end()
        .build())
      SaveNetworkRequestBytes = baos.toByteArray()
    } catch (e: CborException) {
      Log.e(TAG, "Failed to encode.", e)
    }
    return SaveNetworkRequestBytes
  }

}
