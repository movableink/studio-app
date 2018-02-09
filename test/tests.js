import StudioApp from '../src/studio-app';
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
  const app = new StudioApp();
  const tag = app.tags.find(t => t.text === '[hours]');
  tag.backgroundImage = 'http://example.com/image.png';

  CD.log = function(msg) {
    assert.equal(msg, 'Wait for asset: http://example.com/image.png');
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

QUnit.test('.container', function(assert) {
  const app = new StudioApp();
  assert.equal(app.container.id, 'mi_size_container');
});

QUnit.test('.innerBoundingBox', function(assert) {
  const app = new StudioApp();
  assert.equal(app.innerBoundingBox().top, 111, 'has correct top');
  assert.equal(app.innerBoundingBox().left, 62, 'has correct left');
  assert.equal(app.innerBoundingBox().bottom, 171, 'has correct bottom');
  assert.equal(app.innerBoundingBox().right, 338, 'has correct right');
  assert.equal(app.innerBoundingBox().width, 276, 'has correct width');
  assert.equal(app.innerBoundingBox().height, 60, 'has correct height');
});

QUnit.test('.innerBoundingBox with args', function(assert) {
  const app = new StudioApp();
  const tags = app.tags.slice(0, 1);
  const tag = tags[0];
  assert.equal(app.innerBoundingBox(tags).top, tag.top, 'has correct top');
  assert.equal(app.innerBoundingBox(tags).left, tag.left, 'has correct left');
  assert.equal(app.innerBoundingBox(tags).bottom, 171, 'has correct bottom');
  assert.equal(app.innerBoundingBox(tags).right, 338, 'has correct right');
  assert.equal(app.innerBoundingBox(tags).width, tag.width, 'has correct width');
  assert.equal(app.innerBoundingBox(tags).height, tag.height, 'has correct height');
});

QUnit.test('.innerBoundingBox with empty array', function(assert) {
  const app = new StudioApp();
  const tags = [];
  assert.equal(app.innerBoundingBox(tags).top, 0, 'has correct top');
  assert.equal(app.innerBoundingBox(tags).left, 0, 'has correct left');
  assert.equal(app.innerBoundingBox(tags).bottom, 0, 'has correct bottom');
  assert.equal(app.innerBoundingBox(tags).right, 0, 'has correct right');
  assert.equal(app.innerBoundingBox(tags).width, 0, 'has correct width');
  assert.equal(app.innerBoundingBox(tags).height, 0, 'has correct height');
});

QUnit.test('.fitToTags', function(assert) {
  const app = new StudioApp();
  app.fitToTags();

  assert.equal(app.container.style.width, '276px', 'resizes the width');
  assert.equal(app.container.style.height, '60px', 'resizes the height');
});

QUnit.test('.fitToTags with padding', function(assert) {
  const app = new StudioApp();
  app.fitToTags({ top: 5, bottom: 3, left: 10, right: 44 });

  assert.equal(app.container.style.width, '330px', 'resizes the width');
  assert.equal(app.container.style.height, '68px', 'resizes the height');
});

QUnit.test('.sliceOutTag', function(assert) {
  const app = new StudioApp();
  const hours = app.tags.find(t => t.tool.name === 'hours');
  assert.equal(hours.top, 131, 'hours element starts at 131');
  const text = app.tags.filter(t => t.tool.name === 'text');

  text.forEach(t => {
    app.sliceOutTag(t);
  });

  assert.equal(hours.top, 111, 'moves the hours element up 20px');

  assert.notOk(app.tags.find(t => t.tool.name === 'text'), 'removes text tags from tag list');
  assert.notOk(app.allTags.find(t => t.tool.name === 'text'), 'removes text tags from all tags');
});
