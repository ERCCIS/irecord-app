/** ****************************************************************************
 * App object.
 *****************************************************************************/
import $ from 'jquery';
import Backbone from 'backbone';
import Marionette from 'marionette';
import FastClick from '../vendor/fastclick/js/fastclick';
import analytics from './helpers/analytics';
import log from './helpers/log';
import brcArt from './helpers/brcart';

import DialogRegion from './components/common/dialog_region';
import HideableRegion from './components/common/hideable_region';

// init Analytics
analytics.init();

log(brcArt, 'i'); // saying hello :)

const App = new Marionette.Application();

App.navigate = function (route, options = {}) {
  let defaultOptions = { trigger: true };
  Backbone.history.navigate(route, $.extend(defaultOptions, options));
};

App.getCurrentRoute = function () {
  return Backbone.history.fragment;
};

App.on('before:start', function () {
  var RegionContainer = Marionette.LayoutView.extend({
    el: '#app',

    regions: {
      header: new HideableRegion({ el: "#header" }),
      footer: new HideableRegion({ el: "#footer" }),
      main: '#main',
      dialog: DialogRegion
    }
  });

  App.regions = new RegionContainer();
});

App.on('start', function () {
  // Init for the first time
  // download appcache
  // set up DB
  // when done - carry on with showing pages

  FastClick.attach(document.body);

  // turn off the loading splash screen
  $('div.loading').css('display', 'none');
  $('body').removeClass('loading');

  if (Backbone.history) {
    Backbone.history.start();

    if (this.getCurrentRoute() === '') {
      App.trigger('records:list');
    }

    App.on('404:show', function () {
      CommonController.show({
        App,
        route: 'common/404',
        title: 404,
      });
    });

    if (window.cordova) {
      // Although StatusB  ar in the global scope, it is not available until after the deviceready event.
      $(document).on('deviceready', () => {
        window.StatusBar.overlaysWebView(true);
        window.StatusBar.backgroundColorByName('black');

        // hide loader
        if (navigator && navigator.splashscreen) {
          navigator.splashscreen.hide();
        }
      });

      // iOS make space for statusbar
      if (window.deviceIsIOS) {
        $('body').addClass('ios');
      }
    } else {
      // development loader
      $('#loader').remove();
    }
  }
});

export { App as default };

