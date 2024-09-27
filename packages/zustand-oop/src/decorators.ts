import { immerable } from "immer";
export { Type } from "class-transformer";

export function immutable(constructor: any): any {
  constructor.prototype[immerable] = true;

  return constructor;
}
