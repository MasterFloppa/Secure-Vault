//------------------------------------------ Authentication ------------------------------------------
function meow() {
    var url = "https://192.168.182.230/middle"; // Assuming this is the authentication endpoint
    var params = "username=" + encodeURIComponent(localStorage.getItem('username'))
        + "&password=" + encodeURIComponent(localStorage.getItem('password'));
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (!response.success) {
                    //Redirect back if not logged in
                    window.location.href = './login.html';
                }
            } else {
                console.error('Authentication failed. Status:', xhr.status);
            }
        }
    };
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(params);
}
meow();

//------------------------------------------ File Upload ------------------------------------------
// Function to derive a cryptographic key from the user's password and username
async function deriveKey(password, username) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const usernameBuffer = encoder.encode(username);
    const concatenatedBuffer = new Uint8Array([...passwordBuffer, ...usernameBuffer]);

    // Derive key using SHA-256
    const digestBuffer = await crypto.subtle.digest('SHA-256', concatenatedBuffer);

    // Import key from the digest buffer
    return await crypto.subtle.importKey(
        'raw', // Key format
        digestBuffer, // Key data
        { name: 'AES-GCM' }, // Algorithm details
        false, // Not extractable
        ['encrypt', 'decrypt'] // Key usages
    );
}

var IV = new Uint8Array([43, 176, 185, 12, 183, 207, 91, 13, 93, 242, 50, 21]);

// Function to encrypt only the file content
async function encryptFileContent(fileBuffer, key) {
    const encryptedFileContent = await crypto.subtle.encrypt({ name: "AES-GCM", iv: IV }, key, fileBuffer);
    //console.log("Original File Content:", new Uint8Array(fileBuffer));
    //console.log("Encrypted File Content:", new Uint8Array(encryptedFileContent));
    return encryptedFileContent;
}

// Function to encrypt the entire file including metadata
async function encryptFile(file, key) {
    const fileBuffer = await file.arrayBuffer();

    // Encrypt only the file content
    const encryptedFileContent = await encryptFileContent(fileBuffer, key);
    //console.log("Encrypted File Content:", new Uint8Array(encryptedFileContent));

    // Create a new File object
    const encryptedFile = new File([new Uint8Array(encryptedFileContent)], file.name);

    return encryptedFile;
}


document.getElementById("uploadButton").addEventListener("click", async function () {
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];
    var password = localStorage.getItem('password');
    var username = localStorage.getItem('username');

    if (file && password && username) {
        try {
            // Derive cryptographic key from password and username
            const key = await deriveKey(password, username);

            // Create a new FormData object and append the encrypted file content

            var encryptedFile = await encryptFile(file, key);


            const fileBuffer = await encryptedFile.arrayBuffer();

            console.log(encryptedFile.name);
            console.log("encrypted msg:", new Uint8Array(fileBuffer));

            var formData = new FormData();
            formData.append("file", encryptedFile);

            const response = await fetch("https://192.168.182.230/upload/", {
                method: 'POST',
                body: formData
            })
            console.log('eeee', await response.text())
        } catch (error) {
            console.error("Encryption error:", error);
        }
    } else {
        console.error("Please select a file and fill in all required fields.");
    }
});

//sha256 for admin= 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

async function decryptFile(encryptedFile, key) {
    return await crypto.subtle.decrypt({ name: "AES-GCM" }, key, encryptedFile);
}


async function decryptBuffer(encryptedBuffer, key) {
    // Decrypt the buffer using the provided key
    console.log({ IV, encryptedBuffer, key });
    let unpaddedArrayBuf = new ArrayBuffer(encryptedBuffer.length - 2);
    unpaddedArrayBuf = encryptedBuffer.slice(0, -2);
    console.log({ unpaddedArrayBuf })
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: IV }, key, unpaddedArrayBuf).catch(e => console.error('decrypt', e));
    return decryptedBuffer;
}


async function downloadFile(filename) {

    var fileNameInput = document.getElementById('fileNameInput');
    var fileName = fileNameInput.value;
    var url = "https://192.168.182.230/download?filename=" + encodeURIComponent(fileName);
    var password = localStorage.getItem('password');
    var username = localStorage.getItem('username');
    const key = await deriveKey(password, username);
    // Make a request to the server to get the file
    if (fileName) {
        var url = "https://192.168.182.230/download?filename=" + encodeURIComponent(fileName);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        console.log("Requesting file:", fileName);
        xhr.setRequestHeader("Content-Type", "arraybuffer"); // Set content type if needed
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var ppXhr = new XMLHttpRequest();
                    ppXhr.open('GET', filename, true);
                    ppXhr.responseType = 'arraybuffer'; // The response type should be 'arraybuffer' for binary data
                    ppXhr.onload = async function () {
                        if (ppXhr.status === 200) {
                            // Get the encrypted buffer representing the file
                            var encryptedBuffer = ppXhr.response;

                            // Decrypt the buffer
                            try {
                                const decryptedBuffer = await decryptBuffer(encryptedBuffer, key).catch(console.error);
                                // Convert the decrypted buffer to a Blob
                                var decryptedBlob = new Blob([decryptedBuffer], { type: 'application/octet-stream' });

                                // Create a temporary anchor element to trigger the download
                                var a = document.createElement('a');
                                a.href = window.URL.createObjectURL(decryptedBlob);
                                a.download = filename; // Set the file name
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            } catch (error) {
                                console.error('Decryption error:', error);
                            }
                        }
                    };

                    ppXhr.send();
                    console.log("Received data:", xhr.response);
                } else {
                    console.error('Failed to fetch data. Status:', xhr.status);
                }
            }
        };
        xhr.send();
    }
}

document.getElementById("downloadButton").addEventListener("click", function () {
    var filename = './output.txt'; // Specify the path to your file
    downloadFile(filename);
});
