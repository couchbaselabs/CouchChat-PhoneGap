//
//  PersonaController+AppKit.h
//  TouchWiki
//
//  Created by Jens Alfke on 1/9/13.
//  Copyright (c) 2013 Couchbase. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "PersonaController.h"

@interface PersonaController (AppKit)

/** A view controller that hosts the login UI. */
@property (nonatomic,readonly) NSViewController* viewController;

/** A panel window containing the login view controller. */
@property (nonatomic,readonly) NSPanel* panel;

@end
