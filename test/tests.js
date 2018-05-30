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

QUnit.test('all tags getter', function(assert) {
  const app = new StudioApp();
  assert.notOk(app._allTags, '_allTags is not defined in constructor');
  const allTags = app.allTags;
  assert.deepEqual(app.allTags, app._allTags, 'calling getter defines _allTags');
  app._allTags = 'foo';
  assert.equal(app.allTags, 'foo', 'getter returns _allTags if defined');
});

QUnit.test('tags getter', function(assert) {
  const app = new StudioApp();
  assert.notOk(app._tags, '_tags is not defined in constructor');
  const tags = app.tags;
  assert.deepEqual(app.tags, app._tags, 'calling getter defines _tags');
  app._tags = 'foo';
  assert.equal(app.tags, 'foo', 'getter returns _tags if defined');
});

QUnit.test('fields getter', function(assert) {
  const app = new StudioApp();
  assert.notOk(app._fields, '_fields is not defined in constructor');
  const fields = app.fields;
  assert.deepEqual(app.fields, app._fields, 'calling getter defines _fields');
  app._fields = 'foo';
  assert.equal(app.fields, 'foo', 'getter returns _fields if defined');
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

QUnit.test('container', function(assert) {
  assert.ok(
    new StudioApp().container,
    document,
    'it sets the document as the container by default'
  );

  const container2 = document.querySelector('#mi_size_container').cloneNode(true);
  container2.setAttribute('id', 'mi_size_container_2');
  [...container2.children].forEach(child => child.classList.add('container-2'));

  const container1 = document.querySelector('#mi_size_container');
  [...container1.children].forEach(child => child.classList.add('container-1'));

  container1.append(container2);

  const app1 = new StudioApp({ container: container1 });
  const app2 = new StudioApp({ container: container2 });

  assert.equal(app1.container, container1, 'it assigns a container');
  assert.equal(app1.tags.length, 11);
  assert.ok(
    app1.tags.every(({ element }) => element.classList.contains('container-1')),
    'it scopes tags to its container'
  );

  assert.equal(app2.container, container2, 'it correctly assigns a container');
  assert.equal(app2.tags.length, 11);
  assert.ok(
    app2.tags.every(({ element }) => element.classList.contains('container-2')),
    'it scopes tags to its container'
  );
});

QUnit.test('formatImageTags', function(assert) {
  const container = document.createElement('body');
  const miAttributes = document.querySelector('.mi-attributes');

  const tags = JSON.stringify([
    { id: 'image', type: 'image', isCropped: false },
    { id: 'croppedImage', type: 'image', isCropped: true },
    { id: 'banana', type: 'banana' },
  ]);

  const html = `
    <div mi-tag='image'><img></div>
    <div mi-tag='croppedImage'><img></div>
    <div mi-tag='banana'></div>
  `;

  container.innerHTML = html;
  miAttributes.innerHTML = tags;

  const app = new StudioApp({ container });
  app.formatImageTags();

  assert.equal(
    container.querySelector('[mi-tag="image"] img').style.getPropertyValue('max-width'),
    '100%'
  );

  assert.equal(
    container.querySelector('[mi-tag="image"] img').style.getPropertyValue('max-height'),
    '100%'
  );

  assert.equal(
    container.querySelector('[mi-tag="croppedImage"] img').style.getPropertyValue('width'),
    'auto'
  );

  assert.equal(
    container.querySelector('[mi-tag="croppedImage"] img').style.getPropertyValue('height'),
    'auto'
  );
});
