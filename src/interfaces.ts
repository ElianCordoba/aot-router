export type HTTPMethod =
  | "ACL"
  | "BIND"
  | "CHECKOUT"
  | "CONNECT"
  | "COPY"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "LINK"
  | "LOCK"
  | "M-SEARCH"
  | "MERGE"
  | "MKACTIVITY"
  | "MKCALENDAR"
  | "MKCOL"
  | "MOVE"
  | "NOTIFY"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PROPFIND"
  | "PROPPATCH"
  | "PURGE"
  | "PUT"
  | "REBIND"
  | "REPORT"
  | "SEARCH"
  | "SOURCE"
  | "SUBSCRIBE"
  | "TRACE"
  | "UNBIND"
  | "UNLINK"
  | "UNLOCK"
  | "UNSUBSCRIBE";

type Params = Record<string, string | undefined>

export type Handler = (
  req: Request,
  res: Response,
  params: Params
) => any;

export interface UncompiledRoute {
  fnName: string;
  params: string[];
  handler: Handler;
}

export type BitMask = number;

export type RawHandler = (rawParams: string[]) => Route;

// For static routes will be a handler, otherwise will be a raw handler
export type CompiledRoutesObject = Record<string, Handler | RawHandler>;

export type Route = { handler: Handler; params: Params };
