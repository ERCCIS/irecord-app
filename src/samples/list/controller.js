/** ****************************************************************************
 * Sample List controller.
 *****************************************************************************/
import Indicia from 'indicia';
import App from 'app';
import radio from 'radio';
import Log from 'helpers/log';
import Analytics from 'helpers/analytics';
import ImageHelp from 'helpers/image';
import appModel from 'app_model';
import savedSamples from 'saved_samples';
import Sample from 'sample';
import Occurrence from 'occurrence';
import ImageModel from '../../common/models/image';
import MainView from './main_view';
import HeaderView from './header_view';

const API = {
  show() {
    Log('Samples:List:Controller: showing');

    // MAIN
    const mainView = new MainView({
      collection: savedSamples,
      appModel,
    });

    mainView.on('childview:sample:edit:attr', (childView, attr) => {
      radio.trigger('samples:edit:attr', childView.model.cid, attr);
    });

    mainView.on('childview:sample:delete', (childView) => {
      const sample = childView.model;
      API.sampleDelete(sample);
    });
    radio.trigger('app:main', mainView);

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

  sampleDelete(sample) {
    Log('Samples:List:Controller: deleting sample');

    const syncStatus = sample.getSyncStatus();
    let body = 'This record hasn\'t been saved to iRecord yet, ' +
      'are you sure you want to remove it from your device?';

    if (syncStatus === Indicia.SYNCED) {
      body = 'Are you sure you want to remove this record from your device?';
      body += '</br><i><b>Note:</b> it will remain on the server.</i>';
    }
    radio.trigger('app:dialog', {
      title: 'Delete',
      body,
      buttons: [
        {
          title: 'Cancel',
          onClick() {
            radio.trigger('app:dialog:hide');
          },
        },
        {
          title: 'Delete',
          class: 'btn-negative',
          onClick() {
            sample.destroy();
            radio.trigger('app:dialog:hide');
            Analytics.trackEvent('List', 'sample remove');
          },
        },
      ],
    });
  },

  photoUpload(photo) {
    Log('Samples:List:Controller: photo upload');

    // show loader
    API.createNewSample(photo, () => {
      // hide loader
    });
  },

  photoSelect() {
    Log('Samples:List:Controller: photo select');

    radio.trigger('app:dialog', {
      title: 'Choose a method to upload a photo',
      buttons: [
        {
          title: 'Camera',
          onClick() {
            ImageHelp.getImage((entry) => {
              API.createNewSample(entry.nativeURL, () => {});
            });
            radio.trigger('app:dialog:hide');
          },
        },
        {
          title: 'Gallery',
          onClick() {
            ImageHelp.getImage((entry) => {
              API.createNewSample(entry.nativeURL, () => {});
            }, {
              sourceType: window.Camera.PictureSourceType.PHOTOLIBRARY,
              saveToPhotoAlbum: false,
            });
            radio.trigger('app:dialog:hide');
          },
        },
      ],
    });
  },

  /**
   * Creates a new sample with an image passed as an argument.
   */
  createNewSample(photo, callback) {
    ImageHelp.getImageModel(ImageModel, photo, (err, image) => {
      if (err || !image) {
        const err = new Error('Missing image.');
        callback(err);
        return;
      }
      const occurrence = new Occurrence();
      occurrence.addMedia(image);

      const sample = new Sample();
      sample.addOccurrence(occurrence);

      // append locked attributes
      appModel.appendAttrLocks(sample);

      sample.save()
        .then(() => {
          savedSamples.add(sample);
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
        })
        .catch(callback);
    });
  },
};

export { API as default };
