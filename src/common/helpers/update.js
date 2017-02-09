/** ****************************************************************************
 * App update functionality.
 *****************************************************************************/

import App from 'app';
import CONFIG from 'config';
import recordManager from '../record_manager';
import Log from './log';
import Error from './error';
import Analytics from './analytics';
import appModel from '../models/app_model';
import userModel from '../models/user_model';

const MIN_UPDATE_TIME = 5000; // show updating dialog for minimum seconds

/**
 * https://gist.github.com/alexey-bass/1115557
 * Simply compares left version to right one.
 *
 * Example:
 * versionCompare('1.1', '1.2') => -1
 * versionCompare('1.1', '1.1') =>  0
 * versionCompare('1.2', '1.1') =>  1
 * versionCompare('2.23.3', '2.22.3') => 1
 *
 * Returns:
 * -1 = left is LOWER than right
 *  0 = they are equal
 *  1 = left is GREATER = right is LOWER
 *  And FALSE if one of input versions are not valid
 *
 * @function
 * @param {String} left  Version #1
 * @param {String} right Version #2
 * @return {Integer|Boolean}
 * @author Alexey Bass (albass)
 * @since 2011-07-14
 */
function versionCompare(left, right) {
  if (typeof left + typeof right !== 'stringstring')
    return false;

  let a = left.split('.')
    , b = right.split('.')
    , i = 0, len = Math.max(a.length, b.length);

  for (; i < len; i++) {
    if ((a[i] && !b[i] && parseInt(a[i], 10) > 0) || (parseInt(a[i], 10) > parseInt(b[i], 10))) {
      return 1;
    } else if ((b[i] && !a[i] && parseInt(b[i], 10) > 0) || (parseInt(a[i], 10) < parseInt(b[i], 10))) {
      return -1;
    }
  }

  return 0;
}


/**
 * part of 1.2.2 update
 */
class DatabaseStorage {
  constructor(options = {}) {
    // because of iOS8 bug on home screen: null & readonly window.indexedDB
    this.indexedDB = window._indexedDB || window.indexedDB;
    this.IDBKeyRange = window._IDBKeyRange || window.IDBKeyRange;

    this.VERSION = 1;
    this.STORE_NAME = 'samples';

    this.NAME = `morel-${options.appname}`;
  }

  /**
   * Brings back all saved data from the database.
   */
  getAll(callback) {
    const that = this;
    this.open((err, store) => {
      if (err) {
        callback(err);
        return;
      }
      try {
        // Get everything in the store
        const keyRange = that.IDBKeyRange.lowerBound(0);
        const req = store.openCursor(keyRange);
        const data = {};

        req.onsuccess = (e) => {
          try {
            const result = e.target.result;

            // If there's data, add it to array
            if (result) {
              data[result.key] = result.value;
              result.continue();

              // Reach the end of the data
            } else {
              callback(null, data);
            }
          } catch (err) {
            callback && callback(err);
          }
        };

        req.onerror = (e) => {
          console.error('Database error.');
          console.error(e.target.error);
          const error = new Error(e.target.error);
          callback(error);
        };
      } catch (err) {
        callback && callback(err);
      }
    });
  }

  /**
   * Opens a database connection and returns a store.
   *
   * @param onError
   * @param callback
   */
  open(callback) {
    const that = this;
    let req = null;

    try {
      req = this.indexedDB.open(this.NAME, this.VERSION);

      /**
       * On Database opening success, returns the Records object store.
       *
       * @param e
       */
      req.onsuccess = (e) => {
        try {
          const db = e.target.result;
          const transaction = db.transaction([that.STORE_NAME], 'readwrite');
          if (transaction) {
            const store = transaction.objectStore(that.STORE_NAME);
            if (store) {
              callback(null, store);
            } else {
              const err = new Error('Database Problem: no such store');
              callback(err);
            }
          }
        } catch (err) {
          callback(err);
        }
      };

      /**
       * If the Database needs an upgrade or is initialising.
       *
       * @param e
       */
      req.onupgradeneeded = (e) => {
        try {
          const db = e.target.result;
          db.createObjectStore(that.STORE_NAME);
        } catch (err) {
          callback && callback(err);
        }
      };

      /**
       * Error of opening the database.
       *
       * @param e
       */
      req.onerror = (e) => {
        console.error('Database error.');
        console.error(e.target.error);
        const error = new Error(e.target.error);
        callback(error);
      };

      /**
       * Error on database being blocked.
       *
       * @param e
       */
      req.onblocked = (e) => {
        console.error('Database error.');
        console.error(e.target.error);
        const error = new Error(e.target.error);
        callback(error);
      };
    } catch (err) {
      callback(err);
    }
  }

