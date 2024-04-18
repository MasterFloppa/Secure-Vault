function getTOTP(secretBase64) {
    // Get the current time in seconds
    var t = Math.floor(Date.now() / 1000);
    var tBytes = new ArrayBuffer(8);
    var counterView = new DataView(tBytes);
    counterView.setUint32(4, t >> 0);
    counterView.setUint32(0, t >>> 0);

    // Decode the secret from base64
    var secretBytes = base64ToUint8Array(secretBase64);

    // Calculate the required padding length
    var paddingLength = (8 - secretBytes.length % 8) % 8;

    // Add padding to the secret
    var secretPadded = new Uint8Array(secretBytes.length + paddingLength);
    secretPadded.set(secretBytes);

    // Convert the timestamp to bytes and pack it
    var counter = new Uint8Array(tBytes);

    // Calculate the HMAC-SHA1 hash
    var hashResult = hmacSHA1(secretPadded, counter);

    // Extract the 4-byte dynamic truncation value
    var offset = hashResult[19] & 0xF;
    var part = hashResult.subarray(offset, offset + 4);

    // Unpack the 4-byte value and apply a mask
    var totp = (part[0] & 0x7F) << 24 | (part[1] & 0xFF) << 16 | (part[2] & 0xFF) << 8 | (part[3] & 0xFF);
    totp = totp % 1000000;

    return ('000000' + totp).slice(-6);
}

function base64ToUint8Array(base64) {
    var binaryString;
    try {
        binaryString = atob(base64);
    } catch (e) {
        console.error("Base64 decoding error:", e);
        return null;
    }
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; ++i) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}


function hmacSHA1(key, data) {
    // Constants
    var blockSize = 64;
    var sha1BlockSize = 64;
    var sha1OutputSize = 20;
    var ipad = 0x36;
    var opad = 0x5C;

    // Padding key if necessary
    if (key.length > sha1BlockSize) {
        key = sha1(key);
    }
    if (key.length < sha1BlockSize) {
        var newKey = new Uint8Array(sha1BlockSize);
        newKey.set(key);
        key = newKey;
    }

    // Inner HMAC
    var iKey = new Uint8Array(blockSize);
    var oKey = new Uint8Array(blockSize);
    for (var i = 0; i < sha1BlockSize; i++) {
        iKey[i] = key[i] ^ ipad;
        oKey[i] = key[i] ^ opad;
    }
    var innerHash = sha1(concatenateUint8Arrays(iKey, data));

    // Outer HMAC
    var outerHash = sha1(concatenateUint8Arrays(oKey, innerHash));

    return outerHash;
}

function sha1(data) {
    var buffer = new Uint8Array(data);
    var sha1Hash = new KJUR.crypto.MessageDigest({ alg: 'sha1', prov: 'cryptojs' });
    sha1Hash.updateHex(bufferToHex(buffer));
    return hexToUint8Array(sha1Hash.digest());
}

function concatenateUint8Arrays(array1, array2) {
    var newArray = new Uint8Array(array1.length + array2.length);
    newArray.set(array1);
    newArray.set(array2, array1.length);
    return newArray;
}

function bufferToHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (x) {
        return ('00' + x.toString(16)).slice(-2);
    }).join('');
}

function hexToUint8Array(hex) {
    var bytes = [];
    for (var i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
}

console.log(getTOTP("ORSXG5A=="));
