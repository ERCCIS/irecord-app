import Backbone from 'backbone';
import App from '../../../app';
import log from '../../../helpers/log';
import appModel from '../../common/app_model';
import userModel from '../../common/user_model';
import recordManager from '../../common/record_manager';
import MainView from './main_view';
import HeaderView from '../../common/header_view';

const API = {
  show() {
    const templateData = new Backbone.Model({
      useGridRef: appModel.get('useGridRef'),
      autosync: appModel.get('autosync'),
    });

    const mainView = new MainView({
      model: templateData,
    });
    mainView.on('setting:toggled', (setting, on) => {
      appModel.set(setting, on);
      appModel.save();
    });

    mainView.on('records:submit:all', API.sendAllRecords);
    mainView.on('records:delete:all', API.deleteAllRecords);
    mainView.on('app:reset', () => {
      App.regions.dialog.show({
        title: 'Reset',
        class: 'error',
        body: 'Are you sure you want to reset the application to its initial state? ' +
        'This will wipe all the locally stored app data!',
        buttons: [
          {
            title: 'Cancel',
            onClick() {
              App.regions.dialog.hide();
            },
          },
          {
            title: 'Reset',
            class: 'btn-negative',
            onClick() {
              // delete all
              API.resetApp(() => {
                App.regions.dialog.show({
                  title: 'Done!',
                  timeout: 1000,
                });
              });
            },
          },
        ],
      });
    });

    App.regions.main.show(mainView);

    const headerView = new HeaderView({
      model: new Backbone.Model({
        title: 'Settings',
      }),
    });
    App.regions.header.show(headerView);
  },

  deleteAllRecords() {
    App.regions.dialog.show({
      title: 'Delete All',
      body: 'Are you sure you want to delete all submitted records?',
      buttons: [
        {
          title: 'Cancel',
          onClick() {
            App.regions.dialog.hide();
          },
        },
        {
          title: 'Delete',
          class: 'btn-negative',
          onClick() {
            // delete all
            recordManager.removeAllSynced(() => {
              App.regions.dialog.show({
                title: 'Done!',
                timeout: 1000,
              });
            });
          },
        },
      ],
    });
  },

  sendAllRecords() {
    App.regions.dialog.show({
      title: 'Send All',
      body: 'Are you sure you want to set all valid records for submission?',
      buttons: [
        {
          title: 'Cancel',
          onClick() {
            App.regions.dialog.hide();
          },
        },
        {
          title: 'OK',
          class: 'btn-positive',
          onClick() {
            // delete all
            recordManager.setAllToSend(() => {
              App.regions.dialog.show({
                title: 'Done!',
                timeout: 1000,
              });
            });
          },
        },
      ],
    });
  },

  resetApp(callback) {
    log('Resetting the application!', 'w');
    appModel.clear().set(appModel.defaults);
    appModel.save();

    userModel.clear().set(appModel.defaults);
    userModel.save();

    recordManager.clear(callback);
  },
};

export { API as default };
