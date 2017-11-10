import CD from 'cropduster';
import StudioApp from '../src/studio-app';

QUnit.test('it instantiates a studio app', function(assert) {
  const app = new StudioApp();
  assert.equal(app.tags.length, 0);
});
