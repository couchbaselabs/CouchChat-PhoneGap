//
//  PersonaController.m
//  TouchWiki
//
//  Created by Jens Alfke on 1/9/13.
//

#import "PersonaController.h"


static NSString* const kPersonaSignInURL = @"https://login.persona.org/sign_in#NATIVE";


@implementation PersonaController

@synthesize delegate = _delegate;
@synthesize origin = _origin;
@synthesize verifier = _verifier;
@synthesize emailAddress = _emailAddress;

- (NSString*) injectedJavaScript
{
    NSString* injectedCodePath = [[NSBundle mainBundle] pathForResource: @"PersonaController" ofType: @"js"];
    NSString* injectedCodeTemplate = [NSString stringWithContentsOfFile: injectedCodePath encoding:NSUTF8StringEncoding error: nil];
    NSAssert(injectedCodeTemplate != nil, @"Could not load PersonaController.js");

    return [NSString stringWithFormat: injectedCodeTemplate, _origin.absoluteString];
}


- (NSURLRequest*) signInURL {
    return [NSURL URLWithString: kPersonaSignInURL];
}


- (void) verifyAssertion: (NSString*) assertion
{
    // POST the assertion to the verification endpoint. Then report back to our delegate about the
    // results.

    id verifyCompletionHandler = ^(NSHTTPURLResponse* response, NSData* data, NSError* error)
    {
        if (error) {
            [_delegate personaController: self didFailVerificationWithError: error];
        } else {
            NSError* decodingError = nil;
            NSDictionary* receipt = [NSJSONSerialization JSONObjectWithData: data options: 0 error: &decodingError];
            if (decodingError) {
                [_delegate personaController: self didFailVerificationWithError: decodingError];
            } else {
                [_delegate personaController: self didSucceedVerificationWithReceipt: receipt];
            }
        }
    };

    NSMutableURLRequest* request = [[NSMutableURLRequest alloc] initWithURL: self.verifier cachePolicy: NSURLCacheStorageAllowed timeoutInterval: 5.0];
#if !__has_feature(objc_arc)
    [request autorelease];
#endif
    [request setHTTPShouldHandleCookies: YES];
    [request setHTTPMethod: @"POST"];
    [request setHTTPBody: [assertion dataUsingEncoding: NSUTF8StringEncoding]];
    [request setValue: @"text/plain" forHTTPHeaderField: @"content-type"];

    [NSURLConnection sendAsynchronousRequest: request queue: [NSOperationQueue mainQueue]
        completionHandler: verifyCompletionHandler];
}

- (BOOL) handleWebViewLink: (NSURL*)url
{
    // The JavaScript side (the code injected in viewDidLoad will make callbacks to this native code by requesting
    // a PersonaController://callbackname/callback?data=foo style URL. So we capture those here and relay
    // them to our delegate.

    if (![[[url scheme] lowercaseString] isEqualToString: @"personaviewcontroller"])
        return NO;
    
    NSString* message = url.host;
    NSString* param = [[url query] substringFromIndex: [@"data=" length]];
    //NSLog(@"MESSAGE '%@', param '%@'", message, param);
    if ([message isEqualToString: @"assertionReady"]) {
        NSRange separator = [param rangeOfString: @"&email="];
        if (separator.length > 0) {
            NSString* email = [param substringFromIndex: NSMaxRange(separator)];
            param = [param substringToIndex: separator.location];
            self.emailAddress = [email stringByReplacingPercentEscapesUsingEncoding: NSUTF8StringEncoding];
        }
        param = [param stringByReplacingPercentEscapesUsingEncoding: NSUTF8StringEncoding];
        if (_verifier) {
            [self verifyAssertion: param];
        } else {
            [_delegate personaController: self didSucceedWithAssertion: param];
        }
    }

    else if ([message isEqualToString: @"assertionFailure"]) {
        [_delegate personaController: self didFailWithReason: param];
    }

    return YES;
}

@end
