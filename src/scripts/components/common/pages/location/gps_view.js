import $ from '../../../../../vendor/jquery/js/jquery';
import Marionette from '../../../../../vendor/marionette/js/backbone.marionette';
import JST from '../../../../JST';

export default Marionette.ItemView.extend({
    initialize: function () {
      let that = this;
      this.locationUpdate; //to store GPS updates

      let recordModel = this.model.get('recordModel');

      this.template = function () {
        if (recordModel.isGPSRunning()) {
          return JST['common/location/gps_running'](arguments[0]);
        };

        let location = recordModel.get('location') || {};
        //only gps and todays records
        if (location.source == 'gps' &&
          (new Date(location.updateTime).toDateString() === new Date().toDateString())) {
          return JST['common/location/gps_success'](arguments[0]);
        } else {
          return JST['common/location/gps'](arguments[0]);
        }
      };

      this.listenTo(recordModel, 'geolocation:start geolocation:stop geolocation:error', this.render);
      this.listenTo(recordModel, 'geolocation:update', this.geolocationUpdate);
      this.listenTo(recordModel, 'geolocation:success', this.geolocationSuccess);
    },

    triggers: {
      'click #gps-button': 'gps:click'
    },

    events: {
      'change #location-name': 'changeName'
    },

    changeName: function (e) {
      this.triggerMethod('location:name:change', $(e.target).val())
    },

    /**
     * Update the temporary location fix
     * @param location
     */
    geolocationUpdate: function (location) {
      this.locationUpdate = location;
      this.render();
    },

    geolocationSuccess: function (location) {
      this.locationUpdate = location;
      this.render();
    },

    serializeData: function () {
      let recordModel = this.model.get('recordModel');
      let location = this.locationUpdate;
      let prevLocation = recordModel.get('location') || {};

      //if not fixed the location but has previous one that is updating
      if (!location && prevLocation.source === 'gps') {
        location = prevLocation;
      }

      if (location) {
        return {
          name: prevLocation.name,
          accuracy: location.accuracy,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyLimit: 100 //TODO: get from GPS
        };
      } else {
        return {
          name: prevLocation.name
        }
      }
    }
  });
