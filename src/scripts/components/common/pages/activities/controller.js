/** *****************************************************************************
 * Activities List controller.
 ******************************************************************************/
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
import Log from '../../../../helpers/log';
import App from '../../../../app';
import MainView from './main_view';
import HeaderView from '../../views/header_view';
import RefreshView from './refresh_view';
import appModel from '../../models/app_model';
import userModel from '../../models/user_model';
import recordManager from '../../record_manager';
import CONFIG from 'config'; // Replaced with alias

/**
 * Model to hold details of an activity (group entity)
 */
const ActivityModel = Backbone.Model.extend({
  defaults: {
    id: null,
    title: '',
    description: '',
    group_type: '',
    group_from_date: null,
    group_to_date: null,
    checked: false,
  },
});

let recordModel; // should be initialized if editing records' activity

const ActivitiesCollection = Backbone.Collection.extend({
  model: ActivityModel,

  initialize() {
    Log('Activities:Controller: initializing collection');
    const that = this;

    this.updateActivitiesCollection();

    this.listenTo(userModel, 'sync:activities:start', () => {
      Log('Activities:Controller: reseting collection for sync');
      that.reset();
    });
    this.listenTo(userModel, 'sync:activities:end', this.updateActivitiesCollection);
  },

  updateActivitiesCollection() {
    Log('Activities:Controller: updating collection');

    // if loading have empty collection
    if (userModel.synchronizingActivities) {
      this.reset();
      return;
    }

    const that = this;
    const lockedActivity = appModel.getAttrLock('activity');
    let recordActivity;

    if (recordModel) {
      recordActivity = recordModel.get('group');
    }

    const selectedActivity = recordActivity || lockedActivity || {};

    // add default activity
    const defaultActivity = new ActivityModel({
      title: 'Default',
      description: '',
      checked: !selectedActivity.id,
    });

    let foundOneToCheck = false;
    this.reset();
    this.add(defaultActivity);

    // add user activities
    const activitiesData = _.cloneDeep(userModel.get('activities'));
    $.each(activitiesData, (index, activ) => {
      activ.checked = selectedActivity.id === activ.id; // todo:  server '71' == local 71
      foundOneToCheck = foundOneToCheck || activ.checked;

      that.add(new ActivityModel(activ));
    });
  },
});

const activitiesCollection = new ActivitiesCollection();

const API = {
  show(recordID) {
    Log('Activities:Controller: showing');

    if (!userModel.hasLogIn()) {
      API.userLoginMessage();
    }

    // HEADER
    const refreshView = new RefreshView();

    const headerView = new HeaderView({
      rightPanel: refreshView,
      model: new Backbone.Model({
        title: 'Activities',
      }),
    });

    App.regions.header.show(headerView);

    // FOOTER
    App.regions.footer.hide().empty();

    // MAIN
    const mainView = new MainView({
      collection: activitiesCollection,
    });

    let onExit = () => {
      Log('Activities:List:Controller: exiting');
      const activity = mainView.getActivity();
      API.save(activity);
    };

    // Initialize data
    if (recordID) {
      recordManager.get(recordID, (err, record) => {
        if (err) {
          Log(err, 'e');
          return;
        }

        recordModel = record;
        activitiesCollection.updateActivitiesCollection();

        onExit = () => {
          Log('Activities:List:Controller: exiting');
          const newActivity = mainView.getActivity();
          API.save(newActivity);
          recordModel = null; // reset
        };

        refreshView.on('refreshClick', () => {
          Log('Activities:List:Controller: refresh clicked');
          if (!userModel.hasLogIn()) {
            App.trigger('user:login');
            return;
          }
          API.refreshActivities();
        });
      });
    } else {
      activitiesCollection.updateActivitiesCollection();

      refreshView.on('refreshClick', () => {
        Log('Activities:List:Controller: refresh clicked');
        if (!userModel.hasLogIn()) {
          App.trigger('user:login');
          return;
        }
        API.refreshActivities();
      });
    }

    // if exit on selection click
    mainView.on('save', onExit);
    App.regions.main.show(mainView);

    headerView.onExit = onExit;
  },

  refreshActivities() {
    userModel.syncActivities(true);
  },

  save(activity = {}) {
    const activityID = activity.id;
    if (recordModel) {
      recordModel.set('group', userModel.getActivity(activityID));
      recordModel.save(null, {
        success: () => {
          // return to previous page after save
          window.history.back();
        },
      });
    } else {
      appModel.setAttrLock('activity', userModel.getActivity(activityID));
      // return to previous page after save
      window.history.back();
    }
  },

  /**
   * Notify the user why the there are no activities.
   */
  userLoginMessage() {
    App.regions.dialog.show({
      title: 'Information',
      body: 'Please log in to the app before selecting an alternative ' +
      'activity for your records.',
      buttons: [{
        id: 'ok',
        title: 'OK',
        onClick: App.regions.dialog.hide,
      }],
    });
  },
};

export { API as default };
