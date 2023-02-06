"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailRecord = exports.getUserIdByEmail = exports.getAllUserIds = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const nextSupabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    db: {
        schema: "next_auth",
    },
});
const publicSupabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    db: {
        schema: "public",
    },
});
const getAllUserIds = async () => {
    const res = await nextSupabase.from("users").select("id");
    if (!res.data) {
        return [];
    }
    return res.data.map((user) => user.id);
};
exports.getAllUserIds = getAllUserIds;
// get userid from email using nextSupabase
const getUserIdByEmail = async (email) => {
    const res = await nextSupabase.from("users").select("id").eq("email", email);
    if (!res.data) {
        return "";
    }
    return res.data[0].id;
};
exports.getUserIdByEmail = getUserIdByEmail;
// create new email record using publicSupabase
const createEmailRecord = async (email) => {
    return publicSupabase.from("emails").insert([email]);
};
exports.createEmailRecord = createEmailRecord;
