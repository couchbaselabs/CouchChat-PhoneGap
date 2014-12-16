**Warning: this example is very out of date, so expect to spend some effort wrangling with it.  Check our [sample app list](http://developer.couchbase.com/mobile/develop/samples/samples/index.html) for an updated list.**

This is an example app for the [LiteGap container for PhoneGap/Cordova and Couchbase Lite](https://github.com/couchbaselabs/LiteGap)

To install it follow the instruction in the LiteGap readme. Do note that it requires configuring the Couchbase Sync Gateway with the  [configuration from the native iOS version of this app](https://github.com/couchbaselabs/CouchChat-iOS/blob/master/sync-gateway-config.json)

## Learn more

The [app code itself is here](https://github.com/couchbaselabs/CouchChat-PhoneGap/blob/ios/www/js/app/controller.js) and there is a [Browserify script here to bundle the JavaScript before each build](https://github.com/couchbaselabs/CouchChat-PhoneGap/blob/ios/bundle.js)

There is a build phase for running the `bundle.js` script. If it gives you any trouble you can delete it from the Xcode project, and run `./bundle.js -w` and it will bundle everytime you touch a file.
