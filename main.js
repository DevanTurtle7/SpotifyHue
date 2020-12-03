
function generateUsername() {
    return "temporaryUsername"
}

function main() {
    var ip = prompt("enter ip:")
    $.get("https://" + ip + "/api/newdeveloper", function(data, status){
        alert("Data: " + data + "\nStatus: " + status);
    });
}

$(document).ready(main);