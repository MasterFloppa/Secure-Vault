async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}


localStorage.clear();


async function authenticate() {

    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    //sah256 for admin= 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
    hashed_password = await sha256(password);
    console.log(hashed_password);

    var url = "https://192.168.182.230/middle"; // Assuming this is the authentication endpoint
    var params = "username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(hashed_password);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    alert('Login successful!');
                    localStorage.setItem('username', username);
                    localStorage.setItem('password', hashed_password);

                    window.location.href = './home.html'; // Redirect to home page
                    // Redirect or perform other actions upon successful login
                } else {
                    alert('Login failed. Please check your credentials.');
                    localStorage.clear();
                }
                //console.log("Authentication successful");
                //window.location.href = '/home.html'; // Redirect to home page
            } else {
                console.error('Authentication failed. Status:', xhr.status);
                localStorage.clear();
            }
        }
    };
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(params);
}
