//
//  PersonaController
//  TouchWiki
//
//  Created by Jens Alfke on 1/9/13.
//  Copyright (c) 2013 Couchbase. All rights reserved.
//

#import <Foundation/Foundation.h>
@class PersonaController;


/** Delegate of a PersonaController. Of the optional methods, didSucceedWithAssertion
    must be implemented unless the controller's 'verifier' property is set, in which case both
    didSucceedVerificationWithReceipt and didFailVerificationWithError must be implemented. */
@protocol PersonaControllerDelegate <NSObject>

/** Sent if the user presses the Cancel button on the Persona window. */
- (void) personaControllerDidCancel: (PersonaController*) personaController;

/** Sent if the authentication process fails. Currently the reason will just be @"". */
- (void) personaController: (PersonaController*) personaController
           didFailWithReason: (NSString*) reason;
@optional
/** Sent after authentication was successful. The assertion will be a long opaque string that
    should be sent to the origin site's Persona authentication API. */
- (void) personaController: (PersonaController*) personaController
     didSucceedWithAssertion: (NSString*) assertion;

/** Sent after authentication and server-side verification are successful, _only_ if the
    controller's 'verifier' property is set to a server-side verifier URL.
    The 'receipt' parameter is the verifier response as decoded from JSON. */
- (void) personaController: (PersonaController*) personaController
         didSucceedVerificationWithReceipt: (NSDictionary*) receipt;

/** Sent if server-side verification fails, _only_ if the controller's 'verifier' property is set
    to a server-side verifier URL. */
- (void) personaController: (PersonaController*) personaController
         didFailVerificationWithError: (NSError*) error;

@end


/** Controller for Persona login. This class is cross-platform; the UI-related API is in
    category methods found in PersonaController+UIKit.h and PersonaController+AppKit.h. */
@interface PersonaController : NSObject
{
    @private
    id _UIController;
}

/** The object that will be informed about success or failure. Required. */
#if !__has_feature(objc_arc)
@property (nonatomic,assign) id<PersonaControllerDelegate> delegate;
#else
@property (nonatomic,weak) id<PersonaControllerDelegate> delegate;
#endif


/** The URL of the site the user is logging into (i.e. the site you will send the assertion to).
    Required. */
@property (nonatomic,strong) NSURL* origin;

/** An optional URL of a verification service provided by your applicatin's server-side counterpart.
    If this property is set, an assertion will be sent to this URL as the body of a POST request,
    and the response relayed to the delegate via its verification-related methods. */
@property (nonatomic,strong) NSURL* verifier;

/** After a successful login, this property will be set to the email address the user entered. */
@property (nonatomic,strong) NSString* emailAddress;

// Internal:

@property (nonatomic,readonly) NSString* injectedJavaScript;
@property (nonatomic,readonly) NSURL* signInURL;
- (BOOL) handleWebViewLink: (NSURL*)url;

@end
