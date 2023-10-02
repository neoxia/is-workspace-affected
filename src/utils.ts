export function fixDefaultExport<T extends { default: unknown }>(mod: T): T['default'] {
  return mod as T['default'];
}
