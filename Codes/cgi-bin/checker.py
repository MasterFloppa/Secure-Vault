#!/usr/bin/env python3

import sys
import json

def main():


    if len(sys.argv) < 3:
        #print("Usage: python checker.py <username> <password>")
        return "bad"

    # Retrieve username and password from command-line arguments
    username = sys.argv[1]
    hashed_password = sys.argv[2]
   

    with open('users.json') as f:
        users = json.load(f)


    # Check if username and hashed password match any user in the JSON data
    for user in users:
        if user['username'] == username and user['password'] == hashed_password:
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
