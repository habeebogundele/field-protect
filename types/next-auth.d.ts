import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      userRole: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    isAdmin: boolean;
    userRole: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    userRole: string;
  }
}
