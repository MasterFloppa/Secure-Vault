#!/usr/bin/env python3

import sys
import json
import hmac
import time
import base64
import struct
import hashlib


def get_totp(secret_base64):
    t = int(time.time()) // 30

    #print("t=", t)

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


def main():


    if len(sys.argv) < 3:
        #print("Usage: python checker.py <username> <password>")
        return "bad"

    # Retrieve username and password from command-line arguments
    username = sys.argv[1]
    hashed_password = sys.argv[2]
    FA = sys.argv[3]
    

    with open('/home/kali/metadata/users.json') as f:
        users = json.load(f)


    # Check if username and hashed password match any user in the JSON data
    for user in users:
        if user['username'] == username and user['password'] == hashed_password and FA==str(get_totp(user['FA'])):
            #print('Content-Type: application/json')  # Set the content type to JSON
            #print()  # Print a blank line to indicate the start of the response body
            #print(json.dumps({'success': True}))  # Send JSON response indicating success
            return "good"

    # If no match is found, return failure
    #print('Content-Type: application/json')  # Set the content type to JSON
    #print()  # Print a blank line to indicate the start of the response body
    #print(json.dumps({'success': False}))  # Send JSON response indicating failure
    return "bad"

if __name__ == "__main__":
    print(main())
