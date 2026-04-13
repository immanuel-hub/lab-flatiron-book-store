const chai = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const babel = require('@babel/core');

global.expect = chai.expect;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toLowerCase();
    this.ownerDocument = ownerDocument;
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this._textContent = '';
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentNode) return;

    this.parentNode.children = this.parentNode.children.filter(
      currentChild => currentChild !== this
    );
    this.parentNode = null;

    if (this.id) {
      delete this.ownerDocument.elementsById[this.id];
    }
  }

  set textContent(value) {
    this.children = [];
    this._textContent = String(value);
  }

  get textContent() {
    if (this.children.length > 0) {
      return this.children.map(child => child.textContent).join('');
    }

    return this._textContent;
  }

  get innerHTML() {
    if (this.children.length > 0) {
      return this.children.map(child => child.outerHTML).join('');
    }

    return escapeHtml(this._textContent);
  }

  get outerHTML() {
    const attributes = Object.entries(this.attributes)
      .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
      .join('');

    if (this.tagName === 'img') {
      return `<img${attributes}>`;
    }

    return `<${this.tagName}${attributes}>${this.innerHTML}</${this.tagName}>`;
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes[name] = stringValue;

    if (name === 'id') {
      this.ownerDocument.elementsById[stringValue] = this;
    }
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  set id(value) {
    this.setAttribute('id', value);
  }

  get id() {
    return this.getAttribute('id');
  }

  set src(value) {
    this.setAttribute('src', value);
  }

  get src() {
    return this.getAttribute('src');
  }

  set alt(value) {
    this.setAttribute('alt', value);
  }

  get alt() {
    return this.getAttribute('alt');
  }
}

class Document {
  constructor() {
    this.elementsById = {};
    this.body = new Element('body', this);
  }

  createElement(tagName) {
    return new Element(tagName, this);
  }

  querySelector(selector) {
    if (selector === 'body') {
      return this.body;
    }

    if (selector.startsWith('#')) {
      return this.elementsById[selector.slice(1)] || null;
    }

    return null;
  }
}

function createInitialDom() {
  const document = new Document();

  const header = document.createElement('h1');
  header.id = 'header';
  header.textContent = 'This is a Bookstore';
  document.body.appendChild(header);

  const bookList = document.createElement('ul');
  bookList.id = 'book-list';
  document.body.appendChild(bookList);

  const placeholderBook = document.createElement('li');
  placeholderBook.id = 'delete-this';
  bookList.appendChild(placeholderBook);

  const placeholderTitle = document.createElement('h3');
  placeholderTitle.textContent = 'Example Title';
  placeholderBook.appendChild(placeholderTitle);

  const placeholderAuthor = document.createElement('p');
  placeholderAuthor.textContent = 'Example Author';
  placeholderBook.appendChild(placeholderAuthor);

  const placeholderImage = document.createElement('img');
  placeholderImage.src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADCCAMAAAB6zFdcAAAAQlBMVEX///+hoaGenp6ampr39/fHx8fOzs7j4+P8/Pyvr6/d3d3FxcX29va6urqYmJjs7OzU1NSlpaW1tbWtra3n5+e/v78TS0zBAAACkUlEQVR4nO3b63KCMBCGYUwUUVEO6v3fagWVY4LYZMbZnff51xaZ5jON7CZNEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQb5tvI8qzX4/nH84XG5Upfj2ir2V2E5fZ/XpIX9saMnhkYLIkiyRJjdgMoiEDMmiQgfwM8rSu77ew2wnPoLTmwdZBs0J2BuXrYckcQm4nOoP+WcmWAbcTnUHZPy9eA24nOoN7n0HI54ToDM5k8PjluwyqgNuJzqDoaugPg8gWZ4noDAYLwuIg75fLeeHHsjNIzrZJwWwW+0DNsmEWPjiEZ5AcD8ZUu8VZ8HyQMifvBdIz+PS33i8adu+7Qn4Gn1Tdupl7rlCfQb9seosK7RkcBy1o30iVZ5CPOtDW3WhQnsF13IV3v0p3BqfJRoSpXVepzmA/24+yqeMyzRm4tqOs44lSUwa3yfgOri25av5CPRnklR33VlPnrqSZV09qMsiqSWV082xOz1uPajJ49pTM/f115k6guWa6JGjJ4N1lt8fXN2rv/vysjFaSQdFXBc/KKF04ptFPliclGVR9Bu27XCyeVOkmy5OODAZN9rYyyip/AIPJ8qIig+PoXbf7YdPdncFoSdCQQT4ZceV+MhiFMBy0hgyu0yGvOLI17KwpyGBaHK5jtt0N5GcwLw7XZdB31sRn8O+ziqYro8Vn4CwOV+k6a9Iz+PwRsKC7h+gMfMXhKu/OmuwM/MXhKq8yWnYG/uJw5Uxoy2jRGZTBZ/jboxuSM1guDtdNhKazJjiDbNMe0AxzKUVnkO+jEJxBxNtJzWCTxlNLzSB8KehJ/H+mJGYAjaDjzj9SnHZRuXZiAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECXP1XDHv7U4SNFAAAAAElFTkSuQmCC';
  placeholderBook.appendChild(placeholderImage);

  return document;
}

const html = fs.readFileSync(
  path.resolve(__dirname, '..', 'index.html'),
  'utf-8'
);

if (!html.includes('id="header"') || !html.includes('id="book-list"')) {
  throw new Error('index.html is missing required lab elements.');
}

const { code: transformedScript } = babel.transformFileSync(
  path.resolve(__dirname, '..', 'index.js'),
  { presets: ['@babel/preset-env'] }
);

const document = createInitialDom();
const window = { document };

vm.runInNewContext(transformedScript, {
  document,
  window,
  console,
});

global.window = window;
global.document = document;
global.navigator = {};
global.HTMLElement = Element;
global.Node = Element;
global.Text = String;
global.XMLHttpRequest = function XMLHttpRequest() {};
