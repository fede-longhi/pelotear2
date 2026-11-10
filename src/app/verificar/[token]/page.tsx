import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/lib/email";

const DEV_VERIFY_COOKIE = "pelotear_dev_verify_url";

export default async function VerificarTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);
  if (!result.ok) {
    redirect(
      `/verificar-email?error=${encodeURIComponent(result.error || "Link inválido.")}`,
    );
  }
  const jar = await cookies();
  jar.delete(DEV_VERIFY_COOKIE);
  redirect("/perfil?verificado=1");
}
