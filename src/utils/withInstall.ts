import type { App } from 'vue';
import type { AppContext, Plugin } from 'vue';

export type SFCWithInstall<T> = T & Plugin

export type SFCInstallWithContext<T> = SFCWithInstall<T> & {
  _context: AppContext | null
}

export const withInstall = <T, E extends Record<string, any>>(
  main: T,
  extra?: E
) => {
  (main as SFCWithInstall<T>).install = (app: App): void => {
    for (const comp of [main, ...Object.values(extra ?? {})]) {
      app.component(comp.name, comp);
    }
  };

  return main as SFCWithInstall<T> & E;
};