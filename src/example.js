const http = require("http");

const router = new (require("../dist/index").default)();
// const router = new (require("../node_modules/find-my-way"))();

router.on("GET", "/user", (req, res) => {
  res.end('Static route')
});

// Needs the header __aot: 2
router.on("GET", "/user/:name", (req, res, params) => {
  res.end('Parametric route 1 ' + JSON.stringify(params));
});

// Needs the header __aot: 6
router.on("GET", "/user/:name/:surname", (req, res, params) => {
  res.end('Parametric route 2 ' + JSON.stringify(params));
});


router.compile();

const server = http.createServer((req, res) => {
  if (req.url === "/favicon.ico" || req.url === "/json") {
    return res.end();
  }
  router.lookup(req, res);
});

server.listen(3000, (err) => {
  if (err) throw err;
  console.log("Server listening on: http://localhost:3000");
});
