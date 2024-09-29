import { produce } from "immer";
import React from "react";
import type { SWRResponse } from "swr";

export const createZustandSWRAction = (
  selector,
  _useRequest,
  pathName,
  store,
  initData
) => {
  const setData = (data) => {
    store.setState(
      (state) => {
        const resultState = produce(state, (draft) => {
          const subState = selector ? selector(draft) : draft;
          if (subState?.[pathName]) {
            subState[pathName].data = data;
          }
        });
        return resultState;
      },
      false,
      {
        type: `${pathName}/data`,
        selector: typeof selector === "string" ? selector : selector?.name,
        payload: data,
      }
    );
  };
  const setLoading = (loading) => {
    store.setState(
      (state) => {
        const resultState = produce(state, (draft) => {
          const subState = selector ? selector(draft) : draft;
          if (subState?.[pathName]) {
            subState[pathName].loading = loading;
          }
        });
      },
      false,
      {
        type: `${pathName}/loading`,
        payload: loading,
      }
    );
  };
  const setError = (error) => {
    store.setState(
      (state) => {
        const resultState = produce(state, (draft) => {
          const subState = selector ? selector(draft) : draft;
          if (subState?.[pathName]) {
            subState[pathName].error = error;
          }
        });
      },
      false,
      {
        type: `${pathName}/error`,
        payload: error,
      }
    );
  };

  const useRequest = (...args) => {
    const { data, isValidating, mutate, error } = _useRequest(...args) as any;
    const finalData = data ?? initData;

    React.useEffect(() => {
      setData(finalData);
    }, [finalData]);

    React.useEffect(() => {
      setLoading(isValidating);
    }, [isValidating]);

    React.useEffect(() => {
      setError(error);
    }, [error]);

    return {
      data: finalData,
      isValidating,
      mutate,
      error,
    };
  };

  return {
    useRequest,
    setData,
    setError,
    setLoading,
  };
};

export class SWRAction<
  UseRequest,
  Data = UseRequest extends (...args: any) => SWRResponse<infer Data>
    ? Data
    : any,
> {
  initData: Data;
  data: Data;
  loading = false;
  error: any;
  useRequest: UseRequest;
  setData: any;
  setError: any;
  setLoading: any;

  constructor(_useRequest: UseRequest, initialData?: Data) {
    this.useRequest = ((...args: any[]) => {
      return (_useRequest as any)(...args);
    }) as any;
    this.data = initialData;
    this.initData = initialData;
  }
}

export const createSWRAction = <UseRequest>(
  useRequest: UseRequest,
  initialData?: UseRequest extends (...args: any) => SWRResponse<infer Data>
    ? Data
    : any
) => {
  return new SWRAction(useRequest, initialData);
};
