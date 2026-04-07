import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validations";
import { comparePassword, signJWT, setAuthCookie, clearAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const result = adminLoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "請輸入帳號和密碼" }, { status: 400 });
  }

  const { username, password } = result.data;

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  const valid = await comparePassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  const token = await signJWT({ userId: admin.id, username: admin.username });
  await setAuthCookie(token);

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
