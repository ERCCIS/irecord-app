define([
  'marionette',
  'location',
  'JST',
], function (Marionette, LocHelp, JST) {

  return Marionette.ItemView.extend({
    template: JST['common/location/grid_ref'],

    events: {
      'click #grid-ref-set-btn': 'setGridRef'
    },

    setGridRef: function () {
      let location = {
        source: 'gridref'
      };

      var val = this.$el.find('#grid-ref').val();
      var name = this.$el.find('#location-name').val();

      var latLon = LocHelp.grid2coord(val);
      if (latLon) {
        location.latitude = latLon.lat;
        location.longitude = latLon.lon;
        location.name = name;

        //-2 because of gridref letters, 2 because this is min precision
        let accuracy = (val.replace(/\s/g, '').length - 2) || 2;
        location.accuracy = accuracy;

        //trigger won't work to bubble up
        this.triggerMethod('location:select:gridref', location);
      }
    }
  });
});