//
//  PersonaController+UIKit.m
//  TouchWiki
//
//  Created by Jens Alfke on 1/9/13.
//  Copyright (c) 2013 Couchbase. All rights reserved.
//

#import "PersonaController+UIKit.h"


@interface PersonaUIViewController : UIViewController <UIWebViewDelegate>
{
    PersonaController* _controller;
    UIWebView* _webView;
}
- (id) initWithController: (PersonaController*)controller;
@end


@implementation PersonaController (UIKit)

static id noarcAutorelease(id obj) {
#if !__has_feature(objc_arc)
    return [obj autorelease];
#else
    return obj;
#endif
}

- (UIViewController*) viewController {
    if (!_UIController) {
        _UIController = [[PersonaUIViewController alloc] initWithController: self];
    }
    return _UIController;
}

/** A convenience method that puts the receiver in a UINavigationController and presents it modally
 in the given parent controller. */
- (UINavigationController*) presentModalInController: (UIViewController*)parentController {
    UIViewController* viewController = self.viewController;
    if (!viewController)
        return nil;
    UINavigationController* navController = [[UINavigationController alloc]
                                             initWithRootViewController: viewController];
    if (navController == nil)
        return nil;

    if (UI_USER_INTERFACE_IDIOM() != UIUserInterfaceIdiomPhone) {
        navController.modalPresentationStyle = UIModalPresentationFormSheet;
    }
    [parentController presentViewController: navController animated: YES completion: nil];
    return noarcAutorelease(navController);
}

@end


@implementation PersonaUIViewController

- (id) initWithController: (PersonaController*)controller {
    self = [super init];
    if (self) {
        _controller = controller;
    }
    return self;
}

- (void) loadView {
    UIView* rootView = [[UIView alloc] initWithFrame: CGRectMake(0, 0, 200, 200)];
    _webView = [[UIWebView alloc] initWithFrame: rootView.bounds];
    _webView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    [rootView addSubview: _webView];
    _webView.delegate = self;
    self.view = rootView;
    noarcAutorelease(rootView);
}

- (void) viewDidLoad
{
    [super viewDidLoad];

    self.title = NSLocalizedString(@"Log In With Persona", @"Persona login window title");

    UIBarButtonItem* cancelButton = [[UIBarButtonItem alloc] initWithTitle: @"Cancel"
                                                                     style: UIBarButtonItemStylePlain target: self action: @selector(cancel)];
    self.navigationItem.rightBarButtonItem = cancelButton;
}

- (void) viewWillAppear:(BOOL)animated
{
    [_webView loadRequest: [NSURLRequest requestWithURL: _controller.signInURL]];
    [_webView stringByEvaluatingJavaScriptFromString: _controller.injectedJavaScript];
}

- (BOOL) shouldAutorotateToInterfaceOrientation: (UIInterfaceOrientation) interfaceOrientation
{
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone) {
        return (interfaceOrientation == UIInterfaceOrientationPortrait);
    } else {
        return YES;
    }
}

- (IBAction) cancel
{
    [_webView stopLoading];
    [_controller.delegate personaControllerDidCancel: _controller];
}

- (BOOL) webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
    NSURL* url = request.URL;
    if ([_controller handleWebViewLink: url]) {
        return NO;
    } else if ([[[url scheme] lowercaseString] isEqualToString: @"http"] ||
               [[[url scheme] lowercaseString] isEqualToString: @"https"])
    {
        if (![url isEqual: _controller.signInURL])
        {
            [[UIApplication sharedApplication] openURL: url];
            return NO;
        }
    }

    return YES;
}


@end
