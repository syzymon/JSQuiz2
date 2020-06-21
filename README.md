# JSQuiz 2 

## Getting Started

This is a Node.js back end web application written in TypeScript, featuring a
simple vanilla TypeScript frontend (check the first version of [JSQuiz](https://github.com/syzymon/JSQuiz)) bundled by Webpack.

## Deployment
Node.js ^12 required.
Go to the project root directory and execute the following commands:
```bash
npm install
```

To compile frontend and backend sources run:
```bash
npm run compile
```

To initialize the database run:
```bash
npm run createdb
```

Run the app (default port 3000):
```bash
npm start
```

Run unit tests
```bash
npm run test
```

## Built With

* [Express - fast, unopinionated, minimalist web framework for Node.js](https://expressjs.com/)
* [NeDB - The JavaScript Database](https://github.com/louischatriot/nedb)
* [Nunjucks - a rich and powerful templating language for JavaScript.](https://mozilla.github.io/nunjucks/)
* [gts - TypeScript style guide, formatter, and linter.](https://github.com/google/gts)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
