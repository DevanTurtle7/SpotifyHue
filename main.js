

async function getClientSecret() {
    var docRef = db.collection("credentials").doc("client_secret")

    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log("Error occurred getting secret. Trying again...")
        return getClientSecret()
    })

    return data.value
}

function generateUsername() {
    return "temporaryUsername"
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

function pingBridge(ip) {
    var username = generateUsername();
    $.ajax({
        url: "https://" + ip + "/api",
        type: "POST",
        data: JSON.stringify({ "devicetype": username }),
        success: function (data) {
            console.log(data);
            if (data[0].error != null) {
                return null
            } else {
                var username = data[0].success.username
                return username
            }
        },
        error: function (data) {
            console.log("error!")
            console.log(data)
        }
    })
}

async function connectToBridge(ip) {
    var connectedToBridge = false;
    var bridgeUsername = ""

    while (!connectedToBridge) {
        var response = pingBridge(ip)

        if (response != null) {
            bridgeUsername = response
            connectedToBridge = true;
        }

        await sleep(5000)
    }
    console.log(response)

    return bridgeUsername
}

function spotifyLogin() {
    location.replace("https://accounts.spotify.com/authorize?response_type=code&client_id=" + client_id + "&redirect_uri=" + redirect_uri);
}

function getToken() {
    getClientSecret().then(function (value) {
        var responseQuery = window.location.search
        var re = /[&?]code=([^&]*)/
        var code = re.exec(responseQuery)[1]
        var client_secret = value

        $.ajax({
            type: "POST",
            url: 'https://accounts.spotify.com/api/token',
            data: {
                "grant_type": 'authorization_code',
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
            },
            success: function (data) {
                console.log(data)
            },
            error: function (data) {
                console.log("error!")
                console.log(data)
            }
        })
    })
}

function getSongHandler() {
    getClientSecret().then(function (value) {
        client_secret = value
        getCurrentSong(client_secret)
    })
}

function getCurrentSong(clientSecret) {
    $.ajax({
        type: "GET",
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        headers: {
            "Authorization": "user-read-currently-playing"
        }, success: function(data) {
            console.log(data)
        }, error: function(data) {
            console.log("Error!")
            console.log(data)
        }
    })
}

function main() {
    //var ip = prompt("enter ip:");
    //connectToBridge(ip)
    //getCurrentSong()

    firebase.initializeApp({
        apiKey: "AIzaSyCoWUDx03Onb9JDj2MOqvjiTUzHAVrwzyY",
        authDomain: "spotify-hue.firebaseapp.com",
        projectId: "spotify-hue",
        storageBucket: "spotify-hue.appspot.com",
        messagingSenderId: "18502599113",
        appId: "1:18502599113:web:c7627cea0aa74a3efd6818",
        measurementId: "G-XZ8PE0K3Y1"
    });

    db = firebase.firestore()

    let client_secret;

    getClientSecret().then(function (value) {
        client_secret = value
    })

}

$(document).ready(main);