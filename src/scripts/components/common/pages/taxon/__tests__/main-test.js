import searchEngine from '../taxon_search_engine';
import species_list from 'master_list.data';

const NAME = 1;
const WAREHOUSE_ID = 0;

/**
 * Gets a random species from the species list
 * @returns {Array}
 */
function getRandomSpecies() {
  let randArrayIndex = (Math.random() * (window.species_list.length - 1)).toFixed(0);
  const sp = window.species_list[randArrayIndex];
  let species = [];
  let speciesArray;
  for (let j = 0, length = sp.length; j < length; j++) {
    if (sp[j] instanceof Array) {
      speciesArray = sp[j];
    }
  }
  if (speciesArray) {
    randArrayIndex = (Math.random() * (speciesArray.length - 1)).toFixed(0);
    const speciesInArray = speciesArray[randArrayIndex];
    species = [speciesInArray[WAREHOUSE_ID], `${sp[2]} ${speciesInArray[NAME]}`];
  } else {
    species = [sp[WAREHOUSE_ID], sp[2]];
  }

  return species;
}

describe('Taxon Search Engine', () => {
  it('should be an API object with search function', () => {
    expect(searchEngine).to.be.an('object');
    expect(searchEngine.search).to.exist;
    expect(searchEngine.search).to.be.a('function');
  });

  describe('search', () => {
    it('should accept a string and a callback', (done) => {
      searchEngine.search('blackbird', (results) => {
        done();
      });
    });

    it('should accept both capitalized and lowercase strings', (done) => {
      searchEngine.search('blackbird', (results) => {
        searchEngine.search('Blackbird', (results2) => {
          expect(results).to.deep.equal(results2);
          done();
        });
      });
    });

    it('should treat non alpha numeric characters as spaces', (done) => {
      // todo: check "Wakely's Dowd"
      searchEngine.search('Isle-of-Man Cabbage', (results) => {
        searchEngine.search('Isle of Man Cabbage', (resultsDash) => {
          expect(results).to.deep.equal(resultsDash);

          searchEngine.search('Perfoliate (Cotswold) Pennycress', (results) => {
            searchEngine.search('Perfoliate Cotswold Pennycress', (resultsBracket) => {
              expect(results).to.deep.equal(resultsBracket);
              done();
            });
          });
        });
      });
    });
    it('should accept hybrids', (done) => {
      searchEngine.search('Caryopteris incana x mongholica =', (results) => {
        expect(results).to.be.an('array');
        expect(results.length).to.equal(1);

        searchEngine.search('X Cupressocyparis', (results) => {
          expect(results).to.be.an('array');
          expect(results.length).to.equal(1);
          done();
        });
      });
    });

    describe('random taxa search', () => {
      // random search of 100 names
      const speciesToSearch = [];
      for (let i = 0; i < 100; i++) {
        speciesToSearch.push(getRandomSpecies());
      }

      // go through selected species names
      speciesToSearch.forEach(function(species) {
        it(`should find ${species[NAME]} (${species[WAREHOUSE_ID]})`, (done) => {
          searchEngine.search(species[NAME], (results) => {
            expect(results).to.not.be.empty;

            //check all results
            let found = false;
            results.forEach((result) => {
              if (result.warehouse_id === species[WAREHOUSE_ID]) {
                found = true;
              }
            });

            expect(found).to.be.true;
            done();
          });
        });
      });
    });

    it('should work with selected taxa', (done) => {
      searchEngine.search('Phytomyza ilicis', (results) => {
        expect(results).to.not.be.empty;
        const result = results[0];

        expect(result.warehouse_id).to.be.equal(229548);
        expect(result.scientific_name).to.be.equal('Phytomyza ilicis');

        // genus
        searchEngine.search('Rotaliella', (results) => {
          expect(results).to.not.be.empty;
          const result = results[0];

          expect(result.warehouse_id).to.be.equal(213771);
          expect(result.scientific_name).to.be.equal('Rotaliella');

          // common name
          searchEngine.search('Giant Blackberry', (results) => {
            expect(results).to.not.be.empty;
            const result = results[0];

            expect(result.warehouse_id).to.be.equal(208098);
            expect(result.common_name).to.be.equal('Giant Blackberry');
            expect(result.scientific_name).to.be.equal('Rubus armeniacus');
            done();
          });
        });
      });
    });

    describe('return', () => {
      it('should be an array', (done) => {
        searchEngine.search('blackbird', (results) => {
          expect(results).to.be.an('array');
          expect(results.length).to.equal(1);
          done();
        });
      });
      it('should hold warehouse_id', (done) => {
        searchEngine.search('blackbird', (results) => {
          const result = results[0];

          expect(result).to.be.an('object');
          expect(result).to.have.all.keys(
            'array_id',
            'species_id',
            'found_in_name',
            'warehouse_id',
            'group',
            'scientific_name',
            'common_name',
            'synonym'
          );
          done();
        });
      });
    });
  });
});

