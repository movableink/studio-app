import StudioApp from '../src/studio-app';
import CD from 'cropduster';
import { wysiwygContent, mockParams, mockOptions } from './helper';
const { module, test } = QUnit;

module('StudioApp', function (hooks) {
  const container = document.createElement('div');
  container.classNames = 'container';
  document.body.appendChild(container);

  hooks.beforeEach(function(assert) {
    CD.log = () => {};
    container.innerHTML = wysiwygContent();
    this.subject = () => new StudioApp();
  });

  hooks.afterEach(function () {
    container.innerHTML = '';
  });

  module('constructor', function(hooks) {
    test('it instantiates a studio app', function(assert) {
      assert.equal(this.subject().tags.length, 11);
    });

    test('constructor setting tags', function(assert) {
      const app = this.subject();
      assert.equal(app.tags.length, 11);
      assert.equal(app.tags[0].text, '[seconds]');
      assert.equal(app.tags[0].element.innerText, '[seconds]');
    });

    test('constructor setting options', function(assert) {
      mockOptions({ foo: 'bar' });
      assert.equal(this.subject().options.foo, 'bar');
    });
  });

  module('param', function() {
    test('with required value missing', function(assert) {
      mockParams({ foo: null });

      assert.throws(function() {
        this.subject().param('foo', { required: true });
      }, /missing required query param: foo/);
    });

    test('with required value present', function(assert) {
      mockParams({ foo: 'bar' });

      assert.equal(this.subject().param('foo', { required: true }), 'bar', 'returns the param');
    });

    test('with default value', function(assert) {
      mockParams({ foo: null });

      assert.equal(this.subject().param('foo', { defaultValue: 'bar' }), 'bar', 'returns the default');
    });

    test('with default value replacing empty string', function(assert) {
      mockParams({ foo: '' });

      assert.equal(this.subject().param('foo', { defaultValue: 'bar' }), 'bar', 'returns the default');
    });

    test('not required and no default', function(assert) {
      assert.throws(function() {
        this.subject().param('foo');
      }, /parameters need a default/, 'throws an error');
    });
  });

  module('.error', function(hooks) {
    hooks.beforeEach(function(assert) {
      CD.log = function(err) {
        assert.equal(err, 'Capturama error: something went wrong');
      };
    });

    test('it calls CD.log', function(assert) {
      assert.throws(function() {
        this.subject().error('something went wrong');
      }, /something went wrong/);

      assert.expect(2);
    });
  });

  module('.replaceTokens', function() {
    test('when tag has valid tokens', function(assert) {
      const app = new StudioApp();
      const tag = app.tags.find(t => t.text === '[seconds]');

      app.replaceTokens([tag], { seconds: '43' });

      assert.equal(tag.element.innerHTML, '43');
    });

    test('when tag has no tokens', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === 'hours');

      app.replaceTokens([tag], { seconds: '43' });

      assert.equal(tag.element.innerHTML, 'hours', 'leaves the tag alone');
    });

    test('when no values match token', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[seconds]');
      tag.fallbackText = '00';

      app.replaceTokens([tag], { hours: '9' });

      assert.equal(tag.element.innerHTML, '00');
    });

    test('when tag is missing', function(assert) {
      const app = this.subject();

      app.replaceTokens([], { hours: '9' });

      assert.expect(0);
    });
  });

  module('.showFallbackText', function() {
    test('with tags', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[seconds]');
      tag.fallbackText = '00';

      app.showFallbackText([tag]);
      assert.equal(tag.element.innerHTML, '00', "changes tag element's text to the fallback");
    });

    test('with a single tag', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[seconds]');
      tag.fallbackText = '00';

      app.showFallbackText(tag);
      assert.equal(tag.element.innerHTML, '00', "changes tag element's text to the fallback");
    });

    test('with a tag with no fallback text', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[seconds]');
      tag.fallbackText = null;

      app.showFallbackText(tag);
      assert.equal(tag.element.style.display, 'none', 'hides tag');
    });
  });

  module('.resizeTag', function() {
    test('with text that already fits', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[seconds]');
      const originalWidth = tag.element.style.width;

      app.resizeTag(tag);
      assert.equal(tag.element.style.width, originalWidth);
    });

    test('with text that can be resized down to fit', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[hours]');
      tag.element.style.fontSize = '40px';
      tag.element.innerHTML = 'too long';

      app.resizeTag(tag);

      assert.equal(tag.element.style.fontSize, '12px');
      assert.equal(tag.element.innerHTML, 'too long');
    });

    test('with text that will never fit', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[hours]');
      tag.element.style.fontSize = '40px';
      tag.element.innerHTML = 'this text will be waaay too long to ever fit';
      tag.fallbackText = '00';
      tag.minimumFontSize = 8;

      app.resizeTag(tag);

      assert.equal(tag.element.style.fontSize, '40px');
      assert.equal(tag.element.innerHTML, '00');
    });

    test('with missing element', function(assert) {
      const app = this.subject();
      const tag = app.tags.find(t => t.text === '[hours]');
      tag.element = null;

      CD.log = function(err) {
        assert.equal(err, 'resize tag is missing element');
      };

      app.resizeTag(tag);

      assert.expect(1);
    });
  });

  module('.overflowRatio', function() {
    test('it correctly calculates the ratio', function(assert) {
      const app = this.subect();
      const tag = app.tags.find(t => t.text === '[hours]');
      tag.element.style.fontSize = '40px';
      tag.element.innerHTML = 'too long';

      assert.ok(app.overflowRatio(tag.element) > 2.0, 'should be roughly 2.36');
      assert.ok(app.overflowRatio(tag.element) < 2.5, 'should be roughly 2.36');
    });
  });

  module('.waitForImageAssets', function() {
    test('with no images', function(assert) {
      const images = this.subject().waitForImageAssets();
      assert.equal(images.length, 0);
    });

    test('with background images', function(assert) {
      const backgroundImage = 'http://example.com/image.png';

      const app = this.subject();
      const { element } = app.tags.find(t => t.text === '[hours]');
      element.style.setProperty('background-image', `url("${backgroundImage}")`);

      CD.log = function(msg) {
        assert.equal(msg, `Wait for asset: "${backgroundImage}"`);
      };

      const images = app.waitForImageAssets();

      assert.equal(images.length, 1);
      assert.expect(2);
    });

    test('with img tags', function(assert) {
      const app = this.subject();
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
  });
});
