## Ahead of time compiled router

The idea is to send a little bit more data from the frontend to the backend so that we can avoid the calculations of trying to figure out the shape of the URL (figuring out what's static and what is parametric).

Without any context, the URL `/user/elian`, could be one of the four following combinations of static and parametric segments:
- Static & parametric
- Static & static
- Parametric & static
- Parametric & parametric

Prefix-tree based routers need to figure out which part is what but, we already have this information in the frontend at the time of doing the request
```javascript
function getUser(name) {
  return fetch(`${serverURL}/user/${name}`)
  //                               ^^^^^^ Here we now that the `user` segment of the URL is static and the second part is parametric
}
```

The idea is to encode the position of the parametric segments and send it to the backend as a header to later be read when parsing the URL.

The last part missing is to know the parameter name of the parametric part, and this is known at the time we add the routes to the server
```javascript
router.on("/user/:name", ...)
//               ^ If we find a colon we know that this is a parametric segment
```


_Originally I was sending the indexes of the segment by splitting the URL by the "/" but then I realized I could compress that information by encoding it in a bitmap, where each bit is an index. Then that can be converted as decimal (For an example read the `getParamsFromRoute` function)_

TL:DR;

Give the following setup:
```javascript
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

// Run at after you are done adding routes
router.compile();
```

Will output:
```javascript
// This util function gets injected automatically
function mergeParamsWithArgs(params, args) {
  const res = {};
  const l = params.length;
  for (let index = 0; index < l; index++) {
    res[params[index]] = args[index] || "";
  }

  return res;
}

module.exports = {
  // Since it's a static route we can excecute the handler right away
  GET_user: (req, res) => {
    res.end("Static route");
  },
  // For parametric routes we need to parse the params first
  GET_user_λ1(rawArgs) {
    return {
      handler: (req, res, params) => {
        res.end("Parametric route 1 " + JSON.stringify(params));
      },
      params: mergeParamsWithArgs(["name"], rawArgs),
    };
  },
  GET_user_λ1_λ2(rawArgs) {
    return {
      handler: (req, res, params) => {
        res.end("Parametric route 2 " + JSON.stringify(params));
      },
      params: mergeParamsWithArgs(["name", "surname"], rawArgs),
    };
  },
};
```

## Testing

```
npm install

tsc

node src/example.js
```

There is also an `Attach debugger` VScode task that will launch the `example.js` file and attach the debugger to use the in-editor breakpoints

## Important
Don't forget to send the `__aot` header to carry the information, such as
```json
{
  "headers": {
    "__aot": 2
  }
}
```

## After tohughts:
- The frontend could have a list of endpoints such as
``` javascript
const endpoints = {
  getUser: {
    method: 'GET',
    url: '/user',
    dynamicParts: 0
  },
  getUserByName: {
    method: 'GET',
    url: '/user/NAME',
    dynamicParts: 1
  }
}
```
- Haven't thought about wildcard and regex-based routes