import StudioApp from '../src/studio-app';
import CD from 'cropduster';
import { wysiwygContent, mockParams, mockOptions } from './helper';
const { module, test } = QUnit;

const container = document.createElement('div');
container.classNames = 'container';
document.body.appendChild(container);

module('StudioApp', {
  beforeEach: function(assert) {
    CD.log = function() {};
    container.innerHTML = wysiwygContent();
  },
  afterEach: function(assert) {
    container.innerHTML = '';
  }
});

test('it instantiates a studio app', function(assert) {
  const app = new StudioApp();
  assert.equal(app.tags.length, 11);
});

test('.param with required value missing', function(assert) {
  mockParams({ foo: null });

  const app = new StudioApp();
  assert.throws(function() {
    app.param('foo', { required: true });
  }, /missing required query param: foo/);
});

test('.param with required value present', function(assert) {
  mockParams({ foo: 'bar' });

  const app = new StudioApp();
  assert.equal(app.param('foo', { required: true }), 'bar', 'returns the param');
});

test('.param with default value', function(assert) {
  mockParams({ foo: null });

  const app = new StudioApp();
  assert.equal(app.param('foo', { defaultValue: 'bar' }), 'bar', 'returns the default');
});

test('.param with default value replacing empty string', function(assert) {
  mockParams({ foo: '' });

  const app = new StudioApp();
  assert.equal(app.param('foo', { defaultValue: 'bar' }), 'bar', 'returns the default');
});

test('.param not required and no default', function(assert) {
  const app = new StudioApp();

  assert.throws(function() {
    app.param('foo');
  }, /parameters need a default/);
});

test('constructor setting tags', function(assert) {
  const app = new StudioApp();
  assert.equal(app.tags.length, 11);
  assert.equal(app.tags[0].text, '[seconds]');
  assert.equal(app.tags[0].element.innerText, '[seconds]');
});

test('constructor setting options', function(assert) {
  mockOptions({ foo: 'bar' });
  const app = new StudioApp();
  assert.equal(app.options.foo, 'bar');
});

test('.error', function(assert) {
  CD.log = function(err) {
    assert.equal(err, 'Capturama error: something went wrong');
  };
  const app = new StudioApp();

  assert.throws(function() {
    app.error('something went wrong');
  }, /something went wrong/);

  assert.expect(2);
});

test('.replaceTokens when tag has valid tokens', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');

  app.replaceTokens([tag], { seconds: '43' });

  assert.equal(tag.element.innerHTML, '43');
});

test('.replaceTokens when tag has no tokens', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === 'hours');

  app.replaceTokens([tag], { seconds: '43' });

  assert.equal(tag.element.innerHTML, 'hours', 'leaves the tag alone');
});

test('.replaceTokens when no values match token', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = '00';

  app.replaceTokens([tag], { hours: '9' });

  assert.equal(tag.element.innerHTML, '00');
});

test('.replaceTokens when tag is missing', function(assert) {
  const app = new StudioApp();

  app.replaceTokens([], { hours: '9' });

  assert.expect(0);
});

test('.showFallbackText with tags', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = '00';

  app.showFallbackText([tag]);
  assert.equal(tag.element.innerHTML, '00', "changes tag element's text to the fallback");
});

test('.showFallbackText with a single tag', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = '00';

  app.showFallbackText(tag);
  assert.equal(tag.element.innerHTML, '00', "changes tag element's text to the fallback");
});

test('.showFallbackText with a tag with no fallback text', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = null;

  app.showFallbackText(tag);
  assert.equal(tag.element.style.display, 'none', 'hides tag');
});

test('.resizeTag with text that already fits', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  const originalWidth = tag.element.style.width;

  app.resizeTag(tag);
  assert.equal(tag.element.style.width, originalWidth);
});

test('.resizeTag with text that can be resized down to fit', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element.style.fontSize = '40px';
  tag.element.innerHTML = 'too long';

  app.resizeTag(tag);

  assert.equal(tag.element.style.fontSize, '12px');
  assert.equal(tag.element.innerHTML, 'too long');
});

test('.resizeTag with text that will never fit', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element.style.fontSize = '40px';
  tag.element.innerHTML = 'this text will be waaay too long to ever fit';
  tag.fallbackText = '00';
  tag.minimumFontSize = 8;

  app.resizeTag(tag);

  assert.equal(tag.element.style.fontSize, '40px');
  assert.equal(tag.element.innerHTML, '00');
});

test('.resizeTag with missing element', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element = null;

  CD.log = function(err) {
    assert.equal(err, 'resize tag is missing element');
  };

  app.resizeTag(tag);

  assert.expect(1);
});

test('.overflowRatio', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element.style.fontSize = '40px';
  tag.element.innerHTML = 'too long';

  assert.ok(app.overflowRatio(tag.element) > 2.0, 'should be roughly 2.36');
  assert.ok(app.overflowRatio(tag.element) < 2.5, 'should be roughly 2.36');
});

test('.waitForImageAssets with no images', function(assert) {
  const app = new StudioApp();

  const images = app.waitForImageAssets();

  assert.equal(images.length, 0);
});

test('.waitForImageAssets with background images', function(assert) {
  const backgroundImage = 'http://example.com/image.png';

  const app = new StudioApp();
  const { element } = app.tags.find(t => t.text === '[hours]');
  element.style.setProperty('background-image', `url("${backgroundImage}")`);

  CD.log = function(msg) {
    assert.equal(msg, `Wait for asset: "${backgroundImage}"`);
  };

  const images = app.waitForImageAssets();

  assert.equal(images.length, 1);
  assert.expect(2);
});

test('.waitForImageAssets with img tags', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');

  const img = new Image();
  img.src = 'http://example.com/image-tag.png';
  tag.element.appendChild(img);

  CD.log = function(msg) {
    assert.equal(msg, 'Wait for asset: http://example.com/image-tag.png');
  };

  const images = app.waitForImageAssets();

  assert.equal(images.length, 1);
  assert.expect(2);
});
