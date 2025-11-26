"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@yellow/backend/convex/_generated/api";
import { common, dashboard } from "@yellow/i18n/messages";
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
          <h1>{dashboard.title()}</h1>
          <p>{dashboard.welcomeMessage(user.user?.fullName || "")}</p>
          <p>
            {dashboard.privateDataLabel()}
            {privateData?.message}
          </p>
          <UserButton />
        </div>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <AuthLoading>
        <div>{common.loading()}</div>
      </AuthLoading>
    </>
  );
}
