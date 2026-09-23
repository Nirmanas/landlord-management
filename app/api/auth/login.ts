"use server";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export default async function POST(request: NextRequest) {
  // TODO: implement
  const landlord = false;
  if (landlord) {
    redirect("/landlord");
  } else {
    redirect("/tenant");
  }
}
