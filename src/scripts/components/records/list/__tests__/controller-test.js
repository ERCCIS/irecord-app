import Morel from 'morel';
import imageURI from './imageURI';
import Controller from '../controller';
import recordManager from '../../../common/record_manager';

describe('Controller', () => {
  describe('photo picker', () => {

    before((done) => {
      recordManager.clear(done);
    });

    after((done) => {
      recordManager.clear(done);
    });

    const RECORDS_COUNT = 5;

    it(`should create a new record with a photo (${RECORDS_COUNT})`, (done) => {
      let recordsToAddCount = RECORDS_COUNT;

      // adds a record
      function addRecord(callback) {
        // create dummy image
        const image = new Morel.Image({
          data: imageURI,
          type: 'image/png',
        });

        Controller.createNewRecord(image, (err) => {
          if (err) throw err.message;
          recordsToAddCount--;
          callback();
        });
      }

      // tests
      function test() {
        // return if not finished adding all
        if (recordsToAddCount !== 0) return;

        recordManager.storage.size((sizeErr, size) => {
          if (sizeErr) throw sizeErr.message;

          expect(size).to.be.equal(RECORDS_COUNT);
          done();
        });
      }

      // add number of records
      for (let i = 0; i < recordsToAddCount; i++) {
        addRecord(test);
      }
    });

    it('should handle adding large photos', (done) => {
      done();
    });

    it('should throw error if no image provided', (done) => {
      done();
    });
  });
});
