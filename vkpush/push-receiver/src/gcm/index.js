const path = require('path');
const request = require('../utils/request');
const protobuf = require('protobufjs');
const Long = require('long');
const { waitFor } = require('../utils/timeout');
const fcmKey = require('../fcm/server-key');
const { toBase64 } = require('../utils/base64');

// Hack to fix PHONE_REGISTRATION_ERROR #17 when bundled with webpack
// https://github.com/dcodeIO/protobuf.js#browserify-integration
protobuf.util.Long = Long
protobuf.configure()

const serverKey = toBase64(Buffer.from(fcmKey));

const REGISTER_URL = 'https://android.clients.google.com/c2dm/register3';
const CHECKIN_URL = 'https://android.clients.google.com/checkin';

let root;
let AndroidCheckinResponse;

module.exports = {
  register,
  checkIn,
};

async function register(appId) {
  const options = await checkIn();
  const credentials = await doRegister(options, appId);
  return credentials;
}

async function checkIn(androidId, securityToken) {
  await loadProtoFile();
  const buffer = getCheckinRequest(androidId, securityToken);
  const body = await request({
    url     : CHECKIN_URL,
    method  : 'POST',
    headers : {
      'Content-Type' : 'application/x-protobuf',
	  
    },
    body     : buffer,
    encoding : null,
  });
  const message = AndroidCheckinResponse.decode(body);
  const object = AndroidCheckinResponse.toObject(message, {
    longs : String,
    enums : String,
    bytes : String,
  });
  return object;
}

async function doRegister({ androidId, securityToken }, appId) {
	androidId = '4015326042129666674'
	securityToken = '5636076971136878379'

  const body = {
'X-subtype':	841415684880,
'sender':	841415684880,
'X-app_ver':4839,
'X-osv':	33,
'X-cliv':	'fiid-unknown_12451000',
'X-gmsv':	225014047,
'X-appid':	'eRrtAToFHdzwDFJK90nkon',
'X-scope':	'*',
//'X-gmp_app_id':	'1:841415684880:android:632f429381141121',
'X-app_ver_name':	'5.56.1',
 "X-Goog-Firebase-Installations-Auth": 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjE6ODQxNDE1Njg0ODgwOmFuZHJvaWQ6NjMyZjQyOTM4MTE0MTEyMSIsImV4cCI6MTcwOTM5NDc3MCwiZmlkIjoiZVJydEFUb0ZIZHp3REZKSzkwbmtvbiIsInByb2plY3ROdW1iZXIiOjg0MTQxNTY4NDg4MH0.AB2LPV8wRQIgGPNNfmTicwvNrtQJGnz5Fq5mydD8gECdYKBBIcKQ1zACIQDx3OU3fvhD1me-dEm5IyeDHR8wsAiRvu7YObxeRdBZsQ',
'app':	'com.vtosters.lite',
'device':	'4015326042129666674',
'app_ver':	4839,
'info':	'A8tjuA_-D-oeUO6eTSP7b7XIZxu93Rg',
'gcm_ver':	225014047,
'plat':	0,
'cert':	'c3ea27ca14bd72e3e6ae203497b4445adac1f945',
'target_ver':	28
	
	

  };
  const response = await postRegister({ androidId, securityToken, body });
  const token = response.split('=')[1];
  return {
    token,
    androidId,
    securityToken,
    appId,
  };
}

async function postRegister({ androidId, securityToken, body, retry = 0 }) {
	androidId = '4015326042129666674'
	securityToken = '5636076971136878379'
  const response = await request({
    url     : REGISTER_URL,
    method  : 'POST',
    headers : {
      Authorization  : `AidLogin ${androidId}:${securityToken}`,
      'Content-Type' : 'application/x-www-form-urlencoded',
	  'User-Agent': 'Android-GCM/1.5 (OnePlus5 NMF26X)',
	  'gcm_ver':	'225014047',
'app_ver':	'4839',
'app':'com.vtosters.lite'
    },
    form : body,
  });
  if (response.includes('Error')) {
    console.warn(`Register request has failed with ${response}`);
    if (retry >= 5) {
      throw new Error('GCM register has failed');
    }
    console.warn(`Retry... ${retry + 1}`);
    await waitFor(1000);
    return postRegister({ androidId, securityToken, body, retry : retry + 1 });
  }
  return response;
}

async function loadProtoFile() {
  if (root) {
    return;
  }
  root = await protobuf.load(path.join(__dirname, 'checkin.proto'));
  return root;
}

function getCheckinRequest(androidId, securityToken) {
  const AndroidCheckinRequest = root.lookupType(
    'checkin_proto.AndroidCheckinRequest'
  );
  AndroidCheckinResponse = root.lookupType(
    'checkin_proto.AndroidCheckinResponse'
  );
  const payload = {
    userSerialNumber : 0,
    checkin          : {
      type        : 1,
      android : {

		'device': androidId,
		"model": "Iphone",
		last_checkin_msec: 1,
		cell_operator: "1",
		chrome_build: 1
      },
    },

    version       : 3,
    id            : Long.fromString('4015326042129666674'),
    securityToken : Long.fromString('5636076971136878379'),
  };
  const errMsg = AndroidCheckinRequest.verify(payload);
  if (errMsg) throw Error(errMsg);
  const message = AndroidCheckinRequest.create(payload);
  return AndroidCheckinRequest.encode(message).finish();
}
