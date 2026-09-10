declare module "cookie" {
  export function parse(str: string, options?: Record<string, unknown>): Record<string, string>;
  export function serialize(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      maxAge?: number;
    },
  ): string;
}
