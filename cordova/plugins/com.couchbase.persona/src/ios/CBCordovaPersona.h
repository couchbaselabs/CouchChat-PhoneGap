#import <Cordova/CDV.h>
#import "PersonaController+UIKit.h"

@interface CBCordovaPersona : CDVPlugin <PersonaControllerDelegate>

@property (nonatomic, strong) CDVInvokedUrlCommand *command;

- (void)presentPersonaDialog:(CDVInvokedUrlCommand*)urlCommand;

@end
