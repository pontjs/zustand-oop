# SDK 使用指南

## Pontx SDK 简介

Pontx SDK 分为三部分

1、类型信息和元数据信息。这部分在 origin name 指定的文件夹中。这部分代码随着 API 元数据的变化而变化。这部分只能写 Pontx SDK 插件来定制。

2、基于类型和元数据，提供每个 API 的请求方法。Pontx 默认提供 Nodejs、Async Await、React Hooks 等常用风格调用方法，如 request、useRequest。你也可以低成本的定制提供请求方法。

3、请求逻辑。Pontx 在浏览器端默认使用 fetch，Node 端默认使用 node-fetch@2。你也可以低成本的定制请求逻辑。

## 定制提供不同的请求方法

Pontx 每个 API 默认提供 request、useRequest 方法。你可以自定义一个 PontxSDKMethodsProvider。来提供不同的请求方法。

## 定制 API 请求逻辑

你可以通过自定义 Pontx Requester 来实现。以下是一个使用 Axios 进行请求的例子：

```ts
import { createSDK } from "./services/sdk/petstore";

class MyAxiosRequester extends PontxHttpRequester {
	request(options: RequestOptions): Promise<any> {
		const axiosRequest = axios.create({
			baseURL: 'https://petstore.swagger.io/v2',
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const {
			url, params, headers, body
		} = options;
		const method = options?.apiMeta?.method;

		return axiosRequest(url, {
			method,
			params,
			paramsSerializer: (params) => {
				return Object.entries(params).map(([key, value]) => {
					return `${key}=${encodeURIComponent(value)}`;
				}).join('&');
			},
			headers: headers as any,
			data: body,
		}).then((res) => {
			return res.data;
		});
	}
}

export const APIs = createSDK({
	pontxRequester: new MyAxiosRequester()
});
```
