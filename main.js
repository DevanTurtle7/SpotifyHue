
function generateUsername() {
    return "temporaryUsername"
}

function main() {
    $.get("https://" + ip + "/api/newdeveloper", function(data, status){
        alert("Data: " + data + "\nStatus: " + status);
    });
}

main();