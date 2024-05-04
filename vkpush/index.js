


//надеюсь этот ебанный кринж никто никогда не увидит!!!!



const axios = require('axios')
const pb = require("protobufjs");
const crypto_1 = require('crypto');
const { listen } = require('../vkpush/push-receiver');
class VKPUSH{

constructor(callback, creds=null) {
    this._callbackf = callback
	this.creds = creds
	this.token = null
	this.id = Math.floor(Math.random() * 999999999999999);
  }

init = async function()
{
    if(!this.creds){

        let checkinres = await this.executeCheckin()
        let checkindata = await this.parseCheckinResponse(checkinres)
        let fiddata = await this.registerFid('api-project-841415684880', 'AIzaSyCL17U2Q5i1NVwIcXgMOZMidSRFHyGYgwM', '1:841415684880:android:632f429381141121')
        let fidcred = await this.getCredentials(checkindata.androidId, checkindata.securityToken, '841415684880', 'com.vkontakte.android', fiddata.authToken.token, fiddata.fid)

        this.token = fidcred.split("=")[1]
        this.creds = {

            "gcm":
                {
                    "androidId": checkindata.androidId,
                    "securityToken": checkindata.securityToken
                },

            'keys':
                {
                    "privateKey": '1',
                    "publicKey": '1',
                    "authSecret": '1'
                }

        }
    }
    


    

    return listen(this.creds, this.returnMessage)
	
}
returnMessage = (message) => {
    let json = {
        'fromID': this.id,
        'notification': message
    }
    this._callbackf(json)
}
buildCheckinRequest = async function()
{

    let root = await pb.load("./vkpush/checkin.proto");

    let CheckinRequestModel = await root.lookupType("CheckinRequest");
    let payload = {
        imei: "994514045701495",
        androidId: 0,
        checkin:
        {
            build:
            {
                fingerprint: "google/razor/flo:5.0.1/LRX22C/1602158:user/release-keys",
                hardware: "flo",
                brand: "google",
                radio: "FLO-04.04",
                clientId: "android-google",
            },
            lastCheckinMs: 0,
        },
        locale: "en",
        loggingId: Math.floor(Math.random() * Math.pow(2, 63)),
        macAddress: [Array.from(
        {
            length: 12
        }, () => Math.floor(Math.random() * 16).toString(16)).join("")],
        meid: Array.from(
        {
            length: 14
        }, () => Math.floor(Math.random() * 10)).join(""),
        accountCookie: [],
        timeZone: "GMT",
        version: 3,
        otaCert: ["--no-output--"],
        esn: Array.from(
        {
            length: 8
        }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        macAddressType: ["wifi"],
        fragment: 0,
        userSerialNumber: 0,
    };
    let message = await CheckinRequestModel.create(payload);
    return await CheckinRequestModel.encode(message).finish();
};
getLoginData = async function(aId, sT)
{
    let root = await pb.load("./vkpush/mcs.proto");
    let req = await root.lookupType("LoginRequest");
    let payload = {

        adaptive_heartbeat: false,
        auth_service: 2,
        auth_token: sT,
        id: "android-11",
        domain: "mcs.android.com",
        device_id: "android-" + (aId >>> 0).toString(16),
        network_type: 1,
        resource: aId,
        user: aId,
        use_rmq2: true,
        account_id: parseInt(aId),
        received_persistent_id: [],
        setting:
        {
            "new_vc": "1"
        }
    }
    let message = await LoginRequestModel.create(payload);
    return await LoginRequestModel.encode(message).finish();
}


parseCheckinResponse = async function(data)
{
    let root = await pb.load("./vkpush/checkin.proto");
    let CheckinResponseModel = await root.lookupType("CheckinResponse");
    let message = await CheckinResponseModel.decode(data);
    let object = await CheckinResponseModel.toObject(message,
    {
        longs: String,
        enums: String,
        bytes: String,
    });
    return object;
};




registerFid = async function(pr, key, appId)
{
    let url = "https://firebaseinstallations.googleapis.com/v1/projects/" + pr + "/installations";

    let response = await axios.post(url,
    {
        fid: "dIsVQ2QVRT-TW7L6VfeAMh",
        appId: appId,
        authVersion: `FIS_v2`,
        sdkVersion: "a:16.3.1",
    },
    {
        method: "post",

        headers:
        {
			"X-Android-Cert": "48761EEF50EE53AFC4CC9C5F10E6BDE7F8F5B82F",
			"X-Android-Package": "com.vkontakte.android",
            "Content-Type": "application/json",
            "x-goog-api-key": key
        },
        responseType: "json",
        http2: true,
        throwHttpErrors: false,
        retry:
        {
            limit: 3,
            methods: ["POST"]
        }
    })
    return response.data;


}


getCredentials = async function (aId, sT, sender, app, intoken, iniid)
{
    let url = "https://android.clients.google.com/c2dm/register3";
    let headers = {
        "Authorization": `AidLogin ${aId}:${sT}`,
        'User-Agent': 'Android-Checkin/2.0 (vbox86p JLS36G); gzip'
    };
    let data = {
        "X-subtype": '841415684880',
        "sender": '841415684880',
        "X-appid": iniid,
        "X-Goog-Firebase-Installations-Auth": intoken,
        "app": app,
        "device": aId
    };
    let response = await axios.postForm(url, data,
    {
        method: 'POST',
        headers:
        {
            Authorization: `AidLogin ${aId}:${sT}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Android-GCM/1.5 (OnePlus5 NMF26X)',
            'gcm_ver': '225014047',
            'app_ver': '4839',
            'app': 'com.vtosters.lite'
        }
    })

    return response.data;
}

executeCheckin = async function()
{
    let url = "https://android.clients.google.com/checkin";
    try
    {
        let buffer = await this.buildCheckinRequest();
        let response = await axios.default(
        {
            method: "post",
            url: url,
            data: Buffer.from(buffer),
            headers:
            {
                "Content-type": "application/x-protobuffer",
                "Accept-Encoding": "gzip",
                "User-Agent": "Android-Checkin/2.0 (vbox86p JLS36G); gzip"
            },
            responseType: "arraybuffer",
            validateStatus: function(status)
            {
                return status < 500; // Resolve only if the status code is less than 500
            }
        }).catch(error =>
        {
            return error;
        });
        if (response.status == 200)
        {
            return response.data;
        }
        else
        {

            throw new Error(`Google checkin failed with error: ${response.statusText}`);
        }
    }
    catch (error)
    {

        throw new Error(`Google checkin failed with error: ${error}`);
    }

}

randomBits = async function(size)
{
    return Math.floor(Math.random() * Math.pow(2, size));
}
generateFid = async function()
{
    exports.VALID_FID_PATTERN = /^[cdef][\w-]{21}$/;
    let fidByteArray = new Uint8Array(17);
    fidByteArray.set((0, crypto_1.randomBytes)(fidByteArray.length));
    // Replace the first 4 random bits with the constant FID header of 0b0111.
    fidByteArray[0] = 0b01110000 + (fidByteArray[0] % 0b00010000);
    let b64 = Buffer.from(fidByteArray).toString("base64");
    let b64_safe = b64.replace(/\+/g, "-").replace(/\//g, "_");
    let fid = b64_safe.substr(0, 22);
    if (exports.VALID_FID_PATTERN.test(fid))
    {
        return fid;
    }

}



}

module.exports = VKPUSH;