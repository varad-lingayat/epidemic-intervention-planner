import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  if (process.env.EPIGRAPH_DESKTOP_MODE === "true") {
    const now = new Date();
    return {
      req: opts.req,
      res: opts.res,
      user: {
        id: 0,
        openId: "epigraph-desktop-user",
        name: "Local desktop user",
        email: null,
        loginMethod: "desktop",
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      } satisfies User,
    };
  }

  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
