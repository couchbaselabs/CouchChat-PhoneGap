#import "CBCordovaPersona.h"
#import <Cordova/CDV.h>

@implementation CBCordovaPersona

@synthesize command;

- (id) initWithWebView:(UIWebView*)theWebView
{
    self = [super initWithWebView:theWebView];

    // todo capture the web view here instead of fishing it out in the command

    return self;
}

- (void)presentPersonaDialog:(CDVInvokedUrlCommand*)urlCommand
{
    if (self.command != nil) {
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"There is already a Persona call in progress"] callbackId:urlCommand.callbackId];
        return;
    }
    self.command = urlCommand;

    // present modal controller, set us as the delegate
    PersonaController* personaController = [[PersonaController alloc] init];
    personaController.origin = [NSURL URLWithString:[urlCommand.arguments objectAtIndex:0]];
    personaController.delegate = self;

    UIViewController* rootVC = [[[UIApplication sharedApplication] keyWindow] rootViewController];
    [personaController presentModalInController: rootVC];
}

- (void) dismissPersonaController: (PersonaController*) personaController {
    [personaController.viewController dismissViewControllerAnimated: YES completion: NULL];
}

- (void) personaControllerDidCancel: (PersonaController*) personaController {
    [self dismissPersonaController: personaController];
    // send error back to javascript
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"canceled"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.command.callbackId];
    self.command = nil;
}

- (void) personaController: (PersonaController*) personaController
           didFailWithReason: (NSString*) reason
{
    [self dismissPersonaController: personaController];
    // send error back to javascript
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:reason];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.command.callbackId];
    self.command = nil;
}

- (void) personaController: (PersonaController*) personaController
     didSucceedWithAssertion: (NSString*) assertion
{
    [self dismissPersonaController: personaController];
    // send assertion back to javascript
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:assertion];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.command.callbackId];
    self.command = nil;
}

@end
