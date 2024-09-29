import { SDKMethodsProvider } from "pontx-sdk-react-hooks";
import { rootDefaults } from "../defaults";
import type { APIs as APIsType } from "./spec";
import { createSDKClient, getSDKOptionsFormSpecJSON } from "pontx-sdk-core";
import specJSON from "./meta";

export const provider = new SDKMethodsProvider();

export { SDKMethodsProvider, specJSON };

export type DefaultsType = typeof provider.defaults & { pontxRequester?: typeof provider.pontxRequester };

export const setDefaults = (options = {} as DefaultsType) => {
  const finalOptions = {
	...rootDefaults,
    ...options,
  };
  const { pontxRequester, ...defaults } = finalOptions;

  provider.setDefaults(defaults);

  if (pontxRequester) {
    provider.pontxRequester = pontxRequester;
  }
};

export const APIs = createSDKClient<typeof APIsType>(specJSON as any, provider);

export const createSDK = (options = {} as DefaultsType) => {
	const specOptions = getSDKOptionsFormSpecJSON(specJSON as any);
	const sdkProvider = new SDKMethodsProvider({ ...specOptions, ...options});
	return createSDKClient<typeof APIsType>(specJSON as any, sdkProvider);
}
