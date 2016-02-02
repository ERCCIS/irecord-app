define([
  'app',
  'common/app_model',
  'common/user_model',
  './main_view',
  'common/header_view',
  'common/record_manager'
], function (App, appModel, userModel, MainView, HeaderView, recordManager) {
  let API = {
    show: function (id){
      recordManager.get(id, function (err, recordModel) {
        if (!recordModel) {
          App.trigger('404:show');
          return;
        }

        let mainView = new MainView({
          model: new Backbone.Model({recordModel: recordModel, appModel: appModel})
        });

        mainView.on('sync:init', function () {
          if (window.navigator.onLine) {
            if (!userModel.hasLogIn()) {
              App.trigger('user:login');
              return;
            }

            recordManager.sync(recordModel, function (err) {
              if (err) {
                App.regions.dialog.error(err);
                return;
              }
            });
          } else {
            App.regions.dialog.error({
              message: 'Looks like you are offline!'
            });
          }
        });

        App.regions.main.show(mainView);
      });

      let headerView = new HeaderView({
        model: new Backbone.Model({
          title: 'Record'
        })
      });
      App.regions.header.show(headerView);
    }
  };

  return API;
});