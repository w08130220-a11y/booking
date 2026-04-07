import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "找不到此預約" }, { status: 404 });
  }
  return NextResponse.json(booking);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, cancellationReason, paymentStatus } = body;

  const validStatuses = ["confirmed", "cancelled", "completed", "no_show"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "無效的狀態" }, { status: 400 });
  }

  const validPayments = ["pending", "paid", "refunded"];
  if (paymentStatus && !validPayments.includes(paymentStatus)) {
    return NextResponse.json({ error: "無效的付款狀態" }, { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(cancellationReason && { cancellationReason }),
      ...(paymentStatus && { paymentStatus }),
    },
  });

  return NextResponse.json(booking);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
