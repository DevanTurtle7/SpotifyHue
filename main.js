
function generateUsername() {
    return "temporaryUsername"
}

function main() {
    console.log("running");
    var ip = prompt("enter ip:");

    $.get("https://" + ip + "/api/newdeveloper", function(data, status){
        alert("Data: " + data + "\nStatus: " + status);
    });
}

$(document).ready(main);