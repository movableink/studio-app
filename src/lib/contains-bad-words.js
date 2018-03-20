import badWordRegex from 'badwords-list/lib/regexp';

export default function containsBadWords(string = '') {
  return !!string.match(badWordRegex);
}