  delete() {
    this.indexedDB.deleteDatabase(this.NAME);
  }
}

const API = {
  /**
   * Main update function.
   */
  run(callback) {
    const currentVersion = appModel.get('appVersion');
    const newVersion = CONFIG.version;

    if (currentVersion !== newVersion) {
      // todo: check for backward downgrade
      // set new app version
      API._updateAppVersion(currentVersion, newVersion);

      // first install
      if (!currentVersion) callback();

      // find first update
      const firstUpdate = API._findFirst(API.updatesSeq, currentVersion);
      if (firstUpdate < 0) return callback(); // no update for this version

      // hide loader
      if (navigator && navigator.splashscreen) {
        navigator.splashscreen.hide();
      }

      // apply all updates
      App.regions.getRegion('dialog').show({
        title: 'Updating',
        body: 'This should take only a moment...',
        hideAllowed: false,
      });
      const startTime = Date.now();
      return API._applyUpdates(firstUpdate, (error) => {
        if (error) {
          App.regions.getRegion('dialog')
            .error('Sorry, an error has occurred while updating the app');
          return null;
        }

        const timeDiff = (Date.now() - startTime);
        if (timeDiff < MIN_UPDATE_TIME) {
          setTimeout(() => {
            App.regions.getRegion('dialog').hide(true);
            callback();
          }, MIN_UPDATE_TIME - timeDiff);
        } else {
          App.regions.getRegion('dialog').hide(true);
          callback();
        }
        return null;
      });
    }

    callback();
    return null;
  },

  /**
   * The sequence of updates that should take place.
   * @type {string[]}
   */
  updatesSeq: ['1.2.2'],

  /**
   * Update functions.
   * @type {{['1.1.0']: (())}}
   */
  updates: {
    /**
     *  Migrate to new morel database.
     */
    '1.2.2': function (callback) {
      Log('Update: version 1.2.2', 'i');

      // copy over all the records to SQLite db
      const oldDB = new DatabaseStorage({ appname: 'test' });
      oldDB.getAll((err, records = []) => {
        if (err) {
          Log(err, 'e');
          return;
        }

        const recordsCount = Object.keys(records).length;
        Log(`Update: copying ${recordsCount} records to SQLite`, 'i');
        // records
        const toWait = [];
        for (const record in records) {
          const promise = recordManager.set(records[record]);
          toWait.push(promise);
        }

        Promise.all(toWait).then(() => {
          Log('Update: copying done', 'i');

          // check if correct copy
          Log('Update: checking if correct copy', 'i');
          recordManager.storage.size().then((size) => {
            if (recordsCount !== size) {
              callback(true);
              return;
            }

            // clean up old db
            Log('Update: clearing old db', 'i');
            oldDB.delete();

            const oldFirstName = userModel.get('name');
            const oldSecondName = userModel.get('surname');
            userModel.set('firstname', oldFirstName);
            userModel.set('secondname', oldSecondName);
            userModel.set('name', '');
            userModel.unset('surname');
            userModel.save();

            Log('Update: finished', 'i');
            callback(); // fully restart afterwards
          });
        });
      });
    },
  },

  /**
   * Returns the index of the first found update in sequence.
   * @param updatesSeq
   * @param currentVersion
   * @returns {number}
   * @private
   */
  _findFirst(updatesSeq = API.updatesSeq, currentVersion) {
    if (!updatesSeq.length) return -1;

    let firstVersion = -1;
    API.updatesSeq.some((version, index) => {
      if (versionCompare(version, currentVersion) === 1) {
        firstVersion = index;
        return true;
      }
      return null;
    });

    return firstVersion;
  },

  /**
   * Recursively apply all updates.
   * @param updateIndex
   * @param callback
   * @private
   */
  _applyUpdates(updateIndex, callback) {
    const update = API.updates[API.updatesSeq[updateIndex]];

    if (typeof update !== 'function') {
      Log('Update: error with update function', 'e');
      return callback();
    }

    let fullRestartRequired = false;
    return update((error, _fullRestartRequired) => {
      if (error) {
        callback(error);
        return null;
      }

      if (_fullRestartRequired) {
        fullRestartRequired = true;
      }

      // check if last update
      if ((API.updatesSeq.length - 1) <= updateIndex) {
        if (!fullRestartRequired) {
          return callback();
        }
        App.restart();
        return null;
      }

      API._applyUpdates(updateIndex + 1, callback);
      return null;
    });
  },

  _updateAppVersion(currentVersion, newVersion) {
    appModel.set('appVersion', newVersion);
    appModel.save();

    // log only updates and not init as no prev value on init
    if (currentVersion) {
      Analytics.trackEvent('App', 'updated');
    }
  },
};

export default API;
