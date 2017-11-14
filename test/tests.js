import StudioApp from '../src/studio-app';
import { wysiwygContent } from './helper';

const container = document.createElement('div');
container.classNames = 'container';
document.body.appendChild(container);

QUnit.module('StudioApp', {
  beforeEach: function(assert) {
    container.innerHTML = wysiwygContent();
  },
  afterEach: function(assert) {
    container.innerHTML = '';
  }
});

QUnit.test('it instantiates a studio app', function(assert) {
  const app = new StudioApp();
  assert.equal(app.tags.length, 11);
});
