import {
  StoreApi,
  createStore as createZustandStore,
  StoreMutatorIdentifier,
  StateCreator,
  Mutate,
  useStore as useZustandStore,
} from "zustand";
import React, { useRef } from "react";
import "reflect-metadata";
import { produce } from "immer";
import { createZustandSWRAction, SWRAction } from "./swr";

const ActionContructor = Symbol.for("ActionContructor");

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
  (): ExtractState<S>;
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
  getStore: () => StoreApi<T>;
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
  getStore: () => StoreApi<T>;
  useActions: UseBoundState<Mutate<StoreApi<T>, Mos>>;
  useState: UseBoundState<Mutate<StoreApi<T>, Mos>>;
};
export function createStore<S extends StoreApi<unknown>>(
  store: S
): {
  useStore: UseBoundStore<S>;
  getStore: () => S;
  useActions: UseBoundState<S>;
  useState: UseBoundState<S>;
};
export function createStore(initializer) {
  const store = createZustandStore(initializer);

  // 由于 State 的 Action，有可能在 Store 内部被其它方法调用，不能直接修改 State 中的 Action。
  // 因此，需要使用 useActions 方法来获取 Action，useAction 内绑定 store 和 immerjs。
  const useActions = (selector?: any, equalityFn?: any) => {
    const zustandState = (useZustandStore as any)(store, selector, equalityFn);

    const stateActions = getActions(zustandState);
    const actionsRef = React.useRef(
      buildActions(
        stateActions,
        store,
        selector,
        zustandState?.prototype?.constructor
      )
    );

    React.useEffect(() => {
      if (
        actionsRef.current?.[ActionContructor] ===
        zustandState?.prototype?.constructor
      ) {
        return;
      }

      const stateActions = getActions(zustandState);
      actionsRef.current = buildActions(
        stateActions,
        store,
        selector,
        zustandState?.prototype?.constructor
      );
    }, [zustandState?.prototype?.constructor]);

    return actionsRef.current as any;
  };

  const _useState = (selector?: any, equalityFn?: any) => {
    const zustandState = (useZustandStore as any)(store, selector, equalityFn);

    return zustandState;
  };

  const useStore: any = (selector?: any, equalityFn?: any) => {
    const zustandState = (useZustandStore as any)(store, selector, equalityFn);
    const actions = useActions(selector, equalityFn);

    return [zustandState, actions];
  };

  return { useStore, getStore: () => store, useState: _useState, useActions };
}

export const create = createStore;

const getActions = (result, prevActions = {}) => {
  const propertyNames = Reflect.ownKeys(Object.getPrototypeOf(result));
  propertyNames.forEach((key) => {
    const isAction = result?.[key] && typeof result[key] === "function";
    const isSWRAction = result?.[key] instanceof SWRAction;

    if ((isAction || isSWRAction) && !prevActions[key]) {
      prevActions[key] = result[key];
    }
  });

  Object.keys(result || []).forEach((key) => {
    const value = result?.[key];

    if (value instanceof SWRAction) {
      prevActions[key] = value;
    }
  });

  return prevActions;
};

const buildActions = (originActions, store, selector, clazz) => {
  const propertyNames = Object.keys(originActions || {});
  const actions = {
    [ActionContructor]: clazz,
  };

  propertyNames.forEach((key) => {
    const isAction =
      originActions?.[key] && typeof originActions[key] === "function";
    const isSWRAction = originActions?.[key] instanceof SWRAction;

    if (isAction) {
      const fn = originActions[key];
      const newFn = (...args) => {
        const resultState = produce(store.getState(), (draft) => {
          const subState = selector ? selector(draft) : draft;
          fn.apply(subState, args);
        });
        return (store.setState as any)(resultState, true, {
          type: key,
          paylaod: {
            selector: typeof selector === "string" ? selector : selector?.name,
            clazz: clazz?.name,
            method: key,
            args: args,
          },
        });
      };
      actions[key] = newFn;
    }

    const _useRequest = originActions[key]?.useRequest;
    if (isSWRAction && _useRequest) {
      if (_useRequest) {
        const swrActions = createZustandSWRAction(
          selector,
          _useRequest,
          key,
          store,
          originActions[key]?.initData
        );
        actions[key] = swrActions;
      }
    }
  });

  return actions;
};
