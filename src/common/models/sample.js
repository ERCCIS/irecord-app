/** ****************************************************************************
 * Morel Sample.
 *****************************************************************************/
import _ from 'lodash';
import Morel from 'morel';
import CONFIG from 'config';
import Log from 'helpers/log';
import Device from 'helpers/device';
import store from '../store';
import userModel from './user_model';
import Occurrence from './occurrence';
import GeolocExtension from './sample_geoloc_ext';

const Sample = Morel.Sample.extend({
  api_key: CONFIG.morel.api_key,
  remote_host: CONFIG.morel.host,
  user: userModel.getUser,
  password: userModel.getPassword,

  store, // offline store

  Occurrence,

  keys: CONFIG.morel.sample, // warehouse attribute keys

  defaults: {
    // recording form on the iRecord website
    form: CONFIG.morel.input_form,

    // attach device information
    device: Device.getPlatform(),
    device_version: Device.getVersion(),
  },

  initialize() {
    this.checkExpiredGroup(); // activities
    this.listenTo(userModel, 'sync:activities:end', this.checkExpiredGroup);
  },

  validateRemote(attributes) {
    const attrs = _.extend({}, this.attributes, attributes);

    const sample = {};
    const occurrences = {};

    // todo: remove this bit once sample DB update is possible
    // check if saved
    if (!this.metadata.saved) {
      sample.send = false;
    }

    // location
    const location = attrs.location || {};
    if (!location.latitude || !location.longitude) {
      sample.location = 'missing';
    }
    // location name
    if (!location.name) {
      sample['location name'] = 'missing';
    }

    // date
    if (!attrs.date) {
      sample.date = 'missing';
    } else {
      const date = new Date(attrs.date);
      if (date === 'Invalid Date' || date > new Date()) {
        sample.date = (new Date(date) > new Date()) ? 'future date' : 'invalid';
      }
    }

    // location type
    if (!attrs.location_type) {
      sample.location_type = 'can\'t be blank';
    }

    // occurrences
    if (this.occurrences.length === 0) {
      sample.occurrences = 'no species selected';
    } else {
      this.occurrences.each((occurrence) => {
        const errors = occurrence.validate();
        if (errors) {
          const occurrenceID = occurrence.cid;
          occurrences[occurrenceID] = errors;
        }
      });
    }

    if (!_.isEmpty(sample) || !_.isEmpty(occurrences)) {
      const errors = {
        sample,
        occurrences,
      };
      return errors;
    }

    return null;
  },

  /**
   * Set the record for submission and send it.
   */
  setToSend() {
    this.metadata.saved = true;

    if (!this.isValid({ remote: true })) {
      // since the sample was invalid and so was not saved
      // we need to revert it's status
      this.metadata.saved = false;
      return false;
    }

    // save record
    return this.save();
  },

  checkExpiredGroup() {
    const activity = this.get('group');
    if (activity) {
      const expired = userModel.hasActivityExpired(activity);
      if (expired) {
        const newActivity = userModel.getActivity(activity.id);
        if (!newActivity) {
          // the old activity is expired and removed
          Log('Sample:Group: removing exipired activity');
          this.unset('group');
          this.save();
        } else {
          // old activity has been updated
          Log('Sample:Group: updating exipired activity');
          this.set('group', newActivity);
          this.save();
        }
      }
    }
  },

  isLocalOnly() {
    const status = this.getSyncStatus();
    if (this.metadata.saved && (
      status === Morel.LOCAL ||
      status === Morel.SYNCHRONISING)) {
      return true;
    }
    return false;
  },

  timeout() {
    if (!Device.connectionWifi()) {
      return 180000; // 3 min
    }
    return 60000; // 1 min
  },
});

// add geolocation functionality
const SampleWithGeoloc = Sample.extend(GeolocExtension);

export { SampleWithGeoloc as default };
