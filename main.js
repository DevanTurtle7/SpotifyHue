
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

function getCurrentSong() {
    $.ajax({
        url: "https://accounts.spotify.com/authorize?response_type=code&client_id=" + client_id + "&redirect_uri=" + redirect_uri,
        type: "GET",
        success: function (data) {
            console.log("success")
            console.log(data)
        },
        error: function (data) {
            console.log("error")
        }
    })
}

function spotifyLogin() {
    location.replace("https://accounts.spotify.com/authorize?response_type=code&client_id=" + client_id + "&redirect_uri=" + redirect_uri);
}

function getToken() {
    var responseQuery = window.location.search
    var re = /[&?]code=([^&]*)/
    var code = re.exec(responseQuery)[1]
    var client_secret = prompt("Enter client secret")

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
        success: function(data) {
            console.log(data)
        }
    })
}

function main() {
    //var ip = prompt("enter ip:");
    //connectToBridge(ip)
    //getCurrentSong()
}

$(document).ready(main);