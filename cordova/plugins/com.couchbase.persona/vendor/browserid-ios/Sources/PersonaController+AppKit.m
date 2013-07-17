//
//  PersonaController+AppKit.m
//  TouchWiki
//
//  Created by Jens Alfke on 1/9/13.
//  Copyright (c) 2013 Couchbase. All rights reserved.
//

#import "PersonaController+AppKit.h"
#import <WebKit/WebKit.h>

@interface PersonaNSViewController : NSViewController
{
    PersonaController* _controller;
    WebView* _webView;
    NSPanel* _panel;
}
- (id) initWithController: (PersonaController*)controller;
@property (readonly) WebView* webView;
@property (readonly) NSPanel* panel;
@end


@implementation PersonaController (AppKit)

- (NSViewController*) viewController {
    if (!_UIController) {
        _UIController = [[PersonaNSViewController alloc] initWithController: self];
    }
    return _UIController;
}

- (NSPanel*) panel {
    return [(PersonaNSViewController*)self.viewController panel];
}

@end


@implementation PersonaNSViewController

@synthesize webView=_webView;

- (id) initWithController: (PersonaController*)controller {
    self = [super init];
    if (self) {
        _controller = controller;
    }
    return self;
}

- (void) loadView {
    _webView = [[WebView alloc] initWithFrame: NSMakeRect(0, 0, 500, 400)];
    _webView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    _webView.policyDelegate = self;
    self.view = _webView;

    [_webView.mainFrame loadRequest: [NSURLRequest requestWithURL: _controller.signInURL]];
    [_webView stringByEvaluatingJavaScriptFromString: _controller.injectedJavaScript];
}

- (NSPanel*)panel {
    if (!_panel) {
        _panel = [[NSPanel alloc] initWithContentRect: NSMakeRect(0, 0, 500, 450)
                                            styleMask: NSTitledWindowMask | NSClosableWindowMask | NSResizableWindowMask
                                              backing: NSBackingStoreBuffered
                                                defer: YES];
        NSRect frame = NSInsetRect([_panel.contentView bounds], 8, 8);
        frame.origin.y += 40;
        frame.size.height -= 40;
        self.view.frame = frame;
        [_panel.contentView addSubview: self.view];

        NSButton* cancel = [[NSButton alloc] initWithFrame: NSZeroRect];
        cancel.buttonType = NSMomentaryLightButton;
        cancel.bezelStyle = NSRoundedBezelStyle;
        cancel.title = @"Cancel";
        cancel.target = self;
        cancel.action = @selector(cancel);
        cancel.autoresizingMask = NSViewMinXMargin | NSViewMaxYMargin;
        [cancel sizeToFit];
        frame = cancel.frame;
        frame.origin.x = 500 - 8 - frame.size.width;
        frame.origin.y = 8;
        cancel.frame = frame;
        [_panel.contentView addSubview: cancel];
    }
    return _panel;
}

- (IBAction) cancel
{
    [_webView.mainFrame stopLoading];
    [_controller.delegate personaControllerDidCancel: _controller];
}

// WebPolicyDelegate method
- (void) webView:(WebView *)webView
         decidePolicyForNavigationAction:(NSDictionary *)actionInformation
         request:(NSURLRequest *)request
         frame:(WebFrame *)frame
         decisionListener:(id<WebPolicyDecisionListener>)listener
{
    NSURL* url = request.URL;
    if ([_controller handleWebViewLink: url]) {
        [listener ignore];
        return;
    } else if ([[[url scheme] lowercaseString] isEqualToString: @"http"] ||
               [[[url scheme] lowercaseString] isEqualToString: @"https"])
    {
        if (![url isEqual: _controller.signInURL])
        {
            [[NSWorkspace sharedWorkspace] openURL: url];
            [listener ignore];
            return;
        }
    }

    // default:
    [listener use];
}


@end