declare module 'tailwindcss' {
  import { Config } from 'tailwindcss';
  const config: Config;
  export default config;
}

declare module '@tailwindcss/forms' {
  import { Config } from 'tailwindcss';
  const plugin: (options?: any) => { handler: () => void };
  export default plugin;
}

declare module 'tailwindcss-animate' {
  import { Config } from 'tailwindcss';
  const plugin: (options?: any) => { handler: () => void };
  export default plugin;
}

declare module '@designbycode/tailwindcss-text-shadow' {
  import { Config } from 'tailwindcss';
  const plugin: (options?: any) => { handler: () => void };
  export default plugin;
} 