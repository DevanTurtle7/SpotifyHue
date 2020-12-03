
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

async function getCurrentSong() {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        type: "GET",
        success: function(data) {
            console.log("success")
            console.log(data)
        },
        error: function(data) {
            console.log("error")
            console.log(data)
        }
    })
}

function main() {
    //var ip = prompt("enter ip:");
    //connectToBridge(ip)
    getCurrentSong()
}

$(document).ready(main);
