import {
  StoreApi,
  createStore as createZustandStore,
  StoreMutatorIdentifier,
  StateCreator,
  Mutate,
  useStore as useZustandStore,
} from "zustand";
import React from "react";
import "reflect-metadata";
import { produce } from "immer";

type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;
type ReadonlyStoreApi<T> = Pick<
  StoreApi<T>,
  "getState" | "getInitialState" | "subscribe"
>;
type WithReact<S extends ReadonlyStoreApi<unknown>> = S & {
  /** @deprecated please use api.getInitialState() */
  getServerState?: () => ExtractState<S>;
};
export type UseBoundStore<S extends WithReact<ReadonlyStoreApi<unknown>>> = {
  (): [ExtractState<S>, ExtractState<S>];
  <U>(selector: (state: ExtractState<S>) => U): [U, U];
  /**
   * @deprecated Use `createWithEqualityFn` from 'zustand/traditional'
   */
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn: (a: U, b: U) => boolean
  ): [U, U];
} & S;
export type UseBoundState<S extends WithReact<ReadonlyStoreApi<unknown>>> = {
  (): [ExtractState<S>, ExtractState<S>];
  <U>(selector: (state: ExtractState<S>) => U): U;
  /**
   * @deprecated Use `createWithEqualityFn` from 'zustand/traditional'
   */
  <U>(
    selector: (state: ExtractState<S>) => U,
    equalityFn: (a: U, b: U) => boolean
  ): U;
} & S;

export function createStore<
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>
): {
  useStore: UseBoundStore<Mutate<StoreApi<T>, Mos>>;
  useActions: UseBoundState<Mutate<StoreApi<T>, Mos>>;
  useState: UseBoundState<Mutate<StoreApi<T>, Mos>>;
};
export function createStore<
  T,
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [], Mos>
): {
  useStore: UseBoundStore<Mutate<StoreApi<T>, Mos>>;
  useActions: UseBoundState<Mutate<StoreApi<T>, Mos>>;
  useState: UseBoundState<Mutate<StoreApi<T>, Mos>>;
};
export function createStore<S extends StoreApi<unknown>>(
  store: S
): {
  useStore: UseBoundStore<S>;
  useActions: UseBoundState<S>;
  useState: UseBoundState<S>;
};
export function createStore(initializer) {
  const store = createZustandStore(initializer);

  const useActions = (selector?: any) => {
    const result = selector ? selector(store.getState()) : store.getState();
    const actionsRef = React.useRef(buildActions(result, store, selector));

    React.useEffect(() => {
      actionsRef.current = buildActions(
        result,
        store,
        selector,
        actionsRef.current
      );
    }, [result]);

    return actionsRef.current;
  };

  const useState = (selector?: any, equalityFn?: any) => {
    const useZustandState = (useZustandStore as any)(
      store,
      selector,
      equalityFn
    );

    return useZustandState;
  };

  const useStore: any = (selector?: any, equalityFn?: any) => {
    const actions = useActions(selector);

    const useState = (useZustandStore as any)(store, selector, equalityFn);

    return [useState, actions];
  };

  return { useStore, useActions, useState };
}

export const create = createStore;

const buildActions = (result, store, selector, preActions = {}) => {
  const propertyNames = Reflect.ownKeys(Object.getPrototypeOf(result));
  propertyNames.forEach((key) => {
    const isAction = result?.[key] && typeof result[key] === "function";

    if (isAction && !preActions[key]) {
      const fn = result[key];
      const newFn = (...args) => {
        const resultState = produce(store.getState(), (draft) => {
          const subState = selector ? selector(draft) : draft;
          fn.apply(subState, args);
        });
        return (store.setState as any)(resultState, true, {
          type: key,
          paylaod: {
            selector: typeof selector === "string" ? selector : selector?.name,
            clazz: result?.prototype?.constructor?.name,
            method: key,
            args: args,
          },
        });
      };
      preActions[key] = newFn;
    }
  });

  return preActions;
};
