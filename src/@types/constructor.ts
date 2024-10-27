export type ConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;
export type ConstructorFirstArg<T> = T extends new (arg: infer U, ...args: any[]) => any ? U : never;