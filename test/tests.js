import StudioApp, { DataSource } from '..';
import CD from 'cropduster';
import { wysiwygContent, mockParams, mockOptions } from './helper';

const container = document.createElement('div');
container.classNames = 'container';
document.body.appendChild(container);

QUnit.module('StudioApp', {
  beforeEach: function(assert) {
    CD.log = function() {};
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

QUnit.test('.param with required value missing', function(assert) {
  mockParams({ foo: null });

  const app = new StudioApp();
  assert.throws(function() {
    app.param('foo', { required: true });
  }, /missing required query param: foo/);
});

QUnit.test('.param with required value present', function(assert) {
  mockParams({ foo: 'bar' });

  const app = new StudioApp();
  assert.equal(app.param('foo', { required: true }), 'bar', 'returns the param');
});

QUnit.test('.param with default value', function(assert) {
  mockParams({ foo: null });

  const app = new StudioApp();
  assert.equal(app.param('foo', { defaultValue: 'bar' }), 'bar', 'returns the default');
});

QUnit.test('.param with default value replacing empty string', function(assert) {
  mockParams({ foo: '' });

  const app = new StudioApp();
  assert.equal(app.param('foo', { defaultValue: 'bar' }), 'bar', 'returns the default');
});

QUnit.test('.param not required and no default', function(assert) {
  const app = new StudioApp();

  assert.throws(function() {
    app.param('foo');
  }, /parameters need a default/);
});

QUnit.test('constructor setting tags', function(assert) {
  const app = new StudioApp();
  assert.equal(app.tags.length, 11);
  assert.equal(app.tags[0].text, '[seconds]');
  assert.equal(app.tags[0].element.innerText, '[seconds]');
});

QUnit.test('constructor setting options', function(assert) {
  mockOptions({ foo: 'bar' });
  const app = new StudioApp();
  assert.equal(app.options.foo, 'bar');
});

QUnit.test('.error', function(assert) {
  CD.log = function(err) {
    assert.equal(err, 'Capturama error: something went wrong');
  };
  const app = new StudioApp();

  assert.throws(function() {
    app.error('something went wrong');
  }, /something went wrong/);

  assert.expect(2);
});

QUnit.test('.replaceTokens when tag has valid tokens', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');

  app.replaceTokens([tag], { seconds: '43' });

  assert.equal(tag.element.innerHTML, '43');
});

QUnit.test('.replaceTokens when tag has no tokens', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === 'hours');

  app.replaceTokens([tag], { seconds: '43' });

  assert.equal(tag.element.innerHTML, 'hours', 'leaves the tag alone');
});

QUnit.test('.replaceTokens when no values match token', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = '00';

  app.replaceTokens([tag], { hours: '9' });

  assert.equal(tag.element.innerHTML, '00');
});

QUnit.test('.replaceTokens when tag is missing', function(assert) {
  const app = new StudioApp();

  app.replaceTokens([], { hours: '9' });

  assert.expect(0);
});

QUnit.test('.showFallbackText with tags', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = '00';

  app.showFallbackText([tag]);
  assert.equal(tag.element.innerHTML, '00', "changes tag element's text to the fallback");
});

QUnit.test('.showFallbackText with a single tag', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = '00';

  app.showFallbackText(tag);
  assert.equal(tag.element.innerHTML, '00', "changes tag element's text to the fallback");
});

QUnit.test('.showFallbackText with a tag with no fallback text', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  tag.fallbackText = null;

  app.showFallbackText(tag);
  assert.equal(tag.element.style.display, 'none', 'hides tag');
});

QUnit.test('.resizeTag with text that already fits', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[seconds]');
  const originalWidth = tag.element.style.width;

  app.resizeTag(tag);
  assert.equal(tag.element.style.width, originalWidth);
});

QUnit.test('.resizeTag with text that can be resized down to fit', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element.style.fontSize = '40px';
  tag.element.innerHTML = 'too long';

  app.resizeTag(tag);

  assert.equal(tag.element.style.fontSize, '12px');
  assert.equal(tag.element.innerHTML, 'too long');
});

QUnit.test('.resizeTag with text that will never fit', function(assert) {
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

QUnit.test('.resizeTag with missing element', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element = null;

  CD.log = function(err) {
    assert.equal(err, 'resize tag is missing element');
  };

  app.resizeTag(tag);

  assert.expect(1);
});

QUnit.test('.overflowRatio', function(assert) {
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.element.style.fontSize = '40px';
  tag.element.innerHTML = 'too long';

  assert.ok(app.overflowRatio(tag.element) > 2.0, 'should be roughly 2.36');
  assert.ok(app.overflowRatio(tag.element) < 2.5, 'should be roughly 2.36');
});

QUnit.test('.waitForImageAssets with no images', function(assert) {
  const app = new StudioApp();

  const images = app.waitForImageAssets();

  assert.equal(images.length, 0);
});

QUnit.test('.waitForImageAssets with background images', function(assert) {
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

QUnit.test('.waitForImageAssets with img tags', function(assert) {
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

QUnit.test('instantiating DataSource', function(assert) {
  const ds = new DataSource({ key: 'foo' });
  assert.equal(ds.key, 'foo');
});

QUnit.test('DataSource.getRawData', function(assert) {
  const done = assert.async();
  CD.get = path => {
    assert.equal(path, '/data_sources/foo?name=something&another=something%20else');
    done();
  };

  const ds = new DataSource({ key: 'foo' });
  ds.getRawData({ name: 'something', another: 'something else' });
});
