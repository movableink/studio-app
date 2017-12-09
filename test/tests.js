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

// TODO:

QUnit.test('.param', function(assert) {
  assert.expect(0);
});

QUnit.test('.param with required value missing', function(assert) {
  assert.expect(0);
});

QUnit.test('.param with required value present', function(assert) {
  assert.expect(0);
});

QUnit.test('.param with default value', function(assert) {
  assert.expect(0);
});

QUnit.test('.param with default value replacing empty string', function(assert) {
  assert.expect(0);
});

QUnit.test('constructor setting tags', function(assert) {
  assert.expect(0);
});

QUnit.test('constructor setting options', function(assert) {
  assert.expect(0);
});

QUnit.test('.error', function(assert) {
  assert.expect(0);
});

QUnit.test('.replaceTokens when tag has valid tokens', function(assert) {
  assert.expect(0);
});

QUnit.test('.replaceTokens when tag has no tokens', function(assert) {
  assert.expect(0);
});

QUnit.test('.replaceTokens when no values match token', function(assert) {
  assert.expect(0);
});

QUnit.test('.replaceTokens when tag is missing', function(assert) {
  assert.expect(0);
});

QUnit.test('.showFallbackText with tags', function(assert) {
  assert.expect(0);
});

QUnit.test('.showFallbackText with a single tag', function(assert) {
  assert.expect(0);
});

QUnit.test('.showFallbackText with a tag with no fallback text', function(assert) {
  assert.expect(0);
});

QUnit.test('.resizeTag with text that already fits', function(assert) {
  assert.expect(0);
});

QUnit.test('.resizeTag with text that can be resized down to fit', function(assert) {
  assert.expect(0);
});

QUnit.test('.resizeTag with text that will never fit', function(assert) {
  assert.expect(0);
});

QUnit.test('.resizeTag with missing element', function(assert) {
  assert.expect(0);
});

QUnit.test('.overflowRatio', function(assert) {
  assert.expect(0);
});

QUnit.test('.waitForImageAssets with background images', function(assert) {
  assert.expect(0);
});

QUnit.test('.waitForImageAssets with img tags', function(assert) {
  assert.expect(0);
});
