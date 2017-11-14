# Studio App Base

This contains a base StudioApp class which you can extend to build your own studio apps.

## Installation

Inside your project:

```sh
yarn add studio-app
```

## Usage

In your `index.js`, you can extend the app base like so:

```javascript
import StudioApp from 'studio-app';

class MyApp extends StudioApp {
  ...
}

export default MyApp;
```

In `index.html` you can instantiate it and render:

```javascript
const app = new MyApp();
app.render();
```

## License

Copyright 2017 Movable, Inc. All rights reserved.
