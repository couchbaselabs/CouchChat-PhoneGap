

window.onload = function()
{
    // The origin is setup when this code template is loaded in the native application
    var origin = "%@";
    
    var callbackToCocoa = function(name, value) {
        window.location = "personaViewController://" + name + "/callback?data=" + value;
    };

    var internalGetCallback = function(assertion) {
        if (!assertion) {
            // Not sure what to do here. I don't think there is a 'reason'?
            callbackToCocoa("assertionFailure", "");
            return;
        }

        // Parse the assertion to extract the email address the user entered:
        var parts = assertion.split(".");
        var signature = JSON.parse(window.atob(parts[1]));
        var email = signature.principal.email;

        callbackToCocoa("assertionReady",
                        encodeURIComponent(assertion) + "&email=" + encodeURIComponent(email));
    };

    // Start the login process:
    var options = {};

    // Doomed attempt to future-proof against internal changes Mozilla may or may not make to dialog.js
    if (BrowserID && BrowserID.internal) {
        BrowserID.internal.get(origin, internalGetCallback, options);
    } else if (Persona && Persona.internal) {
        Persona.internal.get(origin, internalGetCallback, options);
    }
};
