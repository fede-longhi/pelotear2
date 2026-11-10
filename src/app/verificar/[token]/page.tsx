import { confirmEmailAction } from "@/lib/auth-actions";

export default async function VerificarTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await confirmEmailAction(token);
  return null;
}
