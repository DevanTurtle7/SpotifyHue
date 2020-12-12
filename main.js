async function getClientSecret() {
    var docRef = db.collection('credentials').doc('client_secret')

    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error occurred getting secret. Trying again...')
        return getClientSecret()
    })

    return data.value
}

function generateUsername() {
    return 'temporaryUsername'
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

function pingBridge(ip) {
    var username = generateUsername();
    $.ajax({
        url: 'https://' + ip + '/api',
        type: 'POST',
        data: JSON.stringify({ 'devicetype': username }),
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
            console.log('error!')
            console.log(data)
        }
    })
}

async function connectToBridge(ip) {
    // Try refactoring with promises
    var connectedToBridge = false;
    var bridgeUsername = ''

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
    location.replace('https://accounts.spotify.com/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirect_uri + '&scope=user-read-currently-playing');
}

async function getToken(clientSecret) {
    var responseQuery = window.location.search
    var re = /[&?]code=([^&]*)/
    var code
    
    try {
        code = re.exec(responseQuery)[1]
    } catch {
        spotifyLogin()
    }

    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            data: {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + clientSecret)
            },
            success: function (data) {
                console.log(data)
                resolve(data)
            },
            error: function (data) {
                console.log(data)
                reject('token error')
            }
        })
    })

    return result
}

async function getRefreshToken(clientSecret, accessToken) {
    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            data: {
                'grant_type': 'refresh_token',
                'refresh_token': accessToken,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + clientSecret)
            },
            success: function (data) {
                resolve(data.access_token);
            },
            error: function (data) {
                reject('token refresh error')
            }
        })
    })

    return result
}

async function getCurrentSong(refreshToken) {
    var clientSecret = await getClientSecret()
    var accessToken = await getRefreshToken(clientSecret, refreshToken)

    const result = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: 'https://api.spotify.com/v1/me/player/currently-playing',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }, success: function (data) {
                var image = data.item.album.images[0].url
                resolve(image)
            }, error: function (data) {
                reject('error')
            }
        })
    })

    return result
}

function getPalette(id) {
    "use strict";
    var image = document.getElementById(id)

    var vibrant = new Vibrant(image)
    var swatches = vibrant.swatches()

    return swatches.Vibrant.getHex()
}

async function setup() {
    var clientSecret = await getClientSecret();
    var tokenData = await getToken(clientSecret);
    var token = tokenData.access_token
    var refresh = tokenData.refresh_token
    
    return refresh
}

async function main() {
    firebase.initializeApp({
        apiKey: 'AIzaSyCoWUDx03Onb9JDj2MOqvjiTUzHAVrwzyY',
        authDomain: 'spotify-hue.firebaseapp.com',
        projectId: 'spotify-hue',
        storageBucket: 'spotify-hue.appspot.com',
        messagingSenderId: '18502599113',
        appId: '1:18502599113:web:c7627cea0aa74a3efd6818',
        measurementId: 'G-XZ8PE0K3Y1'
    });

    db = firebase.firestore()

    //var ip = prompt('enter ip:');
    //connectToBridge(ip)

    var refreshToken
    var time = new Date().getTime() / 1000

    if (localStorage.getItem('expires') == null) {
        refreshToken = await setup()
        if (refreshToken != null) {
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('expires', time + 3600)
        } else {
            spotifyLogin()
        }
    } else {
        var expires = localStorage.getItem('expires')
        if (time < expires) {
            refreshToken = localStorage.getItem('refreshToken')
        } else {
            spotifyLogin()
        }
    }

    console.log(1)
    console.log(2)

    setInterval(async function () {
        image = await getCurrentSong(refreshToken)
        $('#currentAlbum').attr('src', image)
    }, 2000);
}


$(document).ready(function () {
    main()
    document.getElementById('currentAlbum').addEventListener('load', function () {
        var color = getPalette('currentAlbum')
        $('#colorBlock').css('background-color', color)
    })
});