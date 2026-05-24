export type ParamProxy = Record<string, string>;
export type SelfProxy = Record<string, string>;

export type BodyFn = (p: ParamProxy, self: SelfProxy) => string;

export interface FunctionDescriptor {
  name: string;
  params: string[];
  body?: BodyFn;    // void call — emits call("...")
  returns?: BodyFn; // value call — emits return call("...")
}

export interface ClassDescriptor {
  name: string;         // becomes filename: sprite → sprite.bas, class name: sprite
  properties: string[]; // dim declarations → ClassName.prototype.prop = undefined
  constructor?: {
    params: string[];
    body: BodyFn;     // return value is assigned to assignTo
    assignTo: string; // property name that receives the return value
  };
  methods: FunctionDescriptor[];
}

export interface ModuleDescriptor {
  name: string;          // becomes filename: stage → stage.bas, module name: stage
  properties?: string[]; // dim declarations → moduleName.prop = undefined (static)
  functions: FunctionDescriptor[];
}
