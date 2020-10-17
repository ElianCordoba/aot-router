import fs from "fs";
import {
  getParamsFromRoute,
  generateFunctionNameAndParams,
  compileRoutes,
} from "./compile";
import { Mode } from "./constants";
import {
  HTTPMethod,
  UncompiledRoute,
  BitMask,
  CompiledRoutesObject,
  Route,
  Handler,
  RawHandler,
} from "./interfaces";

export default class Router {
  private uncompiledRoutes: UncompiledRoute[] = [];
  private routes: CompiledRoutesObject = {};

  on(method: HTTPMethod, path: string, handler: Handler) {
    // Ignore the first element since it is an empty string
    const [, ...pathSegments] = path.split("/");

    const indexesOfParametricSegments = getParamsFromRoute(pathSegments);

    // Get the data needed for compiling the route
    const { fnName, params } = generateFunctionNameAndParams(
      method,
      pathSegments,
      indexesOfParametricSegments,
      Mode.setup
    );

    this.uncompiledRoutes.push({
      fnName,
      params,
      handler,
    });
  }

  compile() {
    const code = compileRoutes(this.uncompiledRoutes);

    fs.writeFileSync("./dist/routes.js", code);

    this.routes = require("./routes");
  }

  find(method: HTTPMethod, url: string, aotHeaders: string | undefined): Route {
    let parametricSegments: BitMask = 0;

    if (aotHeaders) {
      parametricSegments = parseInt(aotHeaders);
    }

    // Ignore the first element since it is an empty string
    const [, ...segments] = url.split("/");

    const { fnName, params } = generateFunctionNameAndParams(
      method,
      segments,
      parametricSegments,
      Mode.lookup
    );

    const rawHandler = this.routes[fnName];

    if (!rawHandler) {
      return;
    }

    if (params.length === 0) {
      return { handler: rawHandler as Handler, params: {} };
    } else {
      return (rawHandler as RawHandler)(params);
    }
  }

  lookup(req, res) {
    const {
      method,
      url,
      headers: { __aot: aotHeaders },
    } = req;

    const route = this.find(method, url, aotHeaders);

    // No match
    if (!route) {
      res.statusCode = 404
      res.end("Not found");
      return;
    }

    const { handler, params } = route;
    return handler(req, res, params);
  }
}
