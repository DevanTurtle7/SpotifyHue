async function getClientSecret() {
    /*
    Gets the client secret from firestore
    */
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
    /*
    Generates a Philips hue username
    */
    return 'spotify-hue'
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

function pingBridge(ip) {
    /*
    Pings the bridge to try to connect

    Parameters:
        ip: The philips hue bridge ip
    */
    var username = generateUsername(); // Get the username
    var url = 'https://' + ip + '/api'
    
    const result = new Promise(function (resolve, reject) { // Create a promise
        $.ajax({
            url: url,
            type: 'POST',
            data: JSON.stringify({ 'devicetype': username }),
            success: function (data) {
                if (data[0].error != null) {
                    // Did not connect to bridge
                    if (data[0].error.description = 'link button not pressed') {
                        // The user needs to press the link button
                        resolve('link button') // Resolve the promise
                    } else {
                        // Error
                        resolve(null) // Resolve the promise
                    }
                } else {
                    // Connected to bridge
                    var username = data[0].success.username // Get the username from response
                    resolve(username) // Resolve the promise
                }
            },
            error: function (data) {
                // The api website's certificate is not trust
                console.log('error pinging bridge')
                console.log(data)

                updateStatus('Untrusted API', url)

                reject('error')
            }
        })
    })

    return result // Return the data
}

async function connectToBridge(ip) {
    /*
    Connects to philips hue bridge

    Parameters:
        ip: The philips hue bridge ip
    */
    var connectedToBridge = false;
    var bridgeUsername

    const result = new Promise(async function (resolve, reject) { // Create a promise
        while (!connectedToBridge) { // Loop until connected to the bridge
            var response = await pingBridge(ip) // Ping the bridge

            if (response != null) {
                if (response == 'link button') {
                    // Alert the user to press the link button
                    updateStatus('Press the Philips Hue link button')
                } else {
                    // Connected to the bridge
                    bridgeUsername = response
                    connectedToBridge = true;
                }
            }

            await sleep(5000) // Wait
        }
        console.log(response)

        resolve(bridgeUsername) // Resolve the promise
    })

    return result // Return the response
}

function spotifyLogin() {
    /*
    Redirects the user to the spotify login
    */
    location.replace('https://accounts.spotify.com/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirect_uri + '&scope=user-read-currently-playing');
}

async function getToken(clientSecret) {
    /*
    Gets an access token for the Spotify API

    Parameters:
        clientSecret: The Spotify API client secret
    */
    var responseQuery = window.location.search // Get the code in the URL returned from the Spotify login
    // The regex for getting the code
    var re = /[&?]code=([^&]*)/
    var code

    try {
        code = re.exec(responseQuery)[1] // Get the code
    } catch {
        // The window location is empty. Login to spotify
        spotifyLogin()
    }

    const result = new Promise(function (resolve, reject) { // Create a promise
        // Request the access token
        $.ajax({
            type: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            data: {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
            },
            headers: {
                // Headers as outline by the Spotify API
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + clientSecret)
            },
            success: function (data) {
                resolve(data) // Resolve the promise
            },
            error: function (data) {
                console.log('error getting token')
                console.log(data)
                reject('token error') // Reject the promise
            }
        })
    })

    return result // Return the response
}

async function getRefreshToken(clientSecret, refreshToken) {
    /*
    Get a refresh token

    Parameters:
        clientSecret: The Spotify API client secret
        refreshToken: The refresh token gotten from getToken()
    */
    const result = new Promise(function (resolve, reject) { // Create a promise
        $.ajax({
            type: 'POST',
            url: 'https://accounts.spotify.com/api/token',
            data: {
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken,
            },
            headers: {
                // Headers as outline by the Spotify API
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(client_id + ':' + clientSecret)
            },
            success: function (data) {
                resolve(data.access_token); // Resolve the promise with the token
            },
            error: function (data) {
                console.log('error getting refresh token')
                reject('token refresh error') // Reject the promise
            }
        })
    })

    return result // Return the response
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
                if (data == null) {
                    resolve(null)
                } else {
                    if (data.item == null) {
                        resolve(null)
                    } else {
                        var image = data.item.album.images[0].url
                        resolve(image)
                    }
                }
            }, error: function (data) {
                console.log('error getting current song')
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

    return swatches.Vibrant.rgb
}

function getXY(color) {
    var red = color[0]
    var green = color[1]
    var blue = color[2]

    if (red > 0.04045) {
        red = Math.pow((red + 0.055) / (1.0 + 0.055), 2.4)
    } else {
        red = (red / 12.92)
    }

    if (green > 0.04045) {
        green = Math.pow((green + 0.055) / (1.0 + 0.055), 2.4)
    } else {
        green = (green / 12.92)
    }

    if (blue > 0.04045) {
        blue = Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4)
    } else {
        blue = (blue / 12.92)
    }

    var X = red * 0.664511 + green * 0.154324 + blue * 0.162028
    var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685
    var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039
    var x = X / (X + Y + Z)
    var y = Y / (X + Y + Z)

    return [x, y]
}

