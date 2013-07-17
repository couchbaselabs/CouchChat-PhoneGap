//
//  PersonaController+UIKit.h
//  TouchWiki
//
//  Created by Jens Alfke on 1/9/13.
//  Copyright (c) 2013 Couchbase. All rights reserved.
//

#import "PersonaController.h"

@interface PersonaController (UIKit)

/** A UIViewController that contains the Persona login UI. */
@property (readonly) UIViewController* viewController;

/** A convenience method that puts the receiver in a UINavigationController and presents it modally
 in the given parent controller. */
- (UINavigationController*) presentModalInController: (UIViewController*)parentController;

@end
