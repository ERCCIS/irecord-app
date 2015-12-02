define([
  'app',
  './main_view',
  './header_view'
], function (app, MainView, HeaderView) {
  let API = {
    show: function (){
      let mainView = new MainView();
      app.regions.main.show(mainView);

      let headerView = new HeaderView();
      app.regions.header.show(headerView);
    }
  };

  return API;
});