import hmac
import time
import base64
import struct
import hashlib

def get_totp(secret_base64):
    t = int(time.time()) // 30

    print("t=", t)

    # Decode the secret from base64
    secret_bytes = base64.b64decode(secret_base64)

    # Calculate the required padding length
    padding_length = (8 - len(secret_bytes) % 8) % 8

    # Add padding to the secret
    secret_padded = secret_bytes + b'\x00' * padding_length

    # Convert the timestamp to bytes and pack it
    counter = struct.pack('>Q', t)

    # Calculate the HMAC-SHA1 hash
    hash_result = hmac.new(secret_padded, counter, hashlib.sha1).digest()

    # Extract the 4-byte dynamic truncation value
    offset = hash_result[19] & 0xF
    part = hash_result[offset:offset + 4]

    # Unpack the 4-byte value and apply a mask
    totp = (struct.unpack(">I", part)[0] & 0x7FFFFFFF) % 1000000

    return str(totp).zfill(6)

print(get_totp("ORSXG5A=="))
