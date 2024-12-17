declare module 'tailwindcss' {
  interface Config {
    content: string[];
    darkMode?: string | string[];
    theme?: {
      extend?: Record<string, any>;
      [key: string]: any;
    };
    plugins?: any[];
    [key: string]: any;
  }
  
  const defaultConfig: Config;
  export default defaultConfig;
  export type { Config };
}

declare module '@tailwindcss/forms' {
  const plugin: () => {
    handler: () => void;
  };
  export default plugin;
}

declare module 'tailwindcss-animate' {
  const plugin: () => {
    handler: () => void;
  };
  export default plugin;
}

declare module '@designbycode/tailwindcss-text-shadow' {
  const plugin: () => {
    handler: () => void;
  };
  export default plugin;
}

declare module '@tailwindcss/aspect-ratio' {
  const plugin: () => {
    handler: () => void;
  };
  export default plugin;
}

// App Types
export interface Reminder {
  id: string;
  text: string;
  date: string;
  completed: boolean;
}

declare module 'react' {
  export = React;
  export as namespace React;

  // React Hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useReducer<R extends React.Reducer<any, any>>(
    reducer: R,
    initialState: React.ReducerState<R>,
    initializer?: (arg: React.ReducerState<R>) => React.ReducerState<R>
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useImperativeHandle<T, R extends T>(ref: React.Ref<T>, init: () => R, deps?: readonly any[]): void;
  export function useLayoutEffect(effect: React.EffectCallback, deps?: readonly any[]): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;

  // React Types
  export type ReactNode = string | number | boolean | null | undefined | ReactElement | ReactFragment | ReactPortal | PromiseLike<ReactNode>;
  export interface ReactElement<P = any> {
    type: string | React.ComponentType<P>;
    props: P;
    key: string | number | null;
  }
  export interface JSXElementConstructor<P> {
    (props: P): ReactElement<P> | null;
  }
  export type ReactPortal = {
    key: string | number | null;
    children: ReactNode;
  };
  export type AwaitedReactNode = ReactNode | Promise<ReactNode>;
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P): ReactElement<P> | null;
    displayName?: string;
  }
  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };
  export type HTMLAttributes<T> = {
    [key: string]: any;
  };
  export type CSSProperties = {
    [key: string]: string | number;
  };
  export type RefObject<T> = {
    readonly current: T | null;
  };
  export type MutableRefObject<T> = {
    current: T;
  };
  export type SVGAttributes<T> = HTMLAttributes<T>;
  export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;
  export type Key = string | number;
  export type Ref<T> = RefCallback<T> | RefObject<T> | null;
  export type RefCallback<T> = (instance: T | null) => void;
}

declare module 'react-dom' {
  import * as ReactDOMNamespace from 'react-dom';
  const ReactDOM: typeof ReactDOMNamespace;
  export = ReactDOM;
  export as namespace ReactDOM;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
} 