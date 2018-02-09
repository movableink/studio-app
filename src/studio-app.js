import CD from 'cropduster';

export default class StudioApp {
  /**
   * Instantiate a new StudioApp. Note that if you override `constructor` in
   * a subclass, you _must_ call super() _first_ before performing any other
   * operations. It is highly recommended that you declare all of your params
   * by setting instance variables via `this.thing = this.param(...)` up front.
   */
  constructor(container) {
    this.container = container || document.querySelector('#mi_size_container');
    this._setOptions();
    this._setTags();
    this._getBounding();
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
    const imageEls = Array.from(document.querySelectorAll('img'));
    const tagsWithBackgrounds = this.allTags.filter(t => {
      return t.backgroundImage && t.backgroundImage !== 'none';
    });

    const urlsFromBackgrounds = tagsWithBackgrounds.map(t => t.backgroundImage);
    const urlsFromImgTags = imageEls.map(el => el.src);

    const imageUrls = urlsFromBackgrounds.concat(urlsFromImgTags);

    imageUrls.forEach(image => {
      CD.waitForAsset(image);
    });

    return imageUrls;
  }

  // Removes a tag from the document and everything located completely
  // below it is shifted up, vertically
  sliceOutTag(tag) {
    const height = tag.height;
    const tagsBelow = this.tags.filter(t => t.top >= tag.top + height);
    tagsBelow.forEach(t => {
      t.top -= height;
      t.element.style.top = t.top + 'px';
    });

    tag.element.parentNode.removeChild(tag.element);

    this.tags = this.tags.filter(t => t !== tag);
    this.allTags = this.allTags.filter(t => t !== tag);
  }

  // resizes the container to just bound around the tag elements
  // inside it
  fitToTags(padding = {}) {
    const boundingBox = this.innerBoundingBox();

    const width = boundingBox.width + (padding.left || 0) + (padding.right || 0);
    const height = boundingBox.height + (padding.top || 0) + (padding.bottom || 0);

    this.container.removeAttribute('width');
    this.container.removeAttribute('height');
    this.container.style.width = width + 'px';
    this.container.style.height = height + 'px';
  }

  // finds a bounding box of all tags
  innerBoundingBox(tags = this.tags) {
    let top = Infinity;
    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    if (!tags.length) {
      return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
    }

    const containerTop = this.container.offsetTop;
    const containerLeft = this.container.offsetLeft;

    tags.map(t => t.element).forEach(el => {
      const boundingBox = el.getBoundingClientRect();
      top = Math.min(top, boundingBox.top - containerTop);
      left = Math.min(left, boundingBox.left - containerLeft);
      bottom = Math.max(bottom, boundingBox.bottom - containerTop);
      right = Math.max(right, boundingBox.right - containerLeft);
    });

    return {
      top,
      left,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }

  // Private Methods

  /**
   * Pulls the tag list from `.mi-attributes` and associates tags with
   * their DOM elements. It creates two properties, `this.tags` for the
   * top-level tags in a tag hierarchy, and `this.allTags` for a flat
   * list of all tags, including nested ones.
   */
  _setTags() {
    this.tags = [];
    this.allTags = [];
    const attributesElement = document.querySelector('.mi-attributes');

    const flattenTags = function(tags) {
      tags.forEach(t => {
        this.allTags.push(t);
        if (t.subtags) {
          flattenTags(t.subtags);
        }
      });
    }.bind(this);

    if (attributesElement) {
      try {
        this.tags = JSON.parse(attributesElement.textContent);
        flattenTags(this.tags);

        this.allTags.forEach(tag => {
          tag.element = document.querySelector(`[mi-tag='${tag.id}']`);
        });
      } catch (e) {
        console.log('Error parsing the attributes element: ' + e);
      }
    }
  }

  /**
   * A safer way to access MI.options, via this.options.
   */
  _setOptions() {
    if (typeof MI === 'undefined') {
      window.MI = { options: {} };
    }
    this.options = MI.options;

    this.fields = {};

    if (this.options.fields) {
      this.options.fields.forEach(field => {
        this.fields[field.name] = field.value;
      });
    }
  }

  /**
   * Pre-sets originalBounding and originalPadding, to store the
   * amount of padding between tags and the sides of the container
   */
  _getBounding() {
    this.originalBounding = this.innerBoundingBox();
    this.originalPadding = {
      top: this.originalBounding.top,
      left: this.originalBounding.left,
      bottom: this.container.getAttribute('height') - this.originalBounding.height,
      right: this.container.getAttribute('width') - this.originalBounding.width
    };
  }
}
