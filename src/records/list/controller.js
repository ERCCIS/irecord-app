/** ****************************************************************************
 * Record List controller.
 *****************************************************************************/
import Morel from 'morel';
import App from 'app';
import radio from 'radio';
import Log from 'helpers/log';
import Analytics from 'helpers/analytics';
import ImageHelp from 'helpers/image';
import appModel from '../../common/models/app_model';
import recordManager from '../../common/record_manager';
import Sample from '../../common/models/sample';
import Occurrence from '../../common/models/occurrence';
import ImageModel from '../../common/models/image';
import MainView from './main_view';
import HeaderView from './header_view';
import LoaderView from '../../common/views/loader_view';

const API = {
  show() {
    const loaderView = new LoaderView();
    radio.trigger('app:main', loaderView);

    recordManager.getAll()
      .then((recordsCollection) => {
        Log('Records:List:Controller: showing');

        // MAIN
        const mainView = new MainView({
          collection: recordsCollection,
          appModel,
        });

        mainView.on('childview:record:edit:attr', (childView, attr) => {
          App.trigger('records:edit:attr', childView.model.cid, attr);
        });

        mainView.on('childview:record:delete', (childView) => {
          const recordModel = childView.model;
          API.recordDelete(recordModel);
        });
        radio.trigger('app:main', mainView);
      })
      .catch((err) => {
        Log(err, 'e');
        radio.on('app:dialog:error', err);
      });

    // HEADER
    const headerView = new HeaderView({ model: appModel });

    headerView.on('photo:upload', (e) => {
      const photo = e.target.files[0];
      API.photoUpload(photo);
    });

    // android gallery/camera selection
    headerView.on('photo:selection', API.photoSelect);

    radio.trigger('app:header', headerView);

    // FOOTER
    radio.trigger('app:footer:hide');
  },

  recordDelete(recordModel) {
    Log('Records:List:Controller: deleting record');

    const syncStatus = recordModel.getSyncStatus();
    let body = 'This record hasn\'t been saved to iRecord yet, ' +
      'are you sure you want to remove it from your device?';

    if (syncStatus === Morel.SYNCED) {
      body = 'Are you sure you want to remove this record from your device?';
      body += '</br><i><b>Note:</b> it will remain on the server.</i>';
    }
    radio.on('app:dialog', {
      title: 'Delete',
      body,
      buttons: [
        {
          title: 'Cancel',
          onClick() {
            radio.on('app:dialog:hide', );
          },
        },
        {
          title: 'Delete',
          class: 'btn-negative',
          onClick() {
            recordModel.destroy();
            radio.on('app:dialog:hide', );
            Analytics.trackEvent('List', 'record remove');
          },
        },
      ],
    });
  },

  photoUpload(photo) {
    Log('Records:List:Controller: photo upload');

    // show loader
    API.createNewRecord(photo, () => {
      // hide loader
    });
  },

  photoSelect() {
    Log('Records:List:Controller: photo select');

    radio.on('app:dialog', {
      title: 'Choose a method to upload a photo',
      buttons: [
        {
          title: 'Camera',
          onClick() {
            ImageHelp.getImage((entry) => {
              API.createNewRecord(entry.nativeURL, () => {});
            });
            radio.on('app:dialog:hide', );
          },
        },
        {
          title: 'Gallery',
          onClick() {
            ImageHelp.getImage((entry) => {
              API.createNewRecord(entry.nativeURL, () => {});
            }, {
              sourceType: window.Camera.PictureSourceType.PHOTOLIBRARY,
              saveToPhotoAlbum: false,
            });
            radio.on('app:dialog:hide', );
          },
        },
      ],
    });
  },

  /**
   * Creates a new record with an image passed as an argument.
   */
  createNewRecord(photo, callback) {
    ImageHelp.getImageModel(ImageModel, photo, (err, image) => {
      if (err || !image) {
        const err = new Error('Missing image.');
        callback(err);
        return;
      }
      const occurrence = new Occurrence();
      occurrence.addImage(image);

      const sample = new Sample();
      sample.addOccurrence(occurrence);

      // append locked attributes
      appModel.appendAttrLocks(sample);

      recordManager.set(sample, (saveErr) => {
        if (saveErr) {
          callback(saveErr);
          return;
        }
        // check if location attr is not locked
        const locks = appModel.get('attrLocks');

        if (!locks.location) {
          // no previous location
          sample.startGPS();
        } else if (!locks.location.latitude || !locks.location.longitude) {
          // previously locked location was through GPS
          // so try again
          sample.startGPS();
        }
        callback();
      });
    });
  },
};

export { API as default };
