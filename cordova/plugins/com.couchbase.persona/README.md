## Mozilla Persona (aka Persona) and PhoneGap / Cordova, together at last.

This plugin is a reasonably non-dirty workaround to [the existing issues with browserid and PhoneGap](https://github.com/mozilla/browserid/issues/2034).

It includes code from the [Couchbase fork of the Mozilla iOS Persona SDK](https://github.com/couchbaselabs/browserid-ios).

The gist is that rather than trying to work with the PhoneGap web view, or the ChildBrowser plugin, or the system browser, instead it just brute forces a new webview, just like you would do if you were a native app.

To install, use [plugman](https://github.com/imhotep/plugman) and run it like this:

	plugman --debug --platform ios --project $MYPRJOJECT --plugin git://github.com/couchbaselabs/cordova-browserid.git

Sorry, only iOS support for now. Happy to accept pull reqs for Android.
