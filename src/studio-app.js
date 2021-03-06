import CD from 'cropduster';
import { cropImageElement, containImageElement } from './dom-utils/format-image';

export default class StudioApp {
  /**
   * Instantiate a new StudioApp. Note that if you override `constructor` in
   * a subclass, you _must_ call super() _first_ before performing any other
   * operations. It is highly recommended that you declare all of your params
   * by setting instance variables via `this.thing = this.param(...)` up front.
   */
  constructor({ container } = {}) {
    this.container = container || document;
  }

  /**
   * Wrapper around CD.param to perform validations and do some
   * type coercion.
   */
  param(key, opts = {}) {
    if (!(opts.required || opts.hasOwnProperty('defaultValue'))) {
      this.error('parameters need a default if they are not required');
    }

    let rawValue = CD.param(key);
    if (!rawValue || !rawValue.length) {
      if (opts.hasOwnProperty('defaultValue')) {
        if (typeof opts.defaultValue === 'function') {
          rawValue = opts.defaultValue();
        } else {
          rawValue = opts.defaultValue;
        }
      } else {
        this.error(`missing required query param: ${key}`);
      }
    }

    if (opts.type === 'float') {
      return parseFloat(rawValue);
    } else if (opts.type === 'integer') {
      return parseInt(rawValue, 10);
    } else {
      return rawValue;
    }
  }

  /**
   * Bail and show fallback content, alerting that something has gone wrong.
   */
  error(msg) {
    CD.throwError(msg);
    throw new Error(msg);
  }

  /**
   * Given a list of Studio tags, iterate over the text tags and replace
   * any instances of [bracketed] text (aka tokens) with the value of the
   * given `data` object
   */
  replaceTokens(tags, data) {
    tags.filter(t => t.text).forEach(tag => {
      const element = tag.element;
      const regex = /\[([\w\s.-]+)\]/g;
      let missingData = false;

      const replaced = tag.text.replace(regex, function(match, tokenName) {
        const value = data[tokenName];
        if (
          typeof value !== 'undefined' &&
          data[tokenName] !== null &&
          !(typeof value === 'number' && isNaN(value))
        ) {
          return value;
        } else {
          CD.log('missing replacement value for ' + tokenName);
          missingData = true;
          return '';
        }
      });

      if (missingData) {
        this.showFallbackText(tag);
      } else {
        tag.text = replaced;
        tag.element.innerHTML = replaced;
      }
    });
  }

  /**
   * Update a tag to show its fallback text.
   */
  showFallbackText(tags) {
    if (typeof tags === 'object' && !tags.pop) {
      tags = [tags];
    }

    tags.forEach(tag => {
      if (tag.fallbackText) {
        tag.element.innerHTML = tag.fallbackText;
      } else {
        tag.element.innerHTML = '';
        tag.element.style.display = 'none';
      }
    });
  }

  /**
   * Default method for iterating through all tags, finding tokens,
   * and replacing the tokens with the values from CD.params(). This
   * method can be overridden to only use a subset of tags, or to use
   * replacement data from other sources.
   */
  fillElements() {
    this.replaceTokens(this.tags, CD.params());
  }

  /**
   * Automatically changes the font size for any tags that have the
   * autoresize flag set.
   */
  autoresizeTags() {
    this.tags.filter(t => t.autoresize).forEach(tag => {
      this.resizeTag(tag);
    });
  }

  /**
   * Step down a tag's font size until the tag fits onto a single line.
   */
  resizeTag(tag) {
    if (!tag.element) {
      CD.log('resize tag is missing element');
      return;
    }

    const minimumSize = tag.minimumFontSize || 0;
    const startingFontSize = tag.fontSize;
    let ratio = this.overflowRatio(tag.element);

    if (ratio > 1.0) {
      const newFontSize = Math.floor(startingFontSize / ratio);
      if (newFontSize > minimumSize) {
          tag.element.style['font-size'] = newFontSize + 'px';
      } else {
        this.showFallbackText(tag);
      }
    }
  }

  /**
   * Calculates the ratio between the length of the element if it did not
   * wrap, and the length of the element if it were to fit in its parent. It
   * takes margin into account, but not padding. (Studio elements should not
   * have padding)
   */
  overflowRatio(element) {
    const originalWhiteSpace = element.style['white-space'];

    element.style['white-space'] = 'nowrap';
    const style = window.getComputedStyle(element);
    const margin = (parseInt(style.marginLeft) || 0) + (parseInt(style.marginRight, 10) || 0);
    const ratio = element.scrollWidth / (element.clientWidth - margin);
    element.style['white-space'] = originalWhiteSpace;

    return ratio;
  }

  /**
   * Default command to perform some common actions on a Studio app. This
   * can and should be overridden by subclasses, with or without calling
   * `super()`.
   */
  render() {
    this.fillElements();
    this.autoresizeTags();
    this.waitForImageAssets();
  }

  /**
   * Find all images on the page and ensure that they get loaded before
   * render.
   */
  waitForImageAssets() {
    const imageSrcUrls = Array.from(document.querySelectorAll('img')).map(({ src }) => src);

    const backgroundImageUrls = Array.from(
      document.querySelectorAll('[style*="background-image"]')
    ).map(({ style }) => {
      const { backgroundImage } = style;
      return backgroundImage.replace(/^url\((.*)\)$/g, '$1');
    });

    const imageUrls = imageSrcUrls.concat(backgroundImageUrls).filter(url => url && url !== 'none');

    imageUrls.forEach(image => {
      CD.waitForAsset(image);
    });

    return imageUrls;
  }

  formatImageTags() {
    return this.allTags
      .filter(({ type }) => type === 'image')
      .forEach(
        ({ isCropped, element }) =>
          isCropped ? cropImageElement(element) : containImageElement(element)
      );
  }

  /**
   * a flat list of all tags, associated with their DOM elements
   */
  get allTags() {
    if (this._allTags) {
      return this._allTags;
    }

    const flattenTags = (nestedTags = []) => {
      return nestedTags.reduce((flattened, tag) => {
        const { subtags } = tag;
        return [...flattened, tag, ...flattenTags(subtags)];
      }, []);
    };

    const tags = this._allTags = flattenTags(this.tags);
    return tags;
  }

  /**
   * a list of tags with nested subtags, associated with their DOM elements
   */
  get tags() {
    if (this._tags) {
      return this._tags;
    }

    const { container } = this;
    const unassignedTags = JSON.parse(document.querySelector('.mi-attributes').textContent);

    const setElements = tags => {
      tags.forEach(tag => {
        tag.element = container.querySelector(`[mi-tag='${tag.id}']`);
        setElements(tag.subtags || []);
      });

      return tags;
    };

    const tags = this._tags = setElements(unassignedTags);
    return tags;
  }

  /**
   * A safer way to access MI.options, via this.options.
   */
  get options() {
    if (typeof MI === 'undefined') {
      window.MI = { options: {} };
    }
    const { options } = MI;
    return options;
  }

  /**
   * A safer way to access manifest field values
   */
  get fields() {
    if (this._fields) {
      return this._fields;
    }

    const optionFields = this.options.fields || [];

    const fieldsObject = this._fields = optionFields.reduce((fields, { name, value }) => {
      fields[name] = value;
      return fields;
    }, {});

    return fieldsObject;
  }
}
