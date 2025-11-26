"use client";

import * as m from "@yellow/i18n/messages";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@yellow/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";

export default function Dashboard() {
  const user = useUser();
  const privateData = useQuery(api.privateData.get);

  return (
    <>
      <Authenticated>
        <div>
          <h1>{m.dashboard.title()}</h1>
          <p>{m.dashboard.welcomeMessage(user.user?.fullName || "")}</p>
          <p>{m.dashboard.privateDataLabel()}{privateData?.message}</p>
          <UserButton />
        </div>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <AuthLoading>
        <div>{m.common.loading()}</div>
      </AuthLoading>
    </>
  );
}
