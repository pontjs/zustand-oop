import { plainToInstance } from "class-transformer";
import { StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";
import { PersistOptions, StateStorage, StorageValue } from "zustand/middleware";
import { persist as zustandPersist } from "zustand/middleware";

// const persistImpl = (config, baseOptions) => {
//   return zustandPersist(config, {
//     ...(baseOptions || {}),
//   });
// };

type PersistListener<S> = (state: S) => void;

type Thenable<Value> = {
  then<V>(
    onFulfilled: (value: Value) => V | Promise<V> | Thenable<V>
  ): Thenable<V>;
  catch<V>(
    onRejected: (reason: Error) => V | Promise<V> | Thenable<V>
  ): Thenable<V>;
};

const toThenable =
  <Result, Input>(
    fn: (input: Input) => Result | Promise<Result> | Thenable<Result>
  ) =>
  (input: Input): Thenable<Result> => {
    try {
      const result = fn(input);
      if (result instanceof Promise) {
        return result as Thenable<Result>;
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result as Result);
        },
        catch(_onRejected) {
          return this as Thenable<any>;
        },
      };
    } catch (e: any) {
      return {
        then(_onFulfilled) {
          return this as Thenable<any>;
        },
        catch(onRejected) {
          return toThenable(onRejected)(e);
        },
      };
    }
  };

type PersistImpl = <T>(
  storeInitializer: StateCreator<T, [], []>,
  options: PersistOptions<T, T> & {
    deserializeClass: new (...args: any[]) => T;
  }
) => StateCreator<T, [], []>;

type StorePersist<S, Ps> = {
  persist: {
    setOptions: (options: Partial<PersistOptions<S, Ps>>) => void;
    clearStorage: () => void;
    rehydrate: () => Promise<void>;
    hasHydrated: () => boolean;
    onHydrate: (fn: PersistListener<S>) => () => void;
    onFinishHydration: (fn: PersistListener<S>) => () => void;
    getOptions: () => Partial<PersistOptions<S, Ps>>;
  };
};

const persistImpl: PersistImpl = (config, baseOptions) => (set, get, api) => {
  type S = ReturnType<typeof config>;
  let options = {
    getStorage: () => localStorage,
    serialize: JSON.stringify as (state: StorageValue<S>) => string,
    deserialize: JSON.parse as (str: string) => StorageValue<S>,
    partialize: (state: S) => state,
    version: 0,
    merge: (persistedState: unknown, currentState: S) => {
      let merged = null;

      if (baseOptions?.merge) {
        merged = baseOptions.merge(persistedState, currentState);
      } else {
        merged = {
          ...(currentState as any),
          ...(persistedState as any),
        };
      }

      if (!baseOptions?.deserializeClass) {
        console.error(
          "zustand-persist-class: No deserializeClass provided, cannot deserialize state"
        );
        return currentState;
      }

      return plainToInstance(baseOptions.deserializeClass, merged);
    },
    ...baseOptions,
  };

  let hasHydrated = false;
  const hydrationListeners = new Set<PersistListener<S>>();
  const finishHydrationListeners = new Set<PersistListener<S>>();
  let storage: StateStorage | undefined;

  try {
    storage = options.getStorage();
  } catch (e) {
    // prevent error if the storage is not defined (e.g. when server side rendering a page)
  }

  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        (set as any)(...args);
      },
      get,
      api
    );
  }

  const thenableSerialize = toThenable(options.serialize);

  const setItem = (): Thenable<void> => {
    const state = options.partialize({ ...get() });

    let errorInSync: Error | undefined;
    const thenable = thenableSerialize({ state, version: options.version })
      .then((serializedValue) =>
        (storage as StateStorage).setItem(options.name, serializedValue)
      )
      .catch((e) => {
        errorInSync = e;
      });
    if (errorInSync) {
      throw errorInSync;
    }
    return thenable;
  };

  const savedSetState = api.setState;

  api.setState = (state, replace, ...args: any[]) => {
    (savedSetState as any)(state, replace, ...args);
    void setItem();
  };

  const configResult = config(
    (...args) => {
      (set as any)(...args);
      void setItem();
    },
    get,
    api
  );

  // a workaround to solve the issue of not storing rehydrated state in sync storage
  // the set(state) value would be later overridden with initial state by create()
  // to avoid this, we merge the state from localStorage into the initial state.
  let stateFromStorage: S | undefined;

  // rehydrate initial state with existing stored state
  const hydrate = () => {
    if (!storage) return;

    hasHydrated = false;
    hydrationListeners.forEach((cb) => cb(get()));

    const postRehydrationCallback =
      options.onRehydrateStorage?.(get()) || undefined;

    // bind is used to avoid `TypeError: Illegal invocation` error
    return toThenable(storage.getItem.bind(storage))(options.name)
      .then((storageValue) => {
        if (storageValue) {
          return options.deserialize(storageValue as any);
        }
      })
      .then((deserializedStorageValue) => {
        if (deserializedStorageValue) {
          if (
            typeof deserializedStorageValue.version === "number" &&
            deserializedStorageValue.version !== options.version
          ) {
            if (options.migrate) {
              return options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              );
            }
            console.error(
              `State loaded from storage couldn't be migrated since no migrate function was provided`
            );
          } else {
            return deserializedStorageValue.state;
          }
        }
      })
      .then((migratedState) => {
        stateFromStorage = options.merge(
          migratedState as S,
          get() ?? configResult
        );

        set(stateFromStorage as S, true);
        return setItem();
      })
      .then(() => {
        postRehydrationCallback?.(stateFromStorage, undefined);
        hasHydrated = true;
        finishHydrationListeners.forEach((cb) => cb(stateFromStorage as S));
      })
      .catch((e: Error) => {
        postRehydrationCallback?.(undefined, e);
      });
  };

  (api as StoreApi<S> & StorePersist<S, S>).persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions,
      };

      if ((newOptions as any).getStorage) {
        storage = (newOptions as any).getStorage();
      }
    },
    clearStorage: () => {
      storage?.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate() as Promise<void>,
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);

      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);

      return () => {
        finishHydrationListeners.delete(cb);
      };
    },
  };

  hydrate();

  return stateFromStorage || configResult;
};

export const persist = persistImpl;
export {
  devtools,
  redux,
  combine,
  subscribeWithSelector,
  createJSONStorage,
} from "zustand/middleware";

export type {
  DevtoolsOptions,
  NamedSet,
  PersistOptions,
  PersistStorage,
  StateStorage,
  StorageValue,
} from "zustand/middleware";
