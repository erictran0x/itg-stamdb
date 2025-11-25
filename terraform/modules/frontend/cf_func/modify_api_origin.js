function handler(event) {
    var request = event.request;
    var slices = request.uri.split("/").filter(function (x) {
        return x.length > 0;
    });
    slices.shift();
    // request.uri = request.uri.replace(/^\/[^/]*\//, '/');
    request.uri = "/" + slices.join("/");
    return request;
}