function setLights(username, ip, xy) {
    var url = 'https://' + ip + '/api/' + username + '/lights'

    $('.lightCheckbox').each(function (index, obj) {
        if ($(obj).prop('checked') == true) {
            var lightNum = $(obj).prop('value')

            $.ajax({
                type: 'PUT',
                url: url + '/' + lightNum.toString() + '/state',
                data: JSON.stringify({ 'xy': xy }),
                error: function (data) {
                    console.log('error changing light ' + lightNum)
                    console.log(data)
                }
            })
        }
    });
}

async function lightSelectorSetup() {
    var url = 'https://' + ip + '/api/' + username + '/lights'

    const done = new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: url,
            success: function (data) {
                for (var obj in data) {
                    if (data[obj].type == "Extended color light") {
                        var name = 'light' + obj.toString() + 'Selector'
                        var text = data[obj].name
                        var checked = true

                        if (localStorage.getItem(text + 'On') != null) {
                            checked = JSON.parse(localStorage.getItem(text + 'On'))
                        } else {
                            localStorage.setItem(text + 'On', true)
                        }

                        var checkedText = checked ? 'checked' : ''

                        var newCheckbox = '<input ' + checkedText + ' type="checkbox" class="lightCheckbox" id="' + name + '" value="' + obj + '">'
                        var checkboxLabel = '<label for="' + name + '">' + text + '</label><br>'

                        $('#lightSelector').append(newCheckbox)
                        $('#lightSelector').append(checkboxLabel)
                    }
                }
                resolve()
            }, error: function(data) {
                updateStatus('Untrusted API', url)
                reject('Untrusted API')
            }
        })
    })

    await done

    $('.lightCheckbox').each(function (index, obj) {
        $(obj).on('change', function () {
            var text = $("label[for='" + obj.id + "']").text()
            localStorage.setItem(text + 'On', $(obj).prop('checked'))
        })
    });
}

function updateStatus(message, apiLink=null) {
    $('#status').text(message)
    if (apiLink != null) {
        $('#trustButton').attr('href', apiLink)
        $('#trustButton').show()
    } else {
        $('#trustButton').hide()
    }
}

async function setup() {
    var time = new Date().getTime() / 1000

    var clientSecret = await getClientSecret();
    try {
        var tokenData = await getToken(clientSecret);
        var token = tokenData.access_token
        var refresh = tokenData.refresh_token
    } catch {
        window.location.replace("")
    }

    if (refresh != null) {
        // User is logged in
        localStorage.setItem('refreshToken', refresh)
        localStorage.setItem('expires', time + 3600)

        return refresh
    } else {
        // User is not logged in
        spotifyLogin()
    }
}

var username = "";
var ip = ""

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

    var refreshToken
    var time = new Date().getTime() / 1000
    var clientSecret = await getClientSecret()

    if (localStorage.getItem('expires') == null) {
        // New user
        refreshToken = await setup()
    } else {
        var expires = localStorage.getItem('expires')
        if (time < expires) {
            // Token has not expired yet
            refreshToken = localStorage.getItem('refreshToken')
        } else {
            // Token has expired
            refreshToken = await setup()
        }
    }

    if (localStorage.getItem('ip') == null) {
        ip = prompt('enter ip:');
        localStorage.setItem('ip', ip)
    } else {
        ip = localStorage.getItem('ip')
    }

    if (localStorage.getItem('username') == null) {
        username = await connectToBridge(ip)
        localStorage.setItem('username', username)
    } else {
        username = localStorage.getItem('username')
    }

    await lightSelectorSetup()

    updateStatus('Connected')

    setInterval(async function () {
        image = await getCurrentSong(refreshToken)
        $('#currentAlbum').attr('src', image)
    }, 1000);
}

$(document).ready(function () {
    main()

    var lastXY
    document.getElementById('currentAlbum').addEventListener('load', function () {
        var color = getPalette('currentAlbum')
        $('#colorBlock').css('background-color', 'rgb(' + color.toString() + ')')

        var xy = getXY(color)

        if (lastXY != xy) {
            lastXY = xy
            if (username != "" && ip != "") {
                setLights(username, ip, xy)
            }
        }
    })
});