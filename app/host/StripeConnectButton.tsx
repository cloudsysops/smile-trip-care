"use client";

import ConnectOnboardingButton from "@/app/components/stripe/ConnectOnboardingButton";

type Props = Readonly<{
  disabled: boolean;
}>;

export default function StripeConnectButton({ disabled }: Props) {
  return (
    <ConnectOnboardingButton
      disabled={disabled}
      endpoint="/api/stripe/connect/host/onboarding"
    />
  );
}

