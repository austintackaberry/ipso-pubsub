import { createClient } from "@supabase/supabase-js";

const nextSupabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    db: {
      schema: "next_auth",
    },
  }
);

export const getAllUserIds = async (): Promise<string[]> => {
  const res = await nextSupabase.from("users").select("id");
  if (!res.data) {
    return [];
  }
  return res.data.map((user) => user.id);
};

// get userid from email using nextSupabase
export const getUserIdByEmail = async (email: string): Promise<string> => {
  const res = await nextSupabase.from("users").select("id").eq("email", email);
  if (!res.data) {
    return "";
  }
  return res.data[0].id;
};
