export function cropImageElement(tagElement) {
  const image = tagElement.querySelector('img');
  image.style.setProperty('width', 'auto');
  image.style.setProperty('height', 'auto');
}

export function containImageElement(tagElement) {
  const image = tagElement.querySelector('img');
  image.style.setProperty('max-width', '100%');
  image.style.setProperty('max-height', '100%');
}
