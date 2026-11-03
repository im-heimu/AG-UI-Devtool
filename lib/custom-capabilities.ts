import type { AgentCapabilities } from "@ag-ui/core";
import { z } from "zod";

/**
 * The custom entries of an agent's capabilities the devtool acts on,
 * as gan declares them. An entry of another name, or of a shape these
 * do not read, changes nothing and is shown as it came.
 */
const AskUserSchema = z.object({ tool: z.string(), request: z.string() });
const ProductSchema = z.object({ code: z.string(), variant: z.string() });
const ProductsSchema = z.array(ProductSchema);
const DocumentsSchema = z.object({
  maxFiles: z.number().int().positive(),
  maxFileMb: z.number().positive(),
  maxPdfPages: z.number().int().positive(),
});
const LanguagesSchema = z.array(z.string());

/** A product as NDP names it: {"code": "mst", "variant": "premium"}. */
export type Product = z.infer<typeof ProductSchema>;
/** The files an agent reads from one message. */
export type Documents = z.infer<typeof DocumentsSchema>;
/** What a client may name in forwardedProps.product. */
export type ProductChoice = { code: string; variant?: string };

/** The custom entries read; undefined when not declared. */
export type CustomCapabilities = {
  askUser: z.infer<typeof AskUserSchema> | undefined;
  products: Product[] | undefined;
  documents: Documents | undefined;
  languages: string[] | undefined;
  // Entries the devtool does not read, by name.
  other: Record<string, unknown>;
};

/** Read the custom entries of what an agent declares. */
export function readCustom(
  capabilities: AgentCapabilities | undefined,
): CustomCapabilities {
  const other: Record<string, unknown> = { ...capabilities?.custom };
  // Take an entry out of `other` once it reads.
  const read = <T>(name: string, schema: z.ZodType<T>): T | undefined => {
    const parsed = schema.safeParse(other[name]);
    if (!parsed.success) {
      return undefined;
    }
    delete other[name];
    return parsed.data;
  };
  return {
    askUser: read("askUser", AskUserSchema),
    products: read("products", ProductsSchema),
    documents: read("documents", DocumentsSchema),
    languages: read("languages", LanguagesSchema),
    other,
  };
}

/** Name a choice as the product picker does: "mst" or "mst/premium". */
export function choiceKey(choice: ProductChoice): string {
  return choice.variant ? `${choice.code}/${choice.variant}` : choice.code;
}

/**
 * The choices a picker offers for the products declared: each product,
 * and each code with more than one variant as a whole.
 */
export function productChoices(products: Product[]): ProductChoice[] {
  const codes = [...new Set(products.map((product) => product.code))];
  return codes.flatMap((code) => {
    const variants = products.filter((product) => product.code === code);
    return [...(variants.length > 1 ? [{ code }] : []), ...variants];
  });
}

/** Keep a choice only while the agent still offers it. */
export function offeredChoice(
  key: string | null,
  products: Product[] | undefined,
): ProductChoice | null {
  if (key === null || products === undefined) {
    return null;
  }
  return (
    productChoices(products).find((choice) => choiceKey(choice) === key) ??
    null
  );
}
