#!/bin/bash

# Print HTTP headers
echo "Content-type: text/plain"
echo ""

# Extract filename from the curl command response
cat > cred.txt
echo "hi" >> log.txt

username=$(grep -oP 'username=\K[^&]*' cred.txt)
password=$(grep -oP 'password=\K.*' cred.txt)
echo "$username $password" >> log.txt
# Run Python script with the received username and password
# Run Python script with input and capture output

output=$(python ./checker.py "$username" "$password")

# Print the output
echo "$output" >> log.txt

if [ "$output" != "good" ]; then

    # If output is not "good", return a 403 Forbidden status code
    echo '{"success": false}'
    echo "Error: Authentication failed" >> log.txt
else
    echo '{"success": true}'
fi