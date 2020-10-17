import { Chars, Mode } from "./constants";
import { HTTPMethod, UncompiledRoute, BitMask } from "./interfaces";

/**
 * Takes:   "user" ":name" ":surname"
 *            │        │        │
 *            └────────┼────────┼─┐
 *            ┌────────┼────────┘ │
 *            │        │          │
 * Binary     1        1          0  
 * 
 * Returns decimal 3
 */
export function getParamsFromRoute(segments: string[]) {
  let parametricSegment: BitMask = 0;

  segments.map((segment, index) => {
    if (segment.charCodeAt(0) === Chars.colon) {
      // We turn the bit on to save the parameter position
      parametricSegment = parametricSegment | (1 << index);
    }
  });

  return parametricSegment;
}

/**
 * This functions generates the function name an parse the params for both the setup (router.on) and lookup, thats why we pass a mode
 */
export function generateFunctionNameAndParams(
  method: HTTPMethod,
  segments: string[],
  indexesOfParameters: BitMask,
  mode: Mode
) {
  let fnName: string = method;
  const params = [];
  const length = segments.length;

  for (let index = 0; index < length; index++) {
    const segment = segments[index];

    // If the bit is turned on, the segment it's parametric
    if (indexesOfParameters & (1 << index)) {
      let value: string;

      // If we are registering the route we need to remove the colon
      value = mode === 0 ? segment.substring(1) : value = segment;

      params.push(value);
      fnName += `_λ${index}`;
    } else {
      fnName += `_${segment}`;
    }
  }

  return {
    fnName,
    params,
  };
}

export function compileRoutes(uncompiledRoutes: UncompiledRoute[]) {
  let functionsCode = "";
  uncompiledRoutes.map((route) => {
    let paramsCode = "";

    // If the route does not have a param, we return a simpler structure that will excecute faster
    if (!route.params || route.params.length === 0) {
      return (functionsCode += `${route.fnName}: ${route.handler},`);
    } else {
      paramsCode = `params: mergeParamsWithArgs(${JSON.stringify(
        route.params
      )}, rawArgs)`;
    }

    functionsCode += `
        ${route.fnName}(rawArgs) {
          return {
            handler: ${route.handler},
            ${paramsCode}
          }
        },
      `;

    // Without this a coma is added between every function
    functionsCode += "\n";
  });

  /*
  * This utils just maps 2 arrays, one with keys an another with values, into an object, such as:
  *
  * Input:
  * [ "name", "surname" ]
  * [ "Elian", "Cordoba" ]
  *
  * Output: 
  * {
  *   name: "Elian",
  *   surname: "Cordoba"
  * }
  */ 
  return `
    function mergeParamsWithArgs(params, args) {
      const res = {};
      const l = params.length
      for (let index = 0; index < l; index++) {
        res[params[index]] = args[index] || '';
      }
    
      return res;
    }

    module.exports = {
      ${functionsCode}
    }
  `;
}
