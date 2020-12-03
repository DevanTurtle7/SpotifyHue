
function generateUsername() {
    return "temporaryUsername"
}

function main() {
    ip = prompt("enter ip:")
    $.get("https://" + ip + "/api/newdeveloper", function(data, status){
        alert("Data: " + data + "\nStatus: " + status);
    });
}

main